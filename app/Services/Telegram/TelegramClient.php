<?php

namespace App\Services\Telegram;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente mínimo de la Bot API de Telegram.
 */
class TelegramClient
{
    public function enviarMensaje(string|int $chatId, string $html): void
    {
        $this->http()->post('sendMessage', [
            'chat_id' => $chatId,
            'text' => $html,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ])->throw();
    }

    public function obtenerActualizaciones(?int $offset, int $timeout = 25): array
    {
        return $this->http()
            ->timeout($timeout + 10)
            ->get('getUpdates', array_filter([
                'offset' => $offset,
                'timeout' => $timeout,
                'allowed_updates' => json_encode(['message']),
            ], fn ($v) => $v !== null))
            ->throw()
            ->json('result', []);
    }

    public function configurarWebhook(string $url, ?string $secreto): array
    {
        return $this->http()->post('setWebhook', array_filter([
            'url' => $url,
            'secret_token' => $secreto,
            'allowed_updates' => ['message'],
        ]))->throw()->json();
    }

    public function eliminarWebhook(): array
    {
        return $this->http()->post('deleteWebhook')->throw()->json();
    }

    private function http(): PendingRequest
    {
        $token = config('services.telegram.token');
        if (!$token) {
            throw new RuntimeException('Falta TELEGRAM_BOT_TOKEN en el archivo .env');
        }

        return Http::baseUrl("https://api.telegram.org/bot{$token}/")->acceptJson();
    }
}
