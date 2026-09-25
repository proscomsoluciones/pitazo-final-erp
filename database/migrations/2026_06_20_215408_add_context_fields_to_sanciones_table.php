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
        Schema::table('sanciones', function (Blueprint $table) {
            $table->string('campeonato')->nullable()->after('id');
            $table->string('fase')->nullable()->after('campeonato');
            $table->string('fecha_campeonato')->nullable()->after('fase');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sanciones', function (Blueprint $table) {
            $table->dropColumn(['campeonato', 'fase', 'fecha_campeonato']);
        });
    }
};
