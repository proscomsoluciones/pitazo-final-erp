<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_borradores', function (Blueprint $table) {
            $table->id();

            // Origen del mensaje en Telegram
            $table->string('telegram_chat_id');
            $table->string('telegram_user_id');
            $table->string('telegram_usuario')->nullable();
            $table->text('texto_original');

            // Sanciones y notas interpretadas (se editan antes de aprobar)
            $table->json('items');

            // Contexto sugerido por el dictado; se confirma al aprobar
            $table->foreignId('campeonato_id')->nullable()->constrained('campeonatos')->nullOnDelete();
            $table->foreignId('fase_id')->nullable()->constrained('fases')->nullOnDelete();
            $table->integer('numero_fecha')->nullable();
            $table->date('fecha_resolucion')->nullable();

            $table->string('estado', 20)->default('PENDIENTE'); // PENDIENTE, APROBADO, DESCARTADO
            $table->json('resultado')->nullable();
            $table->foreignId('revisado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisado_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_borradores');
    }
};
