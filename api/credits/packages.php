<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query("
        SELECT
            id,
            name,
            credits,
            price,
            badge,
            description,
            sort_order
        FROM credit_packages
        WHERE active = 1
        ORDER BY sort_order ASC, id ASC
    ");

    $packages = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'packages' => $packages
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil paket kredit.'
    ], JSON_UNESCAPED_UNICODE);
}