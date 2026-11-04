<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ampliar tipo_involucrado en casos_etica para permitir 'TURNO' (además de JUGADOR, DIRIGENTE, CLUB)
        DB::statement("ALTER TABLE casos_etica MODIFY COLUMN tipo_involucrado VARCHAR(50) NOT NULL DEFAULT 'JUGADOR'");

        // 2. Agregar soporte de tipo_involucrado (JUGADOR, TURNO, DIRIGENTE, CLUB) y datos en sanciones (Tribunal)
        Schema::table('sanciones', function (Blueprint $table) {
            if (!Schema::hasColumn('sanciones', 'tipo_involucrado')) {
                $table->string('tipo_involucrado', 50)->default('JUGADOR')->after('club_id');
            }
            if (!Schema::hasColumn('sanciones', 'nombre_involucrado')) {
                $table->string('nombre_involucrado')->nullable()->after('tipo_involucrado');
            }
            if (!Schema::hasColumn('sanciones', 'rut_involucrado')) {
                $table->string('rut_involucrado', 20)->nullable()->after('nombre_involucrado');
            }
        });

        // Permitir club_id nullable en sanciones (cuando se sanciona a un Turno sin club asociado)
        DB::statement("ALTER TABLE sanciones MODIFY COLUMN club_id BIGINT UNSIGNED NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sanciones', function (Blueprint $table) {
            $cols = array_filter(
                ['tipo_involucrado', 'nombre_involucrado', 'rut_involucrado'],
                fn ($c) => Schema::hasColumn('sanciones', $c)
            );
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};

