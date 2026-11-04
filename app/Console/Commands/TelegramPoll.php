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
            try {
                $updates = $telegram->obtenerActualizaciones(Cache::get('telegram:offset'), $this->option('once') ? 0 : 25);
            } catch (\RuntimeException $e) {
                // Cortes de red: reintentar en vez de cerrar el bot
                $this->warn(now()->format('H:i:s') . ' Sin conexión con Telegram, reintentando... (' . $e->getMessage() . ')');
                if ($this->option('once')) {
                    return self::FAILURE;
                }
                sleep(5);
                continue;
            }

            foreach ($updates as $update) {
                // Avanzar el offset antes de atender, para no reprocesar un mensaje que falle
                Cache::forever('telegram:offset', $update['update_id'] + 1);

                try {
                    $bot->atender($update);
                    $this->line(now()->format('H:i:s') . ' Mensaje ' . $update['update_id'] . ' atendido.');
                } catch (\Throwable $e) {
                    $this->error('Error en mensaje ' . $update['update_id'] . ': ' . $e->getMessage());
                    report($e);
                }
            }
        } while (!$this->option('once'));

        return self::SUCCESS;
    }
}
