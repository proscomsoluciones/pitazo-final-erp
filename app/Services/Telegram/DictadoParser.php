<?php

namespace App\Services\Telegram;

use Illuminate\Support\Str;

/**
 * Interpreta el texto dictado o escrito en Telegram, sin consultar la base de datos.
 * Una línea por registro, campos separados por coma.
 *
 * Disciplina:
 *   Campeonato oficial 2026, Clausura, fecha 1, 1 de noviembre    (contexto, opcional; también "Fecha 1 Clausura 01-11-2026")
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
        'diez' => 10, 'once' => 11, 'doce' => 12, 'trece' => 13, 'catorce' => 14, 'quince' => 15,
    ];

    // Como se escribe en el libro: "1ª Fecha", "13ava Fecha", o leído: "primera fecha"
    private const ORDINALES = [
        'primera' => 1, 'primer' => 1, 'primero' => 1, 'segunda' => 2, 'tercera' => 3, 'cuarta' => 4,
        'quinta' => 5, 'sexta' => 6, 'septima' => 7, 'setima' => 7, 'octava' => 8, 'novena' => 9, 'decima' => 10,
        'undecima' => 11, 'decimo primera' => 11, 'decima primera' => 11, 'decimoprimera' => 11,
        'duodecima' => 12, 'decimo segunda' => 12, 'decima segunda' => 12, 'decimosegunda' => 12,
        'decimo tercera' => 13, 'decima tercera' => 13, 'decimotercera' => 13,
    ];

    private const MESES = [
        'enero' => 1, 'febrero' => 2, 'marzo' => 3, 'abril' => 4, 'mayo' => 5, 'junio' => 6, 'julio' => 7,
        'agosto' => 8, 'septiembre' => 9, 'setiembre' => 9, 'octubre' => 10, 'noviembre' => 11, 'diciembre' => 12,
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
        $lineas = preg_split('/\R/u', trim(self::saltosDictados($texto))) ?: [];
        $primera = $lineas[0] ?? '';

        if ($modulo = self::ENCABEZADOS[self::normalizar($primera)] ?? null) {
            return [$modulo, trim(implode("\n", array_slice($lineas, 1)))];
        }

        // Dictado en una sola línea: "Disciplina, campeonato ..." o leído sin coma: "Disciplina primera fecha ..."
        [$encabezado, $resto] = array_pad(explode(',', $primera, 2), 2, '');
        if ($modulo = self::ENCABEZADOS[self::normalizar($encabezado)] ?? null) {
            $lineas[0] = trim($resto);
            return [$modulo, trim(implode("\n", $lineas))];
        }
        foreach (self::ENCABEZADOS as $nombre => $modulo) {
            $patron = '/^\s*' . str_replace(['etica', ' '], ['[ée]tica', '\s+'], $nombre) . '\b[\s.:;-]+/iu';
            if (preg_match($patron, $primera, $m)) {
                $lineas[0] = trim(substr($primera, strlen($m[0])));
                return [$modulo, trim(implode("\n", $lineas))];
            }
        }

        return [null, $texto];
    }

    /**
     * El teclado a veces escribe literalmente "nueva línea" / "línea nueva" / "punto y aparte"
     * en vez de hacer el salto: se convierten en saltos de línea reales.
     */
    private static function saltosDictados(string $texto): string
    {
        return preg_replace('/\s*,?\s*\b(nueva l[ií]nea|l[ií]nea nueva|siguiente l[ií]nea|punto y aparte|salto de l[ií]nea)\b\s*[,.]?\s*/iu', "\n", $texto);
    }

    /**
     * Arreglos de dictado dentro de una línea, antes de separar por comas.
     */
    private function corregirDictado(string $linea): string
    {
        // "2026" dictado como "20, 26"
        $linea = preg_replace('/\b(20),?\s+(\d{2})\b/', '$1$2', $linea);
        // Montos con coma de miles: "50,000" o "50, 000" -> "50.000" (no "Fondo 32, 100%")
        $linea = preg_replace('/(?<=\b\d|\b\d\d|\b\d\d\d),\s?(?=\d{3}(?![\d%]))/u', '.', $linea);

        return $linea;
    }

    /**
     * Lectura corrida del libro, sin decir "coma":
     *   "primera fecha campeonato clausura 2026 domingo 1 de noviembre Unión 28 de Marzo Gustavo Aguilera Aracena
     *    artículo 211 letra N faltas reiteradas 1 partido San Carlos ..."
     * Se marcan como campos propios lo que tiene forma reconocible (fecha, día, artículo, sanción, RUT, %, días,
     * montos, multa/nota/fondo) y el texto libre que queda se corta donde empieza un club ($largoClub).
     */
    private function insertarComas(string $linea, callable $largoClub): string
    {
        [$a, $z] = ['(?<![\p{L}\p{N}])', '(?![\p{L}\p{N}])'];
        $num = '(?:\d+|' . $this->patronNumeros() . ')';
        $ordinales = implode('|', array_map(fn ($o) => str_replace(' ', '\s?', $o), array_keys(self::ORDINALES)));
        $patrones = [
            // N° de fecha y día
            "/{$a}(?:fecha\s+(?:\d+|" . $this->patronNumeros() . "|{$ordinales})|\d{1,2}\s*(?:ª|º|a|ava|va|ra|era|da|ta|na|ma)\s+fecha|(?:{$ordinales})\s+fecha){$z}/iu",
            // (no el "28 de Marzo" de "Unión 28 de Marzo")
            "/(?<!uni[oó]n\s)(?<!u\.\s)(?<!u\s){$a}\d{1,2}\s+de\s+(?:" . implode('|', array_keys(self::MESES)) . ")(?:\s+del?\s+\d{4})?{$z}/iu",
            "/{$a}\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}{$z}/u",
            // Artículo ("artículo 211 letra N", "211 N", "dos 10 H") y sanción ("1+1 partidos R", "6 meses")
            "/{$a}(?:art(?:[íi]culo)?\.?\s*)?(?:\d{3}|dos\s+\d{2})\s*(?:letra\s+)?[a-zñ]{$z}/iu",
            "/{$a}{$num}(?:\s*(?:\+|m[aá]s)\s*{$num})?\s+(?:partidos?|fechas?|mes(?:es)?|a[ñn]os?){$z}(?:\s+(?:r|erre|reincidencia|reincidente){$z})?/iu",
            // Sanción de amonestación ("doble amonestación" es un motivo, y "carta de amonestación" una nota)
            "/{$a}amonestaci[oó]n\s+escrita{$z}/iu",
            // Datos de fondos y multas
            "/{$a}(?:rut\s*)?\d{1,2}\.?\d{3}\.?\d{3}\s*-\s*[\dk]{$z}/iu",
            "/{$a}\d{2,3}\s*(?:%|por\s*ciento){$z}/iu",
            "/{$a}(?:fractura\s*)?\d{1,3}\s+d[ií]a[sz]?{$z}|{$a}fractura{$z}/iu",
            "/\\$\s*\d{1,3}(?:\.\d{3})+|{$a}\d{1,3}(?:\.\d{3})+(?:\s*pesos)?{$z}/iu",
            "/{$a}(?:multa|nota|fondo(?:\s+solidario)?(?:\s+n[°º.]?\s*\d+|\s+\d+)?){$z}/iu",
        ];

        // Tramos reconocidos, sin superposición (gana el que empieza antes y, a igual inicio, el más largo)
        $tramos = [];
        foreach ($patrones as $patron) {
            preg_match_all($patron, $linea, $coincidencias, PREG_OFFSET_CAPTURE);
            foreach ($coincidencias[0] as [$texto, $inicio]) {
                $tramos[] = [$inicio, strlen($texto)];
            }
        }
        usort($tramos, fn ($x, $y) => [$x[0], -$x[1]] <=> [$y[0], -$y[1]]);

        $campos = [];
        $libreDesde = 0;
        foreach ($tramos as [$inicio, $largo]) {
            if ($inicio < $libreDesde) {
                continue;
            }
            array_push($campos, ...$this->separarClubes(substr($linea, $libreDesde, $inicio - $libreDesde), $largoClub));
            $campos[] = trim(substr($linea, $inicio, $largo));
            $libreDesde = $inicio + $largo;
        }
        array_push($campos, ...$this->separarClubes(substr($linea, $libreDesde), $largoClub));

        return implode(', ', $campos);
    }

    /**
     * Texto libre -> campos, cortando donde empieza un club: "Unión 28 de Marzo Gustavo Aguilera" -> ["Unión 28 de Marzo", "Gustavo Aguilera"].
     * Las cartas ("carta de amonestación al Sr. ...") conservan su texto como un solo campo inicial.
     */
    private function separarClubes(string $texto, callable $largoClub): array
    {
        $palabras = preg_split('/\s+/u', trim($texto, " \t.,;:")) ?: [];
        $palabras = array_values(array_filter($palabras, fn ($p) => $p !== ''));
        $campos = [];
        $actual = [];

        for ($i = 0; $i < count($palabras);) {
            $k = $largoClub(implode(' ', array_slice($palabras, $i, 6)));
            if ($k) {
                if ($actual) {
                    $campos[] = implode(' ', $actual);
                    $actual = [];
                }
                $campos[] = implode(' ', array_slice($palabras, $i, $k));
                $i += $k;
                continue;
            }
            $actual[] = $palabras[$i++];
        }
        if ($actual) {
            $campos[] = implode(' ', $actual);
        }

        return $campos;
    }

    /**
     * "artículo 211, letra P": la letra dictada como campo aparte se une al artículo.
     */
    private function unirLetraDelArticulo(array $campos): array
    {
        $resultado = [];
        foreach ($campos as $campo) {
            $anterior = end($resultado);
            if ($anterior !== false && preg_match('/^letra [a-z]$/', self::normalizar($campo))
                && ($articulo = $this->articulo(self::normalizar($anterior))) && !str_contains($articulo, 'Letra')) {
                $resultado[array_key_last($resultado)] = "{$anterior} {$campo}";
                continue;
            }
            $resultado[] = $campo;
        }

        return $resultado;
    }

    /**
     * @param callable|null $esClub    fn(string $campo): bool — separa registros dictados en una sola línea
     * @param callable|null $largoClub fn(string $texto): ?int — cuántas palabras iniciales del texto son un club;
     *                                 permite leer el libro de corrido, sin comas
     * @return array{contexto: array, items: array<int, array>}
     */
    public function parse(string $texto, string $modulo = self::DISCIPLINA, ?callable $esClub = null, ?callable $largoClub = null): array
    {
        $contexto = [];
        $items = [];

        foreach ($this->segmentar($texto, $modulo, $esClub ?? fn () => false, $largoClub) as $linea) {
            $norm = self::normalizar($linea);

            // "Campeonato oficial 2026, Clausura, fecha 2, 8 de noviembre" o "Fecha 2 Clausura 08-11-2026"
            if ($this->esContexto($norm)) {
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

    /**
     * El dictado del celular suele llegar en una sola línea. Se separa en:
     *  - el contexto del inicio (campeonato, fase, "fecha N", día), hasta el primer club;
     *  - un registro por sanción: termina en "1 partido" (más la R si viene), o antes de "Multa/Nota/Carta/Fondo".
     *
     * @return string[] una línea por registro
     */
    private function segmentar(string $texto, string $modulo, callable $esClub, ?callable $largoClub): array
    {
        $resultado = [];

        foreach (preg_split('/\R+/u', self::saltosDictados($texto)) ?: [] as $linea) {
            $linea = trim($this->corregirDictado($linea), " \t.-•*");
            // Leído de corrido, sin decir "coma"
            if ($largoClub && $modulo === self::DISCIPLINA && !str_contains($linea, ',')) {
                $linea = $this->insertarComas($linea, $largoClub);
            }
            $campos = $this->unirLetraDelArticulo($this->campos($linea));
            if (!$campos) {
                continue;
            }

            $iContexto = null;
            foreach ($campos as $i => $campo) {
                if ($this->esContexto(self::normalizar($campo))) {
                    $iContexto = $i;
                }
            }
            if ($iContexto !== null) {
                $fin = count($campos);
                for ($j = $iContexto + 1; $j < count($campos); $j++) {
                    if ($this->esInicioNota($campos[$j]) || str_starts_with(self::normalizar($campos[$j]), 'fondo') || ($esClub($campos[$j]) && !$this->esContexto(self::normalizar($campos[$j])))) {
                        $fin = $j;
                        break;
                    }
                }
                $resultado[] = implode(', ', array_slice($campos, 0, $fin));
                $campos = array_slice($campos, $fin);
            }

            if ($modulo === self::ETICA) {
                if ($campos) {
                    $resultado[] = implode(', ', $campos);
                }
                continue;
            }

            $actual = [];
            for ($k = 0; $k < count($campos); $k++) {
                $campo = $campos[$k];
                $enNota = $actual && ($this->esInicioNota($actual[0]) || str_starts_with(self::normalizar($actual[0]), 'fondo'));

                // Nueva multa/nota/fondo, un club después de una multa ya completa, o un club después del
                // artículo de una sanción a la que le faltó la cantidad (fila del libro sin "1 partido")
                $conArticulo = (bool) array_filter($actual, fn ($c) => $this->articulo(self::normalizar($c)));
                if ($actual && ($this->esInicioNota($campo) || str_starts_with(self::normalizar($campo), 'fondo')
                        || ($enNota && count($actual) >= 3 && $esClub($campo))
                        || (!$enNota && $conArticulo && $esClub($campo)))) {
                    $resultado[] = implode(', ', $actual);
                    $actual = [];
                    $enNota = false;
                }

                $actual[] = $campo;

                if (!$enNota && !$this->esInicioNota($actual[0]) && $this->sancion(self::normalizar($campo, '+'))) {
                    // La R, o el artículo si se dijo después de la sanción, siguen siendo parte de este registro
                    while (isset($campos[$k + 1])) {
                        $siguiente = self::normalizar($campos[$k + 1]);
                        $tieneArticulo = (bool) array_filter($actual, fn ($c) => $this->articulo(self::normalizar($c)));
                        if (!in_array($siguiente, ['r', 'reincidencia', 'reincidente', 'reincide'], true)
                            && ($tieneArticulo || !$this->articulo($siguiente))) {
                            break;
                        }
                        $actual[] = $campos[++$k];
                    }
                    $resultado[] = implode(', ', $actual);
                    $actual = [];
                }
            }
            if ($actual) {
                $resultado[] = implode(', ', $actual);
            }
        }

        return $resultado;
    }

    private function esContexto(string $norm): bool
    {
        return preg_match('/^(campeonato|liguilla|torneo)\b/', $norm) === 1 || $this->numeroDeFecha($norm) !== null;
    }

    /**
     * "fecha 2", "fecha dos", "1a fecha" (1ª), "13ava fecha", "primera fecha", "decimo tercera fecha"
     *
     * @return array{0: int, 1: string}|null número y texto encontrado
     */
    private function numeroDeFecha(string $norm): ?array
    {
        $ordinales = implode('|', array_map(fn ($o) => str_replace(' ', '\s?', $o), array_keys(self::ORDINALES)));
        $patrones = [
            '/\bfecha (\d+|' . $this->patronNumeros() . '|' . $ordinales . ')\b/',
            '/\b(\d{1,2})(?:a|ava|va|ra|era|da|ta|na|ma) fecha\b/', // el sufijo distingue "1a fecha" de "1 fecha" (sanción)
            '/\b(' . $ordinales . ') fecha\b/',
        ];

        foreach ($patrones as $patron) {
            if (preg_match($patron, $norm, $m)) {
                $valor = preg_replace('/\s+/', ' ', $m[1]);
                $ordinal = self::ORDINALES[$valor] ?? self::ORDINALES[str_replace(' ', '', $valor)] ?? null;

                return [$ordinal ?? $this->numero($valor), $m[0]];
            }
        }

        return null;
    }

    private function esInicioNota(string $campo): bool
    {
        return preg_match('/^(multa|nota|carta)\b/', self::normalizar($campo)) === 1;
    }

    private function parseContexto(string $linea, string $norm): array
    {
        $contexto = [];
        $numeroFecha = $this->numeroDeFecha($norm);

        if ($numeroFecha) {
            $contexto['numero_fecha'] = $numeroFecha[0];
        }
        if ($fecha = $this->fecha($linea)) {
            $contexto['fecha_resolucion'] = $fecha;
        }

        // Lo que queda (campeonato y/o fase) se busca después en la base
        $resto = self::normalizar(preg_replace('/\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/', ' ', $linea));
        $resto = preg_replace('/\b\d{1,2} de (' . implode('|', array_keys(self::MESES)) . ')( del? \d{4})?\b/', ' ', $resto);
        if ($numeroFecha) {
            $resto = str_replace($numeroFecha[1], ' ', $resto);
        }
        $resto = trim(preg_replace('/\s+/', ' ', $resto));
        if ($resto !== '') {
            $contexto['torneo_texto'] = $resto;
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

        // Campos libres antes del primer dato (RUT, %, días, monto) y después
        $antes = [];
        $despues = [];
        $dias = '/(\d{1,3}) (?:dias?|diaz)\b/'; // el dictado suele escribir "días" como "Díaz"
        foreach ($campos as $campo) {
            $norm = self::normalizar($campo);
            $esDato = true;

            if ($item['numero_fondo'] === null && !$antes && preg_match('/^(?:n\s*[°º.]?|nro\.?|n[uú]mero)?\s*(\d{1,4})$/iu', $campo, $m)) {
                $item['numero_fondo'] = (int) $m[1];
                continue;
            } elseif ($item['rut'] === null && ($rut = $this->rut($campo))) {
                $item['rut'] = $rut;
            } elseif ($item['porcentaje'] === null && preg_match('/^(\d{2,3})\s*(?:%|por\s*ciento)$/iu', $campo, $m)) {
                $item['porcentaje'] = (int) $m[1];
            } elseif (str_contains($norm, 'fractura') || preg_match('/^' . trim($dias, '/') . '/', $norm)) {
                $item['fractura'] = $item['fractura'] || str_contains($norm, 'fractura');
                if (preg_match($dias, $norm, $m)) {
                    $item['dias'] = (int) $m[1];
                }
            } elseif ($item['monto'] === null && ($monto = $this->monto($campo, true))) {
                $item['monto'] = $monto;
            } else {
                $esDato = false;
            }

            if (!$esDato) {
                if ($item['rut'] || $item['porcentaje'] || $item['dias'] || $item['fractura'] || $item['monto']) {
                    $despues[] = $campo;
                } else {
                    $antes[] = $campo;
                }
            }
        }

        // club, jugador (aunque el dictado le haya puesto comas: "Julio, Astete, Valenzuela"), datos, detalle
        if (count($antes) >= 2) {
            $item['club_texto'] = $antes[0];
            $item['jugador_texto'] = implode(' ', array_slice($antes, 1));
            $extra = Str::ucfirst(implode(', ', $despues));
        } else {
            // Datos dictados antes del club ("Fondo 32, 100%, Alianza, Julio Astete"): se toman en orden
            $libres = array_merge($antes, $despues);
            $item['club_texto'] = $libres[0] ?? null;
            $item['jugador_texto'] = $libres[1] ?? null;
            $extra = Str::ucfirst(implode(', ', array_slice($libres, 2)));
        }

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

        // Campos libres antes y después del artículo
        $antes = [];
        $despues = [];
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

            if ($item['articulo'] === null) {
                $antes[] = $campo;
            } else {
                $despues[] = $campo;
            }
        }

        if ($item['articulo'] !== null && count($antes) >= 2) {
            // club, jugador (aunque el dictado le haya puesto comas: "Javier, Vera Llano"), artículo, motivo
            $item['club_texto'] = $antes[0];
            $item['jugador_texto'] = implode(' ', array_slice($antes, 1));
            $item['tipo_falta'] = Str::ucfirst(implode(', ', $despues)) ?: null;
        } else {
            $resto = array_merge($antes, $despues);
            $item['club_texto'] = $resto[0] ?? null;
            $item['jugador_texto'] = $resto[1] ?? null;
            $item['tipo_falta'] = count($resto) > 2 ? Str::ucfirst(implode(', ', array_slice($resto, 2))) : null;
        }

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
        // "doscientos diez" dictado como "dos 10" -> 210
        $norm = preg_replace('/^((?:art(?:iculo)?\s*)?)(?:dos|2)\s+(\d{2})\b/', '${1}2$2', $norm);

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
     * Primera fecha del texto -> aaaa-mm-dd. Acepta "08-11-2026" y "8 de noviembre (de 2026)";
     * sin año, se asume el año en curso.
     */
    private function fecha(string $texto): ?string
    {
        if (preg_match('/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/', $texto, $f)) {
            [$dia, $mes, $anio] = [(int) $f[1], (int) $f[2], strlen($f[3]) === 2 ? 2000 + (int) $f[3] : (int) $f[3]];
        } elseif (preg_match('/\b(\d{1,2}) de (' . implode('|', array_keys(self::MESES)) . ')(?: del? (\d{4}))?\b/', self::normalizar($texto), $f)) {
            [$dia, $mes, $anio] = [(int) $f[1], self::MESES[$f[2]], isset($f[3]) ? (int) $f[3] : (int) date('Y')];
        } else {
            return null;
        }

        return checkdate($mes, $dia, $anio) ? sprintf('%04d-%02d-%02d', $anio, $mes, $dia) : null;
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
