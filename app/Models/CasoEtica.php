<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CasoEtica extends Model
{
    use HasFactory;

    protected $table = 'casos_etica';

    protected $fillable = [
        'folio',
        'tipo_oficio',
        'club_id',
        'jugador_id',
        'nombre_involucrado',
        'rut_involucrado',
        'articulo_reglamento',
        'tipo_involucrado',
        'campeonato_id',
        'fase_id',
        'numero_fecha',
        'asunto',
        'descripcion',
        'fecha_citacion',
        'lugar_citacion',
        'fecha_inicio_inhabilitacion',
        'fecha_fin_inhabilitacion',
        'estado',
        'detalles_resolucion',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_citacion' => 'datetime',
            'fecha_inicio_inhabilitacion' => 'date',
            'fecha_fin_inhabilitacion' => 'date',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_id');
    }

    public function jugador(): BelongsTo
    {
        return $this->belongsTo(Jugador::class, 'jugador_id');
    }

    public function campeonato(): BelongsTo
    {
        return $this->belongsTo(Campeonato::class, 'campeonato_id');
    }

    public function fase(): BelongsTo
    {
        return $this->belongsTo(Fase::class, 'fase_id');
    }
}
