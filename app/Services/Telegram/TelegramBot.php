<?php

namespace App\Services\Telegram;

use App\Models\TelegramBorrador;
use Illuminate\Support\Facades\Cache;

/**
 * Atiende los mensajes que llegan al bot (por webhook o por polling).
 * Nunca registra nada directamente: crea borradores que se aprueban en el sistema.
 */
class TelegramBot
{
    private const NOMBRES_MODULO = [DictadoParser::DISCIPLINA => '⚖️ Disciplina', DictadoParser::ETICA => '🏛️ Ética'];

    public function __construct(
        private TelegramClient $telegram,
        private InterpretadorDictado $interpretador,
    ) {
    }

    public function atender(array $update): void
    {
        if (isset($update['callback_query'])) {
            $this->atenderBoton($update['callback_query']);
            return;
        }

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

        // "/etica texto..." o "/disciplina texto..." indican el módulo de inmediato
        $porComando = ['/etica' => DictadoParser::ETICA, '/ética' => DictadoParser::ETICA, '/disciplina' => DictadoParser::DISCIPLINA][$comando] ?? null;
        if ($porComando) {
            $resto = trim(mb_substr($texto, mb_strlen(strtok($texto, "\n ")) ?: 0));
            $resto = preg_replace('/^@\S+\s*/', '', $resto);
            $resto === ''
                ? $this->telegram->enviarMensaje($chatId, $this->formato($porComando))
                : $this->crearBorrador($chatId, $userId, $mensaje['from'], $resto, $porComando);
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
            default => $this->recibirTexto($chatId, $userId, $mensaje['from'], $texto),
        };
    }

    private function recibirTexto(int|string $chatId, string $userId, array $from, string $texto): void
    {
        [$modulo, $sinEncabezado] = DictadoParser::detectarModulo($texto);
        if ($modulo) {
            $this->crearBorrador($chatId, $userId, $from, $sinEncabezado, $modulo);
            return;
        }

        // Sin módulo: se guarda el texto y se pregunta con botones
        Cache::put($this->clavePendiente($chatId), ['texto' => $texto, 'from' => $from], now()->addHour());
        $this->telegram->enviarMensaje($chatId, '¿Este mensaje es para <b>Disciplina</b> o para <b>Ética</b>?', [[
            ['text' => self::NOMBRES_MODULO[DictadoParser::DISCIPLINA], 'callback_data' => 'modulo:' . DictadoParser::DISCIPLINA],
            ['text' => self::NOMBRES_MODULO[DictadoParser::ETICA], 'callback_data' => 'modulo:' . DictadoParser::ETICA],
        ]]);
    }

    private function atenderBoton(array $boton): void
    {
        $chatId = $boton['message']['chat']['id'] ?? null;
        $userId = (string) ($boton['from']['id'] ?? '');
        $modulo = str_replace('modulo:', '', $boton['data'] ?? '');

        if (!$chatId || !$this->autorizado($userId) || !isset(self::NOMBRES_MODULO[$modulo])) {
            $this->telegram->responderBoton($boton['id'], 'No autorizado.');
            return;
        }

        $pendiente = Cache::pull($this->clavePendiente($chatId));
        $this->telegram->responderBoton($boton['id']);

        if (!$pendiente) {
            $this->telegram->editarMensaje($chatId, $boton['message']['message_id'], 'Este mensaje ya fue procesado o venció. Envíalo de nuevo.');
            return;
        }

        $this->telegram->editarMensaje($chatId, $boton['message']['message_id'], 'Módulo: <b>' . self::NOMBRES_MODULO[$modulo] . '</b>');
        $this->crearBorrador($chatId, $userId, $pendiente['from'], $pendiente['texto'], $modulo);
    }

