import { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, HeartHandshake, Search, X, ChevronLeft, ChevronRight, Users, Edit2, Trash2, Shield } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Modal from '@/Components/Modal';

interface Club {
    id: number;
    name: string;
    crest?: string | null;
}

interface Fase {
    id: number;
    nombre: string;
    cantidad_fechas: number;
}

interface Campeonato {
    id: number;
    nombre: string;
    fases: Fase[];
}

interface Fondo {
    id: number;
    campeonato_id: number;
    campeonato?: Campeonato;
    fase_id: number;
    fase?: Fase;
    numero_fecha: number;
    club_id: number;
    club?: Club;
    numero_fondo: number | null;
    jugador_rut: string;
    jugador_nombre: string;
    diagnostico: string | null;
    tipo_beneficio: string | null;
    monto_asignado: number | null;
    estado?: string;
}

export default function Index({ fondos, campeonatos, clubes }: { fondos: Fondo[], campeonatos: Campeonato[], clubes: Club[] }) {
    const { auth } = usePage<any>().props;
    const canManage = auth?.user?.permissions?.includes('gestionar fondos') || auth?.user?.roles?.includes('Super admin');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFondo, setEditingFondo] = useState<Fondo | null>(null);
    const [fondoToDelete, setFondoToDelete] = useState<Fondo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCampeonato, setFilterCampeonato] = useState('');
    const [filterFase, setFilterFase] = useState('');
    const [filterFecha, setFilterFecha] = useState('');

    // Calculo automatico del beneficio (dias de reposo / fractura)
    const [diasReposo, setDiasReposo] = useState('');
    const [esFractura, setEsFractura] = useState(false);

    // Pagination state
    const [perPage, setPerPage] = useState<number | 'TODOS'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        campeonato_id: '' as string | number,
        fase_id: '' as string | number,
        numero_fecha: '' as string | number,
        club_id: '' as string | number,
        jugador_rut: '',
        jugador_nombre: '',
        diagnostico: '',
        tipo_beneficio: '',
        monto_asignado: '' as string | number,
    });

    // Tabla oficial de beneficios del Fondo Solidario
    const calcularBeneficio = (dias: string, fractura: boolean): { pct: number; monto: number } | null => {
        if (fractura) return { pct: 200, monto: 10000 };
        const d = Number(dias);
        if (!d || d < 1) return null;
        if (d <= 7) return { pct: 50, monto: 2500 };
        if (d <= 13) return { pct: 75, monto: 3750 };
        if (d <= 30) return { pct: 100, monto: 5000 };
        return null; // fuera de rango (>30 dias): definir monto manualmente
    };

    const aplicarCalculoAutomatico = (dias: string, fractura: boolean) => {
        setDiasReposo(dias);
        setEsFractura(fractura);
        const resultado = calcularBeneficio(dias, fractura);
        if (resultado) {
            setData(d => ({ ...d, tipo_beneficio: `${resultado.pct}%`, monto_asignado: resultado.monto }));
        } else {
            // Sin dias validos y sin fractura: no dejar un % / monto de un calculo anterior
            setData(d => ({ ...d, tipo_beneficio: '', monto_asignado: '' }));
        }
    };

    const fasesDisponibles = useMemo(() => {
        if (!data.campeonato_id) return [];
        const camp = campeonatos.find(c => c.id.toString() === data.campeonato_id.toString());
        return camp ? camp.fases : [];
    }, [data.campeonato_id, campeonatos]);

    const fechasDisponibles = useMemo(() => {
        if (!data.fase_id) return [];
        const fase = fasesDisponibles.find(f => f.id.toString() === data.fase_id.toString());
        if (!fase) return [];
        return Array.from({ length: fase.cantidad_fechas }, (_, i) => i + 1);
    }, [data.fase_id, fasesDisponibles]);

    // N° de Fondo: correlativo automatico y unico para toda la temporada (no depende del campeonato/torneo),
    // para que el usuario no lo digite y se evitan errores/duplicados
    const proximoNumeroFondo = useMemo(() => {
        if (editingFondo) return editingFondo.numero_fondo;
        const maximo = fondos.reduce((max, f) => Math.max(max, f.numero_fondo || 0), 0);
        return maximo + 1;
    }, [editingFondo, fondos]);

    const openForm = (fondo?: Fondo) => {
        clearErrors();
        if (fondo) {
            setEditingFondo(fondo);
            setData({
                campeonato_id: fondo.campeonato_id,
                fase_id: fondo.fase_id,
                numero_fecha: fondo.numero_fecha,
                club_id: fondo.club_id,
                jugador_rut: fondo.jugador_rut,
                jugador_nombre: fondo.jugador_nombre,
                diagnostico: fondo.diagnostico || '',
                tipo_beneficio: fondo.tipo_beneficio || '',
                monto_asignado: fondo.monto_asignado ?? '',
            });
            setDiasReposo('');
            setEsFractura(false);
        } else {
            setEditingFondo(null);
            setData({
                campeonato_id: '', fase_id: '', numero_fecha: '', club_id: '',
                jugador_rut: '', jugador_nombre: '', diagnostico: '', tipo_beneficio: '',
                monto_asignado: '',
            });
            setDiasReposo('');
            setEsFractura(false);
        }
        setIsFormOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFondo) {
            put(route('fondos.update', editingFondo.id), {
                onSuccess: () => { setIsFormOpen(false); reset(); },
            });
        } else {
            post(route('fondos.store'), {
                onSuccess: () => { setIsFormOpen(false); reset(); },
            });
        }
    };

    const confirmDelete = () => {
        if (fondoToDelete) {
            setIsDeleting(true);
            router.delete(route('fondos.destroy', fondoToDelete.id), {
                onSuccess: () => { setFondoToDelete(null); setIsDeleting(false); },
                onError: () => setIsDeleting(false),
            });
        }
    };

    const filterFasesDisponibles = useMemo(() => {
        if (!filterCampeonato) return [];
        const camp = campeonatos.find(c => c.id.toString() === filterCampeonato);
        return camp ? camp.fases : [];
    }, [filterCampeonato, campeonatos]);

    const filterFechasDisponibles = useMemo(() => {
        if (!filterFase) return [];
        const fase = filterFasesDisponibles.find(f => f.id.toString() === filterFase);
        if (!fase) return [];
        return Array.from({ length: fase.cantidad_fechas }, (_, i) => i + 1);
    }, [filterFase, filterFasesDisponibles]);

    const filteredFondos = useMemo(() => {
        return fondos.filter(f => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                f.jugador_nombre.toLowerCase().includes(term) ||
                f.jugador_rut.toLowerCase().includes(term) ||
                (f.club?.name || '').toLowerCase().includes(term);
            const matchesCampeonato = filterCampeonato ? f.campeonato_id.toString() === filterCampeonato : true;
            const matchesFase = filterFase ? f.fase_id.toString() === filterFase : true;
            const matchesFecha = filterFecha ? f.numero_fecha.toString() === filterFecha : true;
            return matchesSearch && matchesCampeonato && matchesFase && matchesFecha;
        });
    }, [fondos, searchTerm, filterCampeonato, filterFase, filterFecha]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCampeonato, filterFase, filterFecha, perPage]);

    const effectivePerPage = perPage === 'TODOS' ? (filteredFondos.length || 1) : Number(perPage);
    const totalPages = Math.ceil(filteredFondos.length / effectivePerPage) || 1;

    const paginatedFondos = useMemo(() => {
        if (perPage === 'TODOS') return filteredFondos;
        const start = (currentPage - 1) * effectivePerPage;
        return filteredFondos.slice(start, start + effectivePerPage);
    }, [filteredFondos, currentPage, effectivePerPage, perPage]);

    const startIndex = filteredFondos.length === 0 ? 0 : (currentPage - 1) * effectivePerPage + 1;
    const endIndex = perPage === 'TODOS' ? filteredFondos.length : Math.min(currentPage * effectivePerPage, filteredFondos.length);

    const totalJugadores = useMemo(() => {
        const ruts = new Set(fondos.map(f => f.jugador_rut).filter(Boolean));
        return ruts.size;
    }, [fondos]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
                        <HeartHandshake size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fondo Solidario</h2>
                        <p className="text-xs text-slate-500 font-medium">Aportes de la asociación a jugadores afectados</p>
                    </div>
                </div>
            }
        >
            <Head title="Fondo Solidario" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <HeartHandshake size={22} />
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Registros</span>
                                <span className="text-2xl font-black text-slate-900 mt-0.5 block">{fondos.length}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                <Users size={22} />
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Jugadores Beneficiados</span>
                                <span className="text-2xl font-black text-indigo-900 mt-0.5 block">{totalJugadores}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Card & Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Listado de Aportes</h3>
                                <p className="text-sm text-slate-500">Registro de ayudas económicas otorgadas a jugadores.</p>
                            </div>
                            {canManage && (
                                <button
                                    onClick={() => openForm()}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-extrabold text-sm shadow-xs flex items-center gap-2 shrink-0"
                                >
                                    <Plus size={18} /> Nuevo Aporte
                                </button>
                            )}
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-72">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar jugador, RUT o club..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <select
                                value={filterCampeonato}
                                onChange={e => { setFilterCampeonato(e.target.value); setFilterFase(''); setFilterFecha(''); }}
                                className="w-full sm:w-56 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="">Todos los Torneos</option>
                                {campeonatos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>

                            <select
                                value={filterFase}
                                onChange={e => { setFilterFase(e.target.value); setFilterFecha(''); }}
                                className="w-full sm:w-48 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-100"
                                disabled={!filterCampeonato}
                            >
                                <option value="">Todas las Fases</option>
                                {filterFasesDisponibles.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                            </select>

                            <select
                                value={filterFecha}
                                onChange={e => setFilterFecha(e.target.value)}
                                className="w-full sm:w-40 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-100"
                                disabled={!filterFase}
                            >
                                <option value="">Todas las Fechas</option>
                                {filterFechasDisponibles.map(n => <option key={n} value={n}>Fecha {n}</option>)}
                            </select>

                            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold whitespace-nowrap ml-auto">
                                {filteredFondos.length} Aportes
                            </span>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-center">N° Fondo</th>
                                        <th className="px-6 py-4 font-bold">Torneo / Fecha</th>
                                        <th className="px-6 py-4 font-bold">Jugador</th>
                                        <th className="px-6 py-4 font-bold">Diagnóstico / Motivo</th>
                                        <th className="px-6 py-4 font-bold text-center">% Beneficio</th>
                                        <th className="px-6 py-4 font-bold text-right">Monto</th>
                                        {canManage && <th className="px-6 py-4 font-bold text-right">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {paginatedFondos.map(f => (
                                        <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {f.numero_fondo ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                                        N° {f.numero_fondo}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-extrabold text-slate-900">{f.campeonato?.nombre || 'S/N'}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{f.fase?.nombre || 'S/N'} • Fecha {f.numero_fecha}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-extrabold text-slate-600 shadow-inner border border-slate-200/50">
                                                        {f.jugador_nombre.substring(0, 1).toUpperCase()}
                                                        {f.jugador_nombre.split(' ').length > 1 ? f.jugador_nombre.split(' ')[1].substring(0, 1).toUpperCase() : ''}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{f.jugador_nombre}</div>
                                                        <div className="flex items-center mt-0.5 space-x-1.5">
                                                            {f.club?.crest ? (
                                                                <img
                                                                    src={f.club.crest.startsWith('http') || f.club.crest.startsWith('/') ? f.club.crest : `/storage/${f.club.crest}`}
                                                                    alt={f.club.name}
                                                                    className="w-4 h-4 rounded-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <Shield size={12} className="text-slate-400" />
                                                            )}
                                                            <span className="font-medium text-xs text-slate-500">{f.club?.name || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs">{f.diagnostico || '-'}</td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-700">{f.tipo_beneficio || '-'}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                {f.monto_asignado ? `$${f.monto_asignado.toLocaleString('es-CL')}` : '-'}
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => openForm(f)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Editar Aporte"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setFondoToDelete(f)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Eliminar Aporte"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredFondos.length === 0 && (
                                        <tr>
                                            <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                                                <HeartHandshake size={36} className="mx-auto mb-2 text-slate-300" />
                                                <p className="font-semibold text-slate-600 text-sm">No hay aportes registrados.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
                                <span className="font-bold text-slate-700">Mostrar</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPerPage(val === 'TODOS' ? 'TODOS' : Number(val));
                                    }}
                                    className="rounded-xl border-slate-300 py-1.5 px-3 text-xs font-black text-slate-900 bg-white focus:ring-2 focus:ring-blue-600 shadow-xs"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value="TODOS">Todos</option>
                                </select>
                                <span className="font-semibold text-slate-500">
                                    • Mostrando {startIndex} a {endIndex} de {filteredFondos.length} aportes
                                </span>
                            </div>

                            {perPage !== 'TODOS' && totalPages > 1 && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition-all shadow-xs"
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
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition-all shadow-xs"
                                        title="Página Siguiente"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form for Create / Edit */}
            <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="3xl">
                <div className="p-6 sm:p-8 bg-white rounded-3xl">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                                <HeartHandshake size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingFondo ? 'Editar Aporte' : 'Registrar Nuevo Aporte'}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Información del beneficio otorgado al jugador</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campeonato *</label>
                                <select
                                    value={data.campeonato_id}
                                    onChange={e => setData(d => ({ ...d, campeonato_id: e.target.value, fase_id: '', numero_fecha: '' }))}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {campeonatos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                {errors.campeonato_id && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.campeonato_id}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fase *</label>
                                <select
                                    value={data.fase_id}
                                    onChange={e => setData(d => ({ ...d, fase_id: e.target.value, numero_fecha: '' }))}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                                    required
                                    disabled={!data.campeonato_id}
                                >
                                    <option value="">Seleccione...</option>
                                    {fasesDisponibles.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                </select>
                                {errors.fase_id && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.fase_id}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">N° Fecha *</label>
                                <select
                                    value={data.numero_fecha}
                                    onChange={e => setData('numero_fecha', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                                    required
                                    disabled={!data.fase_id}
                                >
                                    <option value="">N°...</option>
                                    {fechasDisponibles.map(n => <option key={n} value={n}>Fecha {n}</option>)}
                                </select>
                                {errors.numero_fecha && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.numero_fecha}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">N° Fondo</label>
                                <div
                                    className="w-full rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500 px-3 py-2 flex items-center"
                                    title="Correlativo asignado automáticamente para evitar errores o duplicados"
                                >
                                    {proximoNumeroFondo ?? 'Sin asignar'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club *</label>
                                <select
                                    value={data.club_id}
                                    onChange={e => setData('club_id', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {clubes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {errors.club_id && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.club_id}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">RUT Jugador *</label>
                                <input
                                    type="text"
                                    value={data.jugador_rut}
                                    onChange={e => setData('jugador_rut', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="12.345.678-9"
                                    required
                                />
                                {errors.jugador_rut && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.jugador_rut}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Jugador *</label>
                                <input
                                    type="text"
                                    value={data.jugador_nombre}
                                    onChange={e => setData('jugador_nombre', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.jugador_nombre && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.jugador_nombre}</span>}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">Cálculo automático del beneficio</p>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Días de Reposo</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={diasReposo}
                                        onChange={e => aplicarCalculoAutomatico(e.target.value, esFractura)}
                                        disabled={esFractura}
                                        className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                        placeholder="Ej: 14"
                                    />
                                </div>
                                <label className="flex items-center gap-2 pb-2.5 font-bold text-sm text-slate-700 whitespace-nowrap cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={esFractura}
                                        onChange={e => aplicarCalculoAutomatico(diasReposo, e.target.checked)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Solo Fractura (200%)
                                </label>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-2">
                                Tabla: 1-7 días → 50% ($2.500) · 8-13 días → 75% ($3.750) · 14-30 días → 100% ($5.000) · Fractura → 200% ($10.000).
                                Más de 30 días: complete el % y monto manualmente abajo.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Diagnóstico / Motivo</label>
                                <input
                                    type="text"
                                    value={data.diagnostico}
                                    onChange={e => setData('diagnostico', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Fractura, aporte por 14 días..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">% Beneficio</label>
                                <input
                                    type="text"
                                    value={data.tipo_beneficio}
                                    readOnly
                                    tabIndex={-1}
                                    className="w-full rounded-xl border-slate-300 bg-slate-100 text-sm font-bold text-slate-600 cursor-not-allowed"
                                    placeholder="Se calcula solo"
                                    title="Se calcula automáticamente según los días de reposo o si es fractura"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Monto ($)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={data.monto_asignado}
                                    onChange={e => setData('monto_asignado', e.target.value)}
                                    className="w-full rounded-xl border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="5000"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold transition shadow-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-extrabold text-sm disabled:opacity-50 shadow-xs"
                            >
                                Guardar Aporte
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDeleteModal
                show={!!fondoToDelete}
                title={`¿Eliminar aporte de ${fondoToDelete?.jugador_nombre}?`}
                description="Esta acción eliminará el registro del aporte de Fondo Solidario."
                onConfirm={confirmDelete}
                onClose={() => setFondoToDelete(null)}
                processing={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
