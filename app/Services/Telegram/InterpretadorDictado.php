<?php

namespace App\Services\Telegram;

use App\Helpers\RutHelper;
use App\Models\Campeonato;
use App\Models\Club;
use App\Models\FondoSolidario;
use App\Models\Jugador;
use App\Models\Sancion;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Cruza lo interpretado por DictadoParser con la base: club, jugador existente,
 * sanciones previas (reincidencia), motivo habitual del artículo, fase y fondos.
 */
class InterpretadorDictado
{
    private const ABREVIATURAS = ['sta' => 'santa', 'sto' => 'santo', 'u' => 'union', 'cd' => '', 'club' => ''];

    // Referencia (REF) sugerida para el oficio de ética según la medida
    private const ASUNTOS = [
        'EN_INVESTIGACION' => 'Apertura de Investigación',
        'CITADO' => 'Citación a Sesión Oficial',
        'INHABILITADO' => 'Inhabilitación',
        'AMONESTADO' => 'Amonestación',
        'RESUELTO' => 'Comunica Resolución',
        'ARCHIVADO' => 'Comunica Resolución',
    ];

    private ?Collection $clubes = null;

    public function __construct(private DictadoParser $parser)
    {
    }

    /**
     * @return array{contexto: array, items: array<int, array>}
     */
    public function interpretar(string $texto, string $modulo = DictadoParser::DISCIPLINA): array
    {
        // Con el club se separan los registros cuando el dictado llega en una sola línea
        $resultado = $this->parser->parse(
            $texto,
            $modulo,
            fn (string $campo) => (bool) $this->buscarClub($campo, 90),
            fn (string $texto) => $this->largoClub($texto),
        );

        $contexto = $resultado['contexto'] + ['avisos' => []];
        if (!empty($contexto['torneo_texto'])) {
            $contexto = array_merge($contexto, $this->resolverTorneo($contexto['torneo_texto'], $contexto['numero_fecha'] ?? null));
        }

        $items = array_map(fn (array $item) => match ($item['tipo']) {
            'SANCION' => $this->resolverSancion($item),
            'NOTA' => $this->resolverNota($item),
            'FONDO' => $this->resolverFondo($item),
            'EXPEDIENTE' => $this->resolverExpediente($item, $contexto['fecha_resolucion'] ?? now()->toDateString()),
            default => $item,
        }, $resultado['items']);

        return ['contexto' => $contexto, 'items' => $items];
    }

    private function resolverSancion(array $item): array
    {
        $club = $item['club_texto'] ? $this->buscarClub($item['club_texto']) : null;
        $item['club_id'] = $club?->id;
        $item['club_nombre'] = $club?->name;
        $item['jugador_id'] = null;
        $item['jugador_nombre'] = $item['jugador_texto'] ? $this->capitalizar($item['jugador_texto']) : null;
        $item['sanciones_previas'] = 0;

        if ($item['club_texto'] && !$club) {
            $item['avisos'][] = "No se encontró el club \"{$item['club_texto']}\".";
        }

        if ($club && $item['jugador_texto']) {
            [$jugador, $aviso] = $this->buscarJugador($item['jugador_texto'], $club->id);
            if ($jugador) {
                $item['jugador_id'] = $jugador->id;
                $item['jugador_nombre'] = $jugador->nombre;
                $item['sanciones_previas'] = Sancion::where('jugador_id', $jugador->id)
                    ->where('tipo_sancion', '!=', 'AMONESTACION')
                    ->count();
            } else {
                $otro = $this->jugadorEnOtroClub($item['jugador_texto'], $club->id);
                $item['avisos'][] = 'Jugador nuevo: se creará al aprobar.'
                    . ($otro ? " Ojo: existe \"{$otro->nombre}\" en {$otro->club?->name}." : '');
            }
            if ($aviso) {
                $item['avisos'][] = $aviso;
            }
        }

        if ($item['reincidencia'] && $item['sanciones_previas'] === 0) {
            $item['avisos'][] = 'Tiene marca R, pero no hay sanciones previas registradas.';
        } elseif (!$item['reincidencia'] && $item['sanciones_previas'] > 0) {
            $item['avisos'][] = "Tiene {$item['sanciones_previas']} sanción(es) previa(s) y no se marcó R.";
        }

        if ($item['articulo']) {
            $motivos = $this->motivosDelArticulo($item['articulo']);

            if (!$item['tipo_falta']) {
                $item['tipo_falta'] = $motivos[0] ?? null;
                $item['avisos'][] = $item['tipo_falta']
                    ? "Motivo completado según el artículo: \"{$item['tipo_falta']}\"."
                    : 'Falta el motivo de la sanción.';
            } elseif ($corregido = $this->corregirMotivo($item['tipo_falta'], $motivos)) {
                // Errores típicos del dictado: "doble mutación" -> "Doble amonestación"
                $item['avisos'][] = "Motivo corregido: \"{$item['tipo_falta']}\" → \"{$corregido}\".";
                $item['tipo_falta'] = $corregido;
            }
        }

        return $item;
    }

