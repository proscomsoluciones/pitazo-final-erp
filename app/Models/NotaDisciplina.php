<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotaDisciplina extends Model
{
    use HasFactory;

    protected $fillable = [
        'campeonato_id',
        'fase_id',
        'numero_fecha',
        'club_id',
        'nota',
        'monto',
    ];

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class);
    }

    public function fase()
    {
        return $this->belongsTo(Fase::class);
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
