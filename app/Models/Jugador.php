<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jugador extends Model
{
    protected $table = 'jugadores';
    protected $fillable = ['rut', 'nombre', 'club_id'];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function getRutFormateadoAttribute()
    {
        return \App\Helpers\RutHelper::format($this->rut);
    }
}
