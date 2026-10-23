<?php

namespace App\Http\Controllers;

use App\Models\Sancion;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\Campeonato;
use App\Models\Fase;
use App\Http\Requests\StoreSancionRequest;
use App\Rules\RutRule;
use App\Services\SancionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SancionController extends Controller
{
    public function __construct(private SancionService $sancionService)
    {
    }

    public function index()
    {
        $sanciones = Sancion::with(['jugador', 'club', 'oficioHabilitacion', 'campeonato', 'fase'])
            ->orderBy('id', 'desc')
            ->get();
            
        $clubes = Club::all();
        $jugadores = Jugador::all();
        $campeonatos = Campeonato::with('fases')->where('estado', 'ACTIVO')->get();
        $notas = \App\Models\NotaDisciplina::with(['campeonato', 'fase', 'club'])
            ->orderBy('numero_fecha', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $referencias = \App\Models\ReferenciaOficio::where('activa', true)
            ->whereIn('modulo', ['GENERAL', 'TRIBUNAL'])
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Tribunal/Index', [
            'sanciones'   => $sanciones,
            'clubes'      => $clubes,
            'jugadores'   => $jugadores,
            'campeonatos' => $campeonatos,
            'notas'       => $notas,
            'referencias' => $referencias,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'club_id' => 'required|exists:clubes,id',
            'jugador_rut' => ['required', 'string', 'max:20', new RutRule()],
            'jugador_nombre' => 'required|string|max:255',
            'articulo_reglamento' => 'required|string|max:255',
            'tipo_falta' => 'required|string|max:255',
            'observacion' => 'nullable|string',
            'cantidad_sancion' => 'required|integer|min:1',
            'tipo_sancion' => 'required|in:PARTIDOS,TIEMPO',
            'unidad_tiempo' => ['required', 'in:PARTIDOS,MESES,AÑOS', $this->unidadTiempoCoincideConTipo($request)],
            'fecha_resolucion' => 'required|date',
        ]);

        // Format RUT to XXXXXXXX-X
        $rutLimpio = preg_replace('/[^kK0-9]/i', '', $data['jugador_rut']);
        $dv = substr($rutLimpio, -1);
        $numero = substr($rutLimpio, 0, -1);
        $data['jugador_rut'] = strtoupper($numero . '-' . $dv);

        // Autocreate/Update Jugador based on RUT
        $jugador = Jugador::updateOrCreate(
            ['rut' => $data['jugador_rut']],
            [
                'nombre' => $data['jugador_nombre'],
                'club_id' => $data['club_id'],
            ]
        );

        $data['jugador_id'] = $jugador->id;
        
        $fase = Fase::find($data['fase_id']);
        $esLiguilla = $fase && str_contains(strtolower($fase->nombre), 'liguilla');

        // Verificar antecedentes previos (Reincidencia)
        $reincidenciasPrevias = Sancion::where('jugador_rut', $data['jugador_rut'])
            ->orWhere('jugador_id', $jugador->id)
            ->count();

        // En Liguilla NO se aplica reincidencia por partidos, solo por tiempo (MESES/AÑOS)
        if ($reincidenciasPrevias > 0 && !($esLiguilla && $data['unidad_tiempo'] === 'PARTIDOS')) {
            $notaReincidencia = "[Reincidencia: {$reincidenciasPrevias} sanción(es) previa(s)]";
            if (empty($data['observacion'])) {
                $data['observacion'] = $notaReincidencia;
            } elseif (!str_contains($data['observacion'], 'Reincidencia')) {
                $data['observacion'] .= ' ' . $notaReincidencia;
            }
        }

        if ($data['tipo_sancion'] === 'TIEMPO') {
            $data['fecha_termino_cronologica'] = app(\App\Services\SancionService::class)->calcularFechaTermino(
                $data['cantidad_sancion'],
                $data['unidad_tiempo'],
                $data['fecha_resolucion']
            );
        } else {
            $data['fecha_termino_cronologica'] = null;
        }

        $sancion = Sancion::create($data);

        $clubName = Club::find($data['club_id'])?->name ?? 'Club';
        $logReincidencia = ($reincidenciasPrevias > 0 && !($esLiguilla && $data['unidad_tiempo'] === 'PARTIDOS')) ? " [Reincidente #{$reincidenciasPrevias}]" : "";
        \App\Support\Auditor::log('CREAR', 'TRIBUNAL', "Ingresó nueva sanción a {$data['jugador_nombre']} ({$clubName}) por {$data['cantidad_sancion']} {$data['unidad_tiempo']}{$logReincidencia}.");

        return redirect()->back()->with('success', 'Sanción registrada correctamente.');
    }

    public function update(Request $request, $id)
    {
        $sancion = Sancion::findOrFail($id);

        $data = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'club_id' => 'required|exists:clubes,id',
            'jugador_rut' => ['required', 'string', 'max:20', new RutRule()],
            'jugador_nombre' => 'required|string|max:255',
            'articulo_reglamento' => 'required|string|max:255',
            'tipo_falta' => 'required|string|max:255',
            'observacion' => 'nullable|string',
            'cantidad_sancion' => 'required|integer|min:1',
            'tipo_sancion' => 'required|in:PARTIDOS,TIEMPO',
            'unidad_tiempo' => ['required', 'in:PARTIDOS,MESES,AÑOS', $this->unidadTiempoCoincideConTipo($request)],
            'fecha_resolucion' => 'required|date',
            'estado' => 'required|in:ACTIVO,CUMPLIDO',
        ]);

        $rutLimpio = preg_replace('/[^kK0-9]/i', '', $data['jugador_rut']);
        $dv = substr($rutLimpio, -1);
        $numero = substr($rutLimpio, 0, -1);
        $data['jugador_rut'] = strtoupper($numero . '-' . $dv);

        $jugador = Jugador::updateOrCreate(
            ['rut' => $data['jugador_rut']],
            [
                'nombre' => $data['jugador_nombre'],
                'club_id' => $data['club_id'],
            ]
        );

        $data['jugador_id'] = $jugador->id;
        
        if ($data['tipo_sancion'] === 'TIEMPO') {
            $data['fecha_termino_cronologica'] = app(\App\Services\SancionService::class)->calcularFechaTermino(
                $data['cantidad_sancion'],
                $data['unidad_tiempo'],
                $data['fecha_resolucion']
            );
        } else {
            $data['fecha_termino_cronologica'] = null;
        }

        $sancion->update($data);

        $clubName = Club::find($data['club_id'])?->name ?? 'Club';
        \App\Support\Auditor::log('EDITAR', 'TRIBUNAL', "Modificó sanción ID #{$sancion->id} de {$data['jugador_nombre']} ({$clubName}) a {$data['cantidad_sancion']} {$data['unidad_tiempo']} [Estado: {$data['estado']}].");

        return redirect()->back()->with('success', 'Sanción actualizada correctamente.');
    }

    /**
     * unidad_tiempo debe ser coherente con tipo_sancion: PARTIDOS exige unidad_tiempo=PARTIDOS,
     * TIEMPO exige unidad_tiempo en MESES o AÑOS (evita fecha_termino_cronologica nula en sanciones TIEMPO).
     */
    private function unidadTiempoCoincideConTipo(Request $request): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($request) {
            $tipo = $request->input('tipo_sancion');

            if ($tipo === 'TIEMPO' && $value === 'PARTIDOS') {
                $fail('Cuando el tipo de sanción es TIEMPO, la unidad de tiempo debe ser MESES o AÑOS.');
            }

            if ($tipo === 'PARTIDOS' && $value !== 'PARTIDOS') {
                $fail('Cuando el tipo de sanción es PARTIDOS, la unidad de tiempo debe ser PARTIDOS.');
            }
        };
    }

    public function destroy($id)
    {
        $sancion = Sancion::with(['jugador', 'club'])->findOrFail($id);
        $jugadorNombre = $sancion->jugador?->nombre ?? 'Jugador';
        $clubNombre = $sancion->club?->name ?? 'Club';
        $sancionId = $sancion->id;

        $sancion->delete();

        \App\Support\Auditor::log('ELIMINAR', 'TRIBUNAL', "Eliminó sanción ID #{$sancionId} de {$jugadorNombre} ({$clubNombre}).");

        return redirect()->back()->with('success', 'Sanción eliminada correctamente.');
    }

    public function emitirOficio(int $id)
    {
        try {
            $sancion = Sancion::with(['jugador', 'club', 'campeonato', 'fase'])->findOrFail($id);

            // Obtener nombres del Secretario y Presidente del sistema
            $secretario = \App\Models\User::role('Secretario')->first();
            $presidente = \App\Models\User::role('Presidente')->first();

            if ($sancion->estado === 'CUMPLIDO') {
                // Oficio de Habilitación (solo para sanciones cumplidas)
                $oficio = $this->sancionService->generarOficioHabilitacion($id);
            } else {
                // Oficio de Sanción (para sanciones activas — genera folio DISC)
                $oficio = $this->sancionService->generarOficioSancion($id);
            }

            $asoc = \App\Models\ConfiguracionAsociacion::instancia();

            $pdf = Pdf::loadView('tribunal.oficio_pdf', [
                'oficio'            => $oficio,
                'sancion'           => $sancion,
                'asoc'              => $asoc,
                'secretario_nombre' => $asoc->nombre_secretario ?: ($secretario?->name ?? 'Secretario(a)'),
                'presidente_nombre' => $asoc->nombre_presidente ?: ($presidente?->name ?? 'Presidente(a)'),
            ]);

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $oficio->folio . '.pdf"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function emitirActaFecha(Request $request)
    {
        $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
        ]);

        $campeonato = Campeonato::findOrFail($request->campeonato_id);
        $fase = Fase::findOrFail($request->fase_id);
        $numero_fecha = $request->numero_fecha;

        $sanciones = Sancion::with(['jugador', 'club'])
            ->where('campeonato_id', $campeonato->id)
            ->where('fase_id', $fase->id)
            ->where('numero_fecha', $numero_fecha)
            ->orderBy('club_id')
            ->get();

        $notas = \App\Models\NotaDisciplina::with('club')
            ->where('campeonato_id', $campeonato->id)
            ->where('fase_id', $fase->id)
            ->where('numero_fecha', $numero_fecha)
            ->get();

        $fondos = \App\Models\FondoSolidario::with('club')
            ->where('campeonato_id', $campeonato->id)
            ->where('fase_id', $fase->id)
            ->where('numero_fecha', $numero_fecha)
            ->get();

        $asoc = \App\Models\ConfiguracionAsociacion::instancia();

        $pdf = Pdf::loadView('tribunal.acta_fecha_pdf', [
            'sanciones' => $sanciones,
            'notas' => $notas,
            'fondos' => $fondos,
            'campeonato' => $campeonato,
            'fase' => $fase,
            'numero_fecha' => $numero_fecha,
            'asoc' => $asoc,
            'fecha_emision' => now()->format('Y-m-d')
        ])->setPaper('a4', 'landscape');

        // Ej: Acta_Disciplina_Fecha_11_Apertura_Campeonato_oficial_2026.pdf
        $nombreArchivo = collect(['Acta_Disciplina', 'Fecha', $numero_fecha, $fase->nombre, $campeonato->nombre])
            ->map(fn ($parte) => trim(preg_replace('/[^A-Za-z0-9]+/', '_', \Illuminate\Support\Str::ascii((string) $parte)), '_'))
            ->filter()
            ->unique() // en liguillas la fase suele llamarse igual que el campeonato
            ->implode('_');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nombreArchivo . '.pdf"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
