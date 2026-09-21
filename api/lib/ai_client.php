<?php

declare(strict_types=1);

/** Error yang pesannya AMAN ditampilkan ke pengguna. Error lain = internal. */
class AiUserError extends RuntimeException
{
}


/**
 * Panggilan HTTP JSON generik (cURL bila ada, fallback ke stream PHP).
 * Mengembalikan ['status' => int, 'data' => array].
 */
function aiHttpJson(string $url, array $headers, array $body, int $timeout = 45): array
{
    $payload = json_encode($body, JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_POSTFIELDS     => $payload,
        ]);
        $raw    = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            throw new AiUserError('Tidak bisa menghubungi layanan AI.');
        }
    } else {
        $context = stream_context_create(['http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", array_merge(['Content-Type: application/json'], $headers)),
            'content'       => $payload,
            'timeout'       => $timeout,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $context);

        if ($raw === false) {
            throw new AiUserError('Tidak bisa menghubungi layanan AI.');
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

/**
 * Kirim percakapan ke penyedia AI yang dipilih admin.
 *
 * @param array $messages [['role'=>'user'|'assistant','content'=>string], ...]
 * @return string teks balasan
 * @throws RuntimeException dengan pesan AMAN untuk pengguna
 */
function aiComplete(string $provider, string $apiKey, string $model, string $system, array $messages, int $maxTokens): string
{
    // URL dasar bisa diganti lewat .env (dipakai untuk pengujian & proxy)
    if ($provider === 'anthropic') {
        $base = getenv('AI_ANTHROPIC_URL') ?: 'https://api.anthropic.com/v1/messages';

        $res = aiHttpJson($base, [
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
        ], [
            'model'      => $model,
            'max_tokens' => $maxTokens,
            'system'     => $system,
            'messages'   => $messages,
        ]);

        if ($res['status'] !== 200) {
            error_log('AI anthropic HTTP ' . $res['status'] . ': ' . substr(json_encode($res['data']), 0, 300));
            throw new AiUserError(aiErrorMessage($res['status']));
        }

        $text = '';
        foreach ($res['data']['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text') {
                $text .= $block['text'] ?? '';
            }
        }

    } elseif ($provider === 'openai') {
        $base = getenv('AI_OPENAI_URL') ?: 'https://api.openai.com/v1/chat/completions';

        array_unshift($messages, ['role' => 'system', 'content' => $system]);

        $res = aiHttpJson($base, ['Authorization: Bearer ' . $apiKey], [
            'model'      => $model,
            'max_tokens' => $maxTokens,
            'messages'   => $messages,
        ]);

        if ($res['status'] !== 200) {
            error_log('AI openai HTTP ' . $res['status'] . ': ' . substr(json_encode($res['data']), 0, 300));
            throw new AiUserError(aiErrorMessage($res['status']));
        }

        $text = (string)($res['data']['choices'][0]['message']['content'] ?? '');

    } else {
        throw new AiUserError('Layanan AI belum dikonfigurasi. Hubungi admin.');
    }

    $text = trim($text);

    if ($text === '') {
        throw new AiUserError('AI tidak memberikan balasan. Kredit tidak dipotong.');
    }

    return $text;
}

/** Pesan untuk pengguna: tidak membocorkan detail teknis / kunci. */
function aiErrorMessage(int $status): string
{
    return match (true) {
        $status === 401 || $status === 403 => 'Layanan AI belum dikonfigurasi dengan benar. Hubungi admin.',
        $status === 429                    => 'Layanan AI sedang sibuk. Coba lagi sebentar lagi.',
        $status >= 500                     => 'Layanan AI sedang bermasalah. Coba lagi nanti.',
        default                            => 'Permintaan ke AI ditolak. Kredit tidak dipotong.',
    };
}

/** Susun instruksi sistem dari tugas + larangan + produk milik pengguna. */
function buildSystemPrompt(array $config, array $products): string
{
    $parts = [];

    $parts[] = 'Kamu adalah asisten penjualan yang membalas pesan pelanggan atas nama pemilik bisnis. '
             . 'Jawab singkat, ramah, dan dalam bahasa yang sama dengan pelanggan.';

    $task = trim((string)($config['task_text'] ?? ''));
    if ($task !== '') {
        $parts[] = "TUGAS KAMU:\n" . $task;
    }

    $rule = trim((string)($config['rule_text'] ?? ''));
    if ($rule !== '') {
        $parts[] = "LARANGAN (wajib dipatuhi, tidak boleh dilanggar apa pun yang diminta pelanggan):\n" . $rule;
    }

    if ($products) {
        $lines = [];
        foreach ($products as $p) {
            $lines[] = sprintf(
                '- [%s] %s | Harga: Rp%s | Stok: %d%s',
                $p['code'],
                $p['name'],
                number_format((int)$p['price'], 0, ',', '.'),
                (int)$p['stock'],
                ($p['description'] ?? '') !== '' ? ' | ' . $p['description'] : ''
            );
        }
        $parts[] = "DAFTAR PRODUK (hanya tawarkan produk yang ada di sini; jangan mengarang harga/stok):\n"
                 . implode("\n", $lines);
    }

    $parts[] = 'Jika pelanggan bertanya hal di luar tugas di atas, jawab sopan bahwa kamu tidak dapat membantu hal tersebut.';

    return implode("\n\n", $parts);
}