<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Texto de la resolución del Comité de Disciplina y fecha desde la que el sancionado queda habilitado
     * (fase + número de fecha, porque una sanción por partidos puede terminar de cumplirse en la fase siguiente).
     */
    public function up(): void
    {
        Schema::table('sanciones', function (Blueprint $table) {
            $table->text('resolucion_texto')->nullable()->after('observacion');
            $table->foreignId('habilitado_fase_id')->nullable()->after('resolucion_texto')->constrained('fases')->nullOnDelete();
            $table->unsignedSmallInteger('habilitado_numero_fecha')->nullable()->after('habilitado_fase_id');
        });
    }

    public function down(): void
    {
        Schema::table('sanciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('habilitado_fase_id');
            $table->dropColumn(['resolucion_texto', 'habilitado_numero_fecha']);
        });
    }
};
