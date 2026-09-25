<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fase extends Model
{
    protected $fillable = ['campeonato_id', 'nombre', 'cantidad_fechas'];

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class);
    }

    public function sanciones()
    {
        return $this->hasMany(Sancion::class);
    }
}
