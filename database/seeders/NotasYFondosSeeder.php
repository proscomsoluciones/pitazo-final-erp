<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotaDisciplina;
use App\Models\Campeonato;
use App\Models\Fase;
use App\Models\Club;

class NotasYFondosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $campeonato = Campeonato::first();
        $fase = Fase::first();
        $clubes = Club::take(5)->pluck('id')->toArray();

        if (!$campeonato || !$fase || empty($clubes)) {
            $this->command->info('No hay suficientes datos (campeonatos, fases o clubes) para correr este seeder.');
            return;
        }

        // Crear 5 notas de la fecha (diferentes fechas)
        $notasData = [
            ['fecha' => 1, 'nota' => 'Multa por atraso en presentación de equipo titular en cancha. 15 minutos.', 'monto' => 10000],
            ['fecha' => 1, 'nota' => 'Observación sobre conducta de la barra local. Incidentes menores post-partido.', 'monto' => null],
            ['fecha' => 2, 'nota' => 'Amonestación escrita por falta de balones reglamentarios para calentamiento.', 'monto' => 5000],
            ['fecha' => 3, 'nota' => 'Club no presentó planilla de jugadores firmada a tiempo. Sanción económica aplicada.', 'monto' => 15000],
            ['fecha' => 5, 'nota' => 'Suspensión temporal del delegado por insultos al árbitro asistente. A la espera de resolución.', 'monto' => null],
        ];

        foreach ($notasData as $index => $data) {
            NotaDisciplina::create([
                'campeonato_id' => $campeonato->id,
                'fase_id' => $fase->id,
                'numero_fecha' => $data['fecha'],
                'club_id' => $clubes[$index % count($clubes)],
                'nota' => $data['nota'],
                'monto' => $data['monto'],
            ]);
        }

        $this->command->info('Se han creado 5 Notas de Disciplina con éxito.');
    }
}
