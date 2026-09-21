<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Enkripsi kunci API (libsodium, ada bawaan di PHP 7.2+)
|--------------------------------------------------------------------------
| Butuh di .env:
|   APP_KEY=<64 karakter hex>      buat dengan:  php -r "echo bin2hex(random_bytes(32));"
|
| PENTING: jika APP_KEY hilang/berubah, kunci API yang tersimpan tidak bisa
| dibuka lagi (harus dimasukkan ulang). Simpan salinannya di tempat aman.
*/

function appKey(): string
{
    $hex = getenv('APP_KEY') ?: '';

    if (strlen($hex) !== 64 || !ctype_xdigit($hex)) {
        throw new RuntimeException('APP_KEY belum diatur di .env (harus 64 karakter hex).');
    }

    return hex2bin($hex);
}

function encryptSecret(string $plain): string
{
    if ($plain === '') {
        return '';
    }

    $nonce  = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $cipher = sodium_crypto_secretbox($plain, $nonce, appKey());

    return base64_encode($nonce . $cipher);
}

function decryptSecret(string $stored): string
{
    if ($stored === '') {
        return '';
    }

    $raw = base64_decode($stored, true);

    if ($raw === false || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
        throw new RuntimeException('Data terenkripsi rusak.');
    }

    $nonce  = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $plain  = sodium_crypto_secretbox_open($cipher, $nonce, appKey());

    if ($plain === false) {
        throw new RuntimeException('Gagal membuka kunci API (APP_KEY berubah?).');
    }

    return $plain;
}

/** Tampilkan kunci secara aman: sk-ant-••••abcd */
function maskSecret(string $plain): string
{
    if ($plain === '') {
        return '';
    }

    $tail = strlen($plain) > 8 ? substr($plain, -4) : '';

    return '••••••••' . $tail;
}