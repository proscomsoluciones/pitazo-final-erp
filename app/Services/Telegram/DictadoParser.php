<?php

namespace App\Services\Telegram;

use Illuminate\Support\Str;

/**
 * Interpreta el texto dictado o escrito en Telegram, sin consultar la base de datos.
 * Una línea por registro, campos separados por coma.
 *
 * Disciplina:
 *   Fecha 1 Clausura 01-11-2026                                   (contexto, opcional)
 *   Carmelo de Praga, Héctor Caneo Navarrete, 210 H, conducta violenta, 4 partidos
 *   Estrella, Maximiliano Navarrete Zamora, 211 P, doble amonestación, 1+1 partidos, R
 *   Multa, Valencia, 50.000, no presentación serie femenina
 *   Carta de amonestación al Sr. Oscar Girola, Santa Margarita, mal comportamiento, 10.000
 *   Fondo 27, Alianza, Julio Astete Valenzuela, 13.262.615-4, 14 días
 *
 * Ética:
 *   Arcoíris, Víctor Figueroa Fernández, 17.273.112-0, dirigente, 206 I, inhabilitación 1 año desde 11-04-2026, se rebaja la sanción
 *
 * Artículo, sanción, RUT, porcentaje, días, calidad y medida se reconocen en cualquier posición;
 * el resto de los campos se toma en orden (club, nombre, motivo o detalle).
 */
class DictadoParser
{
    public const DISCIPLINA = 'DISCIPLINA';
    public const ETICA = 'ETICA';

    private const NUMEROS = [
        'un' => 1, 'uno' => 1, 'una' => 1, 'dos' => 2, 'tres' => 3, 'cuatro' => 4,
        'cinco' => 5, 'seis' => 6, 'siete' => 7, 'ocho' => 8, 'nueve' => 9,
        'diez' => 10, 'once' => 11, 'doce' => 12,
    ];

    private const UNIDADES = [
        'partido' => 'PARTIDOS', 'partidos' => 'PARTIDOS', 'fecha' => 'PARTIDOS', 'fechas' => 'PARTIDOS',
        'mes' => 'MESES', 'meses' => 'MESES', 'ano' => 'AÑOS', 'anos' => 'AÑOS',
    ];

    private const CALIDADES = [
        'jugador' => 'JUGADOR', 'jugadora' => 'JUGADOR', 'dirigente' => 'DIRIGENTE', 'dirigenta' => 'DIRIGENTE',
        'turno' => 'TURNO', 'club' => 'CLUB',
    ];

    // Primera palabra de la medida de ética -> estado del expediente (inhabil* antes que habil*)
    private const MEDIDAS = [
        'inhabilit' => 'INHABILITADO', 'investiga' => 'EN_INVESTIGACION', 'apertura de investigacion' => 'EN_INVESTIGACION',
        'cita' => 'CITADO', 'amonesta' => 'AMONESTADO', 'resol' => 'RESUELTO', 'resuel' => 'RESUELTO', 'archiv' => 'ARCHIVADO',
    ];

    private const ENCABEZADOS = [
        'disciplina' => self::DISCIPLINA, 'tribunal' => self::DISCIPLINA, 'tribunal de disciplina' => self::DISCIPLINA,
        'comite de disciplina' => self::DISCIPLINA, 'etica' => self::ETICA, 'comite de etica' => self::ETICA,
    ];

    /**
     * Si la primera línea es "Ética" o "Disciplina", devuelve el módulo y el texto sin esa línea.
     *
     * @return array{0: ?string, 1: string}
     */
    public static function detectarModulo(string $texto): array
    {
        $lineas = preg_split('/\R/u', trim($texto)) ?: [];
        $modulo = self::ENCABEZADOS[self::normalizar($lineas[0] ?? '')] ?? null;

        return $modulo ? [$modulo, trim(implode("\n", array_slice($lineas, 1)))] : [null, $texto];
    }

