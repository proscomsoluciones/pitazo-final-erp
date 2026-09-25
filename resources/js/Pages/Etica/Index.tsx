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
    tipo_oficio: 'INVESTIGACION' | 'CITACION' | 'INHABILITACION' | 'RESOLUCION';
    tipo_involucrado: 'JUGADOR' | 'DIRIGENTE' | 'CLUB';
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
    estado: 'EN_INVESTIGACION' | 'CITADO' | 'INHABILITADO' | 'RESUELTO' | 'ARCHIVADO';
    detalles_resolucion: string | null;
    observaciones: string | null;
    created_at: string;
    club?: { id: number; name: string };
    jugador?: { id: number; nombre: string; rut: string };
    campeonato?: { id: number; nombre: string };
    fase?: { id: number; nombre: string };
}

interface Club { id: number; name: string }
interface Jugador { id: number; nombre: string; rut: string; club_id: number }
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

    const handleGuardarNuevaReferencia = () => {
        if (!nuevaReferencia.trim()) return;
        router.post(route('referencias-oficio.store'), {
            nombre: nuevaReferencia.trim(),
            modulo: 'ETICA'
        }, {
            onSuccess: () => {
                setData('asunto', nuevaReferencia.trim());
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
        tipo_oficio: 'INVESTIGACION' as 'INVESTIGACION' | 'CITACION' | 'INHABILITACION' | 'RESOLUCION',
        tipo_involucrado: 'JUGADOR' as 'JUGADOR' | 'DIRIGENTE' | 'CLUB',
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
        estado: 'EN_INVESTIGACION' as 'EN_INVESTIGACION' | 'CITADO' | 'INHABILITADO' | 'RESUELTO' | 'ARCHIVADO',
        detalles_resolucion: '',
        observaciones: '',
    });

    const resetForm = () => {
        clearErrors();
        setEditingCaso(null);
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
        setEditingCaso(caso);
        setData({
            tipo_oficio: caso.tipo_oficio,
            tipo_involucrado: caso.tipo_involucrado || (caso.jugador_id ? 'JUGADOR' : caso.nombre_involucrado ? 'DIRIGENTE' : 'CLUB'),
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
            c.folio.toLowerCase().includes(search.toLowerCase()) ||
            c.asunto.toLowerCase().includes(search.toLowerCase()) ||
            (c.nombre_involucrado && c.nombre_involucrado.toLowerCase().includes(search.toLowerCase())) ||
            (c.club && c.club.name.toLowerCase().includes(search.toLowerCase())) ||
            (c.jugador && c.jugador.nombre.toLowerCase().includes(search.toLowerCase()));

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
    const formSelectedCamp = campeonatos.find(c => c.id.toString() === data.campeonato_id);
    const formFases = formSelectedCamp ? formSelectedCamp.fases : [];
    const formSelectedFase = formFases.find(f => f.id.toString() === data.fase_id);
    const formFechas = formSelectedFase ? Array.from({ length: formSelectedFase.cantidad_fechas || 0 }, (_, i) => i + 1) : [];

    const formJugadoresDisponibles = data.club_id 
        ? jugadores.filter(j => j.club_id.toString() === data.club_id)
        : jugadores;

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
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por folio, asunto, club o involucrado..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={tipoFilter}
                                onChange={e => setTipoFilter(e.target.value)}
                                className="rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                            >
                                <option value="">Todos los Tipos de Oficio</option>
                                <option value="INVESTIGACION">Investigación</option>
                                <option value="CITACION">Citación</option>
                                <option value="INHABILITACION">Inhabilitación</option>
                                <option value="RESOLUCION">Resolución</option>
                            </select>

                            <select
                                value={estadoFilter}
                                onChange={e => setEstadoFilter(e.target.value)}
                                className="rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="EN_INVESTIGACION">En Investigación</option>
                                <option value="CITADO">Citado</option>
                                <option value="INHABILITADO">Inhabilitado</option>
                                <option value="RESUELTO">Resuelto</option>
                                <option value="ARCHIVADO">Archivado</option>
                            </select>
                        </div>
                    </div>

                    {/* Table (Desktop) */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/60 border-b border-slate-100 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Folio / Tipo</th>
                                    <th className="px-6 py-4 font-bold">Involucrado / Club</th>
                                    <th className="px-6 py-4 font-bold">Asunto</th>
                                    <th className="px-6 py-4 font-bold">Estado</th>
                                    <th className="px-6 py-4 font-bold text-center">Emitir Oficio PDF</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedCasos.map((caso: CasoEtica) => (
                                    <tr key={caso.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-emerald-900">{caso.folio}</div>
                                            <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border mt-1 ${
                                                caso.tipo_oficio === 'INVESTIGACION'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : caso.tipo_oficio === 'CITACION'
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                        : caso.tipo_oficio === 'INHABILITACION'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                                {caso.tipo_oficio}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {caso.jugador ? (
                                                <div>
                                                    <div className="font-bold text-slate-900">{caso.jugador.nombre}</div>
                                                    <div className="text-xs text-slate-400 font-medium">Jugador • {caso.club?.name || 'Sin club'}</div>
                                                </div>
                                            ) : caso.nombre_involucrado ? (
                                                <div>
                                                    <div className="font-bold text-slate-900">{caso.nombre_involucrado}</div>
                                                    <div className="text-xs text-slate-400 font-medium">{caso.club ? `Club: ${caso.club.name}` : 'Involucrado Directiva/Ext'}</div>
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
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{caso.asunto}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {caso.articulo_reglamento && (
                                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {caso.articulo_reglamento}
                                                    </span>
                                                )}
                                                {caso.campeonato && (
                                                    <span className="text-[11px] text-slate-400">
                                                        {caso.campeonato.nombre} {caso.numero_fecha ? `• Fecha ${caso.numero_fecha}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {caso.estado === 'EN_INVESTIGACION' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                                    En Investigación
                                                </span>
                                            )}
                                            {caso.estado === 'CITADO' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                                    Citado
                                                </span>
                                            )}
                                            {caso.estado === 'INHABILITADO' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/60">
                                                    Inhabilitado
                                                </span>
                                            )}
                                            {caso.estado === 'RESUELTO' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    Resuelto
                                                </span>
                                            )}
                                            {caso.estado === 'ARCHIVADO' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    Archivado
                                                </span>
                                            )}
                                        </td>

                                        {/* Botón de Emisión de Oficio PDF según el tipo/estado del caso */}
                                        <td className="px-6 py-4 text-center">
                                            {caso.tipo_oficio === 'INVESTIGACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'INVESTIGACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all shadow-sm"
                                                    title="Descargar Oficio de Investigación PDF"
                                                >
                                                    <FileDown size={14} className="text-amber-600" />
                                                    <span>Oficio Investigación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'CITACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'CITACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-all shadow-sm"
                                                    title="Descargar Oficio de Citación PDF"
                                                >
                                                    <FileDown size={14} className="text-blue-600" />
                                                    <span>Oficio Citación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'INHABILITACION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'INHABILITACION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 transition-all shadow-sm"
                                                    title="Descargar Oficio de Inhabilitación PDF"
                                                >
                                                    <FileDown size={14} className="text-red-600" />
                                                    <span>Oficio Inhabilitación</span>
                                                </a>
                                            )}
                                            {caso.tipo_oficio === 'RESOLUCION' && (
                                                <a
                                                    href={route('etica.oficio', { id: caso.id, tipo: 'RESOLUCION' })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all shadow-sm"
                                                    title="Descargar Oficio de Resolución PDF"
                                                >
                                                    <FileDown size={14} className="text-emerald-600" />
                                                    <span>Oficio Resolución</span>
                                                </a>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
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
                    <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl max-h-[88vh] flex flex-col w-full">
                        
                        {/* Header fijo */}
                        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {editingCaso ? 'Editar Expediente de Ética' : 'Nuevo Expediente de Ética'}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 mt-0.5">Gestión integral de expedientes disciplinarios y emisión de oficios</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cuerpo scrollable con distribución equilibrada */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
                            
                            {/* BLOQUE SUPERIOR 1: Clasificación y Contexto del Torneo (Full Width) */}
                            <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-4 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Tipo de Oficio */}
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">Tipo de Oficio *</label>
                                        <select
                                            value={data.tipo_oficio}
                                            onChange={e => {
                                                const val = e.target.value;
                                                let nuevoEstado = data.estado;
                                                if (val === 'INVESTIGACION') nuevoEstado = 'EN_INVESTIGACION';
                                                if (val === 'CITACION') nuevoEstado = 'CITADO';
                                                if (val === 'INHABILITACION') nuevoEstado = 'INHABILITADO';
                                                if (val === 'RESOLUCION') nuevoEstado = 'RESUELTO';
                                                setData(d => ({ ...d, tipo_oficio: val as any, estado: nuevoEstado as any }));
                                            }}
                                            className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 bg-white py-2.5 px-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
                                        >
                                            <option value="INVESTIGACION">Oficio por Investigación</option>
                                            <option value="CITACION">Oficio por Citación</option>
                                            <option value="INHABILITACION">Oficio por Inhabilitación</option>
                                            <option value="RESOLUCION">Oficio de Resolución</option>
                                        </select>
                                    </div>

                                    {/* Estado del Caso */}
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">Estado del Caso *</label>
                                        <select
                                            value={data.estado}
                                            onChange={e => {
                                                const val = e.target.value;
                                                let nuevoTipoOficio = data.tipo_oficio;
                                                if (val === 'EN_INVESTIGACION') nuevoTipoOficio = 'INVESTIGACION';
                                                if (val === 'CITADO') nuevoTipoOficio = 'CITACION';
                                                if (val === 'INHABILITADO') nuevoTipoOficio = 'INHABILITACION';
                                                if (val === 'RESUELTO' || val === 'ARCHIVADO') nuevoTipoOficio = 'RESOLUCION';
                                                setData(d => ({ ...d, estado: val as any, tipo_oficio: nuevoTipoOficio as any }));
                                            }}
                                            className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 bg-white py-2.5 px-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
                                        >
                                            <option value="EN_INVESTIGACION">En Investigación</option>
                                            <option value="CITADO">Citado</option>
                                            <option value="INHABILITADO">Inhabilitado</option>
                                            <option value="RESUELTO">Resuelto</option>
                                            <option value="ARCHIVADO">Archivado</option>
                                        </select>
                                    </div>

                                    {/* Torneo / Fase / Fecha Context */}
                                    <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                                        <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                            <Trophy size={16} className="text-emerald-600" />
                                            <span>Torneo / Campeonato (Opcional)</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <select
                                                    value={data.campeonato_id}
                                                    onChange={e => {
                                                        setData('campeonato_id', e.target.value);
                                                        setData('fase_id', '');
                                                        setData('numero_fecha', '');
                                                    }}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5"
                                                >
                                                    <option value="">Campeonato...</option>
                                                    {campeonatos.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <select
                                                    value={data.fase_id}
                                                    onChange={e => {
                                                        setData('fase_id', e.target.value);
                                                        setData('numero_fecha', '');
                                                    }}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5 disabled:opacity-50"
                                                    disabled={!data.campeonato_id}
                                                >
                                                    <option value="">Fase...</option>
                                                    {formFases.map(f => (
                                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <select
                                                    value={data.numero_fecha}
                                                    onChange={e => setData('numero_fecha', e.target.value)}
                                                    className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5 disabled:opacity-50"
                                                    disabled={!data.fase_id}
                                                >
                                                    <option value="">Fecha...</option>
                                                    {formFechas.map(num => (
                                                        <option key={num} value={num}>Fecha {num}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOQUE PRINCIPAL EN 2 COLUMNAS EQUILIBRADAS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                
                                {/* COLUMNA 1: Sujeto / Entidad Sancionada */}
                                <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">Entidad / Sujeto Sancionado *</label>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData(d => ({ ...d, tipo_involucrado: 'JUGADOR', nombre_involucrado: '', rut_involucrado: '' }));
                                            }}
                                            className={`py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                                data.tipo_involucrado === 'JUGADOR' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
                                            }`}
                                        >
                                            Jugador
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData(d => ({ ...d, tipo_involucrado: 'DIRIGENTE', jugador_id: '' }));
                                            }}
                                            className={`py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                                data.tipo_involucrado === 'DIRIGENTE' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
                                            }`}
                                        >
                                            Dirigente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData(d => ({ ...d, tipo_involucrado: 'CLUB', jugador_id: '', nombre_involucrado: '', rut_involucrado: '' }));
                                            }}
                                            className={`py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                                data.tipo_involucrado === 'CLUB' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
                                            }`}
                                        >
                                            Club
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-1">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1.5">Club *</label>
                                            <select
                                                value={data.club_id}
                                                onChange={e => {
                                                    setData('club_id', e.target.value);
                                                    setData('jugador_id', '');
                                                }}
                                                className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3.5"
                                            >
                                                <option value="">Seleccione Club...</option>
                                                {clubes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {data.tipo_involucrado === 'JUGADOR' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1.5">Jugador Registrado</label>
                                                    <select
                                                        value={data.jugador_id}
                                                        onChange={e => {
                                                            const id = e.target.value;
                                                            const j = jugadores.find(item => item.id.toString() === id);
                                                            setData(d => ({
                                                                ...d,
                                                                jugador_id: id,
                                                                nombre_involucrado: j ? j.nombre : d.nombre_involucrado,
                                                                rut_involucrado: j ? j.rut : d.rut_involucrado,
                                                            }));
                                                        }}
                                                        className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3.5"
                                                    >
                                                        <option value="">Seleccione Jugador Registrado...</option>
                                                        {formJugadoresDisponibles.map(j => (
                                                            <option key={j.id} value={j.id}>{j.nombre} ({j.rut})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="pt-3 border-t border-slate-300">
                                                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                                                        ¿No está registrado en el sistema? Ingrese datos manualmente:
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">Nombre Jugador (Manual)</label>
                                                            <input
                                                                type="text"
                                                                value={data.nombre_involucrado}
                                                                onChange={e => setData(d => ({ ...d, jugador_id: '', nombre_involucrado: e.target.value }))}
                                                                placeholder="Ej: Carlos Silva"
                                                                className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">RUT Jugador (Manual)</label>
                                                            <input
                                                                type="text"
                                                                value={data.rut_involucrado}
                                                                onChange={e => setData(d => ({ ...d, rut_involucrado: e.target.value }))}
                                                                placeholder="12.345.678-9"
                                                                className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {data.tipo_involucrado === 'DIRIGENTE' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">Nombre Dirigente *</label>
                                                    <input
                                                        type="text"
                                                        value={data.nombre_involucrado}
                                                        onChange={e => setData('nombre_involucrado', e.target.value)}
                                                        placeholder="Ej: Juan Pérez"
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">RUT Dirigente</label>
                                                    <input
                                                        type="text"
                                                        value={data.rut_involucrado}
                                                        onChange={e => setData('rut_involucrado', e.target.value)}
                                                        placeholder="12.345.678-9"
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA 2: Asunto, Artículo, Antecedentes & Caja de Oficio */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">Referencia (REF:) / Asunto *</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreandoReferencia(!isCreandoReferencia)}
                                                    className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
                                                >
                                                    <Plus size={13} />
                                                    <span>+ Crear nueva referencia</span>
                                                </button>
                                            </div>

                                            {isCreandoReferencia && (
                                                <div className="mb-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={nuevaReferencia}
                                                        onChange={e => setNuevaReferencia(e.target.value)}
                                                        placeholder="Escriba la nueva referencia..."
                                                        className="flex-1 rounded-lg border-emerald-300 text-xs font-extrabold text-slate-900 py-1.5 px-3 focus:ring-2 focus:ring-emerald-600"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleGuardarNuevaReferencia}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCreandoReferencia(false)}
                                                        className="px-2 py-1.5 text-slate-500 hover:text-slate-700 font-bold text-xs"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            <select
                                                value={referencias.some(r => r.nombre === data.asunto) ? data.asunto : (data.asunto ? 'OTRO' : '')}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== 'OTRO') {
                                                        setData('asunto', val);
                                                    } else if (data.asunto && referencias.some(r => r.nombre === data.asunto)) {
                                                        setData('asunto', '');
                                                    }
                                                }}
                                                className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3 mb-2"
                                            >
                                                <option value="">Seleccione una Referencia de la Tabla...</option>
                                                {referencias.map(r => (
                                                    <option key={r.id} value={r.nombre}>REF: {r.nombre}</option>
                                                ))}
                                                <option value="OTRO">✏️ Otra referencia libre / personalizada...</option>
                                            </select>

                                            {(!referencias.some(r => r.nombre === data.asunto)) && (
                                                <input
                                                    type="text"
                                                    value={data.asunto}
                                                    onChange={e => setData('asunto', e.target.value)}
                                                    placeholder="Escriba la referencia o motivo de la resolución..."
                                                    className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                                    required
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">Artículo Reglamento</label>
                                            <input
                                                type="text"
                                                value={data.articulo_reglamento}
                                                onChange={e => setData('articulo_reglamento', e.target.value)}
                                                placeholder="Ej: Art. 15 Inc. B"
                                                className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3 placeholder:text-slate-400 placeholder:font-normal"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">Descripción / Antecedentes</label>
                                        <textarea
                                            rows={3}
                                            value={data.descripcion}
                                            onChange={e => setData('descripcion', e.target.value)}
                                            placeholder="Detalles breves de la investigación o denuncia..."
                                            className="w-full rounded-xl border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2.5 px-3 placeholder:text-slate-400 placeholder:font-normal resize-none"
                                        />
                                    </div>

                                    {/* Sección Dinámica según el Tipo de Oficio */}
                                    {data.tipo_oficio === 'CITACION' && (
                                        <div className="p-4.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-3 shadow-sm">
                                            <div className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <CalendarDays size={16} className="text-blue-600" />
                                                <span>Datos de Citación</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">Fecha y Hora Citación</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={data.fecha_citacion}
                                                        onChange={e => setData('fecha_citacion', e.target.value)}
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-600 bg-white py-2 px-2.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">Lugar de Citación</label>
                                                    <input
                                                        type="text"
                                                        value={data.lugar_citacion}
                                                        onChange={e => setData('lugar_citacion', e.target.value)}
                                                        placeholder="Sede Oficial de la Asociación"
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-600 bg-white py-2 px-2.5 placeholder:text-slate-400 placeholder:font-normal"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {data.tipo_oficio === 'INHABILITACION' && (
                                        <div className="p-4.5 bg-red-50/80 rounded-2xl border border-red-200 space-y-3 shadow-sm">
                                            <div className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <ShieldAlert size={16} className="text-red-600" />
                                                <span>Fechas de Inhabilitación</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">Fecha Inicio</label>
                                                    <input
                                                        type="date"
                                                        value={data.fecha_inicio_inhabilitacion}
                                                        onChange={e => setData('fecha_inicio_inhabilitacion', e.target.value)}
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-red-600 bg-white py-2 px-2.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">Fecha Término</label>
                                                    <input
                                                        type="date"
                                                        value={data.fecha_fin_inhabilitacion}
                                                        onChange={e => setData('fecha_fin_inhabilitacion', e.target.value)}
                                                        className="w-full rounded-xl border-slate-300 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-red-600 bg-white py-2 px-2.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {data.tipo_oficio === 'RESOLUCION' && (
                                        <div className="p-4.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2 shadow-sm">
                                            <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <CheckCircle2 size={16} className="text-emerald-600" />
                                                <span>Dictamen / Detalles de Resolución</span>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={data.detalles_resolucion}
                                                onChange={e => setData('detalles_resolucion', e.target.value)}
                                                placeholder="Fallo final del Comité de Ética..."
                                                className="w-full rounded-xl border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white py-2 px-2.5 placeholder:text-slate-400 placeholder:font-normal resize-none"
                                            />
                                        </div>
                                    )}

                                    {data.tipo_oficio === 'INVESTIGACION' && (
                                        <div className="p-4.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1 shadow-sm">
                                            <div className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <Clock size={16} className="text-amber-600" />
                                                <span>Oficio de Investigación</span>
                                            </div>
                                            <p className="text-xs font-bold text-amber-900">
                                                Este oficio notificará formalmente la apertura del expediente de investigación a las partes involucradas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer fijo con botones de acción */}
                            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-7 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50"
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
