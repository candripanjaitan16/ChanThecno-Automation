<?php

declare(strict_types=1);

require_once __DIR__ . '/crypto.php';

const DEFAULT_MODELS = [
    'anthropic' => 'claude-haiku-4-5-20251001',
    'openai'    => 'gpt-4o-mini',
];

const ALLOWED_PROVIDERS = ['anthropic', 'openai'];

/** Ambil semua pengaturan sebagai array. Kunci API TIDAK didekripsi di sini. */
function loadSettings(PDO $pdo): array
{
    $rows = $pdo->query("SELECT setting_key, setting_value FROM ai_settings")->fetchAll();
    $s = [];

    foreach ($rows as $r) {
        $s[$r['setting_key']] = $r['setting_value'];
    }

    return $s + [
        'provider'          => 'anthropic',
        'model'             => '',
        'api_key_enc'       => '',
        'credit_per_reply'  => '1',
        'max_output_tokens' => '500',
        'enabled'           => '1',
    ];
}

function saveSetting(PDO $pdo, string $key, string $value): void
{
    $pdo->prepare("
        INSERT INTO ai_settings (setting_key, setting_value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ")->execute([$key, $value]);
}

function effectiveModel(array $s): string
{
    if (($s['model'] ?? '') !== '') {
        return $s['model'];
    }

    return DEFAULT_MODELS[$s['provider']] ?? '';
}