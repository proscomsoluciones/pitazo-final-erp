<?php

namespace Tests\Unit;

use App\Services\Telegram\DictadoParser;
use PHPUnit\Framework\TestCase;

class DictadoParserTest extends TestCase
{
    private function parse(string $texto): array
    {
        return (new DictadoParser())->parse($texto);
    }

    public function test_sancion_completa_en_orden(): void
    {
        $item = $this->parse('Carmelo de Praga, Héctor Caneo Navarrete, 210 H, conducta violenta, 4 partidos')['items'][0];

        $this->assertSame('SANCION', $item['tipo']);
        $this->assertSame('Carmelo de Praga', $item['club_texto']);
        $this->assertSame('Héctor Caneo Navarrete', $item['jugador_texto']);
        $this->assertSame('Art. 210 Letra H', $item['articulo']);
        $this->assertSame('Conducta violenta', $item['tipo_falta']);
        $this->assertSame(4, $item['cantidad']);
        $this->assertSame('PARTIDOS', $item['unidad']);
        $this->assertFalse($item['reincidencia']);
        $this->assertSame([], $item['avisos']);
    }

    public function test_reincidencia_con_suma_explicita(): void
    {
        $item = $this->parse('Estrella, Kevin Núñez, artículo 211 letra P, doble amonestación, 1+1 partidos, R')['items'][0];

        $this->assertSame('Art. 211 Letra P', $item['articulo']);
        $this->assertSame(1, $item['cantidad_base']);
        $this->assertSame(2, $item['cantidad']);
        $this->assertTrue($item['reincidencia']);
    }

    public function test_marca_r_sin_suma_agrega_un_partido(): void
    {
        $item = $this->parse('Estrella, Roberth Choque F., 211 F, conducta grosera, 3 partidos, R')['items'][0];

        $this->assertSame(4, $item['cantidad']);
        $this->assertTrue($item['reincidencia']);
        $this->assertStringContainsString('3+1', $item['avisos'][0]);
    }

    public function test_sanciones_por_tiempo_y_numeros_en_palabras(): void
    {
        $items = $this->parse("Unión Compuertas, Ricardo Aspee, 205 J, dirigente con conducta violenta, cinco años\nCompuertas, Camilo Aspee Hernández, 209 A, agresión a árbitro, 6 meses")['items'];

        $this->assertSame([5, 'AÑOS'], [$items[0]['cantidad'], $items[0]['unidad']]);
        $this->assertSame([6, 'MESES'], [$items[1]['cantidad'], $items[1]['unidad']]);
    }

    public function test_campos_en_otro_orden_y_motivo_faltante(): void
    {
        $item = $this->parse('Santa Rosa, Javier Vera Llano, 1 partido, 211P')['items'][0];

        $this->assertSame('Santa Rosa', $item['club_texto']);
        $this->assertSame('Javier Vera Llano', $item['jugador_texto']);
        $this->assertSame('Art. 211 Letra P', $item['articulo']);
        $this->assertNull($item['tipo_falta']);
        $this->assertSame(1, $item['cantidad']);
    }

    public function test_multas(): void
    {
        $items = $this->parse("Multa, Valencia, 50.000, no presentación serie femenina\nmulta Unión Compuertas, barra incorrecta grave, \$210.000")['items'];

        $this->assertSame('NOTA', $items[0]['tipo']);
        $this->assertSame('Valencia', $items[0]['club_texto']);
        $this->assertSame(50000, $items[0]['monto']);
        $this->assertSame('No presentación serie femenina', $items[0]['nota']);

        $this->assertSame('Unión Compuertas', $items[1]['club_texto']);
        $this->assertSame(210000, $items[1]['monto']);
    }

    public function test_linea_de_contexto(): void
    {
        $resultado = $this->parse("Fecha 1 Clausura 01-11-2026\nSan Carlos, Raúl Valencia Contreras, 211 N, faltas reiteradas, 1 partido");

        $this->assertSame(1, $resultado['contexto']['numero_fecha']);
        $this->assertSame('Clausura', $resultado['contexto']['fase_texto']);
        $this->assertSame('2026-11-01', $resultado['contexto']['fecha_resolucion']);
        $this->assertCount(1, $resultado['items']);
    }

    public function test_linea_incompleta_genera_avisos(): void
    {
        $item = $this->parse('Valencia expulsado')['items'][0];

        $this->assertNotEmpty($item['avisos']);
        $this->assertNull($item['articulo']);
        $this->assertNull($item['unidad']);
    }

    public function test_amonestacion(): void
    {
        $item = $this->parse('Valencia, Pedro Pérez, 211 P, insultos, amonestación')['items'][0];

        $this->assertSame('AMONESTACION', $item['unidad']);
        $this->assertSame(1, $item['cantidad']);
    }
}
