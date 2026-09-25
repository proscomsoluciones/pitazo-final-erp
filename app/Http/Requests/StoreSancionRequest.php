<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSancionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('crear_sanciones');
    }

    public function rules(): array
    {
        return [
            'jugador_id' => 'nullable|exists:jugadores,id',
            'club_id' => 'required|exists:clubes,id',
            'articulo_reglamento' => 'required|string|max:255',
            'tipo_sancion' => 'required|in:PARTIDOS,TIEMPO',
            'cantidad_sancion' => 'required|integer|min:1',
            'unidad_tiempo' => 'required_if:tipo_sancion,TIEMPO|in:PARTIDOS,MESES,AÑOS',
            'fecha_resolucion' => 'required|date',
            'observacion' => 'nullable|string',
        ];
    }
}
