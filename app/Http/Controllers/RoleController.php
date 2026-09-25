<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ];
        });

        $permissions = Permission::all()->pluck('name');

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
        ]);

        $role = Role::create(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        \App\Support\Auditor::log('CREAR', 'ROLES', "Creó el rol \"{$role->name}\".");

        return redirect()->back()->with('success', 'Rol creado exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id,
            'permissions' => 'array',
        ]);

        if ($role->name === 'Super admin') {
            return redirect()->back()->with('error', 'No puedes modificar el rol Super admin.');
        }

        $oldName = $role->name;
        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        \App\Support\Auditor::log('EDITAR', 'ROLES', "Editó el rol \"{$oldName}\"" . ($oldName !== $role->name ? " (renombrado a \"{$role->name}\")" : '') . '.');

        return redirect()->back()->with('success', 'Rol actualizado exitosamente.');
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'Super admin') {
            return redirect()->back()->with('error', 'No puedes eliminar el rol Super admin.');
        }

        $name = $role->name;
        $role->delete();

        \App\Support\Auditor::log('ELIMINAR', 'ROLES', "Eliminó el rol \"{$name}\".");

        return redirect()->back()->with('success', 'Rol eliminado exitosamente.');
    }
}
