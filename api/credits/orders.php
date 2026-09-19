<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

try {
    $stmt = $pdo->prepare("
        SELECT order_id, package_name, credits, amount, status, created_at
        FROM payment_orders
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 20
    ");
    $stmt->execute([$userId]);

    $orders = array_map(static fn(array $r): array => [
        'id'      => $r['order_id'],
        'package' => $r['package_name'],
        'credit'  => (int)$r['credits'],
        'price'   => (int)$r['amount'],
        'status'  => $r['status'],
        'date'    => $r['created_at'],
    ], $stmt->fetchAll());

    jsonResponse(['success' => true, 'orders' => $orders]);

} catch (Throwable $e) {
    error_log('orders.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil riwayat top up.'], 500);
}
