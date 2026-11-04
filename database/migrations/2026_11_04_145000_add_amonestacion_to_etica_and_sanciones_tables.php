<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE casos_etica MODIFY COLUMN tipo_oficio ENUM('INVESTIGACION', 'CITACION', 'INHABILITACION', 'AMONESTACION', 'RESOLUCION') NOT NULL DEFAULT 'INVESTIGACION'");
            DB::statement("ALTER TABLE casos_etica MODIFY COLUMN estado ENUM('EN_INVESTIGACION', 'CITADO', 'INHABILITADO', 'AMONESTADO', 'RESUELTO', 'ARCHIVADO') NOT NULL DEFAULT 'EN_INVESTIGACION'");

            DB::statement("ALTER TABLE sanciones MODIFY COLUMN tipo_sancion ENUM('PARTIDOS', 'TIEMPO', 'AMONESTACION') NOT NULL");
            DB::statement("ALTER TABLE sanciones MODIFY COLUMN unidad_tiempo ENUM('PARTIDOS', 'MESES', 'AÑOS', 'AMONESTACION') NOT NULL");
        }
    }

    public function down(): void
    {
        // Preservar registros de amonestación
    }
};

