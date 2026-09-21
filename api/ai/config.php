<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET, POST');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

const MAX_TEXT_LEN    = 20000;   // karakter per kolom tugas/larangan
const MAX_PRODUCTS    = 100;
const MAX_CODE_LEN    = 50;
const MAX_NAME_LEN    = 150;
const MAX_DESC_LEN    = 500;

function loadConfig(PDO $pdo, int $userId): array
{
    $c = $pdo->prepare("SELECT task_text, rule_text, task_file_name, rule_file_name, admin_whatsapp, stop_reply
                        FROM ai_configs WHERE user_id = ? LIMIT 1");
    $c->execute([$userId]);
    $cfg = $c->fetch() ?: [];

    $p = $pdo->prepare("SELECT code, name, description, price, stock
                        FROM ai_catalog WHERE user_id = ? ORDER BY sort_order, id");
    $p->execute([$userId]);

    return [
        'task_text'      => $cfg['task_text'] ?? '',
        'rule_text'      => $cfg['rule_text'] ?? '',
        'task_file_name' => $cfg['task_file_name'] ?? '',
        'rule_file_name' => $cfg['rule_file_name'] ?? '',
        'admin_whatsapp' => $cfg['admin_whatsapp'] ?? '',
        'stop_reply'     => isset($cfg['stop_reply']) ? (bool)$cfg['stop_reply'] : true,
        'products'       => array_map(static fn(array $r): array => [
            'code'        => $r['code'],
            'name'        => $r['name'],
            'description' => $r['description'] ?? '',
            'price'       => (int)$r['price'],
            'stock'       => (int)$r['stock'],
        ], $p->fetchAll()),
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        jsonResponse(['success' => true, 'config' => loadConfig($pdo, $userId)]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
    }

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) {
        throw new InvalidArgumentException('Data tidak valid.');
    }

    $task  = (string)($in['task_text'] ?? '');
    $rule  = (string)($in['rule_text'] ?? '');
    $tFile = substr(trim((string)($in['task_file_name'] ?? '')), 0, 255);
    $rFile = substr(trim((string)($in['rule_file_name'] ?? '')), 0, 255);
    $wa    = trim((string)($in['admin_whatsapp'] ?? ''));
    $stop  = !empty($in['stop_reply']) ? 1 : 0;

    if (strlen($task) > MAX_TEXT_LEN || strlen($rule) > MAX_TEXT_LEN) {
        throw new InvalidArgumentException('Teks terlalu panjang (maks ' . MAX_TEXT_LEN . ' karakter).');
    }

    // Nomor WA: hanya angka, boleh diawali +, 8-20 digit
    if ($wa !== '' && !preg_match('/^\+?[0-9]{8,20}$/', $wa)) {
        throw new InvalidArgumentException('Nomor WhatsApp tidak valid. Contoh: 6281234567890');
    }

    $products = $in['products'] ?? [];
    if (!is_array($products) || count($products) > MAX_PRODUCTS) {
        throw new InvalidArgumentException('Maksimal ' . MAX_PRODUCTS . ' produk.');
    }

    // Validasi tiap produk
    $clean = [];
    $seen  = [];
    foreach ($products as $i => $p) {
        if (!is_array($p)) {
            throw new InvalidArgumentException('Data produk tidak valid.');
        }

        $code  = trim((string)($p['code'] ?? ''));
        $name  = trim((string)($p['name'] ?? ''));
        $desc  = trim((string)($p['description'] ?? ''));
        $price = $p['price'] ?? 0;
        $stock = $p['stock'] ?? 0;

        // Baris yang benar-benar kosong diabaikan
        if ($code === '' && $name === '' && $desc === '' && ($price === '' || (int)$price === 0) && ($stock === '' || (int)$stock === 0)) {
            continue;
        }

        $n = $i + 1;

        if ($code === '' || $name === '') {
            throw new InvalidArgumentException("Produk #{$n}: kode dan nama wajib diisi.");
        }
        if (strlen($code) > MAX_CODE_LEN || strlen($name) > MAX_NAME_LEN || strlen($desc) > MAX_DESC_LEN) {
            throw new InvalidArgumentException("Produk #{$n}: teks terlalu panjang.");
        }
        if (!is_numeric($price) || (float)$price < 0 || (float)$price != floor((float)$price)) {
            throw new InvalidArgumentException("Produk #{$n}: harga harus bilangan bulat ≥ 0.");
        }
        if (!is_numeric($stock) || (float)$stock < 0 || (float)$stock != floor((float)$stock)) {
            throw new InvalidArgumentException("Produk #{$n}: stok harus bilangan bulat ≥ 0.");
        }
        if ((float)$price > 999999999999) {
            throw new InvalidArgumentException("Produk #{$n}: harga terlalu besar.");
        }

        $key = strtolower($code);
        if (isset($seen[$key])) {
            throw new InvalidArgumentException("Kode produk \"{$code}\" dipakai lebih dari satu kali.");
        }
        $seen[$key] = true;

        $clean[] = [$code, $name, $desc, (int)$price, (int)$stock];
    }

    // Simpan semuanya dalam satu transaksi: berhasil semua atau tidak sama sekali
    $pdo->beginTransaction();
    try {
        $pdo->prepare("
            INSERT INTO ai_configs (user_id, task_text, rule_text, task_file_name, rule_file_name, admin_whatsapp, stop_reply)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                task_text = VALUES(task_text), rule_text = VALUES(rule_text),
                task_file_name = VALUES(task_file_name), rule_file_name = VALUES(rule_file_name),
                admin_whatsapp = VALUES(admin_whatsapp), stop_reply = VALUES(stop_reply)
        ")->execute([$userId, $task, $rule, $tFile ?: null, $rFile ?: null, $wa ?: null, $stop]);

        $pdo->prepare("DELETE FROM ai_catalog WHERE user_id = ?")->execute([$userId]);

        $ins = $pdo->prepare("INSERT INTO ai_catalog (user_id, sort_order, code, name, description, price, stock)
                              VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($clean as $order => [$code, $name, $desc, $price, $stock]) {
            $ins->execute([$userId, $order, $code, $name, $desc ?: null, $price, $stock]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    jsonResponse(['success' => true, 'message' => 'Tugas AI berhasil disimpan.', 'config' => loadConfig($pdo, $userId)]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('ai/config.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal menyimpan pengaturan.'], 500);
}