<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/midtrans.php';
require_once __DIR__ . '/../lib/credits.php';

$userId = requireAuth();

try {
    $orderId = trim((string)($_GET['order_id'] ?? ''));

    if ($orderId === '') {
        throw new InvalidArgumentException('order_id wajib diisi.');
    }

    // Hanya boleh melihat order milik sendiri
    $stmt = $pdo->prepare("SELECT * FROM payment_orders WHERE order_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();

    if (!$order) {
        jsonResponse(['success' => false, 'message' => 'Order tidak ditemukan.'], 404);
    }

    // Kalau masih pending, tanya Midtrans langsung. Ini juga jaring pengaman
    // seandainya webhook telat / gagal sampai.
    if ($order['status'] === 'pending') {
        $status = midtransGetStatus($orderId);

        if (($status['order_id'] ?? '') === $orderId) {
            $internal = midtransMapStatus($status);

            if ($internal === 'paid') {
                creditPaidOrder($pdo, $orderId, $status);
            } elseif ($internal !== 'pending') {
                $pdo->prepare("UPDATE payment_orders SET status = ? WHERE order_id = ? AND credited_at IS NULL")
                    ->execute([$internal, $orderId]);
            }

            $stmt->execute([$orderId, $userId]);
            $order = $stmt->fetch();
        }
    }

    jsonResponse([
        'success' => true,
        'order'   => [
            'order_id' => $order['order_id'],
            'status'   => $order['status'],
            'package'  => $order['package_name'],
            'credits'  => (int)$order['credits'],
            'amount'   => (int)$order['amount'],
        ],
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('order-status.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil status order.'], 500);
}
