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
        Schema::create('nota_disciplinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campeonato_id')->constrained()->onDelete('cascade');
            $table->foreignId('fase_id')->constrained('fases')->onDelete('cascade');
            $table->integer('numero_fecha');
            $table->foreignId('club_id')->nullable()->constrained('clubes')->onDelete('cascade');
            $table->text('nota');
            $table->integer('monto')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nota_disciplinas');
    }
};
