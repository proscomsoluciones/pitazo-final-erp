<?php

namespace App\Http\Controllers;

use App\Models\Jugador;
use App\Models\Club;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JugadorController extends Controller
{
    public function index()
    {
        return Inertia::render('Jugadores/Index', [
            'jugadores' => Jugador::with('club')->orderBy('nombre')->get(),
            'clubes' => Club::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rut' => 'nullable|string|max:20',
            'nombre' => 'required|string|max:255',
            'club_id' => 'nullable|exists:clubes,id',
        ]);

        $jugador = Jugador::create($validated);

        \App\Support\Auditor::log('CREAR', 'JUGADORES', "Creó al jugador {$jugador->nombre}" . ($jugador->rut ? " ({$jugador->rut})" : '') . '.');

        return redirect()->back()->with('success', 'Jugador creado correctamente.');
    }

    public function update(Request $request, Jugador $jugador)
    {
        $validated = $request->validate([
            'rut' => 'nullable|string|max:20',
            'nombre' => 'required|string|max:255',
            'club_id' => 'nullable|exists:clubes,id',
        ]);

        $jugador->update($validated);

        \App\Support\Auditor::log('EDITAR', 'JUGADORES', "Editó al jugador {$jugador->nombre}" . ($jugador->rut ? " ({$jugador->rut})" : '') . '.');

        return redirect()->back()->with('success', 'Jugador actualizado correctamente.');
    }

    public function destroy(Jugador $jugador)
    {
        $nombre = $jugador->nombre;
        $rut = $jugador->rut;

        $jugador->delete();

        \App\Support\Auditor::log('ELIMINAR', 'JUGADORES', "Eliminó al jugador {$nombre}" . ($rut ? " ({$rut})" : '') . '.');

        return redirect()->back()->with('success', 'Jugador eliminado correctamente.');
    }
}
