<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Load .env
|--------------------------------------------------------------------------
*/

$envFile = dirname(__DIR__, 2) . '/.env';

if (!file_exists($envFile)) {
    http_response_code(500);
    exit('Environment file not found.');
}

$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($lines as $line) {
    $line = trim($line);

    // Abaikan komentar
    if ($line === '' || str_starts_with($line, '#')) {
        continue;
    }

    // Ambil KEY=VALUE
    if (!str_contains($line, '=')) {
        continue;
    }

    [$key, $value] = explode('=', $line, 2);

    $key = trim($key);
    $value = trim($value);

    // Hilangkan quote jika ada
    if (
        strlen($value) >= 2 &&
        (
            ($value[0] === '"' && $value[-1] === '"') ||
            ($value[0] === "'" && $value[-1] === "'")
        )
    ) {
        $value = substr($value, 1, -1);
    }

    putenv("{$key}={$value}");
}


/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
*/

$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: '';
$username = getenv('DB_USER') ?: '';
$password = getenv('DB_PASSWORD') ?: '';

if ($dbname === '' || $username === '') {
    http_response_code(500);
    exit('Database configuration is incomplete.');
}


/*
|--------------------------------------------------------------------------
| PDO Connection
|--------------------------------------------------------------------------
*/

$dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        $options
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit('Database connection failed.');
}