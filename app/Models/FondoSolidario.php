<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FondoSolidario extends Model
{
    protected $table = 'fondo_solidarios';

    protected $fillable = [
        'campeonato_id',
        'fase_id',
        'numero_fecha',
        'club_id',
        'numero_fondo',
        'jugador_rut',
        'jugador_nombre',
        'diagnostico',
        'tipo_beneficio',
        'monto_asignado',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'numero_fondo' => 'integer',
            'monto_asignado' => 'integer',
        ];
    }

    public function campeonato(): BelongsTo
    {
        return $this->belongsTo(Campeonato::class);
    }

    public function fase(): BelongsTo
    {
        return $this->belongsTo(Fase::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