    private function crearBorrador(int|string $chatId, string $userId, array $from, string $texto, string $modulo): void
    {
        $interpretado = $this->interpretador->interpretar($texto, $modulo);

        if (empty($interpretado['items'])) {
            $this->telegram->enviarMensaje($chatId, "No encontré registros en el mensaje.\n\n" . $this->formato($modulo));
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
            'modulo' => $modulo,
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
        $pesos = fn (?int $monto) => $monto ? ' — $' . number_format($monto, 0, ',', '.') : '';
        $lineas = ["📝 <b>Borrador #{$borrador->id}</b> · " . self::NOMBRES_MODULO[$borrador->modulo]];

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

            $lineas[] = match ($item['tipo']) {
                'SANCION' => sprintf(
                    '%d. <b>%s</b> (%s)%s — %s, %s → %s%s',
                    $n,
                    $e($item['jugador_nombre'] ?? '¿jugador?'),
                    $e($item['club_nombre'] ?? $item['club_texto'] ?? '¿club?'),
                    $item['jugador_id'] ? '' : ' 🆕',
                    $e($item['articulo'] ?? '¿artículo?'),
                    $e($item['tipo_falta'] ?? '¿motivo?'),
                    $e($this->textoSancion($item)),
                    $item['reincidencia'] ? ' (R)' : ''
                ),
                'NOTA' => sprintf(
                    '%d. 💰 <b>%s</b>: %s%s',
                    $n,
                    $e($item['club_nombre'] ?? $item['club_texto'] ?? 'Sin club'),
                    $e($item['nota'] ?? ''),
                    $pesos($item['monto'])
                ),
                'FONDO' => sprintf(
                    '%d. 🩹 Fondo Solidario%s: <b>%s</b> (%s)%s — %s%s',
                    $n,
                    $item['numero_fondo'] ? " N°{$item['numero_fondo']}" : '',
                    $e($item['jugador_nombre'] ?? '¿jugador?'),
                    $e($item['club_nombre'] ?? $item['club_texto'] ?? '¿club?'),
                    $item['rut'] ? ', RUT ' . $e($item['rut']) : '',
                    $item['porcentaje'] ? "{$item['porcentaje']}%" : '¿%?',
                    $pesos($item['monto'])
                ),
                'EXPEDIENTE' => sprintf(
                    '%d. 🏛️ <b>%s</b> (%s%s)%s — %s%s',
                    $n,
                    $e($item['nombre'] ?? $item['club_nombre'] ?? '¿involucrado?'),
                    $e(ucfirst(strtolower($item['calidad']))),
                    $item['club_nombre'] ? ', ' . $e($item['club_nombre']) : '',
                    $item['rut'] ? ', RUT ' . $e($item['rut']) : '',
                    $e($this->textoMedida($item)),
                    $item['articulo'] ? ', ' . $e($item['articulo']) : ''
                ),
                default => "{$n}. ❓ " . $e($item['linea']),
            };

            foreach ($item['avisos'] ?? [] as $aviso) {
                $lineas[] = '   ⚠️ ' . $e($aviso);
                $totalAvisos++;
            }
        }

        $lineas[] = '';
        if ($borrador->modulo === DictadoParser::DISCIPLINA && (!$borrador->fase_id || !$borrador->numero_fecha)) {
            $lineas[] = 'ℹ️ Falta indicar la fase y fecha (ej: <i>Fecha 2 Clausura 08-11-2026</i>). Se puede elegir al aprobar.';
        }
        $lineas[] = $totalAvisos
            ? "Revisa los {$totalAvisos} aviso(s) y aprueba en el sistema:"
            : 'Revisa y aprueba en el sistema:';
        $lineas[] = route('telegram.borradores.show', $borrador->id);

        return implode("\n", $lineas);
    }

    private function textoSancion(array $item): string
    {
        $unidades = ['PARTIDOS' => ['partido', 'partidos'], 'MESES' => ['mes', 'meses'], 'AÑOS' => ['año', 'años']];

        return match ($item['unidad']) {
            'AMONESTACION' => 'Amonestación',
            null => '¿sanción?',
            default => $item['cantidad'] . ' ' . $unidades[$item['unidad']][$item['cantidad'] == 1 ? 0 : 1],
        };
    }

    private function textoMedida(array $item): string
    {
        $fecha = fn (?string $f) => $f ? date('d-m-Y', strtotime($f)) : '?';

        return match ($item['estado']) {
            'INHABILITADO' => 'Inhabilitación desde ' . $fecha($item['fecha_inicio_inhabilitacion'])
                . ($item['fecha_fin_inhabilitacion'] ? ' hasta ' . $fecha($item['fecha_fin_inhabilitacion']) : ' (sin término)'),
            'CITADO' => 'Citación' . ($item['fecha_citacion'] ? ' el ' . date('d-m-Y H:i', strtotime($item['fecha_citacion'])) : ''),
            'EN_INVESTIGACION' => 'Apertura de investigación',
            'AMONESTADO' => 'Amonestación',
            'RESUELTO' => 'Resolución',
            'ARCHIVADO' => 'Archivo',
            default => $item['estado'],
        };
    }

