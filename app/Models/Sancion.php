<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sancion extends Model
{
    protected $table = 'sanciones';

    protected $fillable = [
        'campeonato_id',
        'fase_id',
        'numero_fecha',
        'jugador_id',
        'club_id',
        'articulo_reglamento',
        'tipo_falta',
        'tipo_sancion',
        'cantidad_sancion',
        'unidad_tiempo',
        'fecha_resolucion',
        'partidos_cumplidos',
        'fecha_termino_cronologica',
        'estado',
        'observacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_resolucion' => 'date',
            'fecha_termino_cronologica' => 'date',
        ];
    }

    public function jugador(): BelongsTo
    {
        return $this->belongsTo(Jugador::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function oficioHabilitacion()
    {
        return $this->hasOne(OficioHabilitacion::class);
    }

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class);
    }

    public function fase()
    {
        return $this->belongsTo(Fase::class);
    }

    /**
     * Descripcion del articulo/motivo para mostrar en oficios (fallback generico si no hay tipo_falta).
     */
    public function getTipoInfraccionAttribute(): string
    {
        return $this->tipo_falta ?: 'Infracción reglamentaria';
    }

    /**
     * Nombre de la unidad de tiempo en singular o plural segun cantidad_sancion
     * (ej: "1 Año" / "4 Años", "1 Partido" / "2 Partidos").
     */
    public function getUnidadTiempoTextoAttribute(): string
    {
        $singular = ['PARTIDOS' => 'Partido', 'MESES' => 'Mes', 'AÑOS' => 'Año'];
        $plural   = ['PARTIDOS' => 'Partidos', 'MESES' => 'Meses', 'AÑOS' => 'Años'];

        $mapa = $this->cantidad_sancion == 1 ? $singular : $plural;

        return $mapa[$this->unidad_tiempo] ?? $this->unidad_tiempo;
    }

    /**
     * Texto legible de la sancion (ej: "4+1 Partidos (Reincidencia)" o "1 Año") para oficios y actas.
     */
    public function getSancionTextoAttribute(): string
    {
        $unidad = $this->unidad_tiempo_texto;
        $esReincidente = $this->observacion && str_contains($this->observacion, 'Reincidencia');

        if ($esReincidente && $this->cantidad_sancion > 1) {
            return ($this->cantidad_sancion - 1) . '+1 ' . $unidad . ' (Reincidencia)';
        }

        return $this->cantidad_sancion . ' ' . $unidad;
    }
}
