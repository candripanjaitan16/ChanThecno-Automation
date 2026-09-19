<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Helper Midtrans (tanpa Composer, hanya cURL)
|--------------------------------------------------------------------------
| .env yang dibutuhkan:
|   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx     (rahasia! jangan ke frontend)
|   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx     (boleh publik)
|   MIDTRANS_IS_PRODUCTION=false               (true di produksi)
*/

function midtransConfig(): array
{
    $serverKey = getenv('MIDTRANS_SERVER_KEY') ?: '';
    $clientKey = getenv('MIDTRANS_CLIENT_KEY') ?: '';
    $isProd    = filter_var(getenv('MIDTRANS_IS_PRODUCTION') ?: 'false', FILTER_VALIDATE_BOOLEAN);

    if ($serverKey === '' || $clientKey === '') {
        throw new RuntimeException('Konfigurasi Midtrans belum lengkap.');
    }

    return [
        'server_key' => $serverKey,
        'client_key' => $clientKey,
        'is_prod'    => $isProd,
        'snap_url'   => $isProd
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
        'api_url'    => $isProd
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2',
        'snap_js'    => $isProd
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js',
    ];
}

/**
 * Request ke Midtrans. Auth = Basic base64(ServerKey + ":").
 * Memakai cURL bila tersedia; jika tidak, fallback ke stream PHP bawaan
 * (tidak semua hosting mengaktifkan ekstensi cURL).
 */
function midtransRequest(string $method, string $url, ?array $body = null): array
{
    $cfg = midtransConfig();

    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($cfg['server_key'] . ':'),
    ];
    $payload = $body !== null ? json_encode($body, JSON_UNESCAPED_UNICODE) : null;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }

        $raw    = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            throw new RuntimeException('Gagal menghubungi Midtrans: ' . $err);
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method'        => $method,
                'header'        => implode("\r\n", $headers),
                'content'       => $payload ?? '',
                'timeout'       => 20,
                'ignore_errors' => true,   // tetap baca body saat HTTP 4xx/5xx
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);

        if ($raw === false) {
            throw new RuntimeException('Gagal menghubungi Midtrans (stream).');
        }

        $status = 0;
        foreach ($http_response_header ?? [] as $h) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) {
                $status = (int)$m[1];
            }
        }
    }

    $data = json_decode((string)$raw, true);

    return ['status' => $status, 'data' => is_array($data) ? $data : []];
}

/** Buat transaksi Snap -> ['token' => ..., 'redirect_url' => ...] */
function midtransCreateSnap(array $payload): array
{
    $cfg = midtransConfig();
    $res = midtransRequest('POST', $cfg['snap_url'], $payload);

    if ($res['status'] !== 201 || empty($res['data']['token'])) {
        error_log('Midtrans snap gagal: HTTP ' . $res['status'] . ' ' . json_encode($res['data']));
        throw new RuntimeException('Gagal membuat transaksi pembayaran.');
    }

    return $res['data'];
}

/** Ambil status transaksi langsung dari Midtrans (sumber kebenaran). */
function midtransGetStatus(string $orderId): array
{
    $cfg = midtransConfig();
    $res = midtransRequest('GET', $cfg['api_url'] . '/' . rawurlencode($orderId) . '/status');

    return $res['data'];
}

/** SHA512(order_id + status_code + gross_amount + ServerKey) */
function midtransSignatureValid(array $n): bool
{
    $cfg = midtransConfig();

    foreach (['order_id', 'status_code', 'gross_amount', 'signature_key'] as $k) {
        if (!isset($n[$k]) || !is_string($n[$k])) {
            return false;
        }
    }

    $expected = hash('sha512', $n['order_id'] . $n['status_code'] . $n['gross_amount'] . $cfg['server_key']);

    return hash_equals($expected, $n['signature_key']);
}

/**
 * Petakan status Midtrans -> status internal.
 *  paid    : settlement, atau capture + fraud accept
 *  pending : pending / capture+challenge
 *  failed  : deny, failure
 *  expired : expire
 *  canceled: cancel
 */
function midtransMapStatus(array $s): string
{
    $trx   = $s['transaction_status'] ?? '';
    $fraud = $s['fraud_status'] ?? 'accept';

    return match (true) {
        $trx === 'settlement'                          => 'paid',
        $trx === 'capture' && $fraud === 'accept'      => 'paid',
        $trx === 'capture'                             => 'pending',
        $trx === 'pending'                             => 'pending',
        $trx === 'expire'                              => 'expired',
        $trx === 'cancel'                              => 'canceled',
        in_array($trx, ['deny', 'failure'], true)      => 'failed',
        default                                        => 'pending',
    };
}