    /**
     * @return array{contexto: array, items: array<int, array>}
     */
    public function parse(string $texto, string $modulo = self::DISCIPLINA): array
    {
        $contexto = [];
        $items = [];

        foreach (preg_split('/\R+/u', $texto) ?: [] as $linea) {
            $linea = trim($linea, " \t.-•*");
            if ($linea === '') {
                continue;
            }

            $norm = self::normalizar($linea);

            if (preg_match('/^fecha\s+(\d+|' . $this->patronNumeros() . ')\b/', $norm)) {
                $contexto = array_merge($contexto, $this->parseContexto($linea, $norm));
                continue;
            }

            if ($modulo === self::ETICA) {
                $items[] = $this->parseExpediente($linea);
            } elseif (preg_match('/^(multa|nota|carta)\b/', $norm)) {
                $items[] = $this->parseNota($linea);
            } elseif (preg_match('/^fondo\b/', $norm)) {
                $items[] = $this->parseFondo($linea);
            } else {
                $items[] = $this->parseSancion($linea);
            }
        }

        return ['contexto' => $contexto, 'items' => $items];
    }

    private function parseContexto(string $linea, string $norm): array
    {
        preg_match('/^fecha\s+(\d+|' . $this->patronNumeros() . ')\b/', $norm, $m);
        $contexto = ['numero_fecha' => $this->numero($m[1])];

        if ($fecha = $this->fecha($linea)) {
            $contexto['fecha_resolucion'] = $fecha;
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
        $esCarta = str_starts_with(self::normalizar($campos[0]), 'carta');
        $item = ['tipo' => 'NOTA', 'linea' => $linea, 'club_texto' => null, 'candidatos_club' => [], 'nota' => null, 'monto' => null, 'avisos' => []];

        // "Multa, Valencia, ..." o "Multa Valencia, ..."; en las cartas el texto se conserva completo
        if (!$esCarta) {
            $primero = trim(preg_replace('/^\s*(multa|nota)\b[\s:]*/iu', '', array_shift($campos)));
            if ($primero !== '') {
                array_unshift($campos, $primero);
            }
        }

        $resto = [];
        foreach ($campos as $campo) {
            if ($item['monto'] === null && ($monto = $this->monto($campo, false))) {
                $item['monto'] = $monto;
                continue;
            }
            $resto[] = $campo;
        }

        if ($esCarta) {
            // El club puede ir en cualquier campo después del texto de la carta
            $item['candidatos_club'] = array_slice($resto, 1);
        } else {
            $item['club_texto'] = array_shift($resto);
        }
        $item['nota'] = Str::ucfirst(implode(', ', $resto)) ?: null;

        if (!$esCarta && !$item['club_texto']) {
            $item['avisos'][] = 'Falta el club de la multa.';
        }
        if (!$item['nota']) {
            $item['avisos'][] = 'Falta el detalle de la multa o nota.';
        }

        return $item;
    }

    private function parseFondo(string $linea): array
    {
        $campos = $this->campos($linea);
        $item = [
            'tipo' => 'FONDO', 'linea' => $linea, 'club_texto' => null, 'jugador_texto' => null,
            'numero_fondo' => null, 'rut' => null, 'porcentaje' => null, 'monto' => null, 'dias' => null,
            'fractura' => false, 'diagnostico' => null, 'avisos' => [],
        ];

        // "Fondo 27", "Fondo solidario N° 27" o "Fondo, 27, ..."
        $primero = trim(preg_replace('/^\s*fondo(\s+solidario)?\b[\s:]*/iu', '', array_shift($campos)));
        if ($primero !== '') {
            array_unshift($campos, $primero);
        }

        $resto = [];
        foreach ($campos as $campo) {
            $norm = self::normalizar($campo);

            if ($item['numero_fondo'] === null && preg_match('/^(?:n\s*[°º.]?|nro\.?|n[uú]mero)?\s*(\d{1,4})$/iu', $campo, $m)) {
                $item['numero_fondo'] = (int) $m[1];
            } elseif ($item['rut'] === null && ($rut = $this->rut($campo))) {
                $item['rut'] = $rut;
            } elseif ($item['porcentaje'] === null && preg_match('/^(\d{2,3})\s*(?:%|por\s*ciento)$/iu', $campo, $m)) {
                $item['porcentaje'] = (int) $m[1];
            } elseif (str_contains($norm, 'fractura') || preg_match('/^(\d{1,3}) dias?\b/', $norm)) {
                $item['fractura'] = $item['fractura'] || str_contains($norm, 'fractura');
                if (preg_match('/(\d{1,3}) dias?\b/', $norm, $m)) {
                    $item['dias'] = (int) $m[1];
                }
            } elseif ($item['monto'] === null && ($monto = $this->monto($campo, true))) {
                $item['monto'] = $monto;
            } else {
                $resto[] = $campo;
            }
        }

        $item['club_texto'] = $resto[0] ?? null;
        $item['jugador_texto'] = $resto[1] ?? null;
        $extra = Str::ucfirst(implode(', ', array_slice($resto, 2)));

        // Tabla oficial del Fondo Solidario (misma que el formulario del sistema)
        if ($item['porcentaje'] === null) {
            $item['porcentaje'] = match (true) {
                $item['fractura'] => 200,
                $item['dias'] === null => null,
                $item['dias'] >= 1 && $item['dias'] <= 7 => 50,
                $item['dias'] >= 8 && $item['dias'] <= 13 => 75,
                $item['dias'] >= 14 && $item['dias'] <= 30 => 100,
                default => null,
            };
        }
        if ($item['monto'] === null && $item['porcentaje'] !== null) {
            $item['monto'] = $item['porcentaje'] * 50;
        }

        $porDias = $item['dias'] ? "aporte por {$item['dias']} días" : '';
        $diagnostico = $item['fractura'] ? ('Fractura' . ($porDias ? ", {$porDias}" : '')) : Str::ucfirst($porDias);
        $item['diagnostico'] = trim(implode('. ', array_filter([$diagnostico, $extra]))) ?: null;

        if (!$item['club_texto'] || !$item['jugador_texto']) {
            $item['avisos'][] = 'No se reconoció el club o el jugador. Formato: fondo N°, club, jugador, RUT, % o días de reposo.';
        }
        if ($item['porcentaje'] === null) {
            $item['avisos'][] = $item['dias'] > 30
                ? 'Más de 30 días de reposo: define el porcentaje y monto a mano.'
                : 'Falta el porcentaje o los días de reposo (ej: 100%, 14 días, fractura).';
        }
        if (!$item['rut']) {
            $item['avisos'][] = 'Sin RUT.';
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

    private function parseExpediente(string $linea): array
    {
        $item = [
            'tipo' => 'EXPEDIENTE', 'linea' => $linea, 'calidad' => null, 'rut' => null, 'articulo' => null,
            'estado' => null, 'duracion' => null, 'desde' => null, 'hasta' => null, 'fecha_citacion' => null,
            'textos' => [], 'avisos' => [],
        ];

        foreach ($this->campos($linea) as $campo) {
            $norm = self::normalizar($campo);

            if ($item['rut'] === null && ($rut = $this->rut($campo))) {
                $item['rut'] = $rut;
            } elseif ($item['calidad'] === null && isset(self::CALIDADES[$norm])) {
                $item['calidad'] = self::CALIDADES[$norm];
            } elseif ($item['articulo'] === null && ($articulo = $this->articulo($norm))) {
                $item['articulo'] = $articulo;
            } elseif ($item['estado'] === null && ($medida = $this->medida($campo, $norm))) {
                $item = array_merge($item, $medida);
            } else {
                $item['textos'][] = $campo;
            }
        }

        if (!$item['estado']) {
            $item['estado'] = 'EN_INVESTIGACION';
            $item['avisos'][] = 'No se indicó la medida; queda como apertura de investigación.';
        }
        if (!$item['textos']) {
            $item['avisos'][] = 'Falta el nombre del involucrado. Formato: club, nombre, RUT, calidad, artículo, medida, detalle.';
        }

        return $item;
    }

    /**
     * "inhabilitación 1 año desde 11-04-2026", "citación 10-11-2026 19:30", "investigación", "resolución"
     */
    private function medida(string $campo, string $norm): ?array
    {
        $estado = null;
        foreach (self::MEDIDAS as $prefijo => $valor) {
            if (str_starts_with($norm, $prefijo)) {
                $estado = $valor;
                break;
            }
        }
        if (!$estado) {
            return null;
        }

        $medida = ['estado' => $estado];

        if (preg_match('/\b(\d+|' . $this->patronNumeros() . ') (anos?|mes|meses)\b/', $norm, $m)) {
            $medida['duracion'] = ['cantidad' => $this->numero($m[1]), 'unidad' => self::UNIDADES[$m[2]]];
        }
        if (preg_match('/desde\s+(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/iu', $campo, $m)) {
            $medida['desde'] = $this->fecha($m[1]);
        }
        if (preg_match('/hasta\s+(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/iu', $campo, $m)) {
            $medida['hasta'] = $this->fecha($m[1]);
        }
        if ($estado === 'CITADO' && ($dia = $this->fecha($campo))) {
            $hora = preg_match('/\b(\d{1,2})[:.](\d{2})\b/', $campo, $h) ? sprintf('%02d:%02d', $h[1], $h[2])
                : (preg_match('/\b(\d{1,2})\s*(?:hrs?|horas)\b/iu', $campo, $h) ? sprintf('%02d:00', $h[1]) : '19:00');
            $medida['fecha_citacion'] = "{$dia} {$hora}";
        }

        return $medida;
    }

    /**
     * "211 P", "art 211 letra p", "articulo 210 letra h", "207" -> "Art. 211 Letra P"
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

    /**
     * "13.262.615-4", "RUT 13262615-4" -> "13.262.615-4"
     */
    private function rut(string $campo): ?string
    {
        if (!preg_match('/^(?:rut:?\s*)?(\d{1,2})\.?(\d{3})\.?(\d{3})\s*-\s*([\dkK])$/iu', trim($campo), $m)) {
            return null;
        }

        return "{$m[1]}.{$m[2]}.{$m[3]}-" . strtoupper($m[4]);
    }

    /**
     * "$50.000", "50.000", "50000 pesos". Con $obligatorio, solo montos con signo $ o la palabra pesos.
     */
    private function monto(string $campo, bool $exigirSigno): ?int
    {
        $patron = $exigirSigno
            ? '/^(?:\$\s*(\d{1,3}(?:\.\d{3})+|\d{3,})|(\d{1,3}(?:\.\d{3})+|\d{3,})\s*pesos)$/iu'
            : '/^\$?\s*(\d{1,3}(?:\.\d{3})+|\d{4,})\s*(?:pesos)?$/iu';

        if (!preg_match($patron, trim($campo), $m)) {
            return null;
        }

        return (int) str_replace('.', '', $m[1] ?: ($m[2] ?? ''));
    }

    /**
     * Primera fecha dd-mm-aaaa del texto -> aaaa-mm-dd
     */
    private function fecha(string $texto): ?string
    {
        if (!preg_match('/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/', $texto, $f)) {
            return null;
        }
        $anio = strlen($f[3]) === 2 ? 2000 + (int) $f[3] : (int) $f[3];

        return checkdate((int) $f[2], (int) $f[1], $anio) ? sprintf('%04d-%02d-%02d', $anio, $f[2], $f[1]) : null;
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
