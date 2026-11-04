<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBot;
use App\Services\Telegram\TelegramClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class TelegramPoll extends Command
{
    protected $signature = 'telegram:poll {--once : Revisa una sola vez (para usar con cron) en vez de quedar escuchando}';

    protected $description = 'Lee los mensajes del bot de Telegram sin necesidad de webhook';

    public function handle(TelegramClient $telegram, TelegramBot $bot): int
    {
        $this->info('Escuchando mensajes de Telegram... (Ctrl+C para detener)');

        do {
            $offset = Cache::get('telegram:offset');
            $updates = $telegram->obtenerActualizaciones($offset, $this->option('once') ? 0 : 25);

            foreach ($updates as $update) {
                // Avanzar el offset antes de atender, para no reprocesar un mensaje que falle
                Cache::forever('telegram:offset', $update['update_id'] + 1);

                try {
                    $bot->atender($update);
                    $this->line('Mensaje ' . $update['update_id'] . ' atendido.');
                } catch (\Throwable $e) {
                    $this->error('Error en mensaje ' . $update['update_id'] . ': ' . $e->getMessage());
                    report($e);
                }
            }
        } while (!$this->option('once'));

        return self::SUCCESS;
    }
}