    private function pendientes(): string
    {
        $pendientes = TelegramBorrador::where('estado', 'PENDIENTE')->latest()->limit(10)->get();
        if ($pendientes->isEmpty()) {
            return 'No hay borradores pendientes.';
        }

        return "Borradores pendientes de aprobar:\n" . $pendientes
            ->map(fn ($b) => sprintf('• #%d %s (%d registros) %s', $b->id, self::NOMBRES_MODULO[$b->modulo], count($b->items), route('telegram.borradores.show', $b->id)))
            ->implode("\n");
    }

    private function ayuda(): string
    {
        return implode("\n", [
            '<b>Registro por Telegram — Pitazo Final</b>',
            'Escribe o dicta una línea por registro, separando los datos con comas.',
            'Al enviar, te preguntaré si es para <b>Disciplina</b> o <b>Ética</b>. También puedes escribir «Disciplina» o «Ética» en la primera línea.',
            '',
            $this->formato(DictadoParser::DISCIPLINA),
            '',
            $this->formato(DictadoParser::ETICA),
            '',
            '• Al dictar, di «coma» entre datos y «nueva línea» entre registros.',
            '• Nada se registra hasta aprobar el borrador en el sistema.',
            '',
            '/disciplina o /etica — ver solo ese formato',
            '/pendientes — borradores sin aprobar',
            '/id — tu ID de Telegram',
        ]);
    }

    private function formato(string $modulo): string
    {
        return $modulo === DictadoParser::ETICA
            ? implode("\n", [
                '🏛️ <b>Ética</b> — <i>club, nombre, RUT, calidad, artículo, medida, detalle</i>',
                '<code>Ética',
                'Arcoíris, Víctor Figueroa Fernández, 17.273.112-0, dirigente, 206 I, inhabilitación 1 año desde 11-04-2026, se rebaja la sanción de 2 años a 1',
                'Valencia, Pedro Pérez, jugador, citación 12-11-2026 19:30, insultos al turno',
                'Turno, Margarita Vargas Vargas, 207, investigación, ingreso de oficios</code>',
                '• Calidad: jugador, dirigente, turno o club.',
                '• Medida: investigación, citación (fecha y hora), inhabilitación (duración o desde/hasta), amonestación o resolución.',
            ])
            : implode("\n", [
                '⚖️ <b>Disciplina</b> — <i>club, jugador, artículo, motivo, sanción</i>',
                '<code>Disciplina',
                'Fecha 2 Clausura 08-11-2026',
                'Carmelo de Praga, Héctor Caneo Navarrete, 210 H, conducta violenta, 4 partidos',
                'Estrella, Kevin Núñez Núñez, 211 P, doble amonestación, 1+1 partidos, R',
                'Multa, Valencia, 50.000, no presentación serie femenina',
                'Carta de amonestación al Sr. Oscar Girola DT, Santa Margarita, mal comportamiento, 10.000',
                'Fondo 32, Alianza, Julio Astete Valenzuela, 13.262.615-4, 14 días</code>',
                '• La línea «Fecha …» (fase y día) es opcional.',
                '• R marca reincidencia: «1 partido, R» o «1+1 partidos» quedan en 2.',
                '• Fondo: indica % (100%) o días de reposo (14 días, fractura).',
            ]);
    }

    private function completo(array $item): bool
    {
        return match ($item['tipo']) {
            'SANCION' => $item['club_id'] && ($item['jugador_id'] || $item['jugador_nombre'])
                && $item['articulo'] && $item['tipo_falta'] && $item['unidad'] && $item['cantidad'],
            'NOTA' => (bool) $item['nota'],
            'FONDO' => $item['club_id'] && $item['jugador_nombre'] && $item['porcentaje'] && $item['monto'],
            'EXPEDIENTE' => ($item['calidad'] === 'CLUB' ? (bool) $item['club_id'] : (bool) $item['nombre'])
                && ($item['estado'] !== 'CITADO' || $item['fecha_citacion']),
            default => false,
        };
    }

    private function clavePendiente(int|string $chatId): string
    {
        return "telegram:pendiente:{$chatId}";
    }

    private function autorizado(string $userId): bool
    {
        return in_array($userId, config('services.telegram.usuarios_autorizados', []), true);
    }
}
