<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\ReferenciaOficio;
use App\Models\TelegramBorrador;
use App\Services\Telegram\AprobadorBorrador;
use App\Services\Telegram\DictadoParser;
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

        // La pantalla antepone el nombre del campo ("Registro 3, club: es obligatorio.")
        $mensajes = [
            'required' => 'es obligatorio.',
            'required_without' => 'es obligatorio.',
            'required_unless' => 'es obligatorio.',
            'required_if' => 'es obligatorio.',
            'exists' => 'no existe en el sistema.',
            'integer' => 'debe ser un número entero.',
            'min' => 'debe ser mayor a cero.',
            'in' => 'no es válido.',
            'date' => 'no es una fecha válida.',
            'after_or_equal' => 'debe ser posterior al inicio.',
        ];

        // En ética la fecha del campeonato es opcional
        $etica = $borrador->modulo === DictadoParser::ETICA;
        $contexto = $request->validate([
            'campeonato_id' => ($etica ? 'nullable' : 'required') . '|exists:campeonatos,id',
            'fase_id' => ($etica ? 'nullable' : 'required') . '|exists:fases,id',
            'numero_fecha' => ($etica ? 'nullable' : 'required') . '|integer|min:1',
            'fecha_resolucion' => ($etica ? 'nullable' : 'required') . '|date',
        ], $mensajes);

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.tipo' => 'required|in:SANCION,NOTA,FONDO,EXPEDIENTE,ERROR',
            'items.*.incluir' => 'boolean',
        ]);

        // validate() solo devuelve los campos con regla; los items se toman completos
        $items = array_values($request->input('items'));
        $incluidos = array_filter($items, fn ($i) => !empty($i['incluir']));
        if (!$incluidos) {
            return back()->with('error', 'No hay registros marcados para aprobar.');
        }

        if (array_filter($incluidos, fn ($i) => $i['tipo'] === 'FONDO') && !$request->user()->can('gestionar fondos')) {
            return back()->with('error', 'No tienes permiso para registrar fondos solidarios: desmarca esos registros.');
        }

        // Validar solo lo que se va a registrar
        $reglas = [];
        foreach ($items as $i => $item) {
            if (empty($item['incluir'])) {
                continue;
            }
            $reglas += match ($item['tipo']) {
                'SANCION' => [
                    "items.$i.club_id" => 'required|exists:clubes,id',
                    "items.$i.jugador_id" => 'nullable|exists:jugadores,id',
                    "items.$i.jugador_nombre" => "required_without:items.$i.jugador_id|nullable|string|max:255",
                    "items.$i.articulo" => 'required|string|max:255',
                    "items.$i.tipo_falta" => 'required|string|max:255',
                    "items.$i.cantidad" => 'required|integer|min:1',
                    "items.$i.unidad" => 'required|in:PARTIDOS,MESES,AÑOS,AMONESTACION',
                    "items.$i.reincidencia" => 'boolean',
                ],
                'NOTA' => [
                    "items.$i.club_id" => 'nullable|exists:clubes,id',
                    "items.$i.nota" => 'required|string',
                    "items.$i.monto" => 'nullable|integer|min:0',
                ],
                'FONDO' => [
                    "items.$i.club_id" => 'required|exists:clubes,id',
                    "items.$i.numero_fondo" => 'nullable|integer|min:1',
                    "items.$i.jugador_nombre" => 'required|string|max:255',
                    "items.$i.rut" => 'nullable|string|max:20',
                    "items.$i.porcentaje" => 'required|integer|min:1',
                    "items.$i.monto" => 'required|integer|min:1',
                    "items.$i.diagnostico" => 'nullable|string',
                    "items.$i.estado" => 'required|in:PENDIENTE,PAGADO',
                ],
                'EXPEDIENTE' => [
                    "items.$i.calidad" => 'required|in:JUGADOR,DIRIGENTE,TURNO,CLUB',
                    "items.$i.club_id" => "required_if:items.$i.calidad,CLUB|nullable|exists:clubes,id",
                    "items.$i.jugador_id" => 'nullable|exists:jugadores,id',
                    "items.$i.nombre" => "required_unless:items.$i.calidad,CLUB|nullable|string|max:255",
                    "items.$i.rut" => 'nullable|string|max:20',
                    "items.$i.articulo" => 'nullable|string|max:255',
                    "items.$i.estado" => 'required|in:EN_INVESTIGACION,CITADO,INHABILITADO,AMONESTADO,RESUELTO,ARCHIVADO',
                    "items.$i.asunto" => 'required|string|max:255',
                    "items.$i.descripcion" => 'nullable|string',
                    "items.$i.detalles_resolucion" => 'nullable|string',
                    "items.$i.fecha_citacion" => "required_if:items.$i.estado,CITADO|nullable|date",
                    "items.$i.lugar_citacion" => 'nullable|string|max:255',
                    "items.$i.fecha_inicio_inhabilitacion" => "required_if:items.$i.estado,INHABILITADO|nullable|date",
                    "items.$i.fecha_fin_inhabilitacion" => "nullable|date|after_or_equal:items.$i.fecha_inicio_inhabilitacion",
                ],
                default => abort(422, 'Hay líneas que no se entendieron marcadas para aprobar.'),
            };
        }
        $request->validate($reglas, $mensajes);

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
