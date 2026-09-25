<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuracion_asociacion', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->default('Asociación de Fútbol');
            $table->string('ciudad')->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('correo')->nullable();
            $table->string('sitio_web')->nullable();
            $table->string('nombre_presidente')->nullable();
            $table->string('nombre_secretario')->nullable();
            $table->string('nombre_tesorero')->nullable();
            $table->string('logo_path')->nullable();   // ruta relativa en storage
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_asociacion');
    }
};
