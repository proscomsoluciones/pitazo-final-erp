<?php

namespace App\Services;

use App\Models\Sancion;
use App\Models\OficioHabilitacion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SancionService
{
    /**
     * Calcula la fecha de término cronológica basada en cantidad y unidad de tiempo.
     */
    public function calcularFechaTermino(int $cantidad, string $unidad, string $fechaResolucion): ?Carbon
    {
        $fecha = Carbon::parse($fechaResolucion);

        return match ($unidad) {
            'MESES' => $fecha->addMonths($cantidad),
            'AÑOS'  => $fecha->addYears($cantidad),
            default => null, // Para 'PARTIDOS'
        };
    }

    /**
     * Incrementa el número de partidos cumplidos para todas las sanciones activas por partido de un club.
     * Si la sanción alcanza la cantidad de partidos exigida, cambia el estado a 'CUMPLIDO'.
     */
    public function incrementarPartidoCumplido(int $clubId): void
    {
        $sanciones = Sancion::where('club_id', $clubId)
            ->where('tipo_sancion', 'PARTIDOS')
            ->where('estado', 'ACTIVO')
            ->get();

        foreach ($sanciones as $sancion) {
            $sancion->partidos_cumplidos++;

            if ($sancion->partidos_cumplidos >= $sancion->cantidad_sancion) {
                $sancion->estado = 'CUMPLIDO';
            }

            $sancion->save();
        }
    }

    /**
     * Genera un folio único para el Oficio de SANCIÓN (estado ACTIVO).
     * Folio formato: DISC-YYYY-NNNNN
     */
    public function generarOficioSancion(int $sancionId): OficioHabilitacion
    {
        return DB::transaction(function () use ($sancionId) {
            $sancion = Sancion::where('id', $sancionId)->lockForUpdate()->firstOrFail();

            // Si ya tiene oficio, devolverlo
            if ($sancion->oficioHabilitacion) {
                return $sancion->oficioHabilitacion;
            }

            $currentYear = now()->year;

            $ultimoOficio = OficioHabilitacion::whereYear('fecha_emision', $currentYear)
                ->where('folio', 'like', 'DISC-%')
                ->lockForUpdate()
                ->orderBy('id', 'desc')
                ->first();

            $nextNumber = 1;
            if ($ultimoOficio) {
                $parts = explode('-', $ultimoOficio->folio);
                if (count($parts) === 3) {
                    $nextNumber = (int) $parts[2] + 1;
                }
            }

            $folio = sprintf('DISC-%s-%05d', $currentYear, $nextNumber);

            return OficioHabilitacion::create([
                'sancion_id'    => $sancion->id,
                'folio'         => $folio,
                'fecha_emision' => now()->toDateString(),
                'pdf_path'      => 'oficios/' . $folio . '.pdf',
            ]);
        });
    }

    /**
     * Genera un folio único para el Oficio de HABILITACIÓN (estado CUMPLIDO).
     * Folio formato: CED-YYYY-NNNNN
     */
    public function generarOficioHabilitacion(int $sancionId): OficioHabilitacion
    {
        return DB::transaction(function () use ($sancionId) {
            $sancion = Sancion::where('id', $sancionId)->lockForUpdate()->firstOrFail();

            if ($sancion->estado !== 'CUMPLIDO') {
                throw new \Exception('La sanción no está cumplida. No se puede emitir el certificado de habilitación.');
            }

            if ($sancion->oficioHabilitacion) {
                return $sancion->oficioHabilitacion;
            }

            $currentYear = now()->year;

            $ultimoOficio = OficioHabilitacion::whereYear('fecha_emision', $currentYear)
                ->where('folio', 'like', 'CED-%')
                ->lockForUpdate()
                ->orderBy('id', 'desc')
                ->first();

            $nextNumber = 1;
            if ($ultimoOficio) {
                $parts = explode('-', $ultimoOficio->folio);
                if (count($parts) === 3) {
                    $nextNumber = (int) $parts[2] + 1;
                }
            }

            $folio = sprintf('CED-%s-%05d', $currentYear, $nextNumber);

            return OficioHabilitacion::create([
                'sancion_id'    => $sancion->id,
                'folio'         => $folio,
                'fecha_emision' => now()->toDateString(),
                'pdf_path'      => 'oficios/' . $folio . '.pdf',
            ]);
        });
    }
}
