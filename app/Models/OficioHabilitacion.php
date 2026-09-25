<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OficioHabilitacion extends Model
{
    protected $table = 'oficios_habilitacion';

    protected $fillable = [
        'sancion_id',
        'folio',
        'fecha_emision',
        'pdf_path',
    ];

    protected function casts(): array
    {
        return [
            'fecha_emision' => 'date',
        ];
    }

    public function sancion(): BelongsTo
    {
        return $this->belongsTo(Sancion::class);
    }
}
