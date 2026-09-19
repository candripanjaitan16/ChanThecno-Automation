<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
applyCors('POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
}

startSecureSession();
$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}

session_destroy();

jsonResponse(['success' => true, 'message' => 'Berhasil logout.']);
