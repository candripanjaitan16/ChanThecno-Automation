<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

try {
    $stmt = $pdo->prepare("
        SELECT balance
        FROM credit_balances
        WHERE user_id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'balance' => $row ? (int)$row['balance'] : 0,
    ]);

} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil saldo kredit.'], 500);
}
