<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
}

require_once __DIR__ . '/../config/database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        throw new InvalidArgumentException('Data tidak valid.');
    }

    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = (string)($input['password'] ?? '');

    if ($email === '' || $password === '') {
        throw new InvalidArgumentException('Email dan password wajib diisi.');
    }

    $stmt = $pdo->prepare("
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Pesan sengaja sama untuk email salah / password salah
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'Email atau password salah.'], 401);
    }

    startSecureSession();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];

    jsonResponse([
        'success' => true,
        'message' => 'Login berhasil.',
        'user' => [
            'id'    => (int)$user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
        ],
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
}
