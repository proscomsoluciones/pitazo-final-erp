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
        Schema::table('jugadores', function (Blueprint $table) {
            $table->string('rut')->nullable()->after('id');
            $table->foreignId('club_id')->nullable()->after('nombre')->constrained('clubes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jugadores', function (Blueprint $table) {
            $table->dropForeign(['club_id']);
            $table->dropColumn(['rut', 'club_id']);
        });
    }
};
