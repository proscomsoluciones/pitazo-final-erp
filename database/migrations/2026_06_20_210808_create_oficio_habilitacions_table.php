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
        Schema::create('oficios_habilitacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sancion_id')->constrained('sanciones')->cascadeOnDelete();
            $table->string('folio')->unique();
            $table->date('fecha_emision');
            $table->string('pdf_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oficios_habilitacion');
    }
};
