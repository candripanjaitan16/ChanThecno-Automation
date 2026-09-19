<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';

try {
    $stmt = $pdo->query("
        SELECT
            id,
            name,
            credits,
            price,
            badge,
            description
        FROM credit_packages
        WHERE active = 1
        ORDER BY sort_order ASC
    ");

    $packages = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Database berhasil terhubung.',
        'packages' => $packages
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data database.'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}