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
        Schema::create('fondo_solidarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campeonato_id')->constrained()->onDelete('cascade');
            $table->foreignId('fase_id')->constrained('fases')->onDelete('cascade');
            $table->integer('numero_fecha');
            $table->foreignId('club_id')->constrained('clubes')->onDelete('cascade');
            $table->string('jugador_rut');
            $table->string('jugador_nombre');
            $table->text('diagnostico');
            $table->integer('monto_asignado')->nullable();
            $table->string('estado')->default('PENDIENTE');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fondo_solidarios');
    }
};
