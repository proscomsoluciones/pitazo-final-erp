<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        });

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
        ]);

        $permission = Permission::create(['name' => $request->name]);

        \App\Support\Auditor::log('CREAR', 'PERMISOS', "Creó el permiso \"{$permission->name}\".");

        return redirect()->back()->with('success', 'Permiso creado exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,'.$permission->id,
        ]);

        $oldName = $permission->name;
        $permission->update(['name' => $request->name]);

        \App\Support\Auditor::log('EDITAR', 'PERMISOS', "Renombró el permiso \"{$oldName}\" a \"{$permission->name}\".");

        return redirect()->back()->with('success', 'Permiso actualizado exitosamente.');
    }

    public function destroy($id)
    {
        $permission = Permission::findOrFail($id);
        $name = $permission->name;

        $permission->delete();

        \App\Support\Auditor::log('ELIMINAR', 'PERMISOS', "Eliminó el permiso \"{$name}\".");

        return redirect()->back()->with('success', 'Permiso eliminado exitosamente.');
    }
}
