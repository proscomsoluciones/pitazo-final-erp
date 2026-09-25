<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sancion;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\Campeonato;
use App\Models\Fase;
use Carbon\Carbon;

class SancionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar sanciones y jugadores
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\OficioHabilitacion::truncate();
        Sancion::truncate();
        Jugador::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Obtener un campeonato y fase activo (o el primero que exista)
        $campeonato = Campeonato::where('estado', 'ACTIVO')->first() ?? Campeonato::first();
        $fase = Fase::first();
        $clubes = Club::inRandomOrder()->take(5)->get();

        if (!$campeonato || !$fase || $clubes->count() < 1) {
            $this->command->info('No hay suficientes campeonatos, fases o clubes para poblar.');
            return;
        }

        $nombres = [
            'Alexis Sánchez',
            'Arturo Vidal',
            'Claudio Bravo',
            'Gary Medel',
            'Eduardo Vargas'
        ];

        $ruts = [
            '15.555.555-5',
            '16.666.666-6',
            '17.777.777-7',
            '18.888.888-8',
            '19.999.999-9'
        ];

        $faltas = [
            ['ART 211 LETRA A', 'Reclamos indebidos al árbitro', 1, 'PARTIDOS', 'ACTIVO'],
            ['ART 212 LETRA B', 'Juego brusco grave', 3, 'PARTIDOS', 'ACTIVO'],
            ['ART 213 LETRA C', 'Insultos a la barra contraria', 2, 'PARTIDOS', 'CUMPLIDO'],
            ['ART 215 LETRA A', 'Conducta violenta con agresión', 1, 'AÑOS', 'ACTIVO'],
            ['ART 216 LETRA D', 'Demora en la reanudación del juego', 1, 'PARTIDOS', 'CUMPLIDO'],
        ];

        for ($i = 0; $i < 5; $i++) {
            $club = $clubes[$i % $clubes->count()];
            
            // Crear Jugador
            $jugador = Jugador::create([
                'rut' => str_replace('.', '', strtoupper($ruts[$i])), // formato interno
                'nombre' => $nombres[$i],
                'club_id' => $club->id
            ]);

            // Crear Sanción
            $falta = $faltas[$i];
            
            $fecha_resolucion = Carbon::now()->subDays(rand(1, 30));
            $fecha_termino = null;
            
            if ($falta[3] !== 'PARTIDOS') {
                $fecha_termino = $fecha_resolucion->copy()->addYears($falta[2]);
            }

            Sancion::create([
                'campeonato_id' => $campeonato->id,
                'fase_id' => $fase->id,
                'numero_fecha' => rand(1, 5), // Fechas de la 1 a la 5
                'club_id' => $club->id,
                'jugador_id' => $jugador->id,
                'articulo_reglamento' => $falta[0],
                'tipo_falta' => $falta[1],
                'observacion' => 'El jugador fue sancionado según el informe arbitral.',
                'cantidad_sancion' => $falta[2],
                'tipo_sancion' => $falta[3] === 'PARTIDOS' ? 'PARTIDOS' : 'TIEMPO',
                'unidad_tiempo' => $falta[3],
                'fecha_resolucion' => $fecha_resolucion,
                'fecha_termino_cronologica' => $fecha_termino,
                'estado' => $falta[4],
            ]);
        }

        $this->command->info('Se crearon 5 sanciones de prueba exitosamente.');
    }
}
