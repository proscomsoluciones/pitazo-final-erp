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
        // First drop old ones
        Schema::table('sanciones', function (Blueprint $table) {
            $table->dropColumn(['campeonato', 'fase', 'fecha_campeonato']);
        });

        // Add new relations
        Schema::table('sanciones', function (Blueprint $table) {
            $table->foreignId('campeonato_id')->nullable()->after('id')->constrained('campeonatos')->onDelete('set null');
            $table->foreignId('fase_id')->nullable()->after('campeonato_id')->constrained('fases')->onDelete('set null');
            $table->integer('numero_fecha')->nullable()->after('fase_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sanciones', function (Blueprint $table) {
            $table->dropForeign(['campeonato_id']);
            $table->dropForeign(['fase_id']);
            $table->dropColumn(['campeonato_id', 'fase_id', 'numero_fecha']);
            
            $table->string('campeonato')->nullable();
            $table->string('fase')->nullable();
            $table->string('fecha_campeonato')->nullable();
        });
    }
};
