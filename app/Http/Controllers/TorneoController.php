<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use App\Models\Fase;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TorneoController extends Controller
{
    public function index()
    {
        $campeonatos = Campeonato::with('fases')->orderBy('id', 'desc')->get();
        return Inertia::render('Torneos/Index', [
            'campeonatos' => $campeonatos
        ]);
    }

    public function storeCampeonato(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:campeonatos,nombre',
            'estado' => 'required|in:ACTIVO,INACTIVO',
        ]);

        $campeonato = Campeonato::create($data);

        \App\Support\Auditor::log('CREAR', 'TORNEOS', "Creó el campeonato {$campeonato->nombre}.");

        return redirect()->back()->with('success', 'Campeonato creado exitosamente.');
    }

    public function updateCampeonato(Request $request, Campeonato $campeonato)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:campeonatos,nombre,' . $campeonato->id,
            'estado' => 'required|in:ACTIVO,INACTIVO',
        ]);

        $campeonato->update($data);

        \App\Support\Auditor::log('EDITAR', 'TORNEOS', "Editó el campeonato {$campeonato->nombre}.");

        return redirect()->back()->with('success', 'Campeonato actualizado exitosamente.');
    }

    public function storeFase(Request $request)
    {
        $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'nombre' => 'required|string|max:255',
            'cantidad_fechas' => 'required|integer|min:1|max:100'
        ]);

        $fase = Fase::create($request->all());

        $campeonatoNombre = $fase->campeonato?->nombre ?? 'campeonato';
        \App\Support\Auditor::log('CREAR', 'TORNEOS', "Creó la fase {$fase->nombre} en {$campeonatoNombre}.");

        return redirect()->back()->with('success', 'Fase añadida exitosamente.');
    }

    public function updateFase(Request $request, Fase $fase)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'cantidad_fechas' => 'required|integer|min:1|max:100'
        ]);

        $fase->update($request->only(['nombre', 'cantidad_fechas']));

        $campeonatoNombre = $fase->campeonato?->nombre ?? 'campeonato';
        \App\Support\Auditor::log('EDITAR', 'TORNEOS', "Editó la fase {$fase->nombre} en {$campeonatoNombre}.");

        return redirect()->back()->with('success', 'Fase actualizada exitosamente.');
    }

    public function destroyFase(Campeonato $torneo, Fase $fase)
    {
        if ($fase->sanciones()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar la fase: tiene sanciones registradas.');
        }

        $nombre = $fase->nombre;
        $campeonatoNombre = $fase->campeonato?->nombre ?? 'campeonato';

        $fase->delete();

        \App\Support\Auditor::log('ELIMINAR', 'TORNEOS', "Eliminó la fase {$nombre} de {$campeonatoNombre}.");

        return redirect()->back()->with('success', 'Fase eliminada exitosamente.');
    }
}
