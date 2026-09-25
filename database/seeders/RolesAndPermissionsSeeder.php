<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'ver clubes', 'gestionar clubes',
            'ver jugadores', 'gestionar jugadores',
            'ver torneos', 'gestionar torneos',
            'ver tribunal', 'gestionar sanciones', 'gestionar notas',
            'ver etica', 'gestionar etica',
            'ver fondos', 'gestionar fondos',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign created permissions
        
        // 1. Super Admin
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'Super admin']);
        $roleSuperAdmin->syncPermissions(Permission::all());

        // 2. Presidente (Read-only everything, but CAN manage torneos and clubes)
        $rolePresidente = Role::firstOrCreate(['name' => 'Presidente']);
        $rolePresidente->syncPermissions(['ver clubes', 'gestionar clubes', 'ver jugadores', 'ver torneos', 'gestionar torneos', 'ver tribunal', 'ver etica']);

        // 3. Secretario (View Clubes, View Jugadores, View Torneos, View Tribunal, View Etica)
        $roleSecretario = Role::firstOrCreate(['name' => 'Secretario']);
        $roleSecretario->syncPermissions(['ver clubes', 'ver jugadores', 'ver torneos', 'ver tribunal', 'ver etica']);

        // 4. Comite disciplina (Manage Sanciones and Notas, View others)
        $roleDisciplina = Role::firstOrCreate(['name' => 'Comite disciplina']);
        $roleDisciplina->syncPermissions(['ver clubes', 'ver jugadores', 'gestionar jugadores', 'ver torneos', 'ver tribunal', 'gestionar sanciones', 'gestionar notas', 'ver fondos']);

        // 5. Comite etica (Manage etica, view others)
        $roleEtica = Role::firstOrCreate(['name' => 'Comite etica']);
        $roleEtica->syncPermissions(['ver clubes', 'ver jugadores', 'ver torneos', 'ver tribunal', 'ver etica', 'gestionar etica']);

        // 6. Tesorero (Manage Fondo Solidario, view context)
        $roleTesorero = Role::firstOrCreate(['name' => 'Tesorero']);
        $roleTesorero->syncPermissions(['ver clubes', 'ver jugadores', 'ver torneos', 'ver tribunal', 'ver fondos', 'gestionar fondos']);


        // Create test users and assign roles
        $users = [
            ['name' => 'Super Admin', 'email' => 'admin@pitazofinal.com', 'role' => 'Super admin'],
            ['name' => 'Presidente ASOC', 'email' => 'presidente@pitazofinal.com', 'role' => 'Presidente'],
            ['name' => 'Secretario ASOC', 'email' => 'secretario@pitazofinal.com', 'role' => 'Secretario'],
            ['name' => 'Comité Disciplina', 'email' => 'disciplina@pitazofinal.com', 'role' => 'Comite disciplina'],
            ['name' => 'Comité Ética', 'email' => 'etica@pitazofinal.com', 'role' => 'Comite etica'],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate([
                'email' => $userData['email']
            ], [
                'name' => $userData['name'],
                'password' => Hash::make('Jupipe2083@'),
            ]);
            $user->assignRole($userData['role']);
        }
    }
}
