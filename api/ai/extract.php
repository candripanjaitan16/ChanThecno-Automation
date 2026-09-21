<?php

declare(strict_types=1);

/*
| Upload file tugas / larangan -> dikembalikan sebagai TEKS.
| File TIDAK disimpan di server; hanya teksnya yang dikembalikan ke browser,
| lalu disimpan lewat config.php. Jadi tidak ada file berbahaya yang menetap.
|
| Format: .txt, .md, .csv (teks biasa). PDF/DOCX ditolak dengan pesan jelas
| (butuh ekstensi tambahan yang belum tentu ada di hosting).
*/

require_once __DIR__ . '/../config/auth.php';
applyCors('POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan.'], 405);
}

requireAuth();

const MAX_UPLOAD_BYTES = 512 * 1024;   // 512 KB
const MAX_TEXT_CHARS   = 20000;

try {
    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        throw new InvalidArgumentException('Tidak ada file yang diunggah.');
    }

    $f = $_FILES['file'];

    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $msg = match ($f['error'] ?? 0) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File terlalu besar (maks 512 KB).',
            UPLOAD_ERR_NO_FILE                        => 'Tidak ada file yang diunggah.',
            default                                   => 'Gagal mengunggah file.',
        };
        throw new InvalidArgumentException($msg);
    }

    if (!is_uploaded_file($f['tmp_name'])) {
        throw new InvalidArgumentException('Unggahan tidak valid.');
    }

    if ($f['size'] > MAX_UPLOAD_BYTES) {
        throw new InvalidArgumentException('File terlalu besar (maks 512 KB).');
    }

    $name = (string)($f['name'] ?? '');
    $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));

    if (in_array($ext, ['pdf', 'doc', 'docx'], true)) {
        throw new InvalidArgumentException('Format ' . strtoupper($ext) . ' belum didukung. Simpan sebagai .txt lalu unggah lagi, atau salin-tempel isinya.');
    }
    if (!in_array($ext, ['txt', 'md', 'csv'], true)) {
        throw new InvalidArgumentException('Format tidak didukung. Gunakan .txt, .md, atau .csv.');
    }

    $raw = file_get_contents($f['tmp_name']);

    if ($raw === false || $raw === '') {
        throw new InvalidArgumentException('File kosong.');
    }

    // Tolak file biner yang hanya berganti nama menjadi .txt
    if (str_contains($raw, "\0")) {
        throw new InvalidArgumentException('Isi file bukan teks biasa.');
    }

    // Hilangkan BOM UTF-8 dan pastikan UTF-8 valid
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);

    if (!preg_match('//u', $raw)) {
        $raw = @iconv('Windows-1252', 'UTF-8//IGNORE', $raw) ?: '';
    }

    $raw = str_replace("\r\n", "\n", $raw);
    $raw = trim($raw);

    if ($raw === '') {
        throw new InvalidArgumentException('File tidak berisi teks.');
    }

    $truncated = false;
    if (strlen($raw) > MAX_TEXT_CHARS) {
        $raw = substr($raw, 0, MAX_TEXT_CHARS);
        // jangan memotong di tengah karakter UTF-8
        $raw = preg_replace('/[\x80-\xBF]+$/', '', $raw);
        $raw = preg_replace('/[\xC0-\xFF]$/', '', $raw);
        $truncated = true;
    }

    jsonResponse([
        'success'   => true,
        'name'      => substr(basename($name), 0, 255),
        'text'      => $raw,
        'truncated' => $truncated,
    ]);

} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('ai/extract.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Gagal membaca file.'], 500);
}