<?php

namespace App\Services\Telegram;

use Illuminate\Support\Str;

/**
 * Interpreta el texto dictado o escrito en Telegram, sin consultar la base de datos.
 *
 * Una línea por registro, campos separados por coma:
 *   Fecha 1 Clausura 01-11-2026                                   (contexto, opcional)
 *   Carmelo de Praga, Héctor Caneo Navarrete, 210 H, conducta violenta, 4 partidos
 *   Estrella, Maximiliano Navarrete Zamora, 211 P, doble amonestación, 1+1 partidos, R
 *   Multa, Valencia, 50.000, no presentación serie femenina
 *
 * El artículo, la sanción y la marca R se reconocen en cualquier posición;
 * el resto de los campos se toma en orden como club, jugador y motivo.
 */
class DictadoParser
{
    private const NUMEROS = [
        'un' => 1, 'uno' => 1, 'una' => 1, 'dos' => 2, 'tres' => 3, 'cuatro' => 4,
        'cinco' => 5, 'seis' => 6, 'siete' => 7, 'ocho' => 8, 'nueve' => 9,
        'diez' => 10, 'once' => 11, 'doce' => 12,
    ];

    private const UNIDADES = [
        'partido' => 'PARTIDOS', 'partidos' => 'PARTIDOS', 'fecha' => 'PARTIDOS', 'fechas' => 'PARTIDOS',
        'mes' => 'MESES', 'meses' => 'MESES', 'ano' => 'AÑOS', 'anos' => 'AÑOS',
    ];

    /**
     * @return array{contexto: array, items: array<int, array>}
     */
    public function parse(string $texto): array
    {
        $contexto = [];
        $items = [];

        $lineas = preg_split('/\R+/u', $texto) ?: [];

        foreach ($lineas as $linea) {
            $linea = trim($linea, " \t.-•*");
            if ($linea === '') {
                continue;
            }

            $norm = self::normalizar($linea);

            if (preg_match('/^fecha\s+(\d+|' . $this->patronNumeros() . ')\b/', $norm)) {
                $contexto = array_merge($contexto, $this->parseContexto($linea, $norm));
                continue;
            }

            if (preg_match('/^(multa|nota)\b/', $norm)) {
                $items[] = $this->parseNota($linea);
                continue;
            }

            $items[] = $this->parseSancion($linea);
        }

        return ['contexto' => $contexto, 'items' => $items];
    }

    private function parseContexto(string $linea, string $norm): array
    {
        $contexto = [];

        preg_match('/^fecha\s+(\d+|' . $this->patronNumeros() . ')\b/', $norm, $m);
        $contexto['numero_fecha'] = $this->numero($m[1]);

        if (preg_match('/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/', $linea, $f)) {
            $anio = strlen($f[3]) === 2 ? 2000 + (int) $f[3] : (int) $f[3];
            if (checkdate((int) $f[2], (int) $f[1], $anio)) {
                $contexto['fecha_resolucion'] = sprintf('%04d-%02d-%02d', $anio, $f[2], $f[1]);
            }
        }

        $resto = preg_replace('/\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/', '', $linea);
        $resto = trim(preg_replace('/^\s*fecha\s+\S+/iu', '', $resto), " ,.-");
        if ($resto !== '') {
            $contexto['fase_texto'] = $resto;
        }

        return $contexto;
    }

    private function parseNota(string $linea): array
    {
        $campos = $this->campos($linea);
        $item = ['tipo' => 'NOTA', 'linea' => $linea, 'club_texto' => null, 'nota' => null, 'monto' => null, 'avisos' => []];

        // La palabra clave puede venir sola ("Multa, Valencia, ...") o junto al club ("Multa Valencia, ...")
        $primero = trim(preg_replace('/^\s*(multa|nota)\b[\s:]*/iu', '', array_shift($campos)));
        if ($primero !== '') {
            array_unshift($campos, $primero);
        }

        $resto = [];
        foreach ($campos as $campo) {
            if ($item['monto'] === null && preg_match('/^\$?\s*(\d{1,3}(?:\.\d{3})+|\d{4,})\s*(?:pesos)?$/iu', $campo, $m)) {
                $item['monto'] = (int) str_replace('.', '', $m[1]);
                continue;
            }
            $resto[] = $campo;
        }

        $item['club_texto'] = array_shift($resto);
        $item['nota'] = Str::ucfirst(implode(', ', $resto)) ?: null;

        if (!$item['club_texto']) {
            $item['avisos'][] = 'Falta el club de la multa.';
        }
        if (!$item['nota']) {
            $item['avisos'][] = 'Falta el detalle de la multa.';
        }

        return $item;
    }

