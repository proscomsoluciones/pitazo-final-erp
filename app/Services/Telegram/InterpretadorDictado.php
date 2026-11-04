<?php

namespace App\Services\Telegram;

use App\Helpers\RutHelper;
use App\Models\Club;
use App\Models\Fase;
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
        $resultado = $this->parser->parse($texto, $modulo);

        $contexto = $resultado['contexto'];
        if (!empty($contexto['fase_texto'])) {
            $fase = $this->buscarFase($contexto['fase_texto']);
            $contexto['fase_id'] = $fase?->id;
            $contexto['campeonato_id'] = $fase?->campeonato_id;
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

        if (!$item['tipo_falta'] && $item['articulo']) {
            $item['tipo_falta'] = $this->motivoHabitual($item['articulo']);
            $item['avisos'][] = $item['tipo_falta']
                ? "Motivo completado según el artículo: \"{$item['tipo_falta']}\"."
                : 'Falta el motivo de la sanción.';
        }

        return $item;
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

    public function buscarClub(string $texto, float $minimo = 75): ?Club
    {
        $buscado = $this->normalizarClub($texto);
        if ($buscado === '') {
            return null;
        }

        $this->clubes ??= Club::all()->map(fn (Club $c) => ['club' => $c, 'norm' => $this->normalizarClub($c->name)]);

        $compacto = str_replace(' ', '', $buscado);
        $mejor = null;
        $mejorPuntaje = 0;

        foreach ($this->clubes as ['club' => $club, 'norm' => $norm]) {
            $normCompacto = str_replace(' ', '', $norm);
            if ($normCompacto === $compacto) {
                return $club;
            }

            // "Estrella" -> "Estrella de Chile", "28 de Marzo" -> "Unión 28 de Marzo"
            $puntaje = str_contains($normCompacto, $compacto) || str_contains($compacto, $normCompacto)
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

    private function motivoHabitual(string $articulo): ?string
    {
        $motivo = Sancion::where('articulo_reglamento', $articulo)
            ->selectRaw('tipo_falta, count(*) as total')
            ->groupBy('tipo_falta')
            ->orderByDesc('total')
            ->value('tipo_falta');

        // Quitar el detalle de reincidencia: "Faltas reiteradas (1 partido + 1 ...)"
        return $motivo ? trim(preg_replace('/\s*\(.*\)\s*$/', '', $motivo)) : null;
    }

    private function buscarFase(string $texto): ?Fase
    {
        $buscado = DictadoParser::normalizar($texto);

        // Exacta primero; si no, la de nombre más corto ("Apertura" antes que "Definición Apertura 2026")
        return Fase::all()
            ->filter(fn (Fase $f) => str_contains(DictadoParser::normalizar($f->nombre), $buscado)
                || str_contains($buscado, DictadoParser::normalizar($f->nombre)))
            ->sortBy(fn (Fase $f) => [DictadoParser::normalizar($f->nombre) !== $buscado, mb_strlen($f->nombre), -$f->id])
            ->first();
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
