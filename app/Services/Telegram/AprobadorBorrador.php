<?php

namespace App\Services\Telegram;

use App\Models\Club;
use App\Models\Fase;
use App\Models\Jugador;
use App\Models\NotaDisciplina;
use App\Models\Sancion;
use App\Models\TelegramBorrador;
use App\Services\SancionService;
use App\Support\Auditor;
use Illuminate\Support\Facades\DB;

/**
 * Convierte un borrador revisado en sanciones y notas de disciplina reales.
 */
class AprobadorBorrador
{
    public function __construct(private SancionService $sancionService)
    {
    }

    /**
     * @param array $contexto campeonato_id, fase_id, numero_fecha, fecha_resolucion
     * @param array $items    items revisados en pantalla
     */
    public function aprobar(TelegramBorrador $borrador, array $contexto, array $items, ?int $userId): array
    {
        return DB::transaction(function () use ($borrador, $contexto, $items, $userId) {
            $fase = Fase::findOrFail($contexto['fase_id']);
            $esLiguilla = str_contains(strtolower($fase->nombre), 'liguilla');
            $resultado = ['sanciones' => [], 'notas' => []];

            foreach ($items as $item) {
                if (empty($item['incluir'])) {
                    continue;
                }

                if ($item['tipo'] === 'SANCION') {
                    $resultado['sanciones'][] = $this->crearSancion($borrador, $contexto, $item, $esLiguilla)->id;
                } elseif ($item['tipo'] === 'NOTA') {
                    $resultado['notas'][] = NotaDisciplina::create([
                        'campeonato_id' => $contexto['campeonato_id'],
                        'fase_id' => $contexto['fase_id'],
                        'numero_fecha' => $contexto['numero_fecha'],
                        'club_id' => $item['club_id'] ?: null,
                        'nota' => $item['nota'],
                        'monto' => $item['monto'] ?: null,
                    ])->id;
                }
            }

            $borrador->update([
                'items' => $items,
                'campeonato_id' => $contexto['campeonato_id'],
                'fase_id' => $contexto['fase_id'],
                'numero_fecha' => $contexto['numero_fecha'],
                'fecha_resolucion' => $contexto['fecha_resolucion'],
                'estado' => 'APROBADO',
                'resultado' => $resultado,
                'revisado_por' => $userId,
                'revisado_at' => now(),
            ]);

            Auditor::log('CREAR', 'TRIBUNAL', sprintf(
                'Aprobó el borrador de Telegram #%d (%s, Fecha %d): %d sanción(es) y %d nota(s).',
                $borrador->id, $fase->nombre, $contexto['numero_fecha'],
                count($resultado['sanciones']), count($resultado['notas'])
            ));

            return $resultado;
        });
    }

    private function crearSancion(TelegramBorrador $borrador, array $contexto, array $item, bool $esLiguilla): Sancion
    {
        $jugador = !empty($item['jugador_id'])
            ? Jugador::findOrFail($item['jugador_id'])
            : Jugador::firstOrCreate(['nombre' => trim($item['jugador_nombre']), 'club_id' => $item['club_id']], ['rut' => null]);

        $unidad = $item['unidad'];
        $tipoSancion = match ($unidad) {
            'PARTIDOS' => 'PARTIDOS',
            'AMONESTACION' => 'AMONESTACION',
            default => 'TIEMPO',
        };
        $cantidad = $tipoSancion === 'AMONESTACION' ? 1 : (int) $item['cantidad'];

        $tipoFalta = trim($item['tipo_falta']);
        $observacion = "Registrado vía Telegram (borrador #{$borrador->id}).";

        // En liguilla no hay reincidencia por partidos (misma regla del formulario del Tribunal)
        $aplicaReincidencia = !empty($item['reincidencia']) && $tipoSancion !== 'AMONESTACION'
            && !($esLiguilla && $unidad === 'PARTIDOS');

        if ($aplicaReincidencia) {
            $previas = Sancion::where('jugador_id', $jugador->id)->where('tipo_sancion', '!=', 'AMONESTACION')->count();
            $observacion .= " [Reincidencia: {$previas} sanción(es) previa(s)]";
            if ($unidad === 'PARTIDOS' && $cantidad > 1) {
                $base = $cantidad - 1;
                $tipoFalta .= sprintf(' (%d partido%s + 1 por reincidencia = %d)', $base, $base === 1 ? '' : 's', $cantidad);
            }
        }

        $sancion = Sancion::create([
            'campeonato_id' => $contexto['campeonato_id'],
            'fase_id' => $contexto['fase_id'],
            'numero_fecha' => $contexto['numero_fecha'],
            'jugador_id' => $jugador->id,
            'club_id' => $item['club_id'],
            'tipo_involucrado' => 'JUGADOR',
            'nombre_involucrado' => $jugador->nombre,
            'rut_involucrado' => $jugador->rut,
            'articulo_reglamento' => $item['articulo'],
            'tipo_falta' => $tipoFalta,
            'tipo_sancion' => $tipoSancion,
            'cantidad_sancion' => $cantidad,
            'unidad_tiempo' => $unidad,
            'fecha_resolucion' => $contexto['fecha_resolucion'],
            'partidos_cumplidos' => 0,
            'fecha_termino_cronologica' => $tipoSancion === 'TIEMPO'
                ? $this->sancionService->calcularFechaTermino($cantidad, $unidad, $contexto['fecha_resolucion'])
                : null,
            'estado' => $tipoSancion === 'AMONESTACION' ? 'CUMPLIDO' : 'ACTIVO',
            'observacion' => $observacion,
        ]);

        $clubName = Club::find($item['club_id'])?->name ?? 'Club';
        Auditor::log('CREAR', 'TRIBUNAL', "Ingresó nueva sanción [JUGADOR] a {$jugador->nombre} ({$clubName}) por {$sancion->sancion_texto} vía Telegram.");

        return $sancion;
    }
}
