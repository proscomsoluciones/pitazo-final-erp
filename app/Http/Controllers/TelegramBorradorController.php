<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\ReferenciaOficio;
use App\Models\TelegramBorrador;
use App\Services\Telegram\AprobadorBorrador;
use App\Services\Telegram\DictadoParser;
use App\Services\Telegram\ValidadorBorrador;
use App\Support\Auditor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TelegramBorradorController extends Controller
{
    private const PERMISO_MODULO = [
        DictadoParser::DISCIPLINA => 'gestionar sanciones',
        DictadoParser::ETICA => 'gestionar etica',
    ];

    public function index(Request $request)
    {
        $borradores = TelegramBorrador::with(['fase', 'campeonato', 'revisor:id,name'])
            ->whereIn('modulo', $this->modulosPermitidos($request))
            ->orderByRaw("estado = 'PENDIENTE' desc")
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return Inertia::render('Telegram/Borradores', [
            'borradores' => $borradores,
            'botConfigurado' => (bool) config('services.telegram.token'),
        ]);
    }

    public function show(Request $request, TelegramBorrador $borrador)
    {
        $this->autorizarModulo($request, $borrador);

        return Inertia::render('Telegram/Borrador', [
            'borrador' => $borrador->load(['fase', 'campeonato', 'revisor:id,name']),
            'clubes' => Club::orderBy('name')->get(['id', 'name']),
            'jugadores' => Jugador::orderBy('nombre')->get(['id', 'nombre', 'club_id']),
            'campeonatos' => Campeonato::with('fases')->where('estado', 'ACTIVO')->orderByDesc('id')->get(),
            'referencias' => ReferenciaOficio::where('activa', true)->whereIn('modulo', ['GENERAL', 'ETICA'])->orderBy('nombre')->pluck('nombre'),
        ]);
    }

    public function aprobar(Request $request, TelegramBorrador $borrador, AprobadorBorrador $aprobador)
    {
        $this->autorizarModulo($request, $borrador);
        abort_unless($borrador->estado === 'PENDIENTE', 422, 'Este borrador ya fue revisado.');

        $contexto = $request->validate(ValidadorBorrador::reglasContexto($borrador), ValidadorBorrador::MENSAJES);

        // validate() solo devuelve los campos con regla; los items se toman completos
        $items = array_values((array) $request->input('items', []));
        $incluidos = array_filter($items, fn ($i) => !empty($i['incluir']));
        if (!$incluidos) {
            return back()->with('error', 'No hay registros marcados para aprobar.');
        }

        if (array_filter($incluidos, fn ($i) => ($i['tipo'] ?? null) === 'FONDO') && !$request->user()->can('gestionar fondos')) {
            return back()->with('error', 'No tienes permiso para registrar fondos solidarios: desmarca esos registros.');
        }

        // Validar solo lo que se va a registrar
        $request->validate(ValidadorBorrador::reglasItems($items), ValidadorBorrador::MENSAJES);

        $resultado = $aprobador->aprobar($borrador, $contexto, $items, $request->user()?->id);

        return redirect()->route('telegram.borradores.index')->with('success', sprintf(
            'Borrador #%d aprobado: %s.',
            $borrador->id, AprobadorBorrador::describirResultado($resultado)
        ));
    }

    public function descartar(Request $request, TelegramBorrador $borrador)
    {
        $this->autorizarModulo($request, $borrador);
        abort_unless($borrador->estado === 'PENDIENTE', 422, 'Este borrador ya fue revisado.');

        $borrador->update([
            'estado' => 'DESCARTADO',
            'revisado_por' => $request->user()?->id,
            'revisado_at' => now(),
        ]);

        Auditor::log('ELIMINAR', $borrador->modulo === DictadoParser::ETICA ? 'ETICA' : 'TRIBUNAL', "Descartó el borrador de Telegram #{$borrador->id}.");

        return redirect()->route('telegram.borradores.index')->with('success', "Borrador #{$borrador->id} descartado.");
    }

    private function modulosPermitidos(Request $request): array
    {
        return array_keys(array_filter(self::PERMISO_MODULO, fn ($permiso) => $request->user()->can($permiso)));
    }

    private function autorizarModulo(Request $request, TelegramBorrador $borrador): void
    {
        abort_unless(in_array($borrador->modulo, $this->modulosPermitidos($request), true), 403);
    }
}
