<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('referencias_oficio', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->enum('modulo', ['GENERAL', 'TRIBUNAL', 'ETICA'])->default('GENERAL');
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // Insertar referencias por defecto de la asociación
        DB::table('referencias_oficio')->insert([
            ['nombre' => 'Comunica Resolución', 'modulo' => 'GENERAL', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Notificación de Sanción', 'modulo' => 'TRIBUNAL', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Notificación de Habilitación', 'modulo' => 'GENERAL', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Citación a Sesión Oficial', 'modulo' => 'ETICA', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Inhabilitación Preventiva', 'modulo' => 'GENERAL', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Apertura de Investigación', 'modulo' => 'ETICA', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Faltas al fair play y alteración del orden', 'modulo' => 'GENERAL', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Recurso de Reposición y Apelación', 'modulo' => 'GENERAL', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referencias_oficio');
    }
};
