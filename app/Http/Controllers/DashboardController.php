<?php

namespace App\Http\Controllers;

use App\Models\Sancion;
use App\Models\CasoEtica;
use App\Models\Club;
use App\Models\Jugador;
use App\Models\Campeonato;
use App\Models\ConfiguracionAsociacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalSancionesActivas = Sancion::where('estado', 'ACTIVO')->count();
        $totalSancionesCumplidas = Sancion::where('estado', 'CUMPLIDO')->count();
        $totalCasosEtica = CasoEtica::count();
        $totalClubes = Club::count();
        $totalJugadores = Jugador::count();
        $totalCampeonatos = Campeonato::count();

        // Data for chart 1: Sanciones por Club (Top 8)
        $sancionesPorClub = DB::table('sanciones')
            ->join('clubes', 'sanciones.club_id', '=', 'clubes.id')
            ->select('clubes.name as club', DB::raw('count(*) as total'))
            ->groupBy('clubes.id', 'clubes.name')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        // Data for chart 2: Sanciones por Tipo
        $sancionesPorTipo = DB::table('sanciones')
            ->select('tipo_sancion as tipo', DB::raw('count(*) as total'))
            ->groupBy('tipo_sancion')
            ->get();

        // Data for chart 3: Casos de Ética por Estado
        $casosEticaPorEstado = DB::table('casos_etica')
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get();

        // Últimas Sanciones Registradas (5 más recientes)
        $ultimasSanciones = Sancion::with(['jugador', 'club', 'campeonato'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        // Últimos Casos Éticos (5 más recientes)
        $ultimosCasosEtica = CasoEtica::with(['club', 'jugador'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        $asoc = ConfiguracionAsociacion::instancia();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'activas'     => $totalSancionesActivas,
                'cumplidas'   => $totalSancionesCumplidas,
                'casos_etica' => $totalCasosEtica,
                'clubes'      => $totalClubes,
                'jugadores'   => $totalJugadores,
                'campeonatos' => $totalCampeonatos,
            ],
            'chartSancionesClub'   => $sancionesPorClub,
            'chartSancionesTipo'   => $sancionesPorTipo,
            'chartCasosEstado'     => $casosEticaPorEstado,
            'ultimasSanciones'     => $ultimasSanciones,
            'ultimosCasosEtica'    => $ultimosCasosEtica,
            'asoc'                 => [
                'nombre'   => $asoc->nombre,
                'ciudad'   => $asoc->ciudad,
                'logo_url' => $asoc->logo_url,
            ],
        ]);
    }
}
