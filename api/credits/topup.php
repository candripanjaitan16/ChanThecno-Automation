<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/midtrans.php';

$userId = requireAuth();

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        throw new InvalidArgumentException('Data tidak valid.');
    }

    $packageId = (int)($input['package_id'] ?? 0);

    if ($packageId <= 0) {
        throw new InvalidArgumentException('Paket tidak valid.');
    }

    // Harga & kredit SELALU diambil dari database, bukan dari frontend
    $stmt = $pdo->prepare("
        SELECT id, name, credits, price
        FROM credit_packages
        WHERE id = ? AND active = 1
        LIMIT 1
    ");
    $stmt->execute([$packageId]);
    $package = $stmt->fetch();

    if (!$package) {
        throw new InvalidArgumentException('Paket tidak ditemukan.');
    }

    $u = $pdo->prepare("SELECT name, email FROM users WHERE id = ? LIMIT 1");
    $u->execute([$userId]);
    $user = $u->fetch();

    // order_id unik: huruf/angka/dash saja, maks 50 karakter
    $orderId = 'TOPUP-' . $userId . '-' . time() . '-' . bin2hex(random_bytes(3));

    $amount = (int)$package['price'];

    // 1) Catat order dulu (status pending)
    $pdo->prepare("
        INSERT INTO payment_orders
            (order_id, user_id, package_id, package_name, credits, amount, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ")->execute([
        $orderId,
        $userId,
        (int)$package['id'],
        $package['name'],
        (int)$package['credits'],
        $amount,
    ]);

    // 2) Minta token Snap ke Midtrans
    try {
        $snap = midtransCreateSnap([
        'transaction_details' => [
            'order_id'     => $orderId,
            'gross_amount' => $amount,
        ],
        'item_details' => [[
            'id'       => 'PKG-' . $package['id'],
            'price'    => $amount,
            'quantity' => 1,
            'name'     => substr('Kredit ' . preg_replace('/[^\x20-\x7E]/', '', (string)$package['name']), 0, 50),
        ]],
        'customer_details' => [
            'first_name' => $user['name'] ?? 'Pelanggan',
            'email'      => $user['email'] ?? '',
        ],
        ]);
    } catch (Throwable $e) {
        $pdo->prepare("UPDATE payment_orders SET status = 'failed' WHERE order_id = ?")
            ->execute([$orderId]);
        throw $e;
    }

    $pdo->prepare("UPDATE payment_orders SET snap_token = ?, redirect_url = ? WHERE order_id = ?")
        ->execute([$snap['token'], $snap['redirect_url'] ?? null, $orderId]);

    $cfg = midtransConfig();

    jsonResponse([
        'success'      => true,
        'order_id'     => $orderId,
        'snap_token'   => $snap['token'],
        'redirect_url' => $snap['redirect_url'] ?? null,
        'client_key'   => $cfg['client_key'],   // aman: memang publik
        'snap_js'      => $cfg['snap_js'],
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('topup.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal membuat pesanan top up.'], 500);
}
