<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuracion_asociacion', function (Blueprint $table) {
            $table->string('rut')->nullable()->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('configuracion_asociacion', function (Blueprint $table) {
            $table->dropColumn('rut');
        });
    }
};
