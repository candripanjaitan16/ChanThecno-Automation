<?php

declare(strict_types=1);

/**
 * Potong kredit untuk pemakaian AI, tepat sesuai jumlah, atomik.
 *
 * Dipanggil SETELAH AI berhasil membalas. Karena itu saldo dicek dan dikunci
 * lagi di sini (SELECT ... FOR UPDATE): dua permintaan bersamaan tidak bisa
 * sama-sama lolos dengan saldo yang hanya cukup untuk satu.
 *
 * Deadlock: bila banyak permintaan untuk pengguna yang sama tiba serentak,
 * database dapat membatalkan sebagian dengan error 1213. Itu normal dan aman
 * diulang, jadi fungsi ini mengulang otomatis (maks 5x) sebelum menyerah.
 *
 * @return int saldo setelah dipotong
 * @throws RuntimeException 'INSUFFICIENT' bila saldo tidak cukup
 */
function spendCredits(PDO $pdo, int $userId, int $cost, string $description, string $reference): int
{
    if ($cost <= 0) {
        // Harga 0 = gratis: tidak ada yang dipotong / dicatat
        return currentBalance($pdo, $userId);
    }

    // Pastikan baris saldo ada SEBELUM transaksi. Di luar transaksi, jadi
    // tidak memegang kunci yang memicu deadlock. IGNORE aman jika sudah ada.
    $pdo->prepare("INSERT IGNORE INTO credit_balances (user_id, balance) VALUES (?, 0)")
        ->execute([$userId]);

    $maxAttempts = 5;

    for ($attempt = 1; ; $attempt++) {
        try {
            return spendCreditsOnce($pdo, $userId, $cost, $description, $reference);

        } catch (PDOException $e) {
            // 1213 = deadlock, 1205 = lock wait timeout: keduanya aman diulang
            $code = (int)($e->errorInfo[1] ?? 0);

            if (($code === 1213 || $code === 1205) && $attempt < $maxAttempts) {
                usleep(random_int(20, 120) * 1000 * $attempt);
                continue;
            }

            throw $e;
        }
    }
}

function spendCreditsOnce(PDO $pdo, int $userId, int $cost, string $description, string $reference): int
{
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("SELECT balance FROM credit_balances WHERE user_id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $before = (int)$stmt->fetchColumn();

        if ($before < $cost) {
            $pdo->rollBack();
            throw new RuntimeException('INSUFFICIENT');
        }

        $after = $before - $cost;

        $pdo->prepare("UPDATE credit_balances SET balance = ? WHERE user_id = ?")
            ->execute([$after, $userId]);

        $pdo->prepare("
            INSERT INTO credit_transactions
                (user_id, type, amount, balance_before, balance_after, description, reference)
            VALUES (?, 'usage', ?, ?, ?, ?, ?)
        ")->execute([$userId, -$cost, $before, $after, $description, $reference]);

        $pdo->commit();

        return $after;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/** Saldo saat ini (tanpa kunci), untuk pengecekan awal yang murah. */
function currentBalance(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare("SELECT balance FROM credit_balances WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);

    return (int)$stmt->fetchColumn();
}