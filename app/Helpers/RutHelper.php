<?php

namespace App\Helpers;

class RutHelper
{
    /**
     * RUT provisorio de jugadores cargados sin RUT (ej: PENDIENTE-0240).
     */
    public static function esPendiente(?string $rut): bool
    {
        return $rut !== null && preg_match('/^PENDIENTE-\d+$/i', trim($rut)) === 1;
    }

    /**
     * Normaliza un RUT para guardarlo: XXXXXXXX-X sin puntos, o PENDIENTE-NNNN tal cual.
     */
    public static function normalizar(string $rut): string
    {
        if (self::esPendiente($rut)) {
            return strtoupper(trim($rut));
        }

        $rutLimpio = preg_replace('/[^kK0-9]/i', '', $rut);

        return strtoupper(substr($rutLimpio, 0, -1) . '-' . substr($rutLimpio, -1));
    }

    /**
     * Formatea un RUT chileno a su forma estándar con puntos y guion (ej: 11.111.111-1, 4.567.890-K).
     * Soporta RUTs menores a 5 millones (ej: 4.567.890-K) y mayores.
     *
     * @param string|null $rut
     * @return string
     */
    public static function format(?string $rut): string
    {
        if (empty($rut)) {
            return '';
        }

        // RUT provisorio (aun sin confirmar): mostrar tal cual, no intentar formatear.
        if (stripos($rut, 'PENDIENTE') === 0) {
            return $rut;
        }

        // Limpiar puntos, guiones y caracteres no válidos
        $clean = preg_replace('/[^0-9kK]/', '', $rut);
        if (strlen($clean) < 2) {
            return $rut;
        }

        $dv = strtoupper(substr($clean, -1));
        $number = substr($clean, 0, -1);

        if (!is_numeric($number)) {
            return $rut;
        }

        return number_format((int)$number, 0, '', '.') . '-' . $dv;
    }
}
