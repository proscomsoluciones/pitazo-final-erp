<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfiguracionAsociacion extends Model
{
    protected $table = 'configuracion_asociacion';

    protected $fillable = [
        'nombre',
        'rut',
        'ciudad',
        'direccion',
        'telefono',
        'correo',
        'sitio_web',
        'nombre_presidente',
        'nombre_secretario',
        'nombre_tesorero',
        'etica_integrante_1',
        'etica_integrante_2',
        'etica_integrante_3',
        'disciplina_presidente',
        'disciplina_secretario',
        'disciplina_integrante_3',
        'logo_path',
        'descripcion',
    ];

    /**
     * Obtiene la configuración activa (siempre hay un solo registro).
     */
    public static function instancia(): self
    {
        return static::firstOrCreate([], [
            'nombre' => 'Asociación de Fútbol',
        ]);
    }

    /**
     * URL pública del logo.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) return null;
        return asset('storage/' . $this->logo_path);
    }

    /**
     * Ruta absoluta del logo (para PDF).
     */
    public function getLogoAbsPathAttribute(): ?string
    {
        if (!$this->logo_path) return null;
        $path = storage_path('app/public/' . $this->logo_path);
        return file_exists($path) ? $path : null;
    }
}
