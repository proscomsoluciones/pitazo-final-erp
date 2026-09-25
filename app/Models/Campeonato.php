<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campeonato extends Model
{
    protected $fillable = ['nombre', 'estado'];

    public function fases()
    {
        return $this->hasMany(Fase::class);
    }

    public function sanciones()
    {
        return $this->hasMany(Sancion::class);
    }
}
