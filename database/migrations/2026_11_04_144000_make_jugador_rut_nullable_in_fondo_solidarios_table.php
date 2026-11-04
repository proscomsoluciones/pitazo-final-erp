<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE fondo_solidarios MODIFY COLUMN jugador_rut VARCHAR(255) NULL");
        }
    }

    public function down(): void
    {
        // No revertir para preservar registros sin RUT
    }
};

