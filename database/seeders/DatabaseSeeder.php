<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Club;
use App\Models\Jugador;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Permissions
        Permission::create(['name' => 'ver_sanciones']);
        Permission::create(['name' => 'crear_sanciones']);
        Permission::create(['name' => 'emitir_oficios']);

        // Roles
        $admin = Role::create(['name' => 'Administrador']);
        $admin->givePermissionTo(Permission::all());

        $tribunal = Role::create(['name' => 'Tribunal_Disciplina']);
        $tribunal->givePermissionTo(['ver_sanciones', 'crear_sanciones', 'emitir_oficios']);

        // User
        $user = User::factory()->create([
            'name' => 'Admin Tribunal',
            'email' => 'admin@anfa.cl',
        ]);
        $user->assignRole($admin);

        // Mocks
        $clubes = [
            ['id' => 1, 'name' => 'CD Santa Rosa', 'crest' => 'logos/01KCQC6DZ4FB3500HQ8K01KQ0W.webp'],
            ['id' => 2, 'name' => 'CD Alfredo Riesco', 'crest' => 'logos/01KCQBZH0P7MFNETYJ78JHZQ3G.webp'],
            ['id' => 4, 'name' => 'CD Ñilhue', 'crest' => 'logos/01KCQC3TARGBP20FX3FWC8YEBT.webp'],
            ['id' => 5, 'name' => 'CD Alianza', 'crest' => 'logos/01KCQC0WED02CJYMK0T9PGEZBJ.webp'],
            ['id' => 6, 'name' => 'CD Carmelo de Praga', 'crest' => 'logos/01KCQBJGCSKW0Z8637J7S49699.webp'],
            ['id' => 7, 'name' => 'CD Unión 28 de Marzo', 'crest' => 'logos/01KCQBVY06K0DZRW70PSC9TTKV.webp'],
            ['id' => 9, 'name' => 'CD Arcoíris', 'crest' => 'logos/01KCQC1AR5E20V2YCPV31QEFYB.webp'],
            ['id' => 10, 'name' => 'CD La Colonia', 'crest' => 'logos/01KR7C6JH59RS47BF1J8WAF86C.webp'],
            ['id' => 11, 'name' => 'CD Estrella de Chile', 'crest' => 'logos/01KCQC2S8FZA7V4TVZ954ZB0X2.webp'],
            ['id' => 12, 'name' => 'CD Minera Catemu', 'crest' => 'logos/01KCQC38CM51Q2J0Z1S08XEYDM.webp'],
            ['id' => 13, 'name' => 'CD Peñarol Reinoso', 'crest' => 'logos/01KCQC4G62ZCAY3V3NNEYHXW5W.webp'],
            ['id' => 14, 'name' => 'CD San Carlos', 'crest' => 'logos/01KCQC553YXRXG38H8BH6SNHKQ.webp'],
            ['id' => 15, 'name' => 'CD Santa Margarita', 'crest' => 'logos/01KCQC5V3P4EFW1SYWKKAY3HJJ.webp'],
            ['id' => 16, 'name' => 'CD Unión Compuertas', 'crest' => 'logos/01KCQC73P0T3114E7QS3D4420G.webp'],
            ['id' => 17, 'name' => 'CD Valencia', 'crest' => 'logos/01KCQC08ZX9X7FCHV3HMR95N5H.webp'],
        ];

        foreach ($clubes as $club) {
            Club::create($club);
        }

        Jugador::create(['nombre' => 'Juan Perez']);
        Jugador::create(['nombre' => 'Diego Sanchez']);

        $this->call(CasoEticaSeeder::class);
    }
}
