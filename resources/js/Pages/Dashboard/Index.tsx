import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
    Users, ShieldAlert, CheckCircle2, Shield, BarChart3, Gavel, Scale, 
    Trophy, Building2, FileText, ArrowUpRight, Zap, Sparkles, Clock, AlertTriangle, ChevronRight,
    Activity, FileDown, UserCheck, PieChart as PieChartIcon
} from 'lucide-react';

interface Stats {
    activas: number;
    cumplidas: number;
    casos_etica: number;
    clubes: number;
    jugadores: number;
    campeonatos: number;
}

interface ChartClub {
    club: string;
    total: number;
}

interface ChartTipo {
    tipo: string;
    total: number;
}

interface ChartEstado {
    estado: string;
    total: number;
}

interface SancionItem {
    id: number;
    articulo_reglamento: string;
    cantidad_sancion: number;
    unidad_tiempo: string;
    estado: string;
    fecha_resolucion?: string;
    jugador?: { nombre: string; rut?: string };
    club?: { name: string };
    campeonato?: { nombre: string };
}

interface CasoEticaItem {
    id: number;
    folio: string;
    asunto: string;
    tipo_oficio: string;
    estado: string;
    created_at?: string;
    club?: { name: string };
    jugador?: { nombre: string };
}

interface Asoc {
    nombre: string;
    ciudad: string;
    logo_url?: string;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#0284c7', '#8b5cf6', '#f59e0b'];

export default function Dashboard({
    stats,
    chartSancionesClub = [],
    chartSancionesTipo = [],
    chartCasosEstado = [],
    ultimasSanciones = [],
    ultimosCasosEtica = [],
    asoc,
}: {
    stats: Stats;
    chartSancionesClub: ChartClub[];
    chartSancionesTipo: ChartTipo[];
    chartCasosEstado: ChartEstado[];
    ultimasSanciones: SancionItem[];
    ultimosCasosEtica: CasoEticaItem[];
    asoc: Asoc;
}) {
    const user = usePage<any>().props.auth.user;
    const currentDateFormatted = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Panel Principal</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Métricas en tiempo real, resoluciones e indicadores de gestión
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shrink-0 self-start sm:self-auto">
                        <Sparkles size={14} className="text-emerald-600 animate-pulse" />
                        <span className="capitalize">{currentDateFormatted}</span>
                    </div>
                </div>
            }
        >
            <Head title="Panel Principal - Pitazo Final" />