    /**
     * Motivo conocido del artículo parecido al dictado (≥ 78 %), o null si coincide con uno o no se parece a ninguno.
     */
    private function corregirMotivo(string $dictado, array $motivos): ?string
    {
        $buscado = DictadoParser::normalizar($dictado);
        $mejor = null;
        $mejorPuntaje = 0;

        foreach ($motivos as $motivo) {
            $norm = DictadoParser::normalizar($motivo);
            if ($norm === $buscado) {
                return null;
            }
            if (($puntaje = $this->similitud($buscado, $norm)) > $mejorPuntaje) {
                [$mejor, $mejorPuntaje] = [$motivo, $puntaje];
            }
        }

        return $mejorPuntaje >= 78 ? $mejor : null;
    }

    private function resolverNota(array $item): array
    {
        $club = $item['club_texto'] ? $this->buscarClub($item['club_texto']) : null;

        // Cartas: el club es el primer campo que coincide con un club; se quita del texto de la nota
        foreach ($item['candidatos_club'] ?? [] as $candidato) {
            if ($club = $this->buscarClub($candidato, 90)) {
                $item['nota'] = trim(str_replace(", {$candidato}", '', $item['nota']));
                break;
            }
        }

        $item['club_id'] = $club?->id;
        $item['club_nombre'] = $club?->name;
        unset($item['candidatos_club']);

        if ($item['club_texto'] && !$club) {
            $item['avisos'][] = "No se encontró el club \"{$item['club_texto']}\"; la nota quedará sin club.";
        }

        return $item;
    }

    private function resolverFondo(array $item): array
    {
        $club = $item['club_texto'] ? $this->buscarClub($item['club_texto']) : null;
        $item['club_id'] = $club?->id;
        $item['club_nombre'] = $club?->name;
        $item['jugador_nombre'] = $item['jugador_texto'] ? $this->capitalizar($item['jugador_texto']) : null;
        $item['estado'] = 'PAGADO';

        if ($item['club_texto'] && !$club) {
            $item['avisos'][] = "No se encontró el club \"{$item['club_texto']}\".";
        }

        if ($item['numero_fondo'] && FondoSolidario::where('numero_fondo', $item['numero_fondo'])->exists()) {
            $item['avisos'][] = "Ya existe el Fondo Solidario N°{$item['numero_fondo']}.";
        } elseif (!$item['numero_fondo']) {
            $item['avisos'][] = 'Sin N° de fondo: se asignará el siguiente al aprobar.';
        }

        return $item;
    }

    private function resolverExpediente(array $item, string $fechaBase): array
    {
        $textos = $item['textos'];
        // Umbral más alto: un turno sin club no debe confundirse con un club ("Margarita..." / "Santa Margarita")
        $club = isset($textos[0]) ? $this->buscarClub($textos[0], 85) : null;
        if ($club) {
            array_shift($textos);
        }

        $item['club_id'] = $club?->id;
        $item['club_nombre'] = $club?->name;
        $item['calidad'] ??= 'JUGADOR';
        $item['jugador_id'] = null;
        $item['nombre'] = $item['calidad'] === 'CLUB' ? $club?->name : ($textos ? $this->capitalizar(array_shift($textos)) : null);
        $detalle = Str::ucfirst(implode(', ', $textos)) ?: null;

        if ($item['calidad'] === 'JUGADOR' && $club && $item['nombre']) {
            [$jugador, $aviso] = $this->buscarJugador($item['nombre'], $club->id);
            if ($jugador) {
                $item['jugador_id'] = $jugador->id;
                $item['nombre'] = $jugador->nombre;
                if (!$item['rut'] && $jugador->rut && !RutHelper::esPendiente($jugador->rut)) {
                    $item['rut'] = RutHelper::format($jugador->rut);
                }
            }
            if ($aviso) {
                $item['avisos'][] = $aviso;
            }
        }

        if (!$club && in_array($item['calidad'], ['JUGADOR', 'CLUB'], true)) {
            $item['avisos'][] = 'No se reconoció el club (primer campo).';
        }
        if (!$item['rut'] && in_array($item['calidad'], ['JUGADOR', 'DIRIGENTE', 'TURNO'], true)) {
            $item['avisos'][] = 'Sin RUT: el oficio dirá "No registrado".';
        }

        // Resolución y archivo usan el texto como lo resuelto; el resto, como antecedentes
        $esResolucion = in_array($item['estado'], ['RESUELTO', 'ARCHIVADO'], true);
        $item['descripcion'] = $esResolucion ? null : $detalle;
        $item['detalles_resolucion'] = $esResolucion ? $detalle : null;
        $item['asunto'] = self::ASUNTOS[$item['estado']];

        $item['fecha_inicio_inhabilitacion'] = null;
        $item['fecha_fin_inhabilitacion'] = null;
        if ($item['estado'] === 'INHABILITADO') {
            $inicio = Carbon::parse($item['desde'] ?? $fechaBase);
            $item['fecha_inicio_inhabilitacion'] = $inicio->toDateString();
            $item['fecha_fin_inhabilitacion'] = $item['hasta'] ?? ($item['duracion']
                ? ($item['duracion']['unidad'] === 'AÑOS' ? $inicio->copy()->addYears($item['duracion']['cantidad']) : $inicio->copy()->addMonths($item['duracion']['cantidad']))->toDateString()
                : null);
            if (!$item['fecha_fin_inhabilitacion']) {
                $item['avisos'][] = 'Inhabilitación sin término (indica duración o "hasta dd-mm-aaaa").';
            }
        }
        if ($item['estado'] === 'CITADO') {
            $item['lugar_citacion'] = 'Sede Oficial de la Asociación';
            if (!$item['fecha_citacion']) {
                $item['avisos'][] = 'Citación sin fecha: indícala al aprobar.';
            }
        }

        unset($item['textos'], $item['desde'], $item['hasta'], $item['duracion']);

        return $item;
    }

