<?php

namespace App\Services\Telegram;

use App\Models\TelegramBorrador;

/**
 * Atiende los mensajes que llegan al bot (por webhook o por polling).
 * Nunca registra sanciones directamente: crea borradores que se aprueban en el sistema.
 */
class TelegramBot
{
    public function __construct(
        private TelegramClient $telegram,
        private InterpretadorDictado $interpretador,
    ) {
    }

    public function atender(array $update): void
    {
        $mensaje = $update['message'] ?? null;
        if (!$mensaje || empty($mensaje['chat']['id']) || empty($mensaje['from']['id'])) {
            return;
        }

        $chatId = $mensaje['chat']['id'];
        $userId = (string) $mensaje['from']['id'];
        $texto = trim($mensaje['text'] ?? $mensaje['caption'] ?? '');
        $comando = strtolower(strtok($texto, " @\n") ?: '');

        // /id responde siempre, para que el administrador pueda autorizar al usuario
        if ($comando === '/id') {
            $this->telegram->enviarMensaje($chatId, "Tu ID de Telegram es <code>{$userId}</code>.");
            return;
        }

        if (!$this->autorizado($userId)) {
            $this->telegram->enviarMensaje($chatId, "No estás autorizado para usar este bot.\nPide al administrador que agregue tu ID <code>{$userId}</code>.");
            return;
        }

        match (true) {
            in_array($comando, ['/start', '/ayuda', '/help'], true) => $this->telegram->enviarMensaje($chatId, $this->ayuda()),
            $comando === '/pendientes' => $this->telegram->enviarMensaje($chatId, $this->pendientes()),
            !empty($mensaje['photo']) || !empty($mensaje['voice']) => $this->telegram->enviarMensaje(
                $chatId,
                "Por ahora el bot solo lee texto. Usa el micrófono del teclado para dictar.\n\n" . $this->ayuda()
            ),
            $texto === '' || str_starts_with($texto, '/') => $this->telegram->enviarMensaje($chatId, $this->ayuda()),
            default => $this->crearBorrador($chatId, $userId, $mensaje['from'], $texto),
        };
    }

