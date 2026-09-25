<?php

namespace Database\Seeders;

use App\Models\CasoEtica;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\Campeonato;
use App\Models\Fase;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CasoEticaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $club1 = Club::first() ?? Club::create(['name' => 'CD Santa Rosa']);
        $club2 = Club::skip(1)->first() ?? Club::create(['name' => 'CD Alfredo Riesco']);
        $club3 = Club::skip(2)->first() ?? Club::create(['name' => 'CD Ñilhue']);

        $jugador1 = Jugador::first() ?? Jugador::create(['nombre' => 'Juan Pérez', 'rut' => '15.432.890-1']);
        $jugador2 = Jugador::skip(1)->first() ?? Jugador::create(['nombre' => 'Diego Sánchez', 'rut' => '16.890.123-4']);

        $campeonato = Campeonato::first();
        $fase = Fase::first();

        $casos = [
            [
                'folio' => 'ET-2026-001',
                'tipo_oficio' => 'INVESTIGACION',
                'tipo_involucrado' => 'DIRIGENTE',
                'club_id' => $club1->id,
                'jugador_id' => null,
                'nombre_involucrado' => 'Carlos Mendoza (Presidente)',
                'rut_involucrado' => '12.345.678-9',
                'asunto' => 'Investigación por presunta suplantación de identidad en planilla',
                'articulo_reglamento' => 'Art. 18 Inciso B - Código de Ética ANFA',
                'descripcion' => 'Se inicia investigación de oficio tras la denuncia presentada por la terna arbitral sobre anomalías en las firmas de la planilla de juego.',
                'campeonato_id' => $campeonato?->id,
                'fase_id' => $fase?->id,
                'numero_fecha' => '3',
                'estado' => 'EN_INVESTIGACION',
                'created_at' => Carbon::now()->subDays(10),
            ],
            [
                'folio' => 'ET-2026-002',
                'tipo_oficio' => 'CITACION',
                'tipo_involucrado' => 'JUGADOR',
                'club_id' => $club1->id,
                'jugador_id' => $jugador1->id,
                'nombre_involucrado' => $jugador1->nombre,
                'rut_involucrado' => $jugador1->rut ?? '15.432.890-1',
                'asunto' => 'Citación a comparendo por conducta antideportiva grave',
                'articulo_reglamento' => 'Art. 22 Inciso A',
                'descripcion' => 'Citación obligatoria al jugador para presentar sus descargos respecto a los incidentes ocurridos al finalizar el encuentro.',
                'fecha_citacion' => Carbon::now()->addDays(3)->setHour(19)->setMinute(30),
                'lugar_citacion' => 'Sede Oficial de la Asociación - Sala de Sesiones',
                'campeonato_id' => $campeonato?->id,
                'fase_id' => $fase?->id,
                'numero_fecha' => '4',
                'estado' => 'CITADO',
                'created_at' => Carbon::now()->subDays(5),
            ],
            [
                'folio' => 'ET-2026-003',
                'tipo_oficio' => 'INHABILITACION',
                'tipo_involucrado' => 'DIRIGENTE',
                'club_id' => $club2->id,
                'jugador_id' => null,
                'nombre_involucrado' => 'Roberto Gómez (Delegado General)',
                'rut_involucrado' => '10.987.654-3',
                'asunto' => 'Inhabilitación preventiva por desacato a la autoridad deportiva',
                'articulo_reglamento' => 'Art. 15 Inciso C',
                'descripcion' => 'Se decreta la inhabilitación temporal preventiva del dirigente para ejercer cualquier cargo de representación deportiva durante la tramitación del proceso.',
                'fecha_inicio_inhabilitacion' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'fecha_fin_inhabilitacion' => Carbon::now()->addDays(28)->format('Y-m-d'),
                'campeonato_id' => $campeonato?->id,
                'estado' => 'INHABILITADO',
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'folio' => 'ET-2026-004',
                'tipo_oficio' => 'RESOLUCION',
                'tipo_involucrado' => 'CLUB',
                'club_id' => $club3->id,
                'jugador_id' => null,
                'nombre_involucrado' => 'CD Ñilhue (Institución)',
                'rut_involucrado' => null,
                'asunto' => 'Resolución definitiva por faltas al fair play y alteración del orden',
                'articulo_reglamento' => 'Art. 30 Inciso D',
                'descripcion' => 'El Comité de Ética resuelve amonestar por escrito a la institución y aplicar sanción pecuniaria según reglamento general.',
                'detalles_resolucion' => 'Se sanciona al club CD Ñilhue con multa de 1.5 UTM y amonestación escrita de advertencia.',
                'estado' => 'RESUELTO',
                'created_at' => Carbon::now()->subDays(15),
            ],
            [
                'folio' => 'ET-2026-005',
                'tipo_oficio' => 'INVESTIGACION',
                'tipo_involucrado' => 'JUGADOR',
                'club_id' => $club2->id,
                'jugador_id' => $jugador2->id,
                'nombre_involucrado' => $jugador2->nombre,
                'rut_involucrado' => $jugador2->rut ?? '16.890.123-4',
                'asunto' => 'Denuncia por agresiones verbales hacia el cuerpo técnico rival',
                'articulo_reglamento' => 'Art. 12',
                'descripcion' => 'Expediente archivado por falta de pruebas concluyentes en los informes arbitrales.',
                'detalles_resolucion' => 'Archivado sin responsabilidad ulterior para el jugador involucrado.',
                'estado' => 'ARCHIVADO',
                'created_at' => Carbon::now()->subDays(20),
            ]
        ];

        foreach ($casos as $casoData) {
            CasoEtica::updateOrCreate(
                ['folio' => $casoData['folio']],
                $casoData
            );
        }
    }
}
