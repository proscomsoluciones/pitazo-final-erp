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
        Schema::table('configuracion_asociacion', function (Blueprint $table) {
            // Firmantes Comité de Ética
            $table->string('etica_integrante_1')->nullable()->after('nombre_tesorero');
            $table->string('etica_integrante_2')->nullable()->after('etica_integrante_1');
            $table->string('etica_integrante_3')->nullable()->after('etica_integrante_2');

            // Firmantes Tribunal de Disciplina
            $table->string('disciplina_presidente')->nullable()->after('etica_integrante_3');
            $table->string('disciplina_secretario')->nullable()->after('disciplina_presidente');
            $table->string('disciplina_integrante_3')->nullable()->after('disciplina_secretario');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configuracion_asociacion', function (Blueprint $table) {
            $table->dropColumn([
                'etica_integrante_1',
                'etica_integrante_2',
                'etica_integrante_3',
                'disciplina_presidente',
                'disciplina_secretario',
                'disciplina_integrante_3',
            ]);
        });
    }
};
