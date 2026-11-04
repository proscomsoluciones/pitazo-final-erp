import { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import {
    Scale, Plus, Edit2, Trash2, FileDown, Search, Filter,
    AlertCircle, CheckCircle2, ShieldAlert, Eye, Trophy, Map,
    CalendarDays, User, Building2, Clock, MapPin, X, FileText, ChevronDown,
    ChevronLeft, ChevronRight
} from 'lucide-react';

interface CasoEtica {
    id: number;
    folio: string;
    tipo_oficio: 'INVESTIGACION' | 'CITACION' | 'INHABILITACION' | 'AMONESTACION' | 'RESOLUCION';
    tipo_involucrado: 'JUGADOR' | 'DIRIGENTE' | 'TURNO' | 'CLUB';
    club_id: number | null;
    jugador_id: number | null;
    nombre_involucrado: string | null;
    rut_involucrado: string | null;
    articulo_reglamento: string | null;
    campeonato_id: number | null;
    fase_id: number | null;
    numero_fecha: number | null;
    asunto: string;
    descripcion: string | null;
    fecha_citacion: string | null;
    lugar_citacion: string | null;
    fecha_inicio_inhabilitacion: string | null;
    fecha_fin_inhabilitacion: string | null;
    estado: 'EN_INVESTIGACION' | 'CITADO' | 'INHABILITADO' | 'AMONESTADO' | 'RESUELTO' | 'ARCHIVADO';
    detalles_resolucion: string | null;
    observaciones: string | null;
    created_at: string;
    club?: { id: number; name: string };
    jugador?: { id: number; nombre: string; rut: string };
    campeonato?: { id: number; nombre: string };
    fase?: { id: number; nombre: string };
}

interface Club { id: number; name: string }
interface Jugador { id: number; nombre: string; rut: string; club_id: number | null }
interface Fase { id: number; nombre: string; cantidad_fechas: number }
interface Campeonato { id: number; nombre: string; fases: Fase[] }

interface Referencia {
    id: number;
    nombre: string;
    modulo: string;
}

export default function EticaIndex({
    casos, clubes, jugadores, campeonatos, referencias = []
}: {
    casos: CasoEtica[];
    clubes: Club[];
    jugadores: Jugador[];
    campeonatos: Campeonato[];
    referencias?: Referencia[];
}) {
    const [nuevaReferencia, setNuevaReferencia] = useState('');
    const [isCreandoReferencia, setIsCreandoReferencia] = useState(false);
    const [esMotivoPersonalizado, setEsMotivoPersonalizado] = useState(false);

    const handleGuardarNuevaReferencia = () => {
        if (!nuevaReferencia.trim()) return;
        router.post(route('referencias-oficio.store'), {
            nombre: nuevaReferencia.trim(),
            modulo: 'ETICA'
        }, {
            onSuccess: () => {
                setData('asunto', nuevaReferencia.trim());
                setEsMotivoPersonalizado(false);
                setNuevaReferencia('');
                setIsCreandoReferencia(false);
            }
        });
    };
    const { flash, auth } = usePage<any>().props;
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | null }>({ show: false, message: '', type: null });

    const hasPermission = (p: string) => auth?.user?.permissions?.includes(p) || auth?.user?.roles?.includes('Super admin') || auth?.user?.roles?.includes('Comite etica');
    const canManage = hasPermission('gestionar etica');

    useEffect(() => {
        if (flash?.success) {
            setToast({ show: true, message: flash.success, type: 'success' });
            const timer = setTimeout(() => setToast({ show: false, message: '', type: null }), 4000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ show: true, message: flash.error, type: 'error' });
            const timer = setTimeout(() => setToast({ show: false, message: '', type: null }), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCaso, setEditingCaso] = useState<CasoEtica | null>(null);
    const [selectedCaso, setSelectedCaso] = useState<CasoEtica | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Smart player search states for modal
    const [jugadorSearch, setJugadorSearch] = useState('');
    const [isManualJugador, setIsManualJugador] = useState(false);
    const [showTorneoOpcional, setShowTorneoOpcional] = useState(false);

    const formatRutChileno = (value: string) => {
        const upper = value.toUpperCase().trimStart();
        if (upper.startsWith('P')) return upper;
        const raw = value.replace(/[^kK0-9]/g, '');
        if (raw.length === 0) return '';
        if (raw.length === 1) return raw.toUpperCase();
        const dv = raw.slice(-1).toUpperCase();
        const body = raw.slice(0, -1);
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedBody}-${dv}`;
    };

    const normalizeText = (str: string) =>
        (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Filters & Search
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');

    // Context filter for torneo/fase/fecha
    const [contextCampeonatoId, setContextCampeonatoId] = useState('');
    const [contextFaseId, setContextFaseId] = useState('');
    const [contextNumeroFecha, setContextNumeroFecha] = useState('');

    const selectedCampeonato = campeonatos.find(c => c.id.toString() === contextCampeonatoId);
    const fasesDisponibles = selectedCampeonato ? selectedCampeonato.fases : [];
    const selectedFase = fasesDisponibles.find(f => f.id.toString() === contextFaseId);
    const fechasDisponibles = selectedFase ? Array.from({ length: selectedFase.cantidad_fechas || 0 }, (_, i) => i + 1) : [];

    // Form initialization
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        tipo_oficio: 'INVESTIGACION' as 'INVESTIGACION' | 'CITACION' | 'INHABILITACION' | 'AMONESTACION' | 'RESOLUCION',
        tipo_involucrado: 'JUGADOR' as 'JUGADOR' | 'DIRIGENTE' | 'TURNO' | 'CLUB',
        club_id: '',
        jugador_id: '',
        nombre_involucrado: '',
        rut_involucrado: '',
        articulo_reglamento: '',
        campeonato_id: '',
        fase_id: '',
        numero_fecha: '',
        asunto: '',
        descripcion: '',
        fecha_citacion: '',
        lugar_citacion: '',
        fecha_inicio_inhabilitacion: '',
        fecha_fin_inhabilitacion: '',
        estado: 'EN_INVESTIGACION' as 'EN_INVESTIGACION' | 'CITADO' | 'INHABILITADO' | 'AMONESTADO' | 'RESUELTO' | 'ARCHIVADO',
        detalles_resolucion: '',
        observaciones: '',
    });

    const resetForm = () => {
        clearErrors();
        setEditingCaso(null);
        setJugadorSearch('');
        setIsManualJugador(false);
        setEsMotivoPersonalizado(false);
        setShowTorneoOpcional(!!contextCampeonatoId);
        setData({
            tipo_oficio: 'INVESTIGACION',
            tipo_involucrado: 'JUGADOR',
            club_id: '',
            jugador_id: '',
            nombre_involucrado: '',
            rut_involucrado: '',
            articulo_reglamento: '',
            campeonato_id: contextCampeonatoId,
            fase_id: contextFaseId,
            numero_fecha: contextNumeroFecha,
            asunto: '',
            descripcion: '',
            fecha_citacion: '',
            lugar_citacion: 'Sede Oficial de la Asociación',
            fecha_inicio_inhabilitacion: '',
            fecha_fin_inhabilitacion: '',
            estado: 'EN_INVESTIGACION',
            detalles_resolucion: '',
            observaciones: '',
        });
    };

    const handleEdit = (caso: CasoEtica) => {
        const tipoInv = caso.tipo_involucrado || (caso.jugador_id ? 'JUGADOR' : caso.nombre_involucrado ? 'DIRIGENTE' : 'CLUB');
        setEditingCaso(caso);
        setJugadorSearch('');
        setIsManualJugador(tipoInv === 'JUGADOR' && !caso.jugador_id && !!caso.nombre_involucrado);
        setEsMotivoPersonalizado(Boolean(caso.asunto && !referencias.some(r => r.nombre === caso.asunto)));
        setShowTorneoOpcional(!!caso.campeonato_id);
        setData({
            tipo_oficio: caso.tipo_oficio,
            tipo_involucrado: tipoInv,
            club_id: caso.club_id ? caso.club_id.toString() : '',
            jugador_id: caso.jugador_id ? caso.jugador_id.toString() : '',
            nombre_involucrado: caso.nombre_involucrado || '',
            rut_involucrado: caso.rut_involucrado || '',
            articulo_reglamento: caso.articulo_reglamento || '',
            campeonato_id: caso.campeonato_id ? caso.campeonato_id.toString() : '',
            fase_id: caso.fase_id ? caso.fase_id.toString() : '',
            numero_fecha: caso.numero_fecha ? caso.numero_fecha.toString() : '',
            asunto: caso.asunto || '',
            descripcion: caso.descripcion || '',
            fecha_citacion: caso.fecha_citacion ? caso.fecha_citacion.split('T')[0] : '',
            lugar_citacion: caso.lugar_citacion || 'Sede Oficial de la Asociación',
            fecha_inicio_inhabilitacion: caso.fecha_inicio_inhabilitacion || '',
            fecha_fin_inhabilitacion: caso.fecha_fin_inhabilitacion || '',
            estado: caso.estado,
            detalles_resolucion: caso.detalles_resolucion || '',
            observaciones: caso.observaciones || '',
        });
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCaso) {
            put(route('etica.update', editingCaso.id), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    resetForm();
                }
            });
        } else {
            post(route('etica.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    resetForm();
                }
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteConfirmId) return;
        router.delete(route('etica.destroy', deleteConfirmId), {
            onSuccess: () => setDeleteConfirmId(null)
        });
    };

    // Filtered casos
    const filteredCasos = casos.filter(c => {
        const matchesSearch = 
            (c.folio || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.asunto || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.nombre_involucrado && c.nombre_involucrado.toLowerCase().includes(search.toLowerCase())) ||
            (c.club?.name && c.club.name.toLowerCase().includes(search.toLowerCase())) ||
            (c.jugador?.nombre && c.jugador.nombre.toLowerCase().includes(search.toLowerCase()));

        const matchesEstado = !estadoFilter || c.estado === estadoFilter;
        const matchesTipo = !tipoFilter || c.tipo_oficio === tipoFilter;

        const matchesContextCamp = !contextCampeonatoId || c.campeonato_id?.toString() === contextCampeonatoId;
        const matchesContextFase = !contextFaseId || c.fase_id?.toString() === contextFaseId;
        const matchesContextFecha = !contextNumeroFecha || c.numero_fecha?.toString() === contextNumeroFecha;

        return matchesSearch && matchesEstado && matchesTipo && matchesContextCamp && matchesContextFase && matchesContextFecha;
    });

    // Pagination state (default 10)
    const [perPage, setPerPage] = useState<number | 'TODOS'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when any filter or perPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, estadoFilter, tipoFilter, contextCampeonatoId, contextFaseId, contextNumeroFecha, perPage]);

    const effectivePerPage = perPage === 'TODOS' ? (filteredCasos.length || 1) : Number(perPage);
    const totalPages = Math.ceil(filteredCasos.length / effectivePerPage) || 1;

    const paginatedCasos = useMemo(() => {
        if (perPage === 'TODOS') return filteredCasos;
        const start = (currentPage - 1) * effectivePerPage;
        return filteredCasos.slice(start, start + effectivePerPage);
    }, [filteredCasos, currentPage, effectivePerPage, perPage]);

    const startIndex = filteredCasos.length === 0 ? 0 : (currentPage - 1) * effectivePerPage + 1;
    const endIndex = perPage === 'TODOS' ? filteredCasos.length : Math.min(currentPage * effectivePerPage, filteredCasos.length);

    // Form dropdown helpers
    const formSelectedCamp = campeonatos.find(c => c.id?.toString() === data.campeonato_id);
    const formFases = formSelectedCamp ? formSelectedCamp.fases : [];
    const formSelectedFase = formFases.find(f => f.id?.toString() === data.fase_id);
    const formFechas = formSelectedFase ? Array.from({ length: formSelectedFase.cantidad_fechas || 0 }, (_, i) => i + 1) : [];

    const clubesMap = useMemo(() => {
        const map: Record<number, string> = {};
        clubes.forEach(c => { map[c.id] = c.name; });
        return map;
    }, [clubes]);

    const selectedJugadorObj = useMemo(() => {
        if (!data.jugador_id) return null;
        return jugadores.find(j => j.id?.toString() === data.jugador_id) || null;
    }, [data.jugador_id, jugadores]);

    const jugadoresFiltradosBusqueda = useMemo(() => {
        const term = normalizeText(jugadorSearch.trim());
        const rutClean = jugadorSearch.replace(/[^kK0-9]/g, '').toLowerCase();

        const basePool = data.club_id
            ? jugadores.filter(j => j.club_id != null && j.club_id.toString() === data.club_id)
            : jugadores;

        const matchesInPool = (pool: Jugador[]) => {
            if (!term) return pool.slice(0, 8);
            return pool.filter(j => {
                const matchNombre = normalizeText(j.nombre).includes(term);
                const jRutClean = (j.rut || '').replace(/[^kK0-9]/g, '').toLowerCase();
                const matchRut = (rutClean.length >= 2 && jRutClean.includes(rutClean)) || normalizeText(j.rut || '').includes(term);
                return matchNombre || matchRut;
            }).slice(0, 10);
        };

        const primaryResults = matchesInPool(basePool);
        // Si buscó por texto/RUT y no hay resultados en el club seleccionado, buscar en todos los clubes
        if (term && primaryResults.length === 0 && data.club_id) {
            return matchesInPool(jugadores);
        }
        return primaryResults;
    }, [jugadores, data.club_id, jugadorSearch]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold tracking-tight text-slate-900">Comité de Ética</h2>}
        >
            <Head title="Comité de Ética - Expedientes u Oficios" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">

                {/* Notification Toast */}
                {toast.show && (
                    <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between transition-all ${
                        toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <div className="flex items-center space-x-3">
                            {toast.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-red-500" />}
                            <span className="font-semibold text-sm">{toast.message}</span>
                        </div>
                        <button onClick={() => setToast({ show: false, message: '', type: null })} className="p-1 hover:opacity-70">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Comité de Ética</h1>
                                <p className="text-sm font-medium text-slate-500 mt-0.5">Gestión de expedientes éticos, citaciones, inhabilitaciones y resoluciones</p>
                            </div>
                        </div>

                        {canManage && (
                            <button
                                onClick={() => {
                                    resetForm();
                                    setIsFormOpen(true);
                                }}
                                className="inline-flex items-center justify-center px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 gap-2 shrink-0"
                            >
                                <Plus size={18} />
                                <span>Nuevo Expediente</span>
                            </button>
                        )}
                    </div>

                    {/* Contexto Activo de Trabajo */}
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                        <div className="flex items-center space-x-2 mb-3.5 ml-1">
                            <Trophy size={16} className="text-slate-400" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtrar por Contexto Torneo</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campeonato</label>
                                <select
                                    value={contextCampeonatoId}
                                    onChange={e => {
                                        setContextCampeonatoId(e.target.value);
                                        setContextFaseId('');
                                        setContextNumeroFecha('');
                                    }}
                                    className="w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                >
                                    <option value="">Todos los campeonatos</option>
                                    {campeonatos.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fase</label>
                                <select
                                    value={contextFaseId}
                                    onChange={e => {
                                        setContextFaseId(e.target.value);
                                        setContextNumeroFecha('');
                                    }}
                                    className="w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium disabled:opacity-50"
                                    disabled={!contextCampeonatoId}
                                >
                                    <option value="">Todas las fases</option>
                                    {fasesDisponibles.map(f => (
                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">N° Fecha</label>
                                <select
                                    value={contextNumeroFecha}
                                    onChange={e => setContextNumeroFecha(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium disabled:opacity-50"
                                    disabled={!contextFaseId}
                                >
                                    <option value="">Todas las fechas</option>
                                    {fechasDisponibles.map(num => (
                                        <option key={num} value={num}>Fecha {num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                            <Clock size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{casos.filter(c => c.estado === 'EN_INVESTIGACION').length}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">En Investigación</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                            <CalendarDays size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{casos.filter(c => c.estado === 'CITADO').length}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Citados</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
                            <ShieldAlert size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{casos.filter(c => c.estado === 'INHABILITADO').length}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Inhabilitados</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{casos.filter(c => c.estado === 'RESUELTO').length}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Resueltos</div>
                        </div>
                    </div>
                </div>

                {/* Filters & Table Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por folio, asunto, club o involucrado..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                            <select
                                value={tipoFilter}
                                onChange={e => setTipoFilter(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                            >
                                <option value="">Todos los Tipos de Oficio</option>
                                <option value="INVESTIGACION">Investigación</option>
                                <option value="CITACION">Citación</option>
                                <option value="INHABILITACION">Inhabilitación</option>
                                <option value="AMONESTACION">Carta de Amonestación</option>
                                <option value="RESOLUCION">Resolución</option>
                            </select>

                            <select
                                value={estadoFilter}
                                onChange={e => setEstadoFilter(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="EN_INVESTIGACION">En Investigación</option>
                                <option value="CITADO">Citado</option>
                                <option value="INHABILITADO">Inhabilitado</option>
                                <option value="AMONESTADO">Amonestado</option>
                                <option value="RESUELTO">Resuelto</option>
                                <option value="ARCHIVADO">Archivado</option>
                            </select>
                        </div>
                    </div>

                    {/* Cards View (Mobile & Tablet < 1024px) */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {paginatedCasos.map((caso: CasoEtica) => (
                            <div key={caso.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="font-black text-emerald-900 text-sm">{caso.folio}</span>
                                        <div className="mt-1">
                                            <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                                caso.tipo_oficio === 'INVESTIGACION'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : caso.tipo_oficio === 'CITACION'
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                        : caso.tipo_oficio === 'INHABILITACION'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                            : caso.tipo_oficio === 'AMONESTACION'
                                                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                                {caso.tipo_oficio === 'AMONESTACION' ? 'CARTA AMONESTACIÓN' : caso.tipo_oficio}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {caso.estado === 'EN_INVESTIGACION' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                                En Investigación
                                            </span>
                                        )}
                                        {caso.estado === 'CITADO' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                                Citado
                                            </span>
                                        )}
                                        {caso.estado === 'INHABILITADO' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/60">
                                                Inhabilitado
                                            </span>
                                        )}
                                        {caso.estado === 'AMONESTADO' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200/60">
                                                Amonestado
                                            </span>
                                        )}
                                        {caso.estado === 'RESUELTO' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                Resuelto
                                            </span>
                                        )}
                                        {caso.estado === 'ARCHIVADO' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                Archivado
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {caso.jugador ? (
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{caso.jugador.nombre}</div>
                                            <div className="text-xs text-slate-500 font-medium">Jugador • {caso.club?.name || 'Sin club'}</div>
                                        </div>
                                    ) : caso.nombre_involucrado ? (
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{caso.nombre_involucrado}</div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {caso.tipo_involucrado === 'TURNO'
                                                    ? `Turno (Director)${caso.club ? ` • ${caso.club.name}` : ''}`
                                                    : caso.tipo_involucrado === 'JUGADOR'
                                                        ? `Jugador • ${caso.club?.name || 'Sin club'}`
                                                        : `Dirigente${caso.club ? ` • ${caso.club.name}` : ''}`}
                                            </div>
                                        </div>
                                    ) : caso.club ? (
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{caso.club.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">Sanción / Caso al Club</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">General / Varios</span>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="font-semibold text-slate-800 text-xs">{caso.asunto}</div>
                                    {(caso.articulo_reglamento || caso.campeonato) && (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {caso.articulo_reglamento && (
                                                <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    {caso.articulo_reglamento}
                                                </span>
                                            )}
                                            {caso.campeonato && (
                                                <span className="text-[11px] text-slate-500">
                                                    {caso.campeonato.nombre} {caso.numero_fecha ? `• Fecha ${caso.numero_fecha}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <a
                                        href={route('etica.oficio', { id: caso.id, tipo: caso.tipo_oficio })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-xs"
                                    >
                                        <FileDown size={15} className="text-emerald-600 shrink-0" />
                                        <span>Descargar PDF</span>
                                    </a>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedCaso(caso)}
                                            className="w-9 h-9 rounded-xl text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 flex items-center justify-center transition-all"
                                            title="Ver Detalle"
                                        >
                                            <Eye size={17} />
                                        </button>
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(caso)}
                                                    className="w-9 h-9 rounded-xl text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 flex items-center justify-center transition-all"
                                                    title="Editar Expediente"
                                                >
                                                    <Edit2 size={17} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(caso.id)}
                                                    className="w-9 h-9 rounded-xl text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 flex items-center justify-center transition-all"
                                                    title="Eliminar Expediente"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredCasos.length === 0 && (
                            <div className="p-8 text-center text-slate-400">
                                <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-600 text-sm">No se encontraron expedientes de ética</p>
                            </div>
                        )}
                    </div>

                    {/* Table (Desktop) */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/60 border-b border-slate-100 tracking-wider">
                                <tr>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold whitespace-nowrap">Folio / Tipo</th>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold">Involucrado / Club</th>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold">Asunto</th>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold whitespace-nowrap">Estado</th>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold text-center whitespace-nowrap">Emitir Oficio PDF</th>
                                    <th className="px-4 lg:px-6 py-3.5 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedCasos.map((caso: CasoEtica) => (
                                    <tr key={caso.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                                            <div className="font-black text-emerald-900">{caso.folio}</div>
                                            <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border mt-1 whitespace-nowrap ${
                                                caso.tipo_oficio === 'INVESTIGACION'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : caso.tipo_oficio === 'CITACION'
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                        : caso.tipo_oficio === 'INHABILITACION'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                            : caso.tipo_oficio === 'AMONESTACION'
                                                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                                {caso.tipo_oficio === 'AMONESTACION' ? 'CARTA AMONESTACIÓN' : caso.tipo_oficio}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3.5">
                                            {caso.jugador ? (
                                                <div>
                                                    <div className="font-bold text-slate-900">{caso.jugador.nombre}</div>
                                                    <div className="text-xs text-slate-400 font-medium">Jugador • {caso.club?.name || 'Sin club'}</div>
                                                </div>
                                            ) : caso.nombre_involucrado ? (
                                                <div>
                                                    <div className="font-bold text-slate-900">{caso.nombre_involucrado}</div>
                                                    <div className="text-xs text-slate-400 font-medium">
                                                        {caso.tipo_involucrado === 'TURNO'
                                                            ? `Turno (Director de Turno)${caso.club ? ` • ${caso.club.name}` : ''}`
                                                            : caso.tipo_involucrado === 'JUGADOR'
                                                                ? `Jugador • ${caso.club?.name || 'Sin club'}`
                                                                : `Dirigente${caso.club ? ` • ${caso.club.name}` : ''}`}
                                                    </div>
                                                </div>
                                            ) : caso.club ? (
                                                <div>
                                                    <div className="font-bold text-slate-900">{caso.club.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium">Sanción / Caso al Club</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">General / Varios</span>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3.5">
                                            <div className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{caso.asunto}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {caso.articulo_reglamento && (
                                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                                        {caso.articulo_reglamento}
                                                    </span>
                                                )}
                                                {caso.campeonato && (
                                                    <span className="text-[11px] text-slate-400 truncate">
                                                        {caso.campeonato.nombre} {caso.numero_fecha ? `• Fecha ${caso.numero_fecha}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                                            {caso.estado === 'EN_INVESTIGACION' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
                                                    En Investigación
                                                </span>
                                            )}
                                            {caso.estado === 'CITADO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
                                                    Citado
                                                </span>
                                            )}
                                            {caso.estado === 'INHABILITADO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/60 whitespace-nowrap">
                                                    Inhabilitado
                                                </span>
                                            )}
                                            {caso.estado === 'AMONESTADO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200/60 whitespace-nowrap">
                                                    Amonestado
                                                </span>
                                            )}
                                            {caso.estado === 'RESUELTO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap">
                                                    Resuelto
                                                </span>
                                            )}
                                            {caso.estado === 'ARCHIVADO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                    Archivado
                                                </span>
                                            )}
                                        </td>

                                        {/* Botón de Emisión de Oficio PDF según el tipo/estado del caso */}
                                        <td className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">
                                            {caso.tipo_oficio === 'INVESTIGACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'INVESTIGACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all shadow-xs whitespace-nowrap shrink-0"
                                                    title="Descargar Oficio de Investigación PDF"
                                                >
                                                    <FileDown size={14} className="text-amber-600 shrink-0" />
                                                    <span>Oficio Investigación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'CITACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'CITACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-all shadow-xs whitespace-nowrap shrink-0"
                                                    title="Descargar Oficio de Citación PDF"
                                                >
                                                    <FileDown size={14} className="text-blue-600 shrink-0" />
                                                    <span>Oficio Citación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'INHABILITACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'INHABILITACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 transition-all shadow-xs whitespace-nowrap shrink-0"
                                                    title="Descargar Oficio de Inhabilitación PDF"
                                                >
                                                    <FileDown size={14} className="text-red-600 shrink-0" />
                                                    <span>Oficio Inhabilitación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'AMONESTACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'AMONESTACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 transition-all shadow-xs whitespace-nowrap shrink-0"
                                                    title="Descargar Carta de Amonestación PDF"
                                                >
                                                    <FileDown size={14} className="text-orange-600 shrink-0" />
                                                    <span>Carta Amonestación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'RESOLUCION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'RESOLUCION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all shadow-xs whitespace-nowrap shrink-0"
                                                    title="Descargar Oficio de Resolución PDF"
                                                >
                                                    <FileDown size={14} className="text-emerald-600 shrink-0" />
                                                    <span>Oficio Resolución</span>
                                                </a>
                                            )}
                                        </td>

                                        <td className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => setSelectedCaso(caso)}
                                                    className="w-8 h-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(caso)}
                                                            className="w-8 h-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"
                                                            title="Editar Expediente"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(caso.id)}
                                                            className="w-8 h-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"
                                                            title="Eliminar Expediente"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCasos.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                                            <p className="font-semibold text-slate-600 text-sm">No se encontraron expedientes de ética</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer de Paginación */}
                    <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
                            <span className="font-bold text-slate-700">Mostrar</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPerPage(val === 'TODOS' ? 'TODOS' : Number(val));
                                }}
                                className="rounded-xl border-slate-300 py-1.5 px-3 text-xs font-black text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 shadow-sm"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value="TODOS">Todos</option>
                            </select>
                            <span className="font-semibold text-slate-500">
                                • Mostrando {startIndex} a {endIndex} de {filteredCasos.length} expedientes
                            </span>
                        </div>

                        {perPage !== 'TODOS' && totalPages > 1 && (
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition-all shadow-sm"
                                    title="Página Anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                            currentPage === page
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition-all shadow-sm"
                                    title="Página Siguiente"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Crear / Editar Expediente */}
                <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="5xl">
                    <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col w-full overflow-hidden">
                        
                        {/* Header fijo */}
                        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-white shrink-0">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-600/20 shrink-0">
                                    <Scale size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                                        {editingCaso ? 'Editar Expediente de Ética' : 'Nuevo Expediente de Ética'}
                                    </h3>
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                                        Complete los 3 pasos simples para registrar el caso y emitir su documento oficial
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulario con cuerpo scrollable y pie fijo siempre visible */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5">
                            
                            {/* ── PASO 1: ¿QUÉ DOCUMENTO O ESTADO DESEA REGISTRAR? ── */}
                            <div className="p-3.5 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-sm shrink-0">
                                            1
                                        </span>
                                        <div>
                                            <h4 className="text-sm sm:text-base font-black text-slate-900">
                                                ¿Qué trámite u oficio desea emitir?
                                            </h4>
                                            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                                                Haga clic en una opción (el estado del caso se ajustará automáticamente)
                                            </p>
                                        </div>
                                    </div>
                                    {editingCaso && (
                                        <button
                                            type="button"
                                            onClick={() => setData(d => ({ ...d, estado: 'ARCHIVADO', tipo_oficio: 'RESOLUCION' }))}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                                data.estado === 'ARCHIVADO'
                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            📁 Marcar como Archivado
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                    {[
                                        {
                                            tipo: 'INVESTIGACION',
                                            estado: 'EN_INVESTIGACION',
                                            titulo: 'En Investigación',
                                            sub: 'Inicia investigación del caso',
                                            icon: Clock,
                                            activeClass: 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/30',
                                            iconClass: 'bg-amber-500 text-white',
                                            idleIconClass: 'bg-amber-100 text-amber-700',
                                        },
                                        {
                                            tipo: 'CITACION',
                                            estado: 'CITADO',
                                            titulo: 'Citación',
                                            sub: 'Cita a declarar a la sede',
                                            icon: CalendarDays,
                                            activeClass: 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/30',
                                            iconClass: 'bg-blue-600 text-white',
                                            idleIconClass: 'bg-blue-100 text-blue-700',
                                        },
                                        {
                                            tipo: 'INHABILITACION',
                                            estado: 'INHABILITADO',
                                            titulo: 'Inhabilitación',
                                            sub: 'Suspende temporalmente',
                                            icon: ShieldAlert,
                                            activeClass: 'border-red-600 bg-red-50 text-red-950 ring-2 ring-red-600/30',
                                            iconClass: 'bg-red-600 text-white',
                                            idleIconClass: 'bg-red-100 text-red-700',
                                        },
                                        {
                                            tipo: 'AMONESTACION',
                                            estado: 'AMONESTADO',
                                            titulo: 'Carta Amonestación',
                                            sub: 'Amonestación por escrito',
                                            icon: FileText,
                                            activeClass: 'border-orange-600 bg-orange-50 text-orange-950 ring-2 ring-orange-600/30',
                                            iconClass: 'bg-orange-600 text-white',
                                            idleIconClass: 'bg-orange-100 text-orange-700',
                                        },
                                        {
                                            tipo: 'RESOLUCION',
                                            estado: 'RESUELTO',
                                            titulo: 'Resolución Final',
                                            sub: 'Dictamen o fallo del comité',
                                            icon: CheckCircle2,
                                            activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30',
                                            iconClass: 'bg-emerald-600 text-white',
                                            idleIconClass: 'bg-emerald-100 text-emerald-700',
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = data.tipo_oficio === item.tipo && data.estado !== 'ARCHIVADO';
                                        return (
                                            <button
                                                key={item.tipo}
                                                type="button"
                                                onClick={() => setData(d => ({ ...d, tipo_oficio: item.tipo as any, estado: item.estado as any }))}
                                                className={`p-3 rounded-2xl border-2 text-left lg:text-center transition-all flex flex-row lg:flex-col items-center lg:justify-center gap-3 lg:gap-1.5 cursor-pointer overflow-hidden ${
                                                    isSelected
                                                        ? item.activeClass
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-xl shrink-0 transition-colors ${isSelected ? item.iconClass : item.idleIconClass}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="w-full min-w-0">
                                                    <div className="text-xs sm:text-[13px] font-black leading-tight">{item.titulo}</div>
                                                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">{item.sub}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── PASO 2: ¿A QUIÉN INVOLUCRA ESTE CASO? ── */}
                            <div className="p-3.5 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-sm shrink-0">
                                        2
                                    </span>
                                    <div>
                                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                                            ¿A quién involucra este expediente?
                                        </h4>
                                        <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                                            Elija si el caso es para un Jugador, un Dirigente, un Turno o directamente un Club
                                        </p>
                                    </div>
                                </div>

                                {/* Selector grande de Tipo de Involucrado (4 opciones) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsManualJugador(false);
                                            setData(d => ({ ...d, tipo_involucrado: 'JUGADOR', nombre_involucrado: '', rut_involucrado: '' }));
                                        }}
                                        className={`py-2.5 px-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                            data.tipo_involucrado === 'JUGADOR'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                                        }`}
                                    >
                                        <User size={16} className="shrink-0" />
                                        <span className="truncate">Jugador</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(d => ({ ...d, tipo_involucrado: 'DIRIGENTE', jugador_id: '' }));
                                        }}
                                        className={`py-2.5 px-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                            data.tipo_involucrado === 'DIRIGENTE'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                                        }`}
                                    >
                                        <User size={16} className="shrink-0" />
                                        <span className="truncate">Dirigente</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(d => ({ ...d, tipo_involucrado: 'TURNO', jugador_id: '' }));
                                        }}
                                        className={`py-2.5 px-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                            data.tipo_involucrado === 'TURNO'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                                        }`}
                                    >
                                        <FileText size={16} className="shrink-0" />
                                        <span className="truncate">Turno</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(d => ({ ...d, tipo_involucrado: 'CLUB', jugador_id: '', nombre_involucrado: '', rut_involucrado: '' }));
                                        }}
                                        className={`py-2.5 px-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                            data.tipo_involucrado === 'CLUB'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                                        }`}
                                    >
                                        <Building2 size={16} className="shrink-0" />
                                        <span className="truncate">Club Deportivo</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
                                    {/* Selección de Club */}
                                    <div className={data.tipo_involucrado === 'CLUB' ? 'lg:col-span-12' : 'lg:col-span-4'}>
                                        <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1.5">
                                            {data.tipo_involucrado === 'TURNO' ? 'Club (Opcional)' : '1° Seleccione el Club *'}
                                        </label>
                                        <select
                                            value={data.club_id}
                                            onChange={e => {
                                                const newClubId = e.target.value;
                                                setData(d => ({
                                                    ...d,
                                                    club_id: newClubId,
                                                    jugador_id: '',
                                                    ...(d.tipo_involucrado === 'JUGADOR' && !isManualJugador ? { nombre_involucrado: '', rut_involucrado: '' } : {}),
                                                }));
                                            }}
                                            className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 sm:py-3 px-3.5 shadow-sm"
                                        >
                                            <option value="">
                                                {data.tipo_involucrado === 'TURNO'
                                                    ? 'Sin club (Opcional)'
                                                    : 'Seleccione un Club...'}
                                            </option>
                                            {clubes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                                            {data.tipo_involucrado === 'JUGADOR'
                                                ? 'Puede elegir el club primero o buscar directamente al jugador por nombre/RUT.'
                                                : data.tipo_involucrado === 'TURNO'
                                                    ? 'Opcional: Seleccione el club si el Director de Turno representa a un club específico.'
                                                    : 'Institución deportiva a la que pertenece o se dirige el oficio.'}
                                        </p>
                                    </div>

                                    {/* Buscador Inteligente de Jugador (para +400 jugadores) */}
                                    {data.tipo_involucrado === 'JUGADOR' && (
                                        <div className="lg:col-span-8 space-y-3">
                                            {selectedJugadorObj && !isManualJugador ? (
                                                /* Tarjeta clara cuando ya eligió un jugador de la lista */
                                                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                                                            <CheckCircle2 size={22} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                                                                ✓ Jugador Seleccionado
                                                            </div>
                                                            <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                                                                {selectedJugadorObj.nombre}
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-600 truncate">
                                                                RUT: <span className="text-slate-900">{selectedJugadorObj.rut || 'Sin RUT'}</span>
                                                                {selectedJugadorObj.club_id && clubesMap[selectedJugadorObj.club_id] && (
                                                                    <> • Club: <span className="text-emerald-800">{clubesMap[selectedJugadorObj.club_id]}</span></>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setJugadorSearch('');
                                                            setData(d => ({ ...d, jugador_id: '', nombre_involucrado: '', rut_involucrado: '' }));
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-extrabold transition-all shrink-0 shadow-xs cursor-pointer text-center"
                                                    >
                                                        Cambiar Jugador
                                                    </button>
                                                </div>
                                            ) : !isManualJugador ? (
                                                /* Buscador en vivo por Nombre o RUT */
                                                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-300 shadow-sm space-y-3">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <label className="block text-xs font-extrabold text-slate-800 uppercase">
                                                            2° Buscar Jugador (Escriba Nombre, Apellido o RUT) *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsManualJugador(true);
                                                                setData(d => ({ ...d, jugador_id: '' }));
                                                            }}
                                                            className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                                                        >
                                                            ¿No aparece en el sistema? Escribir manualmente
                                                        </button>
                                                    </div>

                                                    <div className="relative">
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                                                        <input
                                                            type="text"
                                                            value={jugadorSearch}
                                                            onChange={e => setJugadorSearch(e.target.value)}
                                                            placeholder="Ej: Escriba 'Juan', 'Pérez' o '12345678' para buscar rápido..."
                                                            className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-emerald-500/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                                                        />
                                                        {jugadorSearch && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setJugadorSearch('')}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                                                title="Limpiar búsqueda"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Lista de resultados rápida y fácil de presionar */}
                                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                                                        <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
                                                            <span>
                                                                {jugadorSearch.trim()
                                                                    ? `Resultados encontrados (${jugadoresFiltradosBusqueda.length})`
                                                                    : data.club_id
                                                                        ? `Jugadores del club seleccionado (haga clic en uno o escriba arriba para filtrar)`
                                                                        : `Haga clic en un jugador de la lista o escriba arriba para buscar entre los ${jugadores.length} inscritos`}
                                                            </span>
                                                        </div>

                                                        {jugadoresFiltradosBusqueda.length > 0 ? (
                                                            <div className="max-h-44 overflow-y-auto divide-y divide-slate-200/70 bg-white">
                                                                {jugadoresFiltradosBusqueda.map(j => (
                                                                    <button
                                                                        key={j.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setData(d => ({
                                                                                ...d,
                                                                                jugador_id: j.id.toString(),
                                                                                club_id: j.club_id ? j.club_id.toString() : d.club_id,
                                                                                nombre_involucrado: j.nombre,
                                                                                rut_involucrado: j.rut,
                                                                            }));
                                                                        }}
                                                                        className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="text-sm font-black text-slate-900 group-hover:text-emerald-800 truncate">
                                                                                {j.nombre}
                                                                            </div>
                                                                            <div className="text-xs font-semibold text-slate-500 truncate">
                                                                                RUT: {j.rut || 'Sin RUT'}
                                                                                {j.club_id && clubesMap[j.club_id] && (
                                                                                    <span className="ml-2 text-emerald-700 font-bold">
                                                                                        • {clubesMap[j.club_id]}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white text-xs font-extrabold transition-colors shrink-0">
                                                                            Elegir
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 text-center space-y-2 bg-white">
                                                                <p className="text-xs font-bold text-slate-600">
                                                                    No se encontró ningún jugador con "{jugadorSearch}".
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsManualJugador(true);
                                                                        setData(d => ({
                                                                            ...d,
                                                                            jugador_id: '',
                                                                            nombre_involucrado: /[a-zA-Z]/.test(jugadorSearch) ? jugadorSearch : d.nombre_involucrado,
                                                                            rut_involucrado: /[0-9]/.test(jugadorSearch) ? formatRutChileno(jugadorSearch) : d.rut_involucrado,
                                                                        }));
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                                                                >
                                                                    <Plus size={15} />
                                                                    <span>Ingresar a "{jugadorSearch}" manualmente</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Modo Manual Limpio (cuando el jugador no está en los 400 inscritos) */
                                                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 space-y-3 shadow-sm">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                                                            ✏️ Ingresar datos del Jugador manualmente
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsManualJugador(false);
                                                                setJugadorSearch('');
                                                            }}
                                                            className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                                                        >
                                                            ← Volver al buscador de jugadores inscritos
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                                Nombre y Apellidos del Jugador *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={data.nombre_involucrado}
                                                                onChange={e => setData(d => ({ ...d, jugador_id: '', nombre_involucrado: e.target.value }))}
                                                                placeholder="Ej: Carlos Silva Rojas"
                                                                className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                                RUT del Jugador (Opcional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={data.rut_involucrado}
                                                                onChange={e => setData(d => ({ ...d, rut_involucrado: formatRutChileno(e.target.value) }))}
                                                                placeholder="Ej: 12.345.678-9"
                                                                className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Campos para Dirigente o Turno */}
                                    {(data.tipo_involucrado === 'DIRIGENTE' || data.tipo_involucrado === 'TURNO') && (
                                        <div className="lg:col-span-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1.5">
                                                        {data.tipo_involucrado === 'TURNO'
                                                            ? 'Nombre y Apellido del Turno *'
                                                            : 'Nombre y Apellido del Dirigente *'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.nombre_involucrado}
                                                        onChange={e => setData('nombre_involucrado', e.target.value)}
                                                        placeholder={data.tipo_involucrado === 'TURNO' ? 'Ej: Pedro Muñoz Soto' : 'Ej: Juan Pérez González'}
                                                        className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1.5">
                                                        {data.tipo_involucrado === 'TURNO'
                                                            ? 'RUT del Turno (Opcional)'
                                                            : 'RUT del Dirigente (Opcional)'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.rut_involucrado}
                                                        onChange={e => setData('rut_involucrado', formatRutChileno(e.target.value))}
                                                        placeholder="Ej: 12.345.678-9"
                                                        className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── PASO 3: MOTIVO Y DETALLES DEL DOCUMENTO ── */}
                            <div className="p-3.5 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-sm shrink-0">
                                        3
                                    </span>
                                    <div>
                                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                                            Motivo y Detalles del Documento
                                        </h4>
                                        <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                                            Indique el motivo del oficio y los detalles que aparecerán impresos en el PDF
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                    {/* Referencia / Motivo (Ancho amplio de 8 columnas para que nunca se corte) */}
                                    <div className="lg:col-span-8">
                                        <div className="flex justify-between items-center flex-wrap gap-2 mb-1.5">
                                            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                                                Motivo o Referencia del Oficio (REF:) *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreandoReferencia(!isCreandoReferencia)}
                                                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                <span>Guardar nuevo motivo frecuente</span>
                                            </button>
                                        </div>

                                        {isCreandoReferencia && (
                                            <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                                <input
                                                    type="text"
                                                    value={nuevaReferencia}
                                                    onChange={e => setNuevaReferencia(e.target.value)}
                                                    placeholder="Escriba el nuevo motivo frecuente para dejarlo guardado..."
                                                    className="flex-1 rounded-lg border-emerald-300 text-sm font-bold text-slate-900 py-2 px-3 focus:ring-2 focus:ring-emerald-600"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleGuardarNuevaReferencia}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm"
                                                    >
                                                        Guardar en la lista
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCreandoReferencia(false)}
                                                        className="p-2 text-slate-500 hover:text-slate-700 font-bold text-xs"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <select
                                                value={esMotivoPersonalizado ? 'OTRO' : (referencias.some(r => r.nombre === data.asunto) ? data.asunto : (data.asunto ? 'OTRO' : ''))}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === 'OTRO') {
                                                        setEsMotivoPersonalizado(true);
                                                        if (referencias.some(r => r.nombre === data.asunto)) {
                                                            setData('asunto', '');
                                                        }
                                                    } else {
                                                        setEsMotivoPersonalizado(false);
                                                        setData('asunto', val);
                                                    }
                                                }}
                                                className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3.5 shadow-xs"
                                            >
                                                <option value="">-- Seleccione un motivo frecuente o escriba uno --</option>
                                                {referencias.map(r => (
                                                    <option key={r.id} value={r.nombre}>REF: {r.nombre}</option>
                                                ))}
                                                <option value="OTRO">✏️ Escribir un motivo personalizado...</option>
                                            </select>

                                            {(esMotivoPersonalizado || (data.asunto !== '' && !referencias.some(r => r.nombre === data.asunto))) && (
                                                <input
                                                    type="text"
                                                    value={data.asunto}
                                                    onChange={e => setData('asunto', e.target.value)}
                                                    placeholder="Escriba aquí el motivo o asunto (Ej: Citación por incidente en cancha)..."
                                                    className="w-full rounded-xl border border-emerald-400 bg-emerald-50/30 text-sm font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 py-2.5 px-3.5 placeholder:text-slate-400 placeholder:font-normal shadow-xs"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Artículo Reglamento (4 columnas) */}
                                    <div className="lg:col-span-4">
                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                                            Artículo Reglamento (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.articulo_reglamento}
                                            onChange={e => setData('articulo_reglamento', e.target.value)}
                                            placeholder="Ej: Art. 15 Inc. B"
                                            className="w-full rounded-xl border-slate-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3.5 placeholder:text-slate-400 placeholder:font-normal shadow-xs"
                                        />
                                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                                            Solo si desea citar un artículo específico.
                                        </p>
                                    </div>
                                </div>

                                {/* Sección Dinámica destacada según el Paso 1 */}
                                {data.tipo_oficio === 'CITACION' && (
                                    <div className="p-3.5 sm:p-4 bg-blue-50/90 rounded-2xl border-2 border-blue-200 space-y-3 shadow-xs">
                                        <div className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <CalendarDays size={17} className="text-blue-600 shrink-0" />
                                            <span>Datos para la Citación (Aparecerán destacados en el PDF)</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                    Fecha y Hora de la Citación *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.fecha_citacion}
                                                    onChange={e => setData('fecha_citacion', e.target.value)}
                                                    className="w-full rounded-xl border-blue-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-600 bg-white py-2.5 px-3"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                    Lugar de Citación
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.lugar_citacion}
                                                    onChange={e => setData('lugar_citacion', e.target.value)}
                                                    placeholder="Sede Oficial de la Asociación"
                                                    className="w-full rounded-xl border-blue-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-600 bg-white py-2.5 px-3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {data.tipo_oficio === 'INHABILITACION' && (
                                    <div className="p-3.5 sm:p-4 bg-red-50/90 rounded-2xl border-2 border-red-200 space-y-3 shadow-xs">
                                        <div className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldAlert size={17} className="text-red-600 shrink-0" />
                                            <span>Período de Inhabilitación</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                    Fecha de Inicio
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.fecha_inicio_inhabilitacion}
                                                    onChange={e => setData('fecha_inicio_inhabilitacion', e.target.value)}
                                                    className="w-full rounded-xl border-red-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-red-600 bg-white py-2.5 px-3"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                                                    Fecha de Término (Dejar vacío si es indefinida)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.fecha_fin_inhabilitacion}
                                                    onChange={e => setData('fecha_fin_inhabilitacion', e.target.value)}
                                                    className="w-full rounded-xl border-red-300 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-red-600 bg-white py-2.5 px-3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {data.tipo_oficio === 'AMONESTACION' && (
                                    <div className="p-3.5 sm:p-4 bg-orange-50/90 rounded-2xl border-2 border-orange-200 space-y-2 shadow-xs">
                                        <div className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText size={17} className="text-orange-600 shrink-0" />
                                            <span>Observación o Detalle de la Amonestación Escrita (Opcional)</span>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={data.detalles_resolucion}
                                            onChange={e => setData('detalles_resolucion', e.target.value)}
                                            placeholder="Escriba aquí alguna observación o advertencia específica para incluir en la Carta de Amonestación..."
                                            className="w-full rounded-xl border-orange-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-orange-600 bg-white py-2.5 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>
                                )}

                                {data.tipo_oficio === 'RESOLUCION' && (
                                    <div className="p-3.5 sm:p-4 bg-emerald-50/90 rounded-2xl border-2 border-emerald-200 space-y-2 shadow-xs">
                                        <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                                            <span>Dictamen / Fallo Final de la Resolución *</span>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={data.detalles_resolucion}
                                            onChange={e => setData('detalles_resolucion', e.target.value)}
                                            placeholder="Escriba aquí lo resuelto por el Comité (Ej: Se aplica amonestación por escrito / Queda habilitado para jugar)..."
                                            className="w-full rounded-xl border-emerald-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                                        Descripción o Antecedentes del Caso (Opcional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.descripcion}
                                        onChange={e => setData('descripcion', e.target.value)}
                                        placeholder="Resumen breve de los hechos o antecedentes adicionales..."
                                        className="w-full rounded-xl border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3.5 placeholder:text-slate-400 placeholder:font-normal"
                                    />
                                </div>

                                {/* Torneo / Campeonato (Opcional y desplegable para no saturar la pantalla) */}
                                <div className="pt-2 border-t border-slate-200/80">
                                    <button
                                        type="button"
                                        onClick={() => setShowTorneoOpcional(!showTorneoOpcional)}
                                        className="flex items-center justify-between w-full text-left py-1.5 text-xs font-extrabold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Trophy size={15} className="text-emerald-600 shrink-0" />
                                            <span>
                                                ¿Desea vincular este caso a un Campeonato o Fecha específica? (Opcional)
                                                {data.campeonato_id && ' — ✓ Vinculado'}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform shrink-0 ${showTorneoOpcional ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {showTorneoOpcional && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Campeonato</label>
                                                <select
                                                    value={data.campeonato_id}
                                                    onChange={e => {
                                                        setData(d => ({ ...d, campeonato_id: e.target.value, fase_id: '', numero_fecha: '' }));
                                                    }}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5"
                                                >
                                                    <option value="">Ninguno / General...</option>
                                                    {campeonatos.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fase</label>
                                                <select
                                                    value={data.fase_id}
                                                    onChange={e => {
                                                        setData(d => ({ ...d, fase_id: e.target.value, numero_fecha: '' }));
                                                    }}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5 disabled:opacity-50"
                                                    disabled={!data.campeonato_id}
                                                >
                                                    <option value="">Todas / Sin fase...</option>
                                                    {formFases.map(f => (
                                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                                <select
                                                    value={data.numero_fecha}
                                                    onChange={e => setData('numero_fecha', e.target.value)}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5 disabled:opacity-50"
                                                    disabled={!data.fase_id}
                                                >
                                                    <option value="">Sin fecha...</option>
                                                    {formFechas.map(num => (
                                                        <option key={num} value={num}>Fecha {num}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>

                            {/* Footer fijo siempre visible en PC, Notebook y Celular */}
                            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer text-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto px-8 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer text-center"
                                >
                                    {editingCaso ? 'Guardar Cambios' : 'Crear Expediente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Modal Ver Detalle Expediente */}
                <Modal show={!!selectedCaso} onClose={() => setSelectedCaso(null)} maxWidth="md">
                    {selectedCaso && (
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">{selectedCaso.folio}</div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{selectedCaso.asunto}</h3>
                                </div>
                                <button onClick={() => setSelectedCaso(null)} className="p-1 text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Involucrado / Club</div>
                                    <div className="font-bold text-slate-900 mt-1">
                                        {selectedCaso.jugador ? selectedCaso.jugador.nombre : selectedCaso.nombre_involucrado || 'General'}
                                    </div>
                                    {selectedCaso.club && <div className="text-xs text-slate-500">Club: {selectedCaso.club.name}</div>}
                                </div>

                                {selectedCaso.descripcion && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Descripción / Antecedentes</div>
                                        <div className="font-medium text-slate-700 mt-1">{selectedCaso.descripcion}</div>
                                    </div>
                                )}

                                {selectedCaso.detalles_resolucion && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="text-[10px] font-bold text-emerald-800 uppercase">Dictamen de Resolución</div>
                                        <div className="font-semibold text-emerald-950 mt-1">{selectedCaso.detalles_resolucion}</div>
                                    </div>
                                )}

                                <div className="pt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Emitir Documento Oficial PDF:</div>
                                <div>
                                    {selectedCaso.tipo_oficio === 'INVESTIGACION' && (
                                        <a
                                            href={route('etica.oficio', { id: selectedCaso.id, tipo: 'INVESTIGACION' })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 rounded-xl bg-amber-50 text-amber-900 font-extrabold border border-amber-300 text-center text-xs hover:bg-amber-100 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FileDown size={16} className="text-amber-600" />
                                            <span>Descargar Oficio de Investigación PDF</span>
                                        </a>
                                    )}
                                    {selectedCaso.tipo_oficio === 'CITACION' && (
                                        <a
                                            href={route('etica.oficio', { id: selectedCaso.id, tipo: 'CITACION' })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 rounded-xl bg-blue-50 text-blue-900 font-extrabold border border-blue-300 text-center text-xs hover:bg-blue-100 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FileDown size={16} className="text-blue-600" />
                                            <span>Descargar Oficio de Citación PDF</span>
                                        </a>
                                    )}
                                    {selectedCaso.tipo_oficio === 'INHABILITACION' && (
                                        <a
                                            href={route('etica.oficio', { id: selectedCaso.id, tipo: 'INHABILITACION' })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 rounded-xl bg-red-50 text-red-900 font-extrabold border border-red-300 text-center text-xs hover:bg-red-100 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FileDown size={16} className="text-red-600" />
                                            <span>Descargar Oficio de Inhabilitación PDF</span>
                                        </a>
                                    )}
                                    {selectedCaso.tipo_oficio === 'AMONESTACION' && (
                                        <a
                                            href={route('etica.oficio', { id: selectedCaso.id, tipo: 'AMONESTACION' })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 rounded-xl bg-orange-50 text-orange-900 font-extrabold border border-orange-300 text-center text-xs hover:bg-orange-100 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FileDown size={16} className="text-orange-600" />
                                            <span>Descargar Carta de Amonestación PDF</span>
                                        </a>
                                    )}
                                    {selectedCaso.tipo_oficio === 'RESOLUCION' && (
                                        <a
                                            href={route('etica.oficio', { id: selectedCaso.id, tipo: 'RESOLUCION' })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 rounded-xl bg-emerald-50 text-emerald-900 font-extrabold border border-emerald-300 text-center text-xs hover:bg-emerald-100 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FileDown size={16} className="text-emerald-600" />
                                            <span>Descargar Oficio de Resolución PDF</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Modal Confirm Delete */}
                <Modal show={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="sm">
                    <div className="p-6 text-center">
                        <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
                        <h4 className="text-lg font-bold text-slate-900">¿Eliminar expediente de ética?</h4>
                        <p className="text-sm text-slate-500 mt-1">Esta acción no se puede deshacer.</p>
                        <div className="mt-6 flex items-center justify-center space-x-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>

            </div>
        </AuthenticatedLayout>
    );
}