    private function crearBorrador(int|string $chatId, string $userId, array $from, string $texto): void
    {
        $interpretado = $this->interpretador->interpretar($texto);

        if (empty($interpretado['items'])) {
            $this->telegram->enviarMensaje($chatId, "No encontré sanciones ni multas en el mensaje.\n\n" . $this->ayuda());
            return;
        }

        $contexto = $interpretado['contexto'];
        // Las líneas incompletas llegan desmarcadas: se corrigen y marcan en la pantalla de revisión
        $items = array_map(fn ($item) => $item + ['incluir' => $this->completo($item)], $interpretado['items']);

        $borrador = TelegramBorrador::create([
            'telegram_chat_id' => (string) $chatId,
            'telegram_user_id' => $userId,
            'telegram_usuario' => trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? '')) ?: ($from['username'] ?? null),
            'texto_original' => $texto,
            'items' => $items,
            'campeonato_id' => $contexto['campeonato_id'] ?? null,
            'fase_id' => $contexto['fase_id'] ?? null,
            'numero_fecha' => $contexto['numero_fecha'] ?? null,
            'fecha_resolucion' => $contexto['fecha_resolucion'] ?? null,
        ]);

        $this->telegram->enviarMensaje($chatId, $this->resumen($borrador));
    }

    public function resumen(TelegramBorrador $borrador): string
    {
        $e = fn (?string $s) => htmlspecialchars((string) $s, ENT_NOQUOTES);
        $lineas = ["📝 <b>Borrador #{$borrador->id}</b>"];

        if ($borrador->fase || $borrador->numero_fecha || $borrador->fecha_resolucion) {
            $lineas[] = trim(sprintf(
                '%s %s %s',
                $borrador->fase ? $e($borrador->fase->nombre) : '',
                $borrador->numero_fecha ? "Fecha {$borrador->numero_fecha}" : '',
                $borrador->fecha_resolucion?->format('d-m-Y') ?? ''
            ));
        }

        $totalAvisos = 0;
        foreach ($borrador->items as $i => $item) {
            $n = $i + 1;
            $lineas[] = '';

            if ($item['tipo'] === 'SANCION') {
                $unidades = ['PARTIDOS' => ['partido', 'partidos'], 'MESES' => ['mes', 'meses'], 'AÑOS' => ['año', 'años']];
                $sancion = match ($item['unidad']) {
                    'AMONESTACION' => 'Amonestación',
                    null => '¿sanción?',
                    default => $item['cantidad'] . ' ' . $unidades[$item['unidad']][$item['cantidad'] == 1 ? 0 : 1],
                };
                $lineas[] = sprintf(
                    '%d. <b>%s</b> (%s)%s — %s, %s%s',
                    $n,
                    $e($item['jugador_nombre'] ?? '¿jugador?'),
                    $e($item['club_nombre'] ?? $item['club_texto'] ?? '¿club?'),
                    $item['jugador_id'] ? '' : ' 🆕',
                    $e($item['articulo'] ?? '¿artículo?'),
                    $e($item['tipo_falta'] ?? '¿motivo?'),
                    ' → ' . $e($sancion) . ($item['reincidencia'] ? ' (R)' : '')
                );
            } elseif ($item['tipo'] === 'NOTA') {
                $lineas[] = sprintf(
                    '%d. 💰 <b>%s</b>: %s%s',
                    $n,
                    $e($item['club_nombre'] ?? $item['club_texto'] ?? 'Sin club'),
                    $e($item['nota'] ?? ''),
                    $item['monto'] ? ' — $' . number_format($item['monto'], 0, ',', '.') : ''
                );
            }

            foreach ($item['avisos'] ?? [] as $aviso) {
                $lineas[] = '   ⚠️ ' . $e($aviso);
                $totalAvisos++;
            }
        }

        $lineas[] = '';
        if (!$borrador->fase_id || !$borrador->numero_fecha) {
            $lineas[] = 'ℹ️ Falta indicar la fase y fecha (ej: <i>Fecha 2 Clausura 08-11-2026</i>). Se puede elegir al aprobar.';
        }
        $lineas[] = $totalAvisos
            ? "Revisa los {$totalAvisos} aviso(s) y aprueba en el sistema:"
            : 'Revisa y aprueba en el sistema:';
        $lineas[] = route('telegram.borradores.show', $borrador->id);

        return implode("\n", $lineas);
    }

    private function pendientes(): string
    {
        $pendientes = TelegramBorrador::where('estado', 'PENDIENTE')->latest()->limit(10)->get();
        if ($pendientes->isEmpty()) {
            return 'No hay borradores pendientes.';
        }

        return "Borradores pendientes de aprobar:\n" . $pendientes
            ->map(fn ($b) => sprintf('• #%d (%d registros) %s', $b->id, count($b->items), route('telegram.borradores.show', $b->id)))
            ->implode("\n");
    }

    private function ayuda(): string
    {
        return implode("\n", [
            '<b>Registro de sanciones por Telegram</b>',
            'Escribe o dicta una línea por sanción, separando con comas:',
            '<i>club, jugador, artículo, motivo, sanción</i>',
            '',
            'Ejemplo:',
            '<code>Fecha 2 Clausura 08-11-2026',
            'Carmelo de Praga, Héctor Caneo Navarrete, 210 H, conducta violenta, 4 partidos',
            'Estrella, Kevin Núñez Núñez, 211 P, doble amonestación, 1+1 partidos, R',
            'Unión Compuertas, Ricardo Aspee, 205 J, dirigente con conducta violenta, 5 años',
            'Multa, Valencia, 50.000, no presentación serie femenina</code>',
            '',
            '• La primera línea (fecha, fase y día) es opcional.',
            '• R marca reincidencia: «1 partido, R» o «1+1 partidos» quedan en 2.',
            '• Al dictar, di «coma» entre campos y «nueva línea» entre sanciones.',
            '• Nada se registra hasta aprobar el borrador en el sistema.',
            '',
            '/pendientes — borradores sin aprobar',
            '/id — tu ID de Telegram',
        ]);
    }

    private function completo(array $item): bool
    {
        return match ($item['tipo']) {
            'SANCION' => $item['club_id'] && ($item['jugador_id'] || $item['jugador_nombre'])
                && $item['articulo'] && $item['tipo_falta'] && $item['unidad'] && $item['cantidad'],
            'NOTA' => (bool) $item['nota'],
            default => false,
        };
    }

    private function autorizado(string $userId): bool
    {
        return in_array($userId, config('services.telegram.usuarios_autorizados', []), true);
    }
}
