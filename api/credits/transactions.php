<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

try {
    // ?limit=20 (default 20, maks 100)
    $limit = (int)($_GET['limit'] ?? 20);
    $limit = max(1, min($limit, 100));

    $stmt = $pdo->prepare("
        SELECT
            id,
            type,
            amount,
            balance_after,
            description,
            created_at
        FROM credit_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT {$limit}
    ");
    $stmt->execute([$userId]);

    $transactions = array_map(static fn(array $r): array => [
        'id'            => (int)$r['id'],
        'type'          => $r['type'],
        'amount'        => (int)$r['amount'],
        'balance_after' => (int)$r['balance_after'],
        'label'         => $r['description'] ?? '',
        'date'          => $r['created_at'],
    ], $stmt->fetchAll());

    jsonResponse([
        'success'      => true,
        'transactions' => $transactions,
    ]);

} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil riwayat kredit.'], 500);
}