            <div className="py-6 space-y-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    
                    {/* ── BANNER DE BIENVENIDA INSTITUCIONAL ── */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                        {/* Decoración gráfica de fondo */}
                        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute right-40 top-0 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider border border-emerald-500/30">
                                    <Zap size={13} />
                                    <span>{asoc?.nombre || 'ASOCIACIÓN DE FÚTBOL'} &bull; {asoc?.ciudad || 'Chile'}</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    ¡Hola, {user?.name || 'Administrador'}!
                                </h1>
                                <p className="text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                                    Bienvenido al sistema oficial de gestión deportiva. Acceda rápidamente a las sanciones del Comité de Disciplina, expedientes de Ética y certificados oficiales.
                                </p>
                            </div>

                            {/* Accesos destacados en banner */}
                            <div className="flex items-center gap-3 shrink-0">
                                <Link
                                    href={route('tribunal.index')}
                                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                                >
                                    <Gavel size={18} />
                                    <span>Ver Tribunal</span>
                                </Link>
                                <Link
                                    href={route('etica.index')}
                                    className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
                                >
                                    <Scale size={18} />
                                    <span>Comité Ética</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN DE ACCESOS RÁPIDOS ── */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Zap size={16} className="text-emerald-600" />
                                <span>Accesos Rápidos a Módulos</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                            <Link
                                href={route('tribunal.index')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <Gavel size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Tribunal Disciplina
                                </span>
                            </Link>

                            <Link
                                href={route('etica.index')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Scale size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Comité de Ética
                                </span>
                            </Link>

                            <Link
                                href={route('jugadores.index')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Users size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Ficha Jugadores
                                </span>
                            </Link>

                            <Link
                                href={route('clubes.index')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                    <Shield size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Clubes Afiliados
                                </span>
                            </Link>

                            <Link
                                href={route('torneos.index')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Trophy size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Torneos & Fases
                                </span>
                            </Link>

                            <Link
                                href={route('configuracion.asociacion')}
                                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
                            >
                                <div className="p-3 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                    <Building2 size={22} />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    Ajustes Membrete
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* ── KPI CARDS GRID (6 MÉTRICAS CLAVE) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {/* 1. Sanciones Activas */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <ShieldAlert size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Vigentes
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sanciones Activas</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.activas}</p>
                            </div>
                        </div>

                        {/* 2. Sanciones Cumplidas */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <CheckCircle2 size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Cumplidas
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sanciones Cumplidas</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.cumplidas}</p>
                            </div>
                        </div>

                        {/* 3. Expedientes de Ética */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                    <Scale size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                    Expedientes
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Casos de Ética</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.casos_etica}</p>
                            </div>
                        </div>

                        {/* 4. Clubes Registrados */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                                    <Shield size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                                    Afiliados
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Clubes Registrados</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.clubes}</p>
                            </div>
                        </div>

                        {/* 5. Jugadores Inscritos */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-teal-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                    <Users size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                                    Federados
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jugadores Inscritos</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.jugadores}</p>
                            </div>
                        </div>

                        {/* 6. Campeonatos */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-200/70 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                    <Trophy size={20} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Torneos
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campeonatos</p>
                                <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{stats.campeonatos}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN DE GRÁFICOS Y ESTADÍSTICAS MEJORADOS ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 1. Ranking Visual de Clubes Sancionados (Horizontal Visual Progress) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                                        <BarChart3 size={22} className="text-emerald-600" />
                                        <span>Ranking de Clubes con Sanciones Aplicadas</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                        Distribución y proporción de fallos vigentes por institución deportiva
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                                    Top Instituciones
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                {chartSancionesClub.length > 0 ? (
                                    (() => {
                                        const maxTotal = Math.max(...chartSancionesClub.map(c => c.total), 1);
                                        const totalGeneral = chartSancionesClub.reduce((acc, curr) => acc + curr.total, 0);

                                        return chartSancionesClub.map((item, index) => {
                                            const percentage = Math.round((item.total / maxTotal) * 100);
                                            const shareOfTotal = Math.round((item.total / (totalGeneral || 1)) * 100);

                                            return (
                                                <div key={index} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:shadow-sm transition-all space-y-2">
                                                    <div className="flex items-center justify-between text-xs font-extrabold">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 rounded-lg text-[11px] flex items-center justify-center font-black ${
                                                                index === 0 
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                                                    : index === 1 
                                                                        ? 'bg-slate-200 text-slate-700' 
                                                                        : index === 2 
                                                                            ? 'bg-amber-50 text-amber-700' 
                                                                            : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                #{index + 1}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={16} className="text-slate-400" />
                                                                <span className="text-slate-900 font-black">{item.club}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-slate-400 font-semibold text-[11px]">
                                                                {shareOfTotal}% del total
                                                            </span>
                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">
                                                                {item.total} {item.total === 1 ? 'sanción' : 'sanciones'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden p-0.5">
                                                        <div 
                                                            className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.max(8, percentage)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 font-medium text-sm space-y-2">
                                        <Activity size={36} className="text-slate-300" />
                                        <p>No se registran sanciones en los clubes actualmente.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Gráfico Donut Recharts de Distribución Disciplinaria */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                                    <PieChartIcon size={20} className="text-emerald-600" />
                                    <span>Distribución del Sistema</span>
                                </h3>

                                <div className="mt-4">
                                    {/* Gráfico Donut */}
                                    <div className="h-56 w-full relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Sanciones Activas', value: stats.activas, color: '#f59e0b' },
                                                        { name: 'Sanciones Cumplidas', value: stats.cumplidas, color: '#059669' },
                                                        { name: 'Casos de Ética', value: stats.casos_etica, color: '#8b5cf6' },
                                                    ].filter(d => d.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {[
                                                        { color: '#f59e0b' },
                                                        { color: '#059669' },
                                                        { color: '#8b5cf6' },
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Figtree, sans-serif' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        
                                        {/* Texto Central en el Donut */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                            <span className="text-2xl font-black text-slate-900 leading-none">
                                                {stats.activas + stats.cumplidas + stats.casos_etica}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                Total Registros
                                            </span>
                                        </div>
                                    </div>

                                    {/* Leyenda Personalizada */}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                <span className="font-extrabold text-slate-800">Sanciones Activas</span>
                                            </div>
                                            <span className="font-black text-amber-900">{stats.activas}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                                                <span className="font-extrabold text-slate-800">Sanciones Cumplidas</span>
                                            </div>
                                            <span className="font-black text-emerald-900">{stats.cumplidas}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-purple-600" />
                                                <span className="font-extrabold text-slate-800">Casos de Ética</span>
                                            </div>
                                            <span className="font-black text-purple-900">{stats.casos_etica}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tasa de Resolución Disciplinaria */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tasa de Resolución</span>
                                    <span className="text-xs font-black text-emerald-700">
                                        {Math.round((stats.cumplidas / (stats.activas + stats.cumplidas || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.round((stats.cumplidas / (stats.activas + stats.cumplidas || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── SECCIÓN DE ACTIVIDAD Y RESOLUCIONES RECIENTES ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. Últimas Sanciones de Tribunal */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                                        <Gavel size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold text-slate-900">Últimas Sanciones de Tribunal</h4>
                                        <p className="text-xs text-slate-400 font-semibold">Fallos disciplinarios recientes</p>
                                    </div>
                                </div>
                                <Link 
                                    href={route('tribunal.index')}
                                    className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <span>Ver Todo</span>
                                    <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {ultimasSanciones.length > 0 ? (
                                    ultimasSanciones.map((sancion) => (
                                        <div key={sancion.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900 truncate">
                                                        {sancion.jugador ? sancion.jugador.nombre : (sancion.club ? sancion.club.name : 'Sanción')}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                                                        {sancion.articulo_reglamento}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium truncate">
                                                    {sancion.club?.name} &bull; Sanción: {sancion.cantidad_sancion} {sancion.unidad_tiempo}
                                                </p>
                                            </div>

                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 border ${
                                                sancion.estado === 'ACTIVO'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                                {sancion.estado}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-6 text-xs text-slate-400 font-semibold">
                                        No hay registros de sanciones recientes.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. Últimos Expedientes del Comité de Ética */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                        <Scale size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold text-slate-900">Últimos Casos de Ética</h4>
                                        <p className="text-xs text-slate-400 font-semibold">Expedientes éticos en proceso</p>
                                    </div>
                                </div>
                                <Link 
                                    href={route('etica.index')}
                                    className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <span>Ver Todo</span>
                                    <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {ultimosCasosEtica.length > 0 ? (
                                    ultimosCasosEtica.map((caso) => {
                                        const getBadgeConfig = (tipo: string, estado: string) => {
                                            const val = estado || tipo;
                                            switch (val) {
                                                case 'INVESTIGACION':
                                                case 'EN_INVESTIGACION':
                                                    return { label: 'En Investigación', className: 'bg-amber-50 text-amber-800 border-amber-300' };
                                                case 'INHABILITACION':
                                                case 'INHABILITADO':
                                                    return { label: 'Inhabilitado', className: 'bg-rose-50 text-rose-800 border-rose-300' };
                                                case 'CITACION':
                                                case 'CITADO':
                                                    return { label: 'Citado', className: 'bg-blue-50 text-blue-800 border-blue-300' };
                                                case 'RESOLUCION':
                                                case 'RESUELTO':
                                                    return { label: 'Resuelto', className: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
                                                case 'ARCHIVADO':
                                                    return { label: 'Archivado', className: 'bg-slate-100 text-slate-700 border-slate-300' };
                                                default:
                                                    return { label: val, className: 'bg-slate-50 text-slate-700 border-slate-300' };
                                            }
                                        };
                                        const badge = getBadgeConfig(caso.tipo_oficio, caso.estado);

                                        return (
                                            <div key={caso.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-emerald-700 shrink-0">
                                                            {caso.folio}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                            {caso.asunto}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium truncate">
                                                        Involucrado: {caso.jugador?.nombre || caso.club?.name || 'Ver expediente'}
                                                    </p>
                                                </div>

                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 border ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center py-6 text-xs text-slate-400 font-semibold">
                                        No hay expedientes éticos recientes.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
