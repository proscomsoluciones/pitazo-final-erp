<?php

namespace App\Http\Controllers;

use App\Models\NotaDisciplina;
use Illuminate\Http\Request;

class NotaDisciplinaController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'club_id' => 'nullable|exists:clubes,id',
            'nota' => 'required|string',
            'monto' => 'nullable|integer|min:0',
        ]);

        $nota = NotaDisciplina::create($data);

        $clubName = $nota->club?->name ?? 'club no especificado';
        \App\Support\Auditor::log('CREAR', 'TRIBUNAL', "Creó una nota de disciplina para {$clubName} (Fecha {$nota->numero_fecha}).");

        return redirect()->back()->with('success', 'Nota registrada correctamente.');
    }

    public function update(Request $request, $id)
    {
        $nota = NotaDisciplina::findOrFail($id);

        $data = $request->validate([
            'club_id' => 'nullable|exists:clubes,id',
            'nota' => 'required|string',
            'monto' => 'nullable|integer|min:0',
        ]);

        $nota->update($data);

        $clubName = $nota->club?->name ?? 'club no especificado';
        \App\Support\Auditor::log('EDITAR', 'TRIBUNAL', "Editó la nota de disciplina ID #{$nota->id} de {$clubName} (Fecha {$nota->numero_fecha}).");

        return redirect()->back()->with('success', 'Nota actualizada correctamente.');
    }

    public function destroy($id)
    {
        $nota = NotaDisciplina::findOrFail($id);
        $notaId = $nota->id;
        $clubName = $nota->club?->name ?? 'club no especificado';
        $numeroFecha = $nota->numero_fecha;

        $nota->delete();

        \App\Support\Auditor::log('ELIMINAR', 'TRIBUNAL', "Eliminó la nota de disciplina ID #{$notaId} de {$clubName} (Fecha {$numeroFecha}).");

        return redirect()->back()->with('success', 'Nota eliminada correctamente.');
    }
}