    private function parseSancion(string $linea): array
    {
        $item = [
            'tipo' => 'SANCION',
            'linea' => $linea,
            'club_texto' => null,
            'jugador_texto' => null,
            'articulo' => null,
            'tipo_falta' => null,
            'cantidad_base' => null,
            'cantidad' => null,
            'unidad' => null,
            'reincidencia' => false,
            'avisos' => [],
        ];

        $resto = [];
        foreach ($this->campos($linea) as $campo) {
            $norm = self::normalizar($campo, '+');

            if (in_array($norm, ['r', 'reincidencia', 'reincidente', 'reincide'], true)) {
                $item['reincidencia'] = true;
                continue;
            }

            if ($item['articulo'] === null && ($articulo = $this->articulo($norm))) {
                $item['articulo'] = $articulo;
                continue;
            }

            if ($item['unidad'] === null && ($sancion = $this->sancion($norm))) {
                $item = array_merge($item, $sancion, ['reincidencia' => $item['reincidencia'] || $sancion['reincidencia']]);
                continue;
            }

            $resto[] = $campo;
        }

        $item['club_texto'] = $resto[0] ?? null;
        $item['jugador_texto'] = $resto[1] ?? null;
        $item['tipo_falta'] = count($resto) > 2 ? Str::ucfirst(implode(', ', array_slice($resto, 2))) : null;

        // "1+1" ya trae el agravante; "1 partido, R" suma el +1 de la reincidencia
        if ($item['reincidencia'] && $item['unidad'] === 'PARTIDOS' && $item['cantidad'] === $item['cantidad_base']) {
            $item['cantidad'] = $item['cantidad_base'] + 1;
            $item['avisos'][] = "Se sumó +1 partido por reincidencia ({$item['cantidad_base']}+1).";
        }

        if (!$item['club_texto'] || !$item['jugador_texto']) {
            $item['avisos'][] = 'No se reconoció el club o el jugador. Formato: club, jugador, artículo, motivo, sanción.';
        }
        if (!$item['articulo']) {
            $item['avisos'][] = 'Falta el artículo y letra (ej: 211 P).';
        }
        if (!$item['unidad']) {
            $item['avisos'][] = 'Falta la sanción (ej: 1 partido, 2 años, 6 meses).';
        }

        return $item;
    }

    /**
     * "211 P", "art 211 letra p", "articulo 210 letra h" -> "Art. 211 Letra P"
     */
    private function articulo(string $norm): ?string
    {
        if (!preg_match('/^(?:art(?:iculo)?\s*)?(\d{3})(?:\s*(?:letra\s*)?([a-z]))?$/', $norm, $m)) {
            return null;
        }

        return 'Art. ' . $m[1] . (isset($m[2]) && $m[2] !== '' ? ' Letra ' . strtoupper($m[2]) : '');
    }

    /**
     * "4 partidos", "1+1 partidos", "dos anos", "6 meses r", "amonestacion"
     */
    private function sancion(string $norm): ?array
    {
        if (preg_match('/^(carta de )?amonestacion( escrita)?$/', $norm)) {
            return ['cantidad_base' => 1, 'cantidad' => 1, 'unidad' => 'AMONESTACION', 'reincidencia' => false];
        }

        $num = '(\d+|' . $this->patronNumeros() . ')';
        $patron = '/^' . $num . '(?:\s*(?:\+|mas)\s*' . $num . ')?\s*(' . implode('|', array_keys(self::UNIDADES)) . ')(?:\s+(r|reincidencia))?$/';

        if (!preg_match($patron, $norm, $m)) {
            return null;
        }

        $base = $this->numero($m[1]);
        $extra = isset($m[2]) && $m[2] !== '' ? $this->numero($m[2]) : 0;

        return [
            'cantidad_base' => $base,
            'cantidad' => $base + $extra,
            'unidad' => self::UNIDADES[$m[3]],
            'reincidencia' => $extra > 0 || !empty($m[4]),
        ];
    }

    private function campos(string $linea): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $linea)), fn ($c) => $c !== ''));
    }

    private function numero(string $valor): int
    {
        return ctype_digit($valor) ? (int) $valor : (self::NUMEROS[$valor] ?? 0);
    }

    private function patronNumeros(): string
    {
        return implode('|', array_keys(self::NUMEROS));
    }

    /**
     * Minúsculas, sin tildes y sin signos (salvo los indicados), con espacios simples.
     */
    public static function normalizar(string $texto, string $conservar = ''): string
    {
        $texto = Str::lower(Str::ascii($texto));
        $texto = preg_replace('/[^a-z0-9' . preg_quote($conservar, '/') . ']+/', ' ', $texto);

        return trim(preg_replace('/\s+/', ' ', $texto));
    }
}
