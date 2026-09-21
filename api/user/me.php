<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('GET');

require_once __DIR__ . '/../config/database.php';

$userId = requireAuth();

try {
    // is_admin dibaca dengan aman: jika kolom belum ada (SQL belum dijalankan) dianggap 0
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, is_admin FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
    } catch (PDOException $e) {
        $stmt = $pdo->prepare("SELECT id, name, email, 0 AS is_admin FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
    }
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'User tidak ditemukan.'], 401);
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id'       => (int)$user['id'],
            'name'     => $user['name'],
            'email'    => $user['email'],
            'is_admin' => (int)$user['is_admin'] === 1,
        ],
    ]);

} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Gagal mengambil data user.'], 500);
}