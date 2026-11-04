<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente mínimo de la Bot API de Telegram.
 */
class TelegramClient
{
    public function enviarMensaje(string|int $chatId, string $html, ?array $botones = null): void
    {
        $this->llamar('sendMessage', array_filter([
            'chat_id' => $chatId,
            'text' => $html,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
            'reply_markup' => $botones ? json_encode(['inline_keyboard' => $botones]) : null,
        ]));
    }

    /**
     * Sin $botones, Telegram quita los botones que tenía el mensaje.
     */
    public function editarMensaje(string|int $chatId, int $messageId, string $html, ?array $botones = null): void
    {
        $this->llamar('editMessageText', array_filter([
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $html,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
            'reply_markup' => $botones ? json_encode(['inline_keyboard' => $botones]) : null,
        ]));
    }

    public function responderBoton(string $callbackId, ?string $texto = null): void
    {
        $this->llamar('answerCallbackQuery', array_filter(['callback_query_id' => $callbackId, 'text' => $texto]));
    }

    public function obtenerActualizaciones(?int $offset, int $timeout = 25): array
    {
        return $this->llamar('getUpdates', array_filter([
            'offset' => $offset,
            'timeout' => $timeout,
            'allowed_updates' => json_encode(['message', 'callback_query']),
        ], fn ($v) => $v !== null), $timeout + 10) ?? [];
    }

    public function configurarWebhook(string $url, ?string $secreto): void
    {
        $this->llamar('setWebhook', array_filter([
            'url' => $url,
            'secret_token' => $secreto,
            'allowed_updates' => json_encode(['message', 'callback_query']),
        ]));
    }

    public function eliminarWebhook(): void
    {
        $this->llamar('deleteWebhook');
    }

    private function llamar(string $metodo, array $datos = [], int $timeout = 15): mixed
    {
        $token = config('services.telegram.token');
        if (!$token) {
            throw new RuntimeException('Falta TELEGRAM_BOT_TOKEN en el archivo .env');
        }

        try {
            return Http::timeout($timeout)
                ->connectTimeout(10)
                ->asForm()
                ->acceptJson()
                ->post("https://api.telegram.org/bot{$token}/{$metodo}", $datos)
                ->throw()
                ->json('result');
        } catch (\Throwable $e) {
            // La URL de la Bot API incluye el token: nunca dejarlo en mensajes ni logs
            throw new RuntimeException("Telegram ({$metodo}): " . str_replace($token, '***', $e->getMessage()), 0);
        }
    }
}
