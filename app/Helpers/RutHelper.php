<?php

namespace App\Helpers;

class RutHelper
{
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
