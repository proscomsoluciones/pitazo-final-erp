<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use App\Models\Club;
use App\Models\FondoSolidario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FondoSolidarioController extends Controller
{
    public function index()
    {
        $fondos = FondoSolidario::with(['campeonato', 'fase', 'club'])
            ->orderBy('numero_fecha', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $campeonatos = Campeonato::with('fases')->orderBy('id', 'desc')->get();
        $clubes = Club::orderBy('name')->get();

        return Inertia::render('FondoSolidario/Index', [
            'fondos' => $fondos,
            'campeonatos' => $campeonatos,
            'clubes' => $clubes,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'club_id' => 'required|exists:clubes,id',
            'jugador_rut' => 'required|string|max:20',
            'jugador_nombre' => 'required|string|max:255',
            'diagnostico' => 'nullable|string',
            'tipo_beneficio' => 'nullable|string|max:50',
            'monto_asignado' => 'nullable|integer|min:0',
            'estado' => 'nullable|string',
        ]);

        if (empty($data['estado'])) {
            $data['estado'] = 'PAGADO';
        }

        $fondo = DB::transaction(function () use ($data) {
            $ultimoNumero = FondoSolidario::lockForUpdate()->max('numero_fondo');

            $data['numero_fondo'] = ($ultimoNumero ?? 0) + 1;

            return FondoSolidario::create($data);
        });

        \App\Support\Auditor::log('CREAR', 'FONDOS', "Registró aporte de Fondo Solidario N°{$fondo->numero_fondo} para {$fondo->jugador_nombre} ({$fondo->club->name}).");

        return redirect()->back()->with('success', 'Aporte registrado correctamente.');
    }

    public function update(Request $request, FondoSolidario $fondo)
    {
        $data = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'club_id' => 'required|exists:clubes,id',
            'jugador_rut' => 'required|string|max:20',
            'jugador_nombre' => 'required|string|max:255',
            'diagnostico' => 'nullable|string',
            'tipo_beneficio' => 'nullable|string|max:50',
            'monto_asignado' => 'nullable|integer|min:0',
            'estado' => 'nullable|string',
        ]);

        if (empty($data['estado'])) {
            $data['estado'] = $fondo->estado ?? 'PAGADO';
        }

        $fondo->update($data);

        \App\Support\Auditor::log('EDITAR', 'FONDOS', "Editó el aporte de Fondo Solidario de {$fondo->jugador_nombre} ({$fondo->club->name}).");

        return redirect()->back()->with('success', 'Aporte actualizado correctamente.');
    }

    public function destroy(FondoSolidario $fondo)
    {
        $nombre = $fondo->jugador_nombre;
        $clubNombre = $fondo->club->name ?? 'Club';

        $fondo->delete();

        \App\Support\Auditor::log('ELIMINAR', 'FONDOS', "Eliminó el aporte de Fondo Solidario de {$nombre} ({$clubNombre}).");

        return redirect()->back()->with('success', 'Aporte eliminado correctamente.');
    }
}
