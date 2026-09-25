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
        Schema::create('sanciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jugador_id')->nullable()->constrained('jugadores')->nullOnDelete();
            $table->foreignId('club_id')->constrained('clubes')->cascadeOnDelete();
            $table->string('articulo_reglamento');
            $table->enum('tipo_sancion', ['PARTIDOS', 'TIEMPO']);
            $table->integer('cantidad_sancion');
            $table->enum('unidad_tiempo', ['PARTIDOS', 'MESES', 'AÑOS']);
            $table->date('fecha_resolucion');
            $table->integer('partidos_cumplidos')->default(0);
            $table->date('fecha_termino_cronologica')->nullable();
            $table->enum('estado', ['ACTIVO', 'CUMPLIDO'])->default('ACTIVO');
            $table->text('observacion')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sanciones');
    }
};
