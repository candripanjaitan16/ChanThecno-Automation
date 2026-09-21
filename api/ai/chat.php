<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET, POST, DELETE');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/settings.php';
require_once __DIR__ . '/../lib/ai_client.php';
require_once __DIR__ . '/../lib/credit_spend.php';

$userId = requireAuth();

const MAX_MESSAGE_LEN   = 2000;
const HISTORY_FOR_AI    = 12;     // pesan terakhir yang dikirim sebagai konteks
const HISTORY_TO_SHOW   = 50;
const MAX_MSGS_PER_MIN  = 12;     // rem sederhana anti-spam per pengguna

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // ---------------------------------------------------------- GET: riwayat chat
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT id, role, content, created_at
            FROM (SELECT id, role, content, created_at FROM ai_chat_messages
                  WHERE user_id = ? ORDER BY id DESC LIMIT " . HISTORY_TO_SHOW . ") t
            ORDER BY id ASC
        ");
        $stmt->execute([$userId]);

        $settings = loadSettings($pdo);

        jsonResponse([
            'success'  => true,
            'messages' => array_map(static fn(array $r): array => [
                'id'      => (int)$r['id'],
                'role'    => $r['role'],
                'content' => $r['content'],
                'date'    => $r['created_at'],
            ], $stmt->fetchAll()),
            'cost'    => max(0, (int)$settings['credit_per_reply']),
            'enabled' => $settings['enabled'] === '1',
            'balance' => currentBalance($pdo, $userId),
        ]);
    }

    // ---------------------------------------------------------- DELETE: hapus riwayat
    if ($method === 'DELETE') {
        $pdo->prepare("DELETE FROM ai_chat_messages WHERE user_id = ?")->execute([$userId]);
        jsonResponse(['success' => true, 'message' => 'Riwayat chat dihapus.']);
    }

    if ($method !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
    }

    // ---------------------------------------------------------- POST: kirim pesan
    $in = json_decode(file_get_contents('php://input'), true);
    $message = trim((string)(is_array($in) ? ($in['message'] ?? '') : ''));

    if ($message === '') {
        throw new InvalidArgumentException('Pesan tidak boleh kosong.');
    }
    if (strlen($message) > MAX_MESSAGE_LEN) {
        throw new InvalidArgumentException('Pesan terlalu panjang (maks ' . MAX_MESSAGE_LEN . ' karakter).');
    }

    $settings = loadSettings($pdo);

    if ($settings['enabled'] !== '1') {
        jsonResponse(['success' => false, 'message' => 'Fitur AI sedang dinonaktifkan.'], 503);
    }

    $cost = max(0, (int)$settings['credit_per_reply']);

    // Rem anti-spam: batasi pesan per menit (melindungi tagihan API-mu)
    $rate = $pdo->prepare("SELECT COUNT(*) FROM ai_chat_messages
                           WHERE user_id = ? AND role = 'user' AND created_at > (NOW() - INTERVAL 1 MINUTE)");
    $rate->execute([$userId]);
    if ((int)$rate->fetchColumn() >= MAX_MSGS_PER_MIN) {
        jsonResponse(['success' => false, 'message' => 'Terlalu banyak pesan. Tunggu sebentar.'], 429);
    }

    // Cek saldo di awal supaya tidak memanggil AI (berbiaya) untuk pengguna yang tidak sanggup bayar
    $balance = currentBalance($pdo, $userId);
    if ($cost > 0 && $balance < $cost) {
        jsonResponse([
            'success' => false,
            'code'    => 'INSUFFICIENT_CREDIT',
            'message' => 'Kredit kamu tidak cukup. Silakan top up terlebih dahulu.',
            'balance' => $balance,
            'cost'    => $cost,
        ], 402);
    }

    // Kunci API (dienkripsi di database)
    try {
        $apiKey = decryptSecret((string)$settings['api_key_enc']);
    } catch (Throwable $e) {
        error_log('ai/chat.php dekripsi: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Layanan AI belum dikonfigurasi. Hubungi admin.'], 503);
    }
    if ($apiKey === '') {
        jsonResponse(['success' => false, 'message' => 'Layanan AI belum dikonfigurasi. Hubungi admin.'], 503);
    }

    $provider = (string)$settings['provider'];
    $model    = effectiveModel($settings);
    if (!in_array($provider, ALLOWED_PROVIDERS, true) || $model === '') {
        jsonResponse(['success' => false, 'message' => 'Layanan AI belum dikonfigurasi. Hubungi admin.'], 503);
    }

    // Tugas, larangan, dan produk milik pengguna ini
    $c = $pdo->prepare("SELECT task_text, rule_text FROM ai_configs WHERE user_id = ? LIMIT 1");
    $c->execute([$userId]);
    $config = $c->fetch() ?: [];

    $p = $pdo->prepare("SELECT code, name, description, price, stock FROM ai_catalog
                        WHERE user_id = ? ORDER BY sort_order, id");
    $p->execute([$userId]);
    $products = $p->fetchAll();

    // Konteks percakapan
    $h = $pdo->prepare("
        SELECT role, content FROM (SELECT id, role, content FROM ai_chat_messages
                                   WHERE user_id = ? ORDER BY id DESC LIMIT " . HISTORY_FOR_AI . ") t
        ORDER BY id ASC
    ");
    $h->execute([$userId]);
    $history = $h->fetchAll();

    // Anthropic mewajibkan giliran bergantian & diawali 'user'
    while ($history && $history[0]['role'] !== 'user') {
        array_shift($history);
    }
    $clean = [];
    foreach ($history as $m) {
        if ($clean && $clean[count($clean) - 1]['role'] === $m['role']) {
            $clean[count($clean) - 1]['content'] .= "\n" . $m['content'];
        } else {
            $clean[] = ['role' => $m['role'], 'content' => $m['content']];
        }
    }
    if ($clean && $clean[count($clean) - 1]['role'] === 'user') {
        $clean[count($clean) - 1]['content'] .= "\n" . $message;
    } else {
        $clean[] = ['role' => 'user', 'content' => $message];
    }

    // ---- Panggil AI. Jika gagal: lempar error, saldo TIDAK tersentuh. ----
    $maxTokens = max(50, min((int)$settings['max_output_tokens'], 2000));
    $reply = aiComplete($provider, $apiKey, $model, buildSystemPrompt($config, $products), $clean, $maxTokens);

    // ---- AI berhasil -> potong kredit (mengunci & mengecek ulang saldo) ----
    $ref = 'CHAT-' . $userId . '-' . time() . '-' . bin2hex(random_bytes(3));

    try {
        $newBalance = spendCredits($pdo, $userId, $cost, 'Test Chat AI', $ref);
    } catch (RuntimeException $e) {
        if ($e->getMessage() === 'INSUFFICIENT') {
            // Saldo terpakai permintaan lain yang berjalan bersamaan
            jsonResponse([
                'success' => false,
                'code'    => 'INSUFFICIENT_CREDIT',
                'message' => 'Kredit kamu tidak cukup. Silakan top up terlebih dahulu.',
                'balance' => currentBalance($pdo, $userId),
                'cost'    => $cost,
            ], 402);
        }
        throw $e;
    }

    // Simpan percakapan hanya jika balasan sudah dibayar
    $ins = $pdo->prepare("INSERT INTO ai_chat_messages (user_id, role, content) VALUES (?, ?, ?)");
    $ins->execute([$userId, 'user', $message]);
    $ins->execute([$userId, 'assistant', $reply]);

    jsonResponse([
        'success' => true,
        'reply'   => $reply,
        'cost'    => $cost,
        'balance' => $newBalance,
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (AiUserError $e) {
    // Hanya AiUserError yang pesannya aman untuk pengguna
    error_log('ai/chat.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 502);
} catch (Throwable $e) {
    // Termasuk error konfigurasi (APP_KEY, dekripsi): JANGAN bocorkan detailnya
    error_log('ai/chat.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
}