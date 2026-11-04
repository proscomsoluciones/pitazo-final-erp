<?php

namespace App\Services\Telegram;

use App\Models\Club;
use App\Models\Fase;
use App\Models\Jugador;
use App\Models\Sancion;
use Illuminate\Support\Collection;

/**
 * Cruza lo interpretado por DictadoParser con la base: club, jugador existente,
 * sanciones previas (reincidencia), motivo habitual del artículo y fase.
 */
class InterpretadorDictado
{
    private const ABREVIATURAS = ['sta' => 'santa', 'sto' => 'santo', 'u' => 'union', 'cd' => '', 'club' => ''];

    private ?Collection $clubes = null;

    public function __construct(private DictadoParser $parser)
    {
    }

    /**
     * @return array{contexto: array, items: array<int, array>}
     */
    public function interpretar(string $texto): array
    {
        $resultado = $this->parser->parse($texto);

        $contexto = $resultado['contexto'];
        if (!empty($contexto['fase_texto'])) {
            $fase = $this->buscarFase($contexto['fase_texto']);
            $contexto['fase_id'] = $fase?->id;
            $contexto['campeonato_id'] = $fase?->campeonato_id;
        }

        $items = array_map(fn (array $item) => match ($item['tipo']) {
            'SANCION' => $this->resolverSancion($item),
            'NOTA' => $this->resolverNota($item),
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
        $item['club_id'] = $club?->id;
        $item['club_nombre'] = $club?->name;

        if ($item['club_texto'] && !$club) {
            $item['avisos'][] = "No se encontró el club \"{$item['club_texto']}\"; la nota quedará sin club.";
        }

        return $item;
    }

    public function buscarClub(string $texto): ?Club
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

        return $mejorPuntaje >= 75 ? $mejor : null;
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
