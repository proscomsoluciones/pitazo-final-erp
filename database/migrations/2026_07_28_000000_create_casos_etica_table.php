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
        Schema::create('casos_etica', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->enum('tipo_oficio', ['INVESTIGACION', 'CITACION', 'INHABILITACION', 'RESOLUCION'])->default('INVESTIGACION');
            
            $table->foreignId('club_id')->nullable()->constrained('clubes')->nullOnDelete();
            $table->foreignId('jugador_id')->nullable()->constrained('jugadores')->nullOnDelete();
            $table->string('nombre_involucrado')->nullable();
            $table->string('rut_involucrado')->nullable();
            
            $table->foreignId('campeonato_id')->nullable()->constrained('campeonatos')->nullOnDelete();
            $table->foreignId('fase_id')->nullable()->constrained('fases')->nullOnDelete();
            $table->integer('numero_fecha')->nullable();
            
            $table->string('asunto');
            $table->text('descripcion')->nullable();
            
            // Citación
            $table->datetime('fecha_citacion')->nullable();
            $table->string('lugar_citacion')->nullable();
            
            // Inhabilitación
            $table->date('fecha_inicio_inhabilitacion')->nullable();
            $table->date('fecha_fin_inhabilitacion')->nullable();
            
            // Estado y Resolución
            $table->enum('estado', ['EN_INVESTIGACION', 'CITADO', 'INHABILITADO', 'RESUELTO', 'ARCHIVADO'])->default('EN_INVESTIGACION');
            $table->text('detalles_resolucion')->nullable();
            $table->text('observaciones')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('casos_etica');
    }
};
