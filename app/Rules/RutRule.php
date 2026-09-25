<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RutRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$this->validaRut($value)) {
            $fail('El RUT ingresado no es válido.');
        }
    }

    private function validaRut($rut)
    {
        $rut = preg_replace('/[^kK0-9]/i', '', $rut);
        if (strlen($rut) < 8) {
            return false;
        }
        $dv  = substr($rut, -1);
        $numero = substr($rut, 0, strlen($rut) - 1);
        $i = 2;
        $suma = 0;
        foreach (array_reverse(str_split($numero)) as $v) {
            if ($i == 8) {
                $i = 2;
            }
            $suma += $v * $i;
            ++$i;
        }
        $dvr = 11 - ($suma % 11);
        
        if ($dvr == 11) {
            $dvr = 0;
        }
        if ($dvr == 10) {
            $dvr = 'K';
        }
        
        if (strtoupper($dv) == strtoupper((string)$dvr)) {
            return true;
        }

        return false;
    }
}
