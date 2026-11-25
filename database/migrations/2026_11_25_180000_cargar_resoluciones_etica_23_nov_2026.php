<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga de datos (no cambia tablas): resoluciones del Comité de Ética en la sesión del
 * lunes 23-11-2026, transcritas desde el acta manuscrita.
 *
 * 1) Unión Compuertas, reconsideración Oficio N° 17: la sanción de Camilo Aspee Hernandez
 *    (Art. 209 Letra A, 6 meses) se rebaja al mínimo, 4 meses.
 * 2) Apelación del Club Valencia San José por el partido de definición vs Santa Rosa
 *    (30-10-2026): se aplica el Art. 136 y Valencia pierde el partido 3 x 0.
 *
 * Busca todo por nombre. No hace nada si la base no tiene estos datos (pruebas) o si los
 * expedientes ya existen. Si algo no calza, falla sin guardar nada.
 */
return new class extends Migration
{
    private const ASUNTO_COMPUERTAS = 'Reconsideración de sanción (Oficio N° 17 Club Unión Compuertas)';
    private const ASUNTO_VALENCIA = 'Apelación Club Valencia San José: partido de definición vs Santa Rosa (30-10-2026)';

    public function up(): void
    {
        $camp = DB::table('campeonatos')->where('nombre', 'Campeonato oficial 2026')->first();
        if (! $camp) {
            return; // base sin datos (pruebas o instalación nueva)
        }
        if (DB::table('casos_etica')->whereIn('asunto', [self::ASUNTO_COMPUERTAS, self::ASUNTO_VALENCIA])->exists()) {
            return; // ya cargado
        }

        $norm = fn (string $s) => preg_replace('/\s+/', ' ', trim(Str::lower(Str::ascii($s))));
        $fail = fn (string $msg) => throw new RuntimeException("Ética 23-11-2026: $msg");

        $fase = fn (string $nombre) => DB::table('fases')->where('campeonato_id', $camp->id)->where('nombre', $nombre)->first()
            ?? $fail("no existe la fase \"$nombre\".");
        $clubes = DB::table('clubes')->get()->keyBy(fn ($c) => $norm($c->name));
        $club = fn (string $nombre) => $clubes[$norm($nombre)] ?? $fail("no existe el club \"$nombre\".");

        $compuertas = $club('CD Unión Compuertas');
        $valencia = $club('CD Valencia');
        $clausura = $fase('Clausura');
        $definicion = $fase('Definición Apertura 2026');

        $jugadores = DB::table('jugadores')->where('club_id', $compuertas->id)->get()
            ->filter(fn ($j) => $norm($j->nombre) === $norm('Camilo Aspee Hernandez'));
        if ($jugadores->count() !== 1) {
            $fail("se esperaba 1 jugador \"Camilo Aspee Hernandez\" en {$compuertas->name} y hay {$jugadores->count()}.");
        }
        $jugador = $jugadores->first();

        $sanciones = DB::table('sanciones')
            ->where('jugador_id', $jugador->id)
            ->where('articulo_reglamento', 'Art. 209 Letra A')
            ->where('unidad_tiempo', 'MESES')
            ->get();
        if ($sanciones->count() !== 1) {
            $fail("se esperaba 1 sanción Art. 209 Letra A en meses para {$jugador->nombre} y hay {$sanciones->count()}.");
        }
        $sancion = $sanciones->first();
        if (! in_array((int) $sancion->cantidad_sancion, [4, 6], true)) {
            $fail("la sanción #{$sancion->id} tiene {$sancion->cantidad_sancion} meses (se esperaban 6).");
        }

        $inicio = Carbon::parse($sancion->fecha_resolucion);
        $fin = $inicio->copy()->addMonths(4);
        $ahora = now();

        $folio = function () use ($ahora) {
            $year = $ahora->year;
            $maxNum = DB::table('casos_etica')->where('folio', 'like', "ETICA-$year-%")->pluck('folio')
                ->map(fn ($f) => (int) Str::afterLast($f, '-'))->max() ?? 0;
            $count = DB::table('casos_etica')->whereYear('created_at', $year)->count();

            return sprintf('ETICA-%s-%05d', $year, max($maxNum, $count) + 1);
        };

        DB::transaction(function () use ($folio, $camp, $compuertas, $valencia, $clausura, $definicion, $jugador, $sancion, $inicio, $fin, $ahora) {
            $folioCompuertas = $folio();
            DB::table('casos_etica')->insert([
                'folio' => $folioCompuertas,
                'tipo_oficio' => 'RESOLUCION',
                'estado' => 'RESUELTO',
                'club_id' => $compuertas->id,
                'jugador_id' => $jugador->id,
                'nombre_involucrado' => $jugador->nombre,
                'rut_involucrado' => $jugador->rut,
                'tipo_involucrado' => 'JUGADOR',
                'articulo_reglamento' => 'Art. 209 Letra A',
                'campeonato_id' => $camp->id, 'fase_id' => $clausura->id, 'numero_fecha' => $sancion->numero_fecha,
                'asunto' => self::ASUNTO_COMPUERTAS,
                'lugar_citacion' => 'Sede Oficial de la Asociación',
                'fecha_inicio_inhabilitacion' => $inicio->toDateString(),
                'fecha_fin_inhabilitacion' => $fin->toDateString(),
                'detalles_resolucion' => 'se resuelve en pleno, en sesión del lunes 23 de noviembre de 2026 y respecto de la reconsideración presentada por el Club Unión Compuertas mediante Oficio N° 17, aplicar el Art. 209 Letra A rebajando la sanción al mínimo: 4 meses de sanción, desde el '
                    . $inicio->format('d/m/Y') . ' hasta el ' . $fin->format('d/m/Y') . '. '
                    . 'Citada a declarar la turno del encuentro, Srta. Verónica Albornoz, señaló que el jugador sí agredió al árbitro del encuentro con puños y patadas sin provocación. '
                    . 'Los hechos se produjeron en el sector de camarines, donde la turno observó todo lo ocurrido, siendo ella la encargada de informar lo que sucede fuera del recinto deportivo.',
                'created_at' => $ahora, 'updated_at' => $ahora,
            ]);

            if ((int) $sancion->cantidad_sancion === 6) {
                DB::table('sanciones')->where('id', $sancion->id)->update([
                    'cantidad_sancion' => 4,
                    'fecha_termino_cronologica' => $fin->toDateString(),
                    'observacion' => trim(($sancion->observacion ?? '') . " Rebajada de 6 a 4 meses por resolución del Comité de Ética del 23-11-2026 (reconsideración Oficio N° 17 Club Unión Compuertas, expediente $folioCompuertas)."),
                    'updated_at' => $ahora,
                ]);
            }

            DB::table('casos_etica')->insert([
                'folio' => $folio(),
                'tipo_oficio' => 'RESOLUCION',
                'estado' => 'RESUELTO',
                'club_id' => $valencia->id,
                'tipo_involucrado' => 'CLUB',
                'articulo_reglamento' => 'Art. 136',
                'campeonato_id' => $camp->id, 'fase_id' => $definicion->id, 'numero_fecha' => 1,
                'asunto' => self::ASUNTO_VALENCIA,
                'lugar_citacion' => 'Sede Oficial de la Asociación',
                'descripcion' => "De acuerdo a la apelación presentada por el Club Valencia de San José con fecha 11-11-2026, el Comité inició un proceso investigativo conforme al reglamento ANFA (deberes de la Comisión de Ética). En sesión del lunes 23-11-2026 se tomaron las siguientes declaraciones:\n\n"
                    . "DECLARACIÓN DE LA TURNO, SRTA. BRENDA CASTRO (partido de definición jugado el viernes 30-10-2026):\n"
                    . "- El jefe de delegación entregó 7 carnets en mesa y el resto los fue entregando de a poco, a medida que fueron llegando los jugadores.\n"
                    . "- Cuando entregó el partido al árbitro, el Club Valencia tenía 13 jugadores pasados en la papeleta de juego y de ellos 12 firmados, por lo cual el árbitro le entregó el partido para iniciar el encuentro.\n"
                    . "- Ni el delegado ni el capitán del Club Valencia revisaron quién entraba jugando. Ella no podía saber que el jugador P. Aballay, registrado en la papeleta (13 jugadores), entraba de titular al inicio del partido, porque nunca se acercó a la mesa a firmar. En ese momento el delegado del Club Santa Rosa le pidió revisar el registro de jugadores y sus cédulas, y se percató de que el jugador P. Aballay estaba jugando sin haber firmado la papeleta; verificada la situación, se la comunicó de inmediato al delegado del Club Valencia.\n"
                    . "- El orden de los jugadores corresponde a la forma en que fueron entregados por el delegado Sr. Leonardo Verdejo, y el último jugador registrado en la papeleta es uno de los cambios. Con este jugador se completaron 14 jugadores en la papeleta del Club Valencia, por lo que afirma que al inicio del encuentro el Club Valencia tenía 12 jugadores firmados.\n\n"
                    . "DECLARACIÓN DEL JEFE DE DELEGACIÓN DEL CLUB VALENCIA, SR. LEONARDO VERDEJO:\n"
                    . "- El día del partido le pidieron ser jefe de delegación para estar en la mesa y cooperó porque le gusta ayudar.\n"
                    . "- Recolectó los carnets, fue a la mesa y se los entregó a la turno. No recuerda el orden en que los entregó; cree que eran 13 jugadores y después llegó el último. Antes de iniciar, el encargado se dirigió a la mesa y preguntó a la turno si estaba todo bien; ella respondió que sí y comenzó el partido.\n"
                    . "- En un momento fueron a firmar los que estaban en la banca, pero asume su responsabilidad de no haber revisado si todos estaban firmados. Se percató cuando el jefe de delegación del Club Santa Rosa pidió revisar cédulas y listado y le dijo a la turno que el jugador Pablo Aballay F. no tenía firmada la papeleta. La turno los contó y le comunicó que no estaba firmado. Se sintió muy mal y culpable de no haberse dado cuenta.\n"
                    . "- Haciendo memoria, Pablo Aballay no firmó la papeleta de juego porque no se acercó a la mesa.\n"
                    . "- Le queda una duda que no puede confirmar: que la turno haya extraído el carnet de Pablo Aballay y por eso lo colocó casi al final de la papeleta.",
                'detalles_resolucion' => 'se resuelve en pleno, en sesión del lunes 23 de noviembre de 2026 y en relación con la apelación presentada por el Club Valencia de San José con fecha 11-11-2026, que de acuerdo a las declaraciones de la turno del encuentro, Srta. Brenda Castro, y del jefe de delegación del Club Valencia, Sr. Leonardo Verdejo, se encuentra acreditado que el jugador Pablo Aballay actuó en el partido de definición disputado el viernes 30 de octubre de 2026 frente a Santa Rosa sin haber firmado la papeleta de juego. '
                    . 'El Art. 136 del Reglamento ANFA establece que todo jugador, antes de actuar, siempre deberá firmar la papeleta de juego, y que el no cumplimiento de esta disposición será causal de pérdida del partido en que se produjo la infracción por un 3 x 0. '
                    . 'Por lo tanto, no se acoge la apelación y el Club Valencia pierde el partido por 3 x 0.',
                'created_at' => $ahora, 'updated_at' => $ahora,
            ]);
        });
    }

    public function down(): void
    {
        // Carga de datos: no se revierte automáticamente (se corrige desde el sistema si hace falta).
    }
};
