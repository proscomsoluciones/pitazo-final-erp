<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramBorrador extends Model
{
    protected $table = 'telegram_borradores';

    protected $fillable = [
        'telegram_chat_id',
        'telegram_user_id',
        'telegram_usuario',
        'texto_original',
        'items',
        'campeonato_id',
        'fase_id',
        'numero_fecha',
        'fecha_resolucion',
        'estado',
        'resultado',
        'revisado_por',
        'revisado_at',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'resultado' => 'array',
            'fecha_resolucion' => 'date',
            'revisado_at' => 'datetime',
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

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revisado_por');
    }
}
