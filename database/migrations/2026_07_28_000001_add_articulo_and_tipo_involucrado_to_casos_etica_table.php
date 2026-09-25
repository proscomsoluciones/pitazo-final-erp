<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('casos_etica', function (Blueprint $table) {
            $table->string('articulo_reglamento')->nullable()->after('rut_involucrado');
            $table->enum('tipo_involucrado', ['JUGADOR', 'DIRIGENTE', 'CLUB'])->default('JUGADOR')->after('articulo_reglamento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('casos_etica', function (Blueprint $table) {
            $table->dropColumn(['articulo_reglamento', 'tipo_involucrado']);
        });
    }
};
