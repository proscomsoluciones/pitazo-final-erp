<?php

namespace App\Http\Controllers;

use App\Models\CasoEtica;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\Campeonato;
use App\Models\ConfiguracionAsociacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class EticaController extends Controller
{
    public function index()
    {
        $casos = CasoEtica::with(['club', 'jugador', 'campeonato', 'fase'])
            ->orderBy('id', 'desc')
            ->get();

        $clubes = Club::orderBy('name')->get();
        $jugadores = Jugador::orderBy('nombre')->get();
        $campeonatos = Campeonato::with('fases')->orderBy('id', 'desc')->get();

        $referencias = \App\Models\ReferenciaOficio::where('activa', true)
            ->whereIn('modulo', ['GENERAL', 'ETICA'])
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Etica/Index', [
            'casos'       => $casos,
            'clubes'      => $clubes,
            'jugadores'   => $jugadores,
            'campeonatos' => $campeonatos,
            'referencias' => $referencias,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_oficio'                => 'required|in:INVESTIGACION,CITACION,INHABILITACION,RESOLUCION',
            'club_id'                    => 'nullable|exists:clubes,id',
            'jugador_id'                 => 'nullable|exists:jugadores,id',
            'nombre_involucrado'         => 'nullable|string|max:255',
            'rut_involucrado'            => 'nullable|string|max:20',
            'articulo_reglamento'        => 'nullable|string|max:255',
            'tipo_involucrado'           => 'required|in:JUGADOR,DIRIGENTE,CLUB',
            'campeonato_id'              => 'nullable|exists:campeonatos,id',
            'fase_id'                    => 'nullable|exists:fases,id',
            'numero_fecha'               => 'nullable|integer|min:1',
            'asunto'                     => 'required|string|max:255',
            'descripcion'                => 'nullable|string',
            'fecha_citacion'             => 'nullable|date',
            'lugar_citacion'             => 'nullable|string|max:255',
            'fecha_inicio_inhabilitacion'=> 'nullable|date',
            'fecha_fin_inhabilitacion'   => 'nullable|date',
            'estado'                     => 'required|in:EN_INVESTIGACION,CITADO,INHABILITADO,RESUELTO,ARCHIVADO',
            'detalles_resolucion'        => 'nullable|string',
            'observaciones'              => 'nullable|string',
        ]);

        // Generar folio único ETICA-YYYY-0000X
        $year = now()->year;
        $count = CasoEtica::whereYear('created_at', $year)->count() + 1;
        $data['folio'] = sprintf('ETICA-%s-%05d', $year, $count);

        // Sincronizar tipo_oficio según estado
        $mapEstadoTipo = [
            'EN_INVESTIGACION' => 'INVESTIGACION',
            'CITADO'           => 'CITACION',
            'INHABILITADO'     => 'INHABILITACION',
            'RESUELTO'         => 'RESOLUCION',
            'ARCHIVADO'        => 'RESOLUCION',
        ];
        if (isset($data['estado']) && isset($mapEstadoTipo[$data['estado']])) {
            $data['tipo_oficio'] = $mapEstadoTipo[$data['estado']];
        }

        $caso = CasoEtica::create($data);

        \App\Support\Auditor::log('CREAR', 'ETICA', "Creó el expediente de ética {$caso->folio} ({$caso->asunto}).");

        return redirect()->back()->with('success', 'Expediente de Ética creado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $caso = CasoEtica::findOrFail($id);

        $data = $request->validate([
            'tipo_oficio'                => 'required|in:INVESTIGACION,CITACION,INHABILITACION,RESOLUCION',
            'club_id'                    => 'nullable|exists:clubes,id',
            'jugador_id'                 => 'nullable|exists:jugadores,id',
            'nombre_involucrado'         => 'nullable|string|max:255',
            'rut_involucrado'            => 'nullable|string|max:20',
            'articulo_reglamento'        => 'nullable|string|max:255',
            'tipo_involucrado'           => 'required|in:JUGADOR,DIRIGENTE,CLUB',
            'campeonato_id'              => 'nullable|exists:campeonatos,id',
            'fase_id'                    => 'nullable|exists:fases,id',
            'numero_fecha'               => 'nullable|integer|min:1',
            'asunto'                     => 'required|string|max:255',
            'descripcion'                => 'nullable|string',
            'fecha_citacion'             => 'nullable|date',
            'lugar_citacion'             => 'nullable|string|max:255',
            'fecha_inicio_inhabilitacion'=> 'nullable|date',
            'fecha_fin_inhabilitacion'   => 'nullable|date',
            'estado'                     => 'required|in:EN_INVESTIGACION,CITADO,INHABILITADO,RESUELTO,ARCHIVADO',
            'detalles_resolucion'        => 'nullable|string',
            'observaciones'              => 'nullable|string',
        ]);

        // Sincronizar tipo_oficio según estado
        $mapEstadoTipo = [
            'EN_INVESTIGACION' => 'INVESTIGACION',
            'CITADO'           => 'CITACION',
            'INHABILITADO'     => 'INHABILITACION',
            'RESUELTO'         => 'RESOLUCION',
            'ARCHIVADO'        => 'RESOLUCION',
        ];
        if (isset($data['estado']) && isset($mapEstadoTipo[$data['estado']])) {
            $data['tipo_oficio'] = $mapEstadoTipo[$data['estado']];
        }

        $caso->update($data);

        \App\Support\Auditor::log('EDITAR', 'ETICA', "Editó el expediente de ética {$caso->folio} ({$caso->asunto}).");

        return redirect()->back()->with('success', 'Expediente de Ética actualizado correctamente.');
    }

    public function destroy($id)
    {
        $caso = CasoEtica::findOrFail($id);
        $folio = $caso->folio;
        $asunto = $caso->asunto;

        $caso->delete();

        \App\Support\Auditor::log('ELIMINAR', 'ETICA', "Eliminó el expediente de ética {$folio} ({$asunto}).");

        return redirect()->back()->with('success', 'Expediente de Ética eliminado correctamente.');
    }

    public function emitirOficio(int $id, string $tipo)
    {
        $tipoUpper = strtoupper($tipo);
        if (!in_array($tipoUpper, ['INVESTIGACION', 'CITACION', 'INHABILITACION', 'RESOLUCION'])) {
            $tipoUpper = 'INVESTIGACION';
        }

        $caso = CasoEtica::with(['club', 'jugador', 'campeonato', 'fase'])->findOrFail($id);
        $asoc = ConfiguracionAsociacion::instancia();

        $pdf = Pdf::loadView('etica.oficio_pdf', [
            'caso'       => $caso,
            'tipoOficio' => $tipoUpper,
            'asoc'       => $asoc,
            'fechaEmision' => now()->translatedFormat('j \d\e F \d\e Y'),
        ]);

        $filename = sprintf('Oficio_Etica_%s_%s.pdf', $tipoUpper, $caso->folio);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
