<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Webhook Midtrans  (dipanggil server Midtrans, BUKAN browser)
|--------------------------------------------------------------------------
| Daftarkan di Midtrans Dashboard -> Settings -> Configuration ->
| Payment Notification URL:
|     https://DOMAINMU/api/credits/midtrans-notify.php
|
| Lapisan keamanan:
|  1. Cek signature_key (SHA512)
|  2. Konfirmasi ulang ke API status Midtrans (jangan percaya body mentah)
|  3. Nominal harus sama dengan harga order
|  4. Idempotent: kredit hanya ditambah SEKALI per order
| Tidak ada CORS / login di sini karena bukan dari browser.
*/

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/midtrans.php';
require_once __DIR__ . '/../lib/credits.php';

try {
    $notif = json_decode(file_get_contents('php://input'), true);

    if (!is_array($notif) || !isset($notif['order_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Body tidak valid.']);
        exit;
    }

    // 1) Signature
    if (!midtransSignatureValid($notif)) {
        error_log('Midtrans notify: signature tidak valid untuk ' . ($notif['order_id'] ?? '?'));
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Signature tidak valid.']);
        exit;
    }

    $orderId = (string)$notif['order_id'];

    // Order harus ada di sistem kita
    $stmt = $pdo->prepare("SELECT order_id, status FROM payment_orders WHERE order_id = ? LIMIT 1");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        // 200 supaya Midtrans tidak mengulang terus untuk order yang bukan milik kita
        echo json_encode(['success' => true, 'message' => 'Order tidak dikenal, diabaikan.']);
        exit;
    }

    // 2) Konfirmasi langsung ke Midtrans (sumber kebenaran)
    $status = midtransGetStatus($orderId);

    if (($status['order_id'] ?? '') !== $orderId) {
        error_log("Midtrans notify: verifikasi status gagal untuk {$orderId}");
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'Gagal verifikasi ke Midtrans.']);
        exit;
    }

    $internal = midtransMapStatus($status);

    if ($internal === 'paid') {
        // 3 & 4) cek nominal + kredit satu kali
        creditPaidOrder($pdo, $orderId, $status);
    } else {
        // Jangan menurunkan order yang sudah lunas menjadi expired/failed
        $pdo->prepare("
            UPDATE payment_orders
            SET status = ?, payment_type = COALESCE(?, payment_type),
                midtrans_trx_id = COALESCE(?, midtrans_trx_id)
            WHERE order_id = ? AND credited_at IS NULL
        ")->execute([
            $internal,
            $status['payment_type'] ?? null,
            $status['transaction_id'] ?? null,
            $orderId,
        ]);
    }

    echo json_encode(['success' => true]);

} catch (Throwable $e) {
    error_log('midtrans-notify.php: ' . $e->getMessage());
    // 500 -> Midtrans akan mengulang notifikasi
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan.']);
}
