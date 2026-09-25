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
        Schema::table('fondo_solidarios', function (Blueprint $table) {
            $table->unsignedInteger('numero_fondo')->nullable()->after('club_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fondo_solidarios', function (Blueprint $table) {
            $table->dropColumn('numero_fondo');
        });
    }
};
