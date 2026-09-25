<?php

namespace App\Http\Controllers;

use App\Models\ReferenciaOficio;
use Illuminate\Http\Request;

class ReferenciaOficioController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:referencias_oficio,nombre',
            'modulo' => 'required|in:GENERAL,TRIBUNAL,ETICA',
        ]);

        $referencia = ReferenciaOficio::create([
            'nombre' => trim($data['nombre']),
            'modulo' => $data['modulo'],
            'activa' => true,
        ]);

        \App\Support\Auditor::log('CREAR', 'REFERENCIAS', "Creó la referencia de oficio \"{$referencia->nombre}\" ({$referencia->modulo}).");

        return redirect()->back()->with('success', 'Referencia agregada correctamente.');
    }

    public function destroy($id)
    {
        $referencia = ReferenciaOficio::findOrFail($id);
        $nombre = $referencia->nombre;
        $modulo = $referencia->modulo;

        $referencia->delete();

        \App\Support\Auditor::log('ELIMINAR', 'REFERENCIAS', "Eliminó la referencia de oficio \"{$nombre}\" ({$modulo}).");

        return redirect()->back()->with('success', 'Referencia eliminada correctamente.');
    }
}
