<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan.'
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        throw new Exception('Data tidak valid.');
    }

    $name = trim((string)($input['name'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = (string)($input['password'] ?? '');

    if ($name === '' || $email === '' || $password === '') {
        throw new Exception('Nama, email, dan password wajib diisi.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Format email tidak valid.');
    }

    if (strlen($password) < 8) {
        throw new Exception('Password minimal 8 karakter.');
    }

    // Cek email
    $check = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
    ");

    $check->execute([$email]);

    if ($check->fetch()) {
        throw new Exception('Email sudah terdaftar.');
    }

    $pdo->beginTransaction();

    // Simpan user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO users (
            name,
            email,
            password_hash
        )
        VALUES (?, ?, ?)
    ");

    $stmt->execute([
        $name,
        $email,
        $passwordHash
    ]);

    $userId = (int)$pdo->lastInsertId();

    // Berikan 150 kredit gratis
    $stmt = $pdo->prepare("
        INSERT INTO credit_balances (
            user_id,
            balance
        )
        VALUES (?, 150)
    ");

    $stmt->execute([$userId]);

    // Catat bonus kredit
    $stmt = $pdo->prepare("
        INSERT INTO credit_transactions (
            user_id,
            type,
            amount,
            balance_before,
            balance_after,
            description,
            reference
        )
        VALUES (?, 'bonus', 150, 0, 150, ?, ?)
    ");

    $stmt->execute([
        $userId,
        'Bonus kredit gratis saat pendaftaran',
        'REGISTER_BONUS'
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Pendaftaran berhasil. Kamu mendapatkan 150 kredit gratis.',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email
        ],
        'credit' => 150
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}