<?php

declare(strict_types=1);

/**
 * Tambahkan kredit untuk order yang SUDAH LUNAS, tepat satu kali.
 *
 * Aman terhadap notifikasi ganda / balapan (race) berkat:
 *  - transaksi database
 *  - SELECT ... FOR UPDATE pada baris order
 *  - penanda credited_at (jika sudah terisi, tidak menambah lagi)
 *
 * @return bool true jika kredit ditambahkan sekarang, false jika sebelumnya sudah.
 */
function creditPaidOrder(PDO $pdo, string $orderId, array $midtrans): bool
{
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("SELECT * FROM payment_orders WHERE order_id = ? FOR UPDATE");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            $pdo->rollBack();
            throw new RuntimeException('Order tidak ditemukan.');
        }

        // Sudah pernah dikreditkan -> jangan dobel
        if ($order['credited_at'] !== null) {
            $pdo->rollBack();
            return false;
        }

        // Jumlah bayar dari Midtrans HARUS sama dengan harga order kita
        $paid = (int)round((float)($midtrans['gross_amount'] ?? 0));
        if ($paid !== (int)$order['amount']) {
            $pdo->rollBack();
            error_log("Nominal tidak cocok untuk {$orderId}: bayar={$paid}, order={$order['amount']}");
            throw new RuntimeException('Nominal pembayaran tidak sesuai.');
        }

        $userId  = (int)$order['user_id'];
        $credits = (int)$order['credits'];

        // Pastikan baris saldo ada, lalu kunci
        $pdo->prepare("INSERT IGNORE INTO credit_balances (user_id, balance) VALUES (?, 0)")
            ->execute([$userId]);

        $b = $pdo->prepare("SELECT balance FROM credit_balances WHERE user_id = ? FOR UPDATE");
        $b->execute([$userId]);
        $before = (int)$b->fetchColumn();
        $after  = $before + $credits;

        $pdo->prepare("UPDATE credit_balances SET balance = ? WHERE user_id = ?")
            ->execute([$after, $userId]);

        $pdo->prepare("
            INSERT INTO credit_transactions
                (user_id, type, amount, balance_before, balance_after, description, reference)
            VALUES (?, 'topup', ?, ?, ?, ?, ?)
        ")->execute([
            $userId,
            $credits,
            $before,
            $after,
            'Top up paket ' . $order['package_name'],
            $orderId,
        ]);

        $pdo->prepare("
            UPDATE payment_orders
            SET status = 'paid',
                credited_at = NOW(),
                paid_at = COALESCE(paid_at, NOW()),
                payment_type = ?,
                midtrans_trx_id = ?
            WHERE order_id = ?
        ")->execute([
            $midtrans['payment_type'] ?? null,
            $midtrans['transaction_id'] ?? null,
            $orderId,
        ]);

        $pdo->commit();
        return true;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}
