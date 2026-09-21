<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET, POST');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/settings.php';

// Hanya akun dengan users.is_admin = 1
requireAdmin($pdo);

try {
    $s = loadSettings($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Kunci API TIDAK PERNAH dikirim balik. Hanya status + 4 karakter terakhir.
        $masked = '';
        $hasKey = false;

        if ($s['api_key_enc'] !== '') {
            try {
                $masked = maskSecret(decryptSecret((string)$s['api_key_enc']));
                $hasKey = true;
            } catch (Throwable $e) {
                $masked = '(tidak dapat dibuka: APP_KEY berubah?)';
            }
        }

        jsonResponse([
            'success'  => true,
            'settings' => [
                'provider'          => $s['provider'],
                'model'             => $s['model'],
                'default_models'    => DEFAULT_MODELS,
                'credit_per_reply'  => (int)$s['credit_per_reply'],
                'max_output_tokens' => (int)$s['max_output_tokens'],
                'enabled'           => $s['enabled'] === '1',
                'has_api_key'       => $hasKey,
                'api_key_masked'    => $masked,
            ],
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
    }

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) {
        throw new InvalidArgumentException('Data tidak valid.');
    }

    $provider = (string)($in['provider'] ?? $s['provider']);
    if (!in_array($provider, ALLOWED_PROVIDERS, true)) {
        throw new InvalidArgumentException('Penyedia AI tidak valid.');
    }

    $model = trim((string)($in['model'] ?? ''));
    if ($model !== '' && !preg_match('/^[A-Za-z0-9._:\-\/]{1,100}$/', $model)) {
        throw new InvalidArgumentException('Nama model tidak valid.');
    }

    $credit = $in['credit_per_reply'] ?? $s['credit_per_reply'];
    if (!is_numeric($credit) || (float)$credit < 0 || (float)$credit != floor((float)$credit) || (float)$credit > 100000) {
        throw new InvalidArgumentException('Kredit per balasan harus bilangan bulat 0 - 100000.');
    }

    $maxTok = $in['max_output_tokens'] ?? $s['max_output_tokens'];
    if (!is_numeric($maxTok) || (int)$maxTok < 50 || (int)$maxTok > 2000) {
        throw new InvalidArgumentException('Maks token balasan harus 50 - 2000.');
    }

    $enabled = !empty($in['enabled']) ? '1' : '0';

    // Kunci API: hanya diubah bila diisi. Kosong = pertahankan yang lama.
    $newKey = trim((string)($in['api_key'] ?? ''));
    if ($newKey !== '') {
        if (strlen($newKey) < 20 || strlen($newKey) > 300 || preg_match('/\s/', $newKey)) {
            throw new InvalidArgumentException('Format kunci API tidak valid.');
        }
    }

    $pdo->beginTransaction();
    try {
        saveSetting($pdo, 'provider', $provider);
        saveSetting($pdo, 'model', $model);
        saveSetting($pdo, 'credit_per_reply', (string)(int)$credit);
        saveSetting($pdo, 'max_output_tokens', (string)(int)$maxTok);
        saveSetting($pdo, 'enabled', $enabled);

        if ($newKey !== '') {
            saveSetting($pdo, 'api_key_enc', encryptSecret($newKey));
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    jsonResponse(['success' => true, 'message' => 'Pengaturan AI disimpan.']);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('admin/ai-settings.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal memproses pengaturan.'], 500);
}