    /**
     * Cuántas palabras del inicio del texto forman el nombre de un club (para leer el libro sin comas):
     * "Unión 28 de Marzo Gustavo Aguilera" -> 4, "Estrella Kevin Núñez" -> 1, "Gustavo Aguilera" -> null.
     * Acepta el nombre completo, su comienzo ("Estrella", "Carmelo"), su final ("Compuertas", "28 de Marzo")
     * o un error leve de dictado ("Palencia").
     */
    public function largoClub(string $texto): ?int
    {
        $palabras = preg_split('/\s+/u', trim($texto)) ?: [];
        $this->cargarClubes();
        $largo = null;

        for ($k = 1; $k <= min(6, count($palabras)); $k++) {
            $prefijo = str_replace(' ', '', $this->normalizarClub(implode(' ', array_slice($palabras, 0, $k))));
            if (strlen($prefijo) < 4) {
                continue;
            }

            foreach ($this->clubes as ['norm' => $norm]) {
                $club = str_replace(' ', '', $norm);
                $coincide = $prefijo === $club
                    || str_starts_with($club, $prefijo)
                    || (strlen($prefijo) >= 7 && str_ends_with($club, $prefijo))
                    || (strlen($prefijo) >= 6 && abs(strlen($prefijo) - strlen($club)) <= 2 && $this->similitud($prefijo, $club) >= 85);
                if ($coincide) {
                    $largo = $k;
                    break;
                }
            }
        }

        return $largo;
    }

    private function cargarClubes(): void
    {
        $this->clubes ??= Club::all()->map(fn (Club $c) => ['club' => $c, 'norm' => $this->normalizarClub($c->name)]);
    }

    public function buscarClub(string $texto, float $minimo = 75): ?Club
    {
        $buscado = $this->normalizarClub($texto);
        if ($buscado === '') {
            return null;
        }

        $this->cargarClubes();

        $compacto = str_replace(' ', '', $buscado);
        $mejor = null;
        $mejorPuntaje = 0;

        foreach ($this->clubes as ['club' => $club, 'norm' => $norm]) {
            $normCompacto = str_replace(' ', '', $norm);
            if ($normCompacto === $compacto) {
                return $club;
            }

            // "Estrella" -> "Estrella de Chile", "28 de Marzo" -> "Unión 28 de Marzo"
            // (mínimo 4 letras: "R" o "2" no deben coincidir con "Unión 28 de Marzo")
            $puntaje = strlen($compacto) >= 4 && (str_contains($normCompacto, $compacto) || str_contains($compacto, $normCompacto))
                ? 90
                : $this->similitud($compacto, $normCompacto);

            if ($puntaje > $mejorPuntaje) {
                [$mejor, $mejorPuntaje] = [$club, $puntaje];
            }
        }

        return $mejorPuntaje >= $minimo ? $mejor : null;
    }

