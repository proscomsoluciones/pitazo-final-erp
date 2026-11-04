<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\TelegramBorrador;
use App\Services\Telegram\AprobadorBorrador;
use App\Support\Auditor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TelegramBorradorController extends Controller
{
    public function index()
    {
        $borradores = TelegramBorrador::with(['fase', 'campeonato', 'revisor:id,name'])
            ->orderByRaw("estado = 'PENDIENTE' desc")
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return Inertia::render('Telegram/Borradores', [
            'borradores' => $borradores,
            'botConfigurado' => (bool) config('services.telegram.token'),
        ]);
    }

    public function show(TelegramBorrador $borrador)
    {
        return Inertia::render('Telegram/Borrador', [
            'borrador' => $borrador->load(['fase', 'campeonato', 'revisor:id,name']),
            'clubes' => Club::orderBy('name')->get(['id', 'name']),
            'jugadores' => Jugador::orderBy('nombre')->get(['id', 'nombre', 'club_id']),
            'campeonatos' => Campeonato::with('fases')->where('estado', 'ACTIVO')->orderByDesc('id')->get(),
        ]);
    }

    public function aprobar(Request $request, TelegramBorrador $borrador, AprobadorBorrador $aprobador)
    {
        abort_unless($borrador->estado === 'PENDIENTE', 422, 'Este borrador ya fue revisado.');

        // La pantalla antepone el nombre del campo ("Registro 3, club: es obligatorio.")
        $mensajes = [
            'required' => 'es obligatorio.',
            'required_without' => 'es obligatorio.',
            'exists' => 'no existe en el sistema.',
            'integer' => 'debe ser un número entero.',
            'min' => 'debe ser mayor a cero.',
            'in' => 'no es válido.',
            'date' => 'no es una fecha válida.',
        ];

        $contexto = $request->validate([
            'campeonato_id' => 'required|exists:campeonatos,id',
            'fase_id' => 'required|exists:fases,id',
            'numero_fecha' => 'required|integer|min:1',
            'fecha_resolucion' => 'required|date',
        ], $mensajes);

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.tipo' => 'required|in:SANCION,NOTA,ERROR',
            'items.*.incluir' => 'boolean',
        ]);

        // validate() solo devuelve los campos con regla; los items se toman completos
        $items = array_values($request->input('items'));
        $incluidos = array_filter($items, fn ($i) => !empty($i['incluir']));
        if (!$incluidos) {
            return back()->with('error', 'No hay registros marcados para aprobar.');
        }

        // Validar solo lo que se va a registrar
        $reglas = [];
        foreach ($items as $i => $item) {
            if (empty($item['incluir'])) {
                continue;
            }
            if ($item['tipo'] === 'SANCION') {
                $reglas += [
                    "items.$i.club_id" => 'required|exists:clubes,id',
                    "items.$i.jugador_id" => 'nullable|exists:jugadores,id',
                    "items.$i.jugador_nombre" => "required_without:items.$i.jugador_id|nullable|string|max:255",
                    "items.$i.articulo" => 'required|string|max:255',
                    "items.$i.tipo_falta" => 'required|string|max:255',
                    "items.$i.cantidad" => 'required|integer|min:1',
                    "items.$i.unidad" => 'required|in:PARTIDOS,MESES,AÑOS,AMONESTACION',
                    "items.$i.reincidencia" => 'boolean',
                ];
            } elseif ($item['tipo'] === 'NOTA') {
                $reglas += [
                    "items.$i.club_id" => 'nullable|exists:clubes,id',
                    "items.$i.nota" => 'required|string',
                    "items.$i.monto" => 'nullable|integer|min:0',
                ];
            } else {
                return back()->with('error', 'Hay líneas que no se entendieron marcadas para aprobar.');
            }
        }
        $request->validate($reglas, $mensajes);

        $resultado = $aprobador->aprobar($borrador, $contexto, $items, $request->user()?->id);

        return redirect()->route('telegram.borradores.index')->with('success', sprintf(
            'Borrador #%d aprobado: %d sanción(es) y %d nota(s) registradas.',
            $borrador->id, count($resultado['sanciones']), count($resultado['notas'])
        ));
    }

    public function descartar(Request $request, TelegramBorrador $borrador)
    {
        abort_unless($borrador->estado === 'PENDIENTE', 422, 'Este borrador ya fue revisado.');

        $borrador->update([
            'estado' => 'DESCARTADO',
            'revisado_por' => $request->user()?->id,
            'revisado_at' => now(),
        ]);

        Auditor::log('ELIMINAR', 'TRIBUNAL', "Descartó el borrador de Telegram #{$borrador->id}.");

        return redirect()->route('telegram.borradores.index')->with('success', "Borrador #{$borrador->id} descartado.");
    }
}
