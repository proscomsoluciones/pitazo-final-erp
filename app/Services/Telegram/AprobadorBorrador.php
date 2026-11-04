<?php

namespace App\Services\Telegram;

use App\Models\CasoEtica;
use App\Models\Club;
use App\Models\Fase;
use App\Models\FondoSolidario;
use App\Models\Jugador;
use App\Models\NotaDisciplina;
use App\Models\Sancion;
use App\Models\TelegramBorrador;
use App\Services\SancionService;
use App\Support\Auditor;
use Illuminate\Support\Facades\DB;

/**
 * Convierte un borrador revisado en registros reales: sanciones, notas y fondos
 * solidarios (disciplina) o expedientes (ética).
 */
class AprobadorBorrador
{
    public function __construct(private SancionService $sancionService)
    {
    }

    /**
     * @param array $contexto campeonato_id, fase_id, numero_fecha, fecha_resolucion (opcionales en ética)
     * @param array $items    items revisados en pantalla
     * @return array{sanciones: int[], notas: int[], fondos: int[], expedientes: int[]}
     */
    public function aprobar(TelegramBorrador $borrador, array $contexto, array $items, ?int $userId): array
    {
        $contexto += ['campeonato_id' => null, 'fase_id' => null, 'numero_fecha' => null, 'fecha_resolucion' => null];

        return DB::transaction(function () use ($borrador, $contexto, $items, $userId) {
            $fase = $contexto['fase_id'] ? Fase::findOrFail($contexto['fase_id']) : null;
            $esLiguilla = $fase && str_contains(strtolower($fase->nombre), 'liguilla');
            $resultado = ['sanciones' => [], 'notas' => [], 'fondos' => [], 'expedientes' => []];

            foreach ($items as $item) {
                if (empty($item['incluir'])) {
                    continue;
                }

                match ($item['tipo']) {
                    'SANCION' => $resultado['sanciones'][] = $this->crearSancion($borrador, $contexto, $item, $esLiguilla)->id,
                    'NOTA' => $resultado['notas'][] = NotaDisciplina::create([
                        'campeonato_id' => $contexto['campeonato_id'],
                        'fase_id' => $contexto['fase_id'],
                        'numero_fecha' => $contexto['numero_fecha'],
                        'club_id' => $item['club_id'] ?: null,
                        'nota' => $item['nota'],
                        'monto' => $item['monto'] ?: null,
                    ])->id,
                    'FONDO' => $resultado['fondos'][] = $this->crearFondo($contexto, $item)->id,
                    'EXPEDIENTE' => $resultado['expedientes'][] = $this->crearExpediente($borrador, $contexto, $item)->id,
                    default => null,
                };
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

            Auditor::log('CREAR', $borrador->modulo === DictadoParser::ETICA ? 'ETICA' : 'TRIBUNAL', sprintf(
                'Aprobó el borrador de Telegram #%d%s: %s.',
                $borrador->id,
                $fase ? " ({$fase->nombre}, Fecha {$contexto['numero_fecha']})" : '',
                self::describirResultado($resultado)
            ));

            return $resultado;
        });
    }

    /**
     * "2 sanción(es), 1 nota(s)"
     */
    public static function describirResultado(array $resultado): string
    {
        $nombres = ['sanciones' => 'sanción(es)', 'notas' => 'multa(s)/nota(s)', 'fondos' => 'fondo(s) solidario(s)', 'expedientes' => 'expediente(s) de ética'];

        return collect($nombres)
            ->filter(fn ($_, $clave) => !empty($resultado[$clave]))
            ->map(fn ($nombre, $clave) => count($resultado[$clave]) . " {$nombre}")
            ->implode(', ') ?: 'sin registros';
    }

    private function crearFondo(array $contexto, array $item): FondoSolidario
    {
        // Mismo criterio que el formulario: el N° es correlativo si el acta no lo trae
        $numero = $item['numero_fondo'] ?: (FondoSolidario::lockForUpdate()->max('numero_fondo') ?? 0) + 1;

        $fondo = FondoSolidario::create([
            'campeonato_id' => $contexto['campeonato_id'],
            'fase_id' => $contexto['fase_id'],
            'numero_fecha' => $contexto['numero_fecha'],
            'club_id' => $item['club_id'],
            'numero_fondo' => $numero,
            'jugador_rut' => $item['rut'] ?: null,
            'jugador_nombre' => trim($item['jugador_nombre']),
            'diagnostico' => $item['diagnostico'] ?: null,
            'tipo_beneficio' => $item['porcentaje'] ? "{$item['porcentaje']}%" : null,
            'monto_asignado' => $item['monto'] ?: null,
            'estado' => $item['estado'] ?: 'PAGADO',
        ]);

        Auditor::log('CREAR', 'FONDOS', "Registró aporte de Fondo Solidario N°{$fondo->numero_fondo} para {$fondo->jugador_nombre} ({$fondo->club?->name}) vía Telegram.");

        return $fondo;
    }

    private function crearExpediente(TelegramBorrador $borrador, array $contexto, array $item): CasoEtica
    {
        $calidad = $item['calidad'];

        $caso = CasoEtica::create([
            'folio' => CasoEtica::siguienteFolio(),
            'tipo_oficio' => CasoEtica::TIPO_OFICIO_POR_ESTADO[$item['estado']],
            'estado' => $item['estado'],
            'tipo_involucrado' => $calidad,
            'club_id' => $item['club_id'] ?: null,
            'jugador_id' => $calidad === 'JUGADOR' ? ($item['jugador_id'] ?: null) : null,
            'nombre_involucrado' => $calidad === 'CLUB' ? null : trim($item['nombre']),
            'rut_involucrado' => $calidad === 'CLUB' ? null : ($item['rut'] ?: null),
            'articulo_reglamento' => $item['articulo'] ?: null,
            'campeonato_id' => $contexto['campeonato_id'],
            'fase_id' => $contexto['fase_id'],
            'numero_fecha' => $contexto['numero_fecha'],
            'asunto' => $item['asunto'],
            'descripcion' => $item['descripcion'] ?: null,
            'detalles_resolucion' => $item['detalles_resolucion'] ?: null,
            'fecha_citacion' => $item['estado'] === 'CITADO' ? ($item['fecha_citacion'] ?: null) : null,
            'lugar_citacion' => $item['estado'] === 'CITADO' ? ($item['lugar_citacion'] ?: null) : null,
            'fecha_inicio_inhabilitacion' => $item['estado'] === 'INHABILITADO' ? ($item['fecha_inicio_inhabilitacion'] ?: null) : null,
            'fecha_fin_inhabilitacion' => $item['estado'] === 'INHABILITADO' ? ($item['fecha_fin_inhabilitacion'] ?: null) : null,
            'observaciones' => "Registrado vía Telegram (borrador #{$borrador->id}).",
        ]);

        Auditor::log('CREAR', 'ETICA', "Creó el expediente de ética {$caso->folio} ({$caso->asunto}) vía Telegram.");

        return $caso;
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