    /**
     * @return array{0: ?Jugador, 1: ?string}
     */
    private function buscarJugador(string $texto, int $clubId): array
    {
        $buscado = DictadoParser::normalizar($texto);
        $tokens = explode(' ', $buscado);
        $candidatos = Jugador::where('club_id', $clubId)->get();

        $mejor = null;
        $mejorPuntaje = 0;

        foreach ($candidatos as $jugador) {
            $norm = DictadoParser::normalizar($jugador->nombre);
            if ($norm === $buscado) {
                return [$jugador, null];
            }

            // Mismo nombre con o sin segundo apellido o inicial ("Daniel Huerta" / "Daniel Huerta Vera")
            $propios = explode(' ', $norm);
            $comunes = count(array_intersect($tokens, $propios));
            $subconjunto = $comunes >= 2 && ($comunes === count($tokens) || $comunes === count($propios));

            $puntaje = $subconjunto ? 95 : $this->similitud($buscado, $norm);
            if ($puntaje > $mejorPuntaje) {
                [$mejor, $mejorPuntaje] = [$jugador, $puntaje];
            }
        }

        if ($mejorPuntaje >= 88) {
            return [$mejor, "Se asoció al jugador registrado \"{$mejor->nombre}\" (dictado: \"{$texto}\")."];
        }

        return [null, null];
    }

    private function jugadorEnOtroClub(string $texto, int $clubId): ?Jugador
    {
        $buscado = DictadoParser::normalizar($texto);

        return Jugador::with('club')
            ->where('club_id', '!=', $clubId)
            ->get()
            ->first(fn (Jugador $j) => DictadoParser::normalizar($j->nombre) === $buscado);
    }

    /**
     * Motivos ya usados con el artículo, del más frecuente al menos frecuente.
     *
     * @return string[]
     */
    private function motivosDelArticulo(string $articulo): array
    {
        return Sancion::where('articulo_reglamento', $articulo)
            ->selectRaw('tipo_falta, count(*) as total')
            ->groupBy('tipo_falta')
            ->orderByDesc('total')
            ->pluck('tipo_falta')
            // Quitar el detalle de reincidencia: "Faltas reiteradas (1 partido + 1 ...)"
            ->map(fn ($m) => trim(preg_replace('/\s*\(.*\)\s*$/', '', $m)))
            ->filter()
            ->unique(fn ($m) => DictadoParser::normalizar($m))
            ->values()
            ->all();
    }

    /**
     * "campeonato oficial 2026 clausura" -> campeonato y fase activos cuyo nombre aparece en el texto.
     * El año es opcional ("campeonato oficial", "liguilla infantil") y gana el nombre más largo
     * ("definicion apertura" antes que "apertura").
     */
    private function resolverTorneo(string $texto, ?int $numeroFecha): array
    {
        $buscado = ' ' . DictadoParser::normalizar($texto) . ' ';
        $sinAnio = fn (string $nombre) => trim(preg_replace('/\b(19|20)\d{2}\b/', '', DictadoParser::normalizar($nombre)));
        $aparece = fn (string $nombre) => str_contains($buscado, ' ' . DictadoParser::normalizar($nombre) . ' ')
            || str_contains($buscado, ' ' . $sinAnio($nombre) . ' ');
        $masLargo = fn ($coleccion) => $coleccion->filter(fn ($m) => $aparece($m->nombre))->sortByDesc(fn ($m) => mb_strlen($m->nombre))->first();

        $campeonatos = Campeonato::with('fases')->where('estado', 'ACTIVO')->get();
        $campeonato = $masLargo($campeonatos);
        $fase = $masLargo($campeonato ? $campeonato->fases : $campeonatos->flatMap->fases);

        // Liguillas: el campeonato tiene una sola fase
        if (!$fase && $campeonato?->fases->count() === 1) {
            $fase = $campeonato->fases->first();
        }
        $campeonato ??= $fase ? $campeonatos->firstWhere('id', $fase->campeonato_id) : null;

        $avisos = [];
        if (!$fase) {
            $avisos[] = $campeonato
                ? "Falta la fase de {$campeonato->nombre} (" . $campeonato->fases->pluck('nombre')->implode(', ') . ').'
                : "No reconocí el campeonato o la fase \"{$texto}\".";
        } elseif ($numeroFecha && $numeroFecha > $fase->cantidad_fechas) {
            $avisos[] = "{$fase->nombre} tiene {$fase->cantidad_fechas} fecha(s); se indicó la fecha {$numeroFecha}.";
        }

        return [
            'campeonato_id' => $campeonato?->id,
            'campeonato_nombre' => $campeonato?->nombre,
            'fase_id' => $fase?->id,
            'avisos' => $avisos,
        ];
    }

    private function normalizarClub(string $texto): string
    {
        $palabras = explode(' ', DictadoParser::normalizar($texto));
        $palabras = array_map(fn ($p) => self::ABREVIATURAS[$p] ?? $p, $palabras);

        return trim(implode(' ', array_filter($palabras, fn ($p) => $p !== '')));
    }

    private function similitud(string $a, string $b): float
    {
        similar_text($a, $b, $porcentaje);

        return $porcentaje;
    }

    private function capitalizar(string $nombre): string
    {
        return mb_convert_case(trim(preg_replace('/\s+/', ' ', $nombre)), MB_CASE_TITLE, 'UTF-8');
    }
}
