<?php

namespace App\Http\Controllers;

use App\Models\Club;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ClubController extends Controller
{
    public function index()
    {
        return Inertia::render('Clubes/Index', [
            'clubes' => Club::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'crest_file' => 'nullable|image|max:2048', // 2MB max
        ]);

        $club = new Club();
        $club->name = $validated['name'];

        if ($request->hasFile('crest_file')) {
            $path = $request->file('crest_file')->store('clubes', 'public');
            $club->crest = '/storage/' . $path;
        }

        $club->save();

        \App\Support\Auditor::log('CREAR', 'CLUBES', "Creó el club {$club->name}.");

        return redirect()->back()->with('success', 'Club creado correctamente.');
    }

    public function update(Request $request, Club $club)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'crest_file' => 'nullable|image|max:2048',
        ]);

        $club->name = $validated['name'];

        if ($request->hasFile('crest_file')) {
            if ($club->crest) {
                $cleanPath = str_replace('/storage/', '', $club->crest);
                Storage::disk('public')->delete($cleanPath);
            }
            $path = $request->file('crest_file')->store('clubes', 'public');
            $club->crest = '/storage/' . $path;
        }

        $club->save();

        \App\Support\Auditor::log('EDITAR', 'CLUBES', "Editó el club {$club->name}.");

        return redirect()->back()->with('success', 'Club actualizado correctamente.');
    }

    public function destroy(Club $club)
    {
        $clubName = $club->name;

        if ($club->crest) {
            $cleanPath = str_replace('/storage/', '', $club->crest);
            Storage::disk('public')->delete($cleanPath);
        }
        $club->delete();

        \App\Support\Auditor::log('ELIMINAR', 'CLUBES', "Eliminó el club {$clubName}.");

        return redirect()->back()->with('success', 'Club eliminado correctamente.');
    }
}
