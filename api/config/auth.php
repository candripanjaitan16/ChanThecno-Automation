<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Helper Auth + CORS (dipakai semua endpoint yang butuh login)
|--------------------------------------------------------------------------
| Login memakai PHP session (cookie). Karena frontend (React) dan API
| berbeda origin, request dari React WAJIB memakai:
|     fetch(url, { credentials: "include" })
| dan CORS tidak boleh "*" (harus origin spesifik + Allow-Credentials).
*/

const ALLOWED_ORIGINS = [
    'http://localhost:5173',          // Vite dev
    'https://chanthecno.co-id.id',    // production (sesuaikan bila beda)
];

function applyCors(string $methods): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    header("Access-Control-Allow-Methods: {$methods}, OPTIONS");
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 7,           // 7 hari
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        // Lintas origin di HTTPS butuh None+Secure. Di HTTP (dev) pakai Lax.
        'samesite' => $isHttps ? 'None' : 'Lax',
    ]);

    session_start();
}

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Wajib login. Mengembalikan user_id, atau langsung 401. */
function requireAuth(): int
{
    startSecureSession();

    $userId = $_SESSION['user_id'] ?? null;

    if (!is_int($userId) || $userId <= 0) {
        jsonResponse([
            'success' => false,
            'message' => 'Kamu belum login.',
        ], 401);
    }

    return $userId;
}
