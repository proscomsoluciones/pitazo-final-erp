<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga de datos (no cambia tablas): registra al jugador José Tapia Gaete
 * (RUT 18.037.667-4, CD Carmelo de Praga) si no existe, y crea la resolución de Ética
 * que lo habilita por haber cumplido su sanción vigente hasta el 09/11/2026.
 *
 * No hace nada si la base no tiene estos datos (pruebas) o si la resolución ya existe.
 * Si el RUT está registrado en otro club, falla sin guardar nada.
 */
return new class extends Migration
{
    private const ASUNTO = 'Habilitación por cumplimiento de sanción';
    private const RUT = '18037667-4';

    public function up(): void
    {
        $camp = DB::table('campeonatos')->where('nombre', 'Campeonato oficial 2026')->first();
        if (! $camp) {
            return; // base sin datos (pruebas o instalación nueva)
        }

        $norm = fn (string $s) => preg_replace('/\s+/', ' ', trim(Str::lower(Str::ascii($s))));
        $club = DB::table('clubes')->get()->first(fn ($c) => $norm($c->name) === $norm('CD Carmelo de Praga'))
            ?? throw new RuntimeException('Habilitación Tapia Gaete: no existe el club "CD Carmelo de Praga".');

        $rutLimpio = fn (?string $r) => strtoupper(preg_replace('/[^0-9kK]/', '', (string) $r));
        $existentes = DB::table('jugadores')->get()->filter(fn ($j) => $rutLimpio($j->rut) === $rutLimpio(self::RUT));
        if ($existentes->count() > 1) {
            throw new RuntimeException('Habilitación Tapia Gaete: hay ' . $existentes->count() . ' jugadores con RUT 18.037.667-4.');
        }
        $jugador = $existentes->first();
        if ($jugador && (int) $jugador->club_id !== (int) $club->id) {
            throw new RuntimeException("Habilitación Tapia Gaete: el RUT 18.037.667-4 está registrado como \"{$jugador->nombre}\" en otro club (club_id {$jugador->club_id}).");
        }
        if ($jugador && DB::table('casos_etica')->where('jugador_id', $jugador->id)->where('asunto', self::ASUNTO)->exists()) {
            return; // ya cargado
        }

        $ahora = now();

        DB::transaction(function () use ($jugador, $club, $camp, $ahora) {
            if (! $jugador) {
                $id = DB::table('jugadores')->insertGetId([
                    'nombre' => 'Jose Tapia Gaete', 'rut' => self::RUT, 'club_id' => $club->id,
                    'created_at' => $ahora, 'updated_at' => $ahora,
                ]);
                $jugador = DB::table('jugadores')->find($id);
            }

            $year = $ahora->year;
            $maxNum = DB::table('casos_etica')->where('folio', 'like', "ETICA-$year-%")->pluck('folio')
                ->map(fn ($f) => (int) Str::afterLast($f, '-'))->max() ?? 0;
            $count = DB::table('casos_etica')->whereYear('created_at', $year)->count();

            DB::table('casos_etica')->insert([
                'folio' => sprintf('ETICA-%s-%05d', $year, max($maxNum, $count) + 1),
                'tipo_oficio' => 'RESOLUCION',
                'estado' => 'RESUELTO',
                'club_id' => $club->id,
                'jugador_id' => $jugador->id,
                'nombre_involucrado' => $jugador->nombre,
                'rut_involucrado' => $jugador->rut,
                'tipo_involucrado' => 'JUGADOR',
                'campeonato_id' => $camp->id,
                'asunto' => self::ASUNTO,
                'lugar_citacion' => 'Sede Oficial de la Asociación',
                'fecha_fin_inhabilitacion' => '2026-11-09',
                'detalles_resolucion' => 'se informa que el jugador mantenía una sanción vigente hasta el 09/11/2026, la cual se encuentra cumplida, por lo que queda habilitado para jugar.',
                'created_at' => $ahora, 'updated_at' => $ahora,
            ]);
        });
    }

    public function down(): void
    {
        // Carga de datos: no se revierte automáticamente (se corrige desde el sistema si hace falta).
    }
};
