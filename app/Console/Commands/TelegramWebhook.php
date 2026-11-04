<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramClient;
use Illuminate\Console\Command;

class TelegramWebhook extends Command
{
    protected $signature = 'telegram:webhook {--eliminar : Quita el webhook para volver a usar telegram:poll}';

    protected $description = 'Registra en Telegram la URL del webhook del sistema (requiere HTTPS)';

    public function handle(TelegramClient $telegram): int
    {
        if ($this->option('eliminar')) {
            $telegram->eliminarWebhook();
            $this->info('Webhook eliminado.');

            return self::SUCCESS;
        }

        $url = route('telegram.webhook');
        if (!str_starts_with($url, 'https://')) {
            $this->error("Telegram exige HTTPS y APP_URL genera {$url}. Usa telegram:poll mientras tanto.");

            return self::FAILURE;
        }

        if (!config('services.telegram.webhook_secret')) {
            $this->error('Define TELEGRAM_WEBHOOK_SECRET en el .env antes de registrar el webhook.');

            return self::FAILURE;
        }

        $telegram->configurarWebhook($url, config('services.telegram.webhook_secret'));
        $this->info("Webhook registrado en {$url}");

        return self::SUCCESS;
    }
}
