<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga de datos (no cambia tablas): 4a fecha del Clausura, Campeonato oficial 2026,
 * jugada el domingo 22-11-2026. Transcrita desde el acta manuscrita del tribunal.
 *
 * - Busca campeonato, fase, clubes y jugadores por nombre, no por id.
 * - No hace nada si el campeonato/fase no existen (bases de prueba) o si la fecha 4
 *   ya tiene sanciones, notas o fondos (evita duplicar).
 * - Si un jugador esta duplicado en su club o registrado en otro club, falla y no
 *   guarda nada (el deploy se detiene y produccion sigue en la version anterior).
 */
return new class extends Migration
{
    private const FECHA = 4;
    private const RESOLUCION = '2026-11-22';

    // [club, jugador, articulo, tipo_falta, partidos base, reincidencia (marca R)]
    private const SANCIONES = [
        ['CD Ñilhue',            'Johan Cortes Pereira',       'Art. 211 Letra A', 'Juego brusco',            1, false],
        ['CD Ñilhue',            'Cristian Herrera Pizarro',   'Art. 210 Letra H', 'Conducta violenta grave', 6, false],
        ['CD Ñilhue',            'Leonardo Claveria Claveria', 'Art. 210 Letra H', 'Conducta violenta',       4, false],
        ['CD Ñilhue',            'Lucas Aranda Vergara',       'Art. 211 Letra N', 'Faltas reiteradas',       1, true],
        ['CD Santa Rosa',        'Fabian Martinez Gonzalez',   'Art. 211 Letra A', 'Juego brusco',            1, false],
        ['CD Santa Rosa',        'Luis Paredes Vega',          'Art. 210 Letra H', 'Conducta violenta',       4, false],
        ['CD Santa Rosa',        'Oscar Pimentel Del Canto',   'Art. 210 Letra H', 'Conducta violenta',       4, true],
        ['CD Santa Rosa',        'Paulo Pimentel Saldivar',    'Art. 211 Letra N', 'Faltas reiteradas',       1, false],
        ['CD Santa Margarita',   'Nelson Perez Cea',           'Art. 211 Letra Q', 'Conducta antideportiva',  2, true],
        ['CD Unión 28 de Marzo', 'Matias Cortes Basaez',       'Art. 211 Letra Q', 'Conducta antideportiva',  2, false],
        ['CD La Colonia',        'Nicolas Briones Briones',    'Art. 211 Letra N', 'Faltas reiteradas',       1, false],
        ['CD Arcoíris',          'Lindor Bruna Molina',        'Art. 211 Letra P', 'Doble amonestacion',      1, false],
        ['CD Arcoíris',          'Andres Leiva Madariaga',     'Art. 211 Letra N', 'Faltas reiteradas',       1, false],
        ['CD Arcoíris',          'Juan Castro Olivares',       'Art. 211 Letra F', 'Conducta grosera',        3, false],
        ['CD Valencia',          'Martin Paras Lopez',         'Art. 211 Letra N', 'Faltas reiteradas',       1, false],
        ['CD Valencia',          'Alejandro Paras Mesias',     'Art. 211 Letra F', 'Conducta grosera',        3, true],
        ['CD Peñarol Reinoso',   'Brayan Olguin Figueroa',     'Art. 211 Letra P', 'Doble amonestacion',      1, false],
        ['CD Estrella de Chile', 'Martin Molina Gonzalez',     'Art. 207',         null,                      1, false],
        ['CD San Carlos',        'Jorge Lopez Castro',         'Art. 211 Letra A', 'Juego brusco',            1, true],
        ['CD San Carlos',        'Christopher Vergara Estay',  'Art. 211 Letra F', 'Insulto a rival',         1, true],
        ['CD San Carlos',        'Benedicto Tapia Carrasco',   'Art. 210 Letra H', 'Conducta violenta',       4, false],
        ['CD Alfredo Riesco',    'Juan Rojas Escobar',         'Art. 211 Letra F', 'Insulto a rival',         1, false],
    ];

    private const NOTAS = [
        ['CD San Carlos',        'Se multa a Club San Carlos por no presentacion de su serie 1a Adulta, multa segun bases $50.000 (Alfredo Riesco v/s San Carlos)', 50000],
        ['CD Estrella de Chile', 'Se multa a Club Estrella de Chile por no presentacion de su rama Femenina, multa segun bases $50.000 (Peñarol v/s Estrella)', 50000],
        ['CD Peñarol Reinoso',   'Carta de amonestacion al Sr. Renato Calderon, DT de 3a serie Adulta de Club Peñarol Reinoso, por mal comportamiento, multa $10.000', 10000],
    ];

    private const FONDOS = [
        ['CD Santa Rosa',        36, '20.211.107-6', 'Patricio Garcia Vargas'],
        ['CD Unión 28 de Marzo', 37, '23.060.831-8', 'Dante Parada Rivera'],
    ];

    public function up(): void
    {
        $camp = DB::table('campeonatos')->where('nombre', 'Campeonato oficial 2026')->first();
        $fase = $camp ? DB::table('fases')->where('campeonato_id', $camp->id)->where('nombre', 'Clausura')->first() : null;
        if (! $camp || ! $fase) {
            return; // base sin datos (pruebas o instalacion nueva)
        }

        $donde = ['campeonato_id' => $camp->id, 'fase_id' => $fase->id, 'numero_fecha' => self::FECHA];
        $previas = DB::table('sanciones')->where($donde)->count()
            + DB::table('nota_disciplinas')->where($donde)->count()
            + DB::table('fondo_solidarios')->where($donde)->count();
        if ($previas > 0) {
            return; // la fecha 4 ya esta cargada
        }

        $numeros = array_column(self::FONDOS, 1);
        $usados = DB::table('fondo_solidarios')->whereIn('numero_fondo', $numeros)->pluck('numero_fondo')->all();
        if ($usados) {
            throw new RuntimeException('Fecha 4 Clausura: ya existen fondos solidarios N° ' . implode(', ', $usados) . '.');
        }

        $norm = fn (string $s) => preg_replace('/\s+/', ' ', trim(Str::lower(Str::ascii($s))));
        $clubes = DB::table('clubes')->get()->keyBy(fn ($c) => $norm($c->name));
        $club = fn (string $nombre) => $clubes[$norm($nombre)]
            ?? throw new RuntimeException("Fecha 4 Clausura: no existe el club \"$nombre\".");

        $jugadores = DB::table('jugadores')->get();
        $pendiente = (int) $jugadores
            ->map(fn ($j) => preg_match('/^PENDIENTE-(\d+)$/i', (string) $j->rut, $m) ? (int) $m[1] : 0)
            ->max();
        $ahora = now();

        DB::transaction(function () use ($donde, $club, $jugadores, $norm, &$pendiente, $ahora) {
            foreach (self::SANCIONES as [$clubNombre, $nombre, $art, $falta, $base, $reinc]) {
                $c = $club($clubNombre);
                $mismoNombre = $jugadores->filter(fn ($j) => $norm($j->nombre) === $norm($nombre));
                $enClub = $mismoNombre->where('club_id', $c->id);

                if ($enClub->count() > 1) {
                    throw new RuntimeException("Fecha 4 Clausura: hay {$enClub->count()} jugadores \"$nombre\" en {$c->name} (ids " . $enClub->pluck('id')->implode(', ') . ').');
                }
                if ($enClub->isEmpty() && $mismoNombre->isNotEmpty()) {
                    throw new RuntimeException("Fecha 4 Clausura: \"$nombre\" esta registrado en otro club (ids " . $mismoNombre->pluck('id')->implode(', ') . "), no en {$c->name}.");
                }

                if ($enClub->isNotEmpty()) {
                    $jugador = $enClub->first();
                    $jugadorId = $jugador->id;
                    $rut = $jugador->rut;
                    $nombreFinal = $jugador->nombre;
                } else {
                    $rut = sprintf('PENDIENTE-%04d', ++$pendiente);
                    $nombreFinal = $nombre;
                    $jugadorId = DB::table('jugadores')->insertGetId([
                        'nombre' => $nombre, 'club_id' => $c->id, 'rut' => $rut,
                        'created_at' => $ahora, 'updated_at' => $ahora,
                    ]);
                }

                $total = $base + ($reinc ? 1 : 0);
                $tipoFalta = $reinc
                    ? "$falta ($base " . ($base == 1 ? 'partido' : 'partidos') . " + 1 por reincidencia = $total)"
                    : $falta;

                DB::table('sanciones')->insert($donde + [
                    'jugador_id' => $jugadorId, 'club_id' => $c->id, 'tipo_involucrado' => 'JUGADOR',
                    'nombre_involucrado' => $nombreFinal, 'rut_involucrado' => $rut,
                    'articulo_reglamento' => $art, 'tipo_falta' => $tipoFalta,
                    'tipo_sancion' => 'PARTIDOS', 'cantidad_sancion' => $total, 'unidad_tiempo' => 'PARTIDOS',
                    'fecha_resolucion' => self::RESOLUCION, 'partidos_cumplidos' => 0, 'estado' => 'ACTIVO',
                    'observacion' => 'Transcrito desde acta manuscrita.' . ($reinc ? ' [Reincidencia: sancion agravada +1 segun marca R en el acta].' : ''),
                    'created_at' => $ahora, 'updated_at' => $ahora,
                ]);
            }

            DB::table('sanciones')->insert($donde + [
                'club_id' => $club('CD Peñarol Reinoso')->id, 'tipo_involucrado' => 'DIRIGENTE',
                'nombre_involucrado' => 'Renato Calderon', 'articulo_reglamento' => 'Art 207',
                'tipo_falta' => 'Comunica Resolución', 'tipo_sancion' => 'AMONESTACION',
                'cantidad_sancion' => 1, 'unidad_tiempo' => 'AMONESTACION',
                'fecha_resolucion' => self::RESOLUCION, 'partidos_cumplidos' => 0, 'estado' => 'CUMPLIDO',
                'resolucion_texto' => 'Mal comportamiento como DT de 3a serie adulta',
                'created_at' => $ahora, 'updated_at' => $ahora,
            ]);

            foreach (self::NOTAS as [$clubNombre, $texto, $monto]) {
                DB::table('nota_disciplinas')->insert($donde + [
                    'club_id' => $club($clubNombre)->id, 'nota' => $texto, 'monto' => $monto,
                    'created_at' => $ahora, 'updated_at' => $ahora,
                ]);
            }

            foreach (self::FONDOS as [$clubNombre, $num, $rut, $nombre]) {
                DB::table('fondo_solidarios')->insert($donde + [
                    'club_id' => $club($clubNombre)->id, 'numero_fondo' => $num, 'jugador_rut' => $rut,
                    'jugador_nombre' => $nombre, 'diagnostico' => "Transcrito desde acta manuscrita (Fondo Solidario N$num)",
                    'estado' => 'PENDIENTE', 'created_at' => $ahora, 'updated_at' => $ahora,
                ]);
            }
        });
    }

    public function down(): void
    {
        // Carga de datos: no se revierte automaticamente (se corrige desde el sistema si hace falta).
    }
};
