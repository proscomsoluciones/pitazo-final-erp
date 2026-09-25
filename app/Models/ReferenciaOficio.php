<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferenciaOficio extends Model
{
    protected $table = 'referencias_oficio';
    protected $fillable = ['nombre', 'modulo', 'activa'];

    protected $casts = [
        'activa' => 'boolean',
    ];
}
