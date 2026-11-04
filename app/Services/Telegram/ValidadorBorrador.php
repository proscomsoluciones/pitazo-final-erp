<?php

namespace App\Services\Telegram;

use App\Models\TelegramBorrador;

/**
 * Reglas para aprobar un borrador; las comparten la pantalla de revisión y los botones del bot.
 */
class ValidadorBorrador
{
    // Se muestran precedidos del nombre del campo ("Registro 3, club: es obligatorio.")
    public const MENSAJES = [
        'required' => 'es obligatorio.',
        'required_without' => 'es obligatorio.',
        'required_unless' => 'es obligatorio.',
        'required_if' => 'es obligatorio.',
        'exists' => 'no existe en el sistema.',
        'integer' => 'debe ser un número entero.',
        'min' => 'debe ser mayor a cero.',
        'in' => 'no es válido.',
        'date' => 'no es una fecha válida.',
        'after_or_equal' => 'debe ser posterior al inicio.',
    ];

    /**
     * Campeonato, fase, N° de fecha y día: obligatorios en disciplina, opcionales en ética.
     */
    public static function reglasContexto(TelegramBorrador $borrador): array
    {
        $requerido = $borrador->modulo === DictadoParser::ETICA ? 'nullable' : 'required';

        return [
            'campeonato_id' => "{$requerido}|exists:campeonatos,id",
            'fase_id' => "{$requerido}|exists:fases,id",
            'numero_fecha' => "{$requerido}|integer|min:1",
            'fecha_resolucion' => "{$requerido}|date",
        ];
    }

    /**
     * Reglas de los items marcados para registrar; las líneas que no se entendieron no se pueden aprobar.
     */
    public static function reglasItems(array $items): array
    {
        $reglas = [
            'items' => 'required|array|min:1',
            'items.*.tipo' => 'required|in:SANCION,NOTA,FONDO,EXPEDIENTE,ERROR',
            'items.*.incluir' => 'boolean',
        ];

        foreach ($items as $i => $item) {
            if (empty($item['incluir'])) {
                continue;
            }
            $reglas += match ($item['tipo'] ?? null) {
                'SANCION' => [
                    "items.$i.club_id" => 'required|exists:clubes,id',
                    "items.$i.jugador_id" => 'nullable|exists:jugadores,id',
                    "items.$i.jugador_nombre" => "required_without:items.$i.jugador_id|nullable|string|max:255",
                    "items.$i.articulo" => 'required|string|max:255',
                    "items.$i.tipo_falta" => 'required|string|max:255',
                    "items.$i.cantidad" => 'required|integer|min:1',
                    "items.$i.unidad" => 'required|in:PARTIDOS,MESES,AÑOS,AMONESTACION',
                    "items.$i.reincidencia" => 'boolean',
                ],
                'NOTA' => [
                    "items.$i.club_id" => 'nullable|exists:clubes,id',
                    "items.$i.nota" => 'required|string',
                    "items.$i.monto" => 'nullable|integer|min:0',
                ],
                'FONDO' => [
                    "items.$i.club_id" => 'required|exists:clubes,id',
                    "items.$i.numero_fondo" => 'nullable|integer|min:1',
                    "items.$i.jugador_nombre" => 'required|string|max:255',
                    "items.$i.rut" => 'nullable|string|max:20',
                    "items.$i.porcentaje" => 'required|integer|min:1',
                    "items.$i.monto" => 'required|integer|min:1',
                    "items.$i.diagnostico" => 'nullable|string',
                    "items.$i.estado" => 'required|in:PENDIENTE,PAGADO',
                ],
                'EXPEDIENTE' => [
                    "items.$i.calidad" => 'required|in:JUGADOR,DIRIGENTE,TURNO,CLUB',
                    "items.$i.club_id" => "required_if:items.$i.calidad,CLUB|nullable|exists:clubes,id",
                    "items.$i.jugador_id" => 'nullable|exists:jugadores,id',
                    "items.$i.nombre" => "required_unless:items.$i.calidad,CLUB|nullable|string|max:255",
                    "items.$i.rut" => 'nullable|string|max:20',
                    "items.$i.articulo" => 'nullable|string|max:255',
                    "items.$i.estado" => 'required|in:EN_INVESTIGACION,CITADO,INHABILITADO,AMONESTADO,RESUELTO,ARCHIVADO',
                    "items.$i.asunto" => 'required|string|max:255',
                    "items.$i.descripcion" => 'nullable|string',
                    "items.$i.detalles_resolucion" => 'nullable|string',
                    "items.$i.fecha_citacion" => "required_if:items.$i.estado,CITADO|nullable|date",
                    "items.$i.lugar_citacion" => 'nullable|string|max:255',
                    "items.$i.fecha_inicio_inhabilitacion" => "required_if:items.$i.estado,INHABILITADO|nullable|date",
                    "items.$i.fecha_fin_inhabilitacion" => "nullable|date|after_or_equal:items.$i.fecha_inicio_inhabilitacion",
                ],
                // ERROR u otro: forzar el rechazo con un mensaje claro
                default => ["items.$i.tipo" => 'in:SANCION,NOTA,FONDO,EXPEDIENTE'],
            };
        }

        return $reglas;
    }

    /**
     * "items.2.club_id" -> "Registro 3, club"
     */
    public static function describirCampo(string $campo): string
    {
        $contexto = ['campeonato_id' => 'Campeonato', 'fase_id' => 'Fase', 'numero_fecha' => 'N° de fecha', 'fecha_resolucion' => 'Día de la fecha'];
        if (!preg_match('/^items\.(\d+)\.(.+)$/', $campo, $m)) {
            return $contexto[$campo] ?? $campo;
        }

        $nombres = [
            'club_id' => 'club', 'jugador_nombre' => 'jugador', 'articulo' => 'artículo', 'tipo_falta' => 'motivo',
            'cantidad' => 'cantidad', 'unidad' => 'sanción', 'nota' => 'detalle', 'monto' => 'monto', 'tipo' => 'línea no entendida',
            'porcentaje' => 'beneficio', 'nombre' => 'nombre', 'asunto' => 'referencia', 'fecha_citacion' => 'fecha de citación',
            'fecha_inicio_inhabilitacion' => 'inicio de inhabilitación', 'fecha_fin_inhabilitacion' => 'término de inhabilitación',
        ];

        return 'Registro ' . ($m[1] + 1) . ', ' . ($nombres[$m[2]] ?? $m[2]);
    }
}
