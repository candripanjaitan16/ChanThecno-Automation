<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

/*
| Parameter (semua opsional):
|   limit   : jumlah per halaman (default 20, maks 100)
|   page    : nomor halaman mulai dari 1 (default 1)
|   type    : all | topup | usage | bonus | refund | adjustment
|   q       : kata kunci, dicari pada deskripsi
|
| Dashboard memanggil tanpa page/type/q, jadi perilakunya tidak berubah.
*/

const VALID_TYPES = ['topup', 'usage', 'bonus', 'refund', 'adjustment'];

try {
    $limit = max(1, min((int)($_GET['limit'] ?? 20), 100));
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $type  = (string)($_GET['type'] ?? 'all');
    $q     = trim((string)($_GET['q'] ?? ''));

    if ($type !== 'all' && !in_array($type, VALID_TYPES, true)) {
        throw new InvalidArgumentException('Filter tidak valid.');
    }

    // Batasi panjang kata kunci dan escape wildcard LIKE (% dan _)
    $q = substr($q, 0, 100);
    $qLike = '%' . addcslashes($q, '\\%_') . '%';

    $where  = ['user_id = ?'];
    $params = [$userId];

    if ($type !== 'all') {
        $where[]  = 'type = ?';
        $params[] = $type;
    }

    if ($q !== '') {
        $where[]  = "description LIKE ? ESCAPE '\\\\'";
        $params[] = $qLike;
    }

    $whereSql = implode(' AND ', $where);

    // Total untuk paginasi
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM credit_transactions WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $totalPages = max(1, (int)ceil($total / $limit));
    $page   = min($page, $totalPages);
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare("
        SELECT id, type, amount, balance_after, description, created_at
        FROM credit_transactions
        WHERE {$whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT {$limit} OFFSET {$offset}
    ");
    $stmt->execute($params);

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
        'pagination'   => [
            'page'        => $page,
            'limit'       => $limit,
            'total'       => $total,
            'total_pages' => $totalPages,
        ],
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('transactions.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil riwayat kredit.'], 500);
}