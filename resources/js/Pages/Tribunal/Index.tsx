import { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { 
    FileDown, CalendarClock, Trophy, Map, CalendarDays, 
    Shield, User, FileText, MessageSquare, Plus,
    Search, Filter, ChevronLeft, ChevronRight, CheckCircle2,
    XCircle, AlertCircle, Clock, Gavel, X, Eye, Edit2, Trash2, Loader2, Info
} from 'lucide-react';

interface Club {
    id: number;
    name: string;
    crest: string | null;
}

interface Jugador {
    id: number;
    rut: string | null;
    nombre: string;
    club_id?: number | null;
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

interface Sancion {
    id: number;
    campeonato?: Campeonato;
    fase?: Fase;
    numero_fecha?: number;
    jugador?: Jugador;
    club?: Club | null;
    tipo_involucrado?: 'JUGADOR' | 'TURNO' | 'DIRIGENTE' | 'CLUB';
    nombre_involucrado?: string | null;
    rut_involucrado?: string | null;
    articulo_reglamento: string;
    tipo_falta: string;
    tipo_sancion: string;
    cantidad_sancion: number;
    unidad_tiempo: string;
    fecha_resolucion: string;
    partidos_cumplidos: number;
    fecha_termino_cronologica: string | null;
    estado: string;
    observacion: string | null;
}

interface Nota {
    id: number;
    campeonato_id: number;
    campeonato?: Campeonato;
    fase_id: number;
    fase?: Fase;
    numero_fecha: number;
    club_id: number | null;
    club: Club | null;
    nota: string;
    monto: number | null;
}

interface Referencia {
    id: number;
    nombre: string;
    modulo: string;
}

export default function TribunalDashboard({
    sanciones, notas, clubes, campeonatos, jugadores, referencias = []
}: {
    sanciones: Sancion[],
    notas: Nota[],
    clubes: Club[],
    campeonatos: Campeonato[],
    jugadores: Jugador[],
    referencias?: Referencia[]
}) {
    const [nuevaReferencia, setNuevaReferencia] = useState('');
    const [isCreandoReferencia, setIsCreandoReferencia] = useState(false);
    const [jugadorSearch, setJugadorSearch] = useState('');
    const [isManualJugador, setIsManualJugador] = useState(false);
    const [esFaltaPersonalizada, setEsFaltaPersonalizada] = useState(false);

    const handleGuardarNuevaReferencia = () => {
        if (!nuevaReferencia.trim()) return;
        router.post(route('referencias-oficio.store'), {
            nombre: nuevaReferencia.trim(),
            modulo: 'TRIBUNAL'
        }, {
            onSuccess: () => {
                setData('tipo_falta', nuevaReferencia.trim());
                setEsFaltaPersonalizada(false);
                setNuevaReferencia('');
                setIsCreandoReferencia(false);
            }
        });
    };
    const { flash, auth } = usePage<any>().props;
    const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | null}>({show: false, message: '', type: null});

    const hasPermission = (p: string) => auth?.user?.permissions?.includes(p) || auth?.user?.roles?.includes('Super admin');
    const canManageSanciones = hasPermission('gestionar sanciones');
    const canManageNotas = hasPermission('gestionar notas');

    useEffect(() => {
        if (flash?.success) {
            setToast({show: true, message: flash.success, type: 'success'});
            const timer = setTimeout(() => setToast({show: false, message: '', type: null}), 4000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({show: true, message: flash.error, type: 'error'});
            const timer = setTimeout(() => setToast({show: false, message: '', type: null}), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, type: 'sancion'|'nota', id: number | null}>({isOpen: false, type: 'sancion', id: null});

    const confirmDelete = () => {
        if (deleteConfirm.id === null) return;
        if (deleteConfirm.type === 'sancion') router.delete(route('tribunal.sanciones.destroy', deleteConfirm.id));
        if (deleteConfirm.type === 'nota') router.delete(route('tribunal.notas.destroy', deleteConfirm.id));
        setDeleteConfirm({isOpen: false, type: 'sancion', id: null});
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        campeonato_id: '',
        fase_id: '',
        numero_fecha: '',
        tipo_involucrado: 'JUGADOR' as 'JUGADOR' | 'TURNO' | 'DIRIGENTE' | 'CLUB',
        club_id: '',
        jugador_rut: '',
        jugador_nombre: '',
        articulo_reglamento: '',
        tipo_falta: '',
        tipo_sancion: 'PARTIDOS' as 'PARTIDOS' | 'TIEMPO' | 'AMONESTACION',
        cantidad_sancion: 1,
        unidad_tiempo: 'PARTIDOS' as 'PARTIDOS' | 'MESES' | 'AÑOS' | 'AMONESTACION',
        fecha_resolucion: new Date().toISOString().split('T')[0],
        estado: 'ACTIVO',
        observacion: ''
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSancionId, setEditingSancionId] = useState<number | null>(null);
    const [basePartidos, setBasePartidos] = useState<number>(1);
    // Contexto (campeonato/fase/fecha) seleccionado en la página antes de abrir una edición, para restaurarlo al cerrar
    const [contextoPrevio, setContextoPrevio] = useState<{ campeonato_id: string; fase_id: string; numero_fecha: string } | null>(null);

    // Detección de Reincidencia: calcular sanciones previas del jugador (+1 partido por antecedente, excluyendo amonestaciones)
    const antecedenteSanciones = useMemo(() => {
        const cleanRut = data.jugador_rut ? data.jugador_rut.replace(/[^kK0-9]/g, '').toLowerCase() : '';
        const cleanName = data.jugador_nombre ? data.jugador_nombre.trim().toLowerCase() : '';

        if (!cleanRut && !cleanName) return [];

        return sanciones.filter(s => {
            if (editingSancionId && s.id === editingSancionId) return false;
            if (s.tipo_sancion === 'AMONESTACION') return false;
            const sRut = s.jugador?.rut ? s.jugador.rut.replace(/[^kK0-9]/g, '').toLowerCase() : '';
            const sName = s.jugador?.nombre ? s.jugador.nombre.trim().toLowerCase() : '';

            if (cleanRut && sRut && cleanRut === sRut) return true;
            if (cleanName && sName && cleanName === sName) return true;
            return false;
        });
    }, [data.jugador_rut, data.jugador_nombre, sanciones, editingSancionId]);

    const reincidenciaCount = antecedenteSanciones.length;

    // Filter fases based on selected campeonato
    const fasesDisponibles = useMemo(() => {
        if (!data.campeonato_id) return [];
        const camp = campeonatos.find(c => c.id.toString() === data.campeonato_id.toString());
        return camp ? camp.fases : [];
    }, [data.campeonato_id, campeonatos]);

    const selectedFase = useMemo(() => {
        if (!data.fase_id) return null;
        return fasesDisponibles.find(f => f.id.toString() === data.fase_id.toString()) || null;
    }, [data.fase_id, fasesDisponibles]);

    const esLiguilla = useMemo(() => {
        if (!selectedFase) return false;
        return (selectedFase.nombre || '').toLowerCase().includes('liguilla');
    }, [selectedFase]);

    const reincidenciaAplica = useMemo(() => {
        if (data.tipo_sancion === 'AMONESTACION') return false;
        if (reincidenciaCount <= 0) return false;
        if (esLiguilla && data.unidad_tiempo === 'PARTIDOS') return false;
        return true;
    }, [reincidenciaCount, esLiguilla, data.unidad_tiempo, data.tipo_sancion]);

    // Cálculo automático de Total: Base + Reincidencia (+1 partido por expulsión previa)
    useEffect(() => {
        if (reincidenciaAplica && data.unidad_tiempo === 'PARTIDOS') {
            const total = basePartidos + reincidenciaCount;
            const notaReincid = `[Base: ${basePartidos} partido(s) + Reincidencia (${reincidenciaCount} expulsión/es previa/s): +${reincidenciaCount} partido(s) = Total: ${total} partidos]`;
            
            setData(prev => {
                let obs = prev.observacion || '';
                if (obs.includes('[Base:')) {
                    obs = obs.replace(/\[Base:.*?\]/, notaReincid);
                } else {
                    obs = obs ? `${obs} ${notaReincid}` : notaReincid;
                }
                return {
                    ...prev,
                    cantidad_sancion: total,
                    observacion: obs
                };
            });
        } else if (esLiguilla && data.unidad_tiempo === 'PARTIDOS' && reincidenciaCount > 0) {
            setData(prev => {
                let obs = prev.observacion || '';
                if (obs.includes('[Base:')) {
                    obs = obs.replace(/\[Base:.*?\]/, '').trim();
                }
                return {
                    ...prev,
                    cantidad_sancion: basePartidos,
                    observacion: obs
                };
            });
        }
    }, [basePartidos, reincidenciaCount, data.unidad_tiempo, reincidenciaAplica, esLiguilla]);

    // Calculate array of numbers for fechas
    const fechasDisponibles = useMemo(() => {
        if (!data.fase_id) return [];
        const fase = fasesDisponibles.find(f => f.id.toString() === data.fase_id.toString());
        if (!fase) return [];
        return Array.from({ length: fase.cantidad_fechas }, (_, i) => i + 1);
    }, [data.fase_id, fasesDisponibles]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setIsFormOpen(false);
            },
            onError: () => setToast({show: true, message: 'No se pudo guardar: revisa los datos marcados en el formulario.', type: 'error'}),
        };

        if (editingSancionId) {
            put(route('tribunal.sanciones.update', editingSancionId), options);
        } else {
            post(route('tribunal.sanciones.store'), options);
        }
    };

    const closeForm = () => {
        // Al cancelar una edición se descartan los cambios y se restaura el contexto de la página
        if (editingSancionId) resetForm();
        setIsFormOpen(false);
    };

    const jugadoresFiltradosBusqueda = useMemo(() => {
        let list = data.club_id
            ? jugadores.filter(j => j.club_id?.toString() === data.club_id.toString())
            : jugadores;
        if (jugadorSearch.trim()) {
            const q = jugadorSearch.toLowerCase().trim();
            list = list.filter(j =>
                (j.nombre || '').toLowerCase().includes(q) ||
                (j.rut || '').toLowerCase().includes(q)
            );
        }
        return list.slice(0, 15);
    }, [jugadores, data.club_id, jugadorSearch]);

    const resetForm = () => {
        reset('tipo_involucrado', 'club_id', 'jugador_rut', 'jugador_nombre', 'articulo_reglamento', 'tipo_falta', 'observacion', 'cantidad_sancion', 'tipo_sancion', 'unidad_tiempo', 'fecha_resolucion', 'estado');
        if (contextoPrevio) {
            setData(prev => ({ ...prev, ...contextoPrevio }));
            setContextoPrevio(null);
        }
        setJugadorSearch('');
        setIsManualJugador(false);
        setEsFaltaPersonalizada(false);
        setBasePartidos(1);
        clearErrors();
        setEditingSancionId(null);
    };

    const handleEdit = (sancion: any) => {
        const prevCount = sanciones.filter(s => s.id !== sancion.id && (
            (s.jugador?.rut && sancion.jugador?.rut && s.jugador.rut === sancion.jugador.rut) ||
            (s.jugador?.nombre && sancion.jugador?.nombre && s.jugador.nombre === sancion.jugador.nombre)
        )).length;
        
        setBasePartidos(Math.max(1, sancion.cantidad_sancion - prevCount));
        if (!editingSancionId) {
            setContextoPrevio({ campeonato_id: data.campeonato_id, fase_id: data.fase_id, numero_fecha: data.numero_fecha });
        }
        clearErrors();
        const tipoInv = sancion.tipo_involucrado || (sancion.jugador ? 'JUGADOR' : (sancion.nombre_involucrado ? 'TURNO' : 'CLUB'));
        setJugadorSearch('');
        setIsManualJugador(tipoInv === 'JUGADOR' && !sancion.jugador);
        setEsFaltaPersonalizada(Boolean(sancion.tipo_falta && !referencias.some(r => r.nombre === sancion.tipo_falta)));
        setData({
            ...data,
            campeonato_id: sancion.campeonato_id?.toString() || '',
            fase_id: sancion.fase_id?.toString() || '',
            numero_fecha: sancion.numero_fecha?.toString() || '',
            tipo_involucrado: tipoInv,
            club_id: sancion.club_id?.toString() || '',
            jugador_rut: sancion.jugador?.rut || sancion.rut_involucrado || '',
            jugador_nombre: sancion.jugador?.nombre || sancion.nombre_involucrado || '',
            articulo_reglamento: sancion.articulo_reglamento,
            tipo_falta: sancion.tipo_falta,
            observacion: sancion.observacion || '',
            cantidad_sancion: sancion.cantidad_sancion,
            tipo_sancion: sancion.tipo_sancion,
            unidad_tiempo: sancion.unidad_tiempo,
            fecha_resolucion: sancion.fecha_resolucion ? sancion.fecha_resolucion.split('T')[0] : new Date().toISOString().split('T')[0],
            estado: sancion.estado,
        });
        setEditingSancionId(sancion.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({isOpen: true, type: 'sancion', id});
    };

    const formNota = useForm({
        campeonato_id: '',
        fase_id: '',
        numero_fecha: '',
        club_id: '',
        nota: '',
        monto: '',
    });

    const [isNotaFormOpen, setIsNotaFormOpen] = useState(false);
    const [editingNotaId, setEditingNotaId] = useState<number | null>(null);

    const submitNota = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingNotaId) {
            formNota.put(route('tribunal.notas.update', editingNotaId), {
                onSuccess: () => {
                    formNota.reset('club_id', 'nota', 'monto');
                    formNota.clearErrors();
                    setEditingNotaId(null);
                    setIsNotaFormOpen(false);
                },
            });
        } else {
            // sync context before submitting
            formNota.setData('campeonato_id', data.campeonato_id);
            formNota.setData('fase_id', data.fase_id);
            formNota.setData('numero_fecha', data.numero_fecha);
            
            formNota.post(route('tribunal.notas.store'), {
                onSuccess: () => {
                    formNota.reset('club_id', 'nota', 'monto');
                    formNota.clearErrors();
                    setIsNotaFormOpen(false);
                },
            });
        }
    };

    const handleEditNota = (nota: Nota) => {
        formNota.setData({
            campeonato_id: nota.campeonato_id?.toString() || '',
            fase_id: nota.fase_id?.toString() || '',
            numero_fecha: nota.numero_fecha?.toString() || '',
            club_id: nota.club_id ? nota.club_id.toString() : '',
            nota: nota.nota,
            monto: nota.monto ? nota.monto.toString() : '',
        });
        setEditingNotaId(nota.id);
        setIsNotaFormOpen(true);
    };

    const handleDeleteNota = (id: number) => {
        setDeleteConfirm({isOpen: true, type: 'nota', id});
    };

    const isContextSelected = data.campeonato_id && data.fase_id && data.numero_fecha;

    const [activeTab, setActiveTab] = useState<'sanciones' | 'notas'>('sanciones');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCampeonato, setFilterCampeonato] = useState('');
    const [filterFase, setFilterFase] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterFecha, setFilterFecha] = useState('');
    const [selectedSancion, setSelectedSancion] = useState<any>(null);

    // Paginación
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCampeonato, filterFase, filterEstado, filterFecha, itemsPerPage, activeTab]);

    const filterFasesDisponibles: Fase[] = filterCampeonato
        ? (campeonatos.find(c => c.id.toString() === filterCampeonato)?.fases || [])
        : Array.from(
            new globalThis.Map(
                [...sanciones, ...notas]
                    .map(item => item.fase)
                    .filter((f): f is Fase => !!f)
                    .map(f => [f.id, f])
            ).values()
          );

    const filterFechasDisponibles = Array.from(new Set(
        [...sanciones, ...notas]
            .filter(item => filterCampeonato ? item.campeonato?.id?.toString() === filterCampeonato || (item as any).campeonato_id?.toString() === filterCampeonato : true)
            .filter(item => filterFase ? item.fase?.id.toString() === filterFase : true)
            .map(item => item.numero_fecha)
            .filter((n): n is number => n !== undefined && n !== null)
    )).sort((a, b) => a - b);

    const filteredSanciones = sanciones.filter(sancion => {
        const matchesSearch =
            (sancion.jugador?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sancion.nombre_involucrado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sancion.jugador?.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sancion.rut_involucrado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sancion.club?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCampeonato = filterCampeonato ? sancion.campeonato?.id.toString() === filterCampeonato : true;
        const matchesFase = filterFase ? sancion.fase?.id.toString() === filterFase : true;
        const matchesEstado = filterEstado
            ? (filterEstado === 'AMONESTACION'
                ? (sancion.unidad_tiempo === 'AMONESTACION' || sancion.tipo_sancion === 'AMONESTACION')
                : sancion.estado === filterEstado)
            : true;
        const matchesFecha = filterFecha ? sancion.numero_fecha?.toString() === filterFecha : true;

        return matchesSearch && matchesCampeonato && matchesFase && matchesEstado && matchesFecha;
    });

    const filteredNotas = notas.filter(nota => {
        const matchesSearch =
            (nota.nota || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCampeonato = filterCampeonato ? nota.campeonato_id?.toString() === filterCampeonato : true;
        const matchesFase = filterFase ? nota.fase?.id.toString() === filterFase : true;
        const matchesFecha = filterFecha ? nota.numero_fecha?.toString() === filterFecha : true;

        return matchesSearch && matchesCampeonato && matchesFase && matchesFecha;
    });

    const totalPagesSanciones = Math.ceil(filteredSanciones.length / itemsPerPage) || 1;
    const paginatedSanciones = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSanciones.slice(start, start + itemsPerPage);
    }, [filteredSanciones, currentPage, itemsPerPage]);

    const totalPagesNotas = Math.ceil(filteredNotas.length / itemsPerPage) || 1;
    const paginatedNotas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredNotas.slice(start, start + itemsPerPage);
    }, [filteredNotas, currentPage, itemsPerPage]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold tracking-tight text-slate-900">Comité de Disciplina</h2>}
        >
            <Head title="Comité de Disciplina" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Comité de Disciplina</h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Gestión de sanciones, suspensiones y cartas de amonestación</p>
                            </div>
                            {canManageSanciones && (
                                <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setData(prev => ({
                                                ...prev,
                                                unidad_tiempo: 'AMONESTACION',
                                                tipo_sancion: 'AMONESTACION',
                                                cantidad_sancion: 1,
                                                estado: 'CUMPLIDO',
                                            }));
                                            setIsFormOpen(true);
                                        }}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-extrabold text-sm transition-all duration-200 shadow-xs active:scale-[0.98] gap-2 border border-amber-300 cursor-pointer"
                                    >
                                        <FileText size={18} className="text-amber-600 shrink-0" />
                                        <span>Emitir Carta de Amonestación</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setIsFormOpen(true);
                                        }}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-sm transition-all duration-200 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 active:scale-[0.98] gap-2 border border-emerald-400/20 cursor-pointer"
                                    >
                                        <Plus size={18} className="stroke-[2.5] shrink-0" />
                                        <span>Ingresar Sanción</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Contexto Global del Torneo */}
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60">
                            <div className="flex items-center space-x-2 mb-4 ml-1">
                                <Trophy size={18} className="text-slate-400" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contexto Activo de Trabajo</h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Campeonato *</label>
                                    <select 
                                        value={data.campeonato_id}
                                        onChange={e => {
                                            setData('campeonato_id', e.target.value);
                                            setData('fase_id', '');
                                            setData('numero_fecha', '');
                                        }}
                                        className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium shadow-xs"
                                    >
                                        <option value="">Seleccione...</option>
                                        {campeonatos.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Fase *</label>
                                    <select 
                                        value={data.fase_id}
                                        onChange={e => {
                                            setData('fase_id', e.target.value);
                                            setData('numero_fecha', '');
                                        }}
                                        className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium disabled:opacity-50 shadow-xs"
                                        disabled={!data.campeonato_id}
                                    >
                                        <option value="">Seleccione...</option>
                                        {fasesDisponibles.map(f => (
                                            <option key={f.id} value={f.id}>{f.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">N° Fecha *</label>
                                    <select 
                                        value={data.numero_fecha}
                                        onChange={e => setData('numero_fecha', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-green-500 text-sm font-medium disabled:opacity-50"
                                        disabled={!data.fase_id}
                                    >
                                        <option value="">N°...</option>
                                        {fechasDisponibles.map(num => (
                                            <option key={num} value={num}>Fecha {num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {isContextSelected && (
                                <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/70 shadow-xs">
                                    <div className="flex items-center gap-3 text-xs font-medium text-emerald-950">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <span className="font-extrabold text-slate-900 block text-sm">Acta Oficial de Sanciones</span>
                                            <span className="text-emerald-700">Documento PDF correspondiente a la <strong>Fecha {data.numero_fecha}</strong></span>
                                        </div>
                                    </div>
                                    <a 
                                        href={route('tribunal.acta', { 
                                            campeonato_id: data.campeonato_id, 
                                            fase_id: data.fase_id, 
                                            numero_fecha: data.numero_fecha 
                                        })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs tracking-wide transition-all duration-200 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 gap-2 shrink-0 active:scale-[0.98] whitespace-nowrap border border-emerald-400/20"
                                    >
                                        <FileDown size={16} className="stroke-[2.5]" />
                                        <span>Ver / Descargar Acta PDF</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sanction Form Modal */}
                    <Modal show={isFormOpen} onClose={closeForm} maxWidth="5xl">
                        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col w-full">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3.5 sm:px-6 sm:py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 relative overflow-hidden shrink-0">
                                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                                <div className="flex items-center justify-between sm:justify-start gap-3 relative z-10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
                                            data.unidad_tiempo === 'AMONESTACION'
                                                ? 'bg-amber-500/20 border border-amber-400/30 text-amber-400'
                                                : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400'
                                        }`}>
                                            {data.unidad_tiempo === 'AMONESTACION' ? <FileText size={19} /> : <Gavel size={19} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                                                {editingSancionId
                                                    ? (data.unidad_tiempo === 'AMONESTACION' ? 'Editar Carta de Amonestación' : 'Editar Sanción Disciplinaria')
                                                    : (data.unidad_tiempo === 'AMONESTACION' ? 'Emitir Carta de Amonestación — Disciplina' : 'Ingresar Sanción Disciplinaria')}
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                                                {data.unidad_tiempo === 'AMONESTACION'
                                                    ? 'Complete los datos para generar e imprimir la Carta de Amonestación PDF'
                                                    : 'Complete los 3 pasos para registrar el fallo en el acta oficial'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="sm:hidden w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 relative z-10">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs w-full sm:w-auto">
                                        <Trophy size={14} className="text-emerald-400 shrink-0" />
                                        <span className="font-bold text-white truncate">
                                            {campeonatos.find(c => c.id.toString() === data.campeonato_id.toString())?.nombre || 'Seleccione Torneo abajo'}
                                            {selectedFase ? ` • ${selectedFase.nombre}` : ''}
                                            {data.numero_fecha ? ` • Fecha ${data.numero_fecha}` : ''}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="hidden sm:flex w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white items-center justify-center transition-all cursor-pointer shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content: 3 pasos claros y ordenados con pie fijo */}
                            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/70 overflow-y-auto">
                                    {/* Errores de campos de contexto */}
                                    {(['campeonato_id', 'fase_id', 'numero_fecha', 'estado', 'tipo_sancion', 'unidad_tiempo', 'observacion'] as const).some(k => errors[k]) && (
                                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold space-y-1">
                                            {(['campeonato_id', 'fase_id', 'numero_fecha', 'estado', 'tipo_sancion', 'unidad_tiempo', 'observacion'] as const).map(k => errors[k] && <p key={k}>• {errors[k]}</p>)}
                                        </div>
                                    )}

                                    {/* Selector de Torneo / Fase / Fecha dentro del modal (por si no lo eligieron antes) */}
                                    <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs ${
                                        !isContextSelected
                                            ? 'bg-amber-50/90 border-amber-300'
                                            : 'bg-white border-slate-200/90'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <Trophy size={15} className={!isContextSelected ? 'text-amber-600' : 'text-emerald-600'} />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                Torneo, Fase y Fecha de Aplicación {!isContextSelected && <span className="text-amber-700 font-bold">(Seleccione para continuar)</span>}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Campeonato <span className="text-red-500">*</span></label>
                                                <select
                                                    value={data.campeonato_id}
                                                    onChange={e => {
                                                        setData(prev => ({
                                                            ...prev,
                                                            campeonato_id: e.target.value,
                                                            fase_id: '',
                                                            numero_fecha: '',
                                                        }));
                                                    }}
                                                    required
                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                >
                                                    <option value="">Seleccione Campeonato...</option>
                                                    {campeonatos.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Fase <span className="text-red-500">*</span></label>
                                                <select
                                                    value={data.fase_id}
                                                    onChange={e => {
                                                        setData(prev => ({
                                                            ...prev,
                                                            fase_id: e.target.value,
                                                            numero_fecha: '',
                                                        }));
                                                    }}
                                                    disabled={!data.campeonato_id}
                                                    required
                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                                                >
                                                    <option value="">Seleccione Fase...</option>
                                                    {fasesDisponibles.map(f => (
                                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">N° Fecha <span className="text-red-500">*</span></label>
                                                <select
                                                    value={data.numero_fecha}
                                                    onChange={e => setData('numero_fecha', e.target.value)}
                                                    disabled={!data.fase_id}
                                                    required
                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                                                >
                                                    <option value="">Seleccione Fecha...</option>
                                                    {fechasDisponibles.map(num => (
                                                        <option key={num} value={num}>Fecha {num}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PASO 1: ¿A QUIÉN SE APLICA LA SANCIÓN? */}
                                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                                    1
                                                </span>
                                                <div>
                                                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                                        ¿A quién se aplica la sanción?
                                                    </h5>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                                                        Seleccione el tipo de sancionado y luego busque o ingrese sus datos
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de tipo de sancionado */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
                                            {[
                                                { id: 'JUGADOR', label: '⚽ Jugador' },
                                                { id: 'TURNO', label: '📋 Turno (Director)' },
                                                { id: 'DIRIGENTE', label: '👔 Dirigente' },
                                                { id: 'CLUB', label: '🛡️ Club Deportivo' },
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setJugadorSearch('');
                                                        setIsManualJugador(false);
                                                        setData(prev => ({
                                                            ...prev,
                                                            tipo_involucrado: t.id as any,
                                                            ...(t.id === 'CLUB' ? { jugador_rut: '', jugador_nombre: '' } : {}),
                                                        }));
                                                    }}
                                                    className={`py-2.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer truncate ${
                                                        data.tipo_involucrado === t.id
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Club + Datos del Sancionado */}
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 pt-1">
                                            {/* Selector de Club */}
                                            <div className={data.tipo_involucrado === 'CLUB' ? 'lg:col-span-12' : 'lg:col-span-4'}>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    {data.tipo_involucrado === 'TURNO' ? '1° Club (Opcional)' : <>1° Seleccione el Club <span className="text-red-500">*</span></>}
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                        <Shield size={16} />
                                                    </div>
                                                    <select
                                                        value={data.club_id}
                                                        onChange={e => setData('club_id', e.target.value)}
                                                        className={`pl-10 w-full rounded-xl border py-2.5 ${errors.club_id ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-bold text-slate-800 transition-all shadow-xs`}
                                                        required={data.tipo_involucrado !== 'TURNO'}
                                                    >
                                                        <option value="">
                                                            {data.tipo_involucrado === 'TURNO'
                                                                ? '-- Sin Club / Turno General --'
                                                                : '-- Todos los clubes / Seleccione --'}
                                                        </option>
                                                        {clubes.map(club => (
                                                            <option key={club.id} value={club.id}>{club.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                                                    {data.tipo_involucrado === 'JUGADOR'
                                                        ? 'Al elegir un club se filtran sus jugadores para encontrarlo más rápido.'
                                                        : 'Institución deportiva a la que pertenece o se aplica la sanción.'}
                                                </p>
                                                {errors.club_id && <p className="text-red-500 text-xs font-semibold mt-1">{errors.club_id}</p>}
                                            </div>

                                            {/* Buscador de Jugador cuando es JUGADOR */}
                                            {data.tipo_involucrado === 'JUGADOR' && (
                                                <div className="lg:col-span-8 space-y-2.5">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            2° Buscar o Seleccionar Jugador <span className="text-red-500">*</span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsManualJugador(!isManualJugador);
                                                                setJugadorSearch('');
                                                            }}
                                                            className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                                                        >
                                                            {isManualJugador
                                                                ? '← Volver al buscador de jugadores registrados'
                                                                : '¿No aparece en la lista? Ingresar manualmente'}
                                                        </button>
                                                    </div>

                                                    {!isManualJugador ? (
                                                        <div className="space-y-2">
                                                            {/* Tarjeta de jugador ya seleccionado */}
                                                            {data.jugador_nombre ? (
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-400/80 shadow-xs">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                                                                            <CheckCircle2 size={20} />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                                                                                ✓ Jugador Seleccionado
                                                                            </span>
                                                                            <p className="text-sm font-black text-slate-900 truncate">
                                                                                {data.jugador_nombre}
                                                                            </p>
                                                                            <p className="text-xs font-semibold text-emerald-800 truncate">
                                                                                RUT: {data.jugador_rut || 'Sin RUT registrado'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setData(prev => ({ ...prev, jugador_nombre: '', jugador_rut: '' }));
                                                                            setJugadorSearch('');
                                                                        }}
                                                                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 text-xs font-extrabold transition-colors shrink-0 cursor-pointer text-center"
                                                                    >
                                                                        Cambiar Jugador
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="relative">
                                                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                        <input
                                                                            type="text"
                                                                            value={jugadorSearch}
                                                                            onChange={e => setJugadorSearch(e.target.value)}
                                                                            placeholder="Escriba nombre, apellido o RUT para buscar rápido..."
                                                                            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 shadow-xs"
                                                                        />
                                                                        {jugadorSearch && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setJugadorSearch('')}
                                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                                            >
                                                                                <X size={15} />
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    <div className="border border-slate-200 rounded-xl bg-white max-h-44 overflow-y-auto divide-y divide-slate-100 shadow-xs">
                                                                        {jugadoresFiltradosBusqueda.length > 0 ? (
                                                                            jugadoresFiltradosBusqueda.map(j => {
                                                                                const clubDelJugador = clubes.find(c => c.id === j.club_id);
                                                                                return (
                                                                                    <button
                                                                                        key={j.id}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setData(prev => ({
                                                                                                ...prev,
                                                                                                jugador_nombre: j.nombre,
                                                                                                jugador_rut: j.rut || '',
                                                                                                club_id: j.club_id ? j.club_id.toString() : prev.club_id,
                                                                                            }));
                                                                                        }}
                                                                                        className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                                                                                    >
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs font-extrabold text-slate-900 truncate">
                                                                                                {j.nombre}
                                                                                            </p>
                                                                                            <p className="text-[11px] font-medium text-slate-500 truncate">
                                                                                                {clubDelJugador ? clubDelJugador.name : 'Club registrado'} • RUT: {j.rut || 'Sin RUT'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shrink-0">
                                                                                            Elegir
                                                                                        </span>
                                                                                    </button>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <div className="p-4 text-center space-y-1.5">
                                                                                <p className="text-xs font-bold text-slate-600">
                                                                                    No se encontraron jugadores con "{jugadorSearch}"
                                                                                </p>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setIsManualJugador(true);
                                                                                        setData(prev => ({ ...prev, jugador_nombre: jugadorSearch }));
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 cursor-pointer"
                                                                                >
                                                                                    <Plus size={13} />
                                                                                    Ingresar a "{jugadorSearch || 'nuevo jugador'}" manualmente
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                                    Nombre y Apellido del Jugador <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={data.jugador_nombre}
                                                                    onChange={e => setData('jugador_nombre', e.target.value)}
                                                                    placeholder="Ej: Carlos Silva Rojas"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                                    RUT del Jugador (Opcional)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={data.jugador_rut}
                                                                    onChange={e => {
                                                                        let rawRut = e.target.value.replace(/[^kK0-9]/g, '');
                                                                        if (rawRut.length === 0) {
                                                                            setData('jugador_rut', '');
                                                                            return;
                                                                        }
                                                                        let dv = rawRut.slice(-1);
                                                                        let body = rawRut.slice(0, -1);
                                                                        let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                                        let finalRut = rawRut.length > 1 ? `${formattedBody}-${dv}` : rawRut;
                                                                        setData('jugador_rut', finalRut.toUpperCase());
                                                                    }}
                                                                    placeholder="Ej: 12.345.678-9"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {errors.jugador_nombre && <p className="text-red-500 text-xs font-semibold">{errors.jugador_nombre}</p>}
                                                    {errors.jugador_rut && <p className="text-red-500 text-xs font-semibold">{errors.jugador_rut}</p>}
                                                </div>
                                            )}

                                            {/* Campos cuando es TURNO o DIRIGENTE */}
                                            {(data.tipo_involucrado === 'TURNO' || data.tipo_involucrado === 'DIRIGENTE') && (
                                                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                            Nombre y Apellido del {data.tipo_involucrado === 'TURNO' ? 'Turno' : 'Dirigente'} <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={data.jugador_nombre}
                                                            onChange={e => setData('jugador_nombre', e.target.value)}
                                                            placeholder={data.tipo_involucrado === 'TURNO' ? 'Ej: Pedro Morales (Turno)' : 'Ej: Juan Pérez González'}
                                                            className={`w-full rounded-xl border py-2.5 px-3.5 ${errors.jugador_nombre ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                            required
                                                        />
                                                        {errors.jugador_nombre && <p className="text-red-500 text-xs font-medium mt-1">{errors.jugador_nombre}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                            RUT del {data.tipo_involucrado === 'TURNO' ? 'Turno' : 'Dirigente'} (Opcional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={data.jugador_rut}
                                                            onChange={e => {
                                                                let rawRut = e.target.value.replace(/[^kK0-9]/g, '');
                                                                if (rawRut.length === 0) {
                                                                    setData('jugador_rut', '');
                                                                    return;
                                                                }
                                                                let dv = rawRut.slice(-1);
                                                                let body = rawRut.slice(0, -1);
                                                                let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                                let finalRut = rawRut.length > 1 ? `${formattedBody}-${dv}` : rawRut;
                                                                setData('jugador_rut', finalRut.toUpperCase());
                                                            }}
                                                            placeholder="Ej: 12.345.678-9"
                                                            className={`w-full rounded-xl border py-2.5 px-3.5 ${errors.jugador_rut ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                        />
                                                        {errors.jugador_rut && <p className="text-red-500 text-xs font-medium mt-1">{errors.jugador_rut}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Alerta de Reincidencia (si aplica) */}
                                        {reincidenciaCount > 0 && (
                                            esLiguilla && data.unidad_tiempo === 'PARTIDOS' ? (
                                                <div className="p-3.5 rounded-xl bg-sky-50/90 border-2 border-sky-300/80 shadow-xs space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center space-x-2 text-sky-950 font-black text-xs uppercase tracking-wider">
                                                            <Info size={18} className="text-sky-600 shrink-0" />
                                                            <span>🏆 Liguilla Detectada: Exención de Reincidencia por Partidos</span>
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-200 text-sky-900 uppercase shrink-0">
                                                            Sin recargo de partidos
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-sky-950 font-semibold leading-relaxed">
                                                        En la fase de <strong>Liguilla</strong>, las expulsiones previas <strong>no suman partidos adicionales</strong> a la sanción base.
                                                        Este sancionado registra {reincidenciaCount} antecedente(s) previo(s), pero se aplica únicamente la sanción base de <strong>{data.cantidad_sancion} partido(s)</strong>.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3.5 rounded-xl bg-amber-50/90 border-2 border-amber-300/80 shadow-xs space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center space-x-2 text-amber-950 font-black text-xs uppercase tracking-wider">
                                                            <AlertCircle size={18} className="text-amber-600 shrink-0" />
                                                            <span>⚠️ Reincidente Detectado ({reincidenciaCount} sanción{reincidenciaCount > 1 ? 'es' : ''} previa{reincidenciaCount > 1 ? 's' : ''})</span>
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase shrink-0">
                                                            {data.unidad_tiempo === 'PARTIDOS' ? `+${reincidenciaCount} Partido${reincidenciaCount > 1 ? 's' : ''} por reincidencia` : 'Reincidencia activa'}
                                                        </span>
                                                    </div>
                                                    <div className="max-h-24 overflow-y-auto divide-y divide-amber-200/60 pr-1">
                                                        {antecedenteSanciones.map(prev => (
                                                            <div key={prev.id} className="py-1 flex items-center justify-between gap-2 text-[11px] text-amber-900 font-medium">
                                                                <div className="truncate min-w-0">
                                                                    <span className="font-bold">• {prev.tipo_falta}</span> ({prev.articulo_reglamento})
                                                                </div>
                                                                <span className="font-extrabold text-amber-950 bg-amber-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                                                    {prev.cantidad_sancion} {prev.unidad_tiempo}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* PASO 2: MOTIVO E INFRACCIÓN REGLAMENTARIA */}
                                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                                    2
                                                </span>
                                                <div>
                                                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                                        Motivo e Infracción Reglamentaria
                                                    </h5>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                                                        Elija una causal frecuente o escriba una infracción personalizada junto a su artículo
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreandoReferencia(!isCreandoReferencia)}
                                                className="inline-flex items-center text-xs font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} className="mr-1 shrink-0" />
                                                <span>Guardar nueva referencia frecuente</span>
                                            </button>
                                        </div>

                                        {isCreandoReferencia && (
                                            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-center">
                                                <input
                                                    type="text"
                                                    value={nuevaReferencia}
                                                    onChange={e => setNuevaReferencia(e.target.value)}
                                                    placeholder="Escriba el nombre de la referencia frecuente (ej: Agresión verbal al árbitro)..."
                                                    className="flex-1 rounded-xl border-emerald-300 text-xs font-bold text-slate-900 py-2 px-3.5 focus:ring-2 focus:ring-emerald-600"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleGuardarNuevaReferencia}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                                                    >
                                                        Guardar en la lista
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCreandoReferencia(false)}
                                                        className="px-2.5 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                                            <div className="lg:col-span-7 space-y-2">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Tipo de Infracción / Referencia (REF:) <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={esFaltaPersonalizada ? 'OTRO' : (referencias.some(r => r.nombre === data.tipo_falta) ? data.tipo_falta : (data.tipo_falta ? 'OTRO' : ''))}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val === 'OTRO') {
                                                            setEsFaltaPersonalizada(true);
                                                            if (referencias.some(r => r.nombre === data.tipo_falta)) {
                                                                setData('tipo_falta', '');
                                                            }
                                                        } else {
                                                            setEsFaltaPersonalizada(false);
                                                            setData('tipo_falta', val);
                                                        }
                                                    }}
                                                    className={`w-full rounded-xl border py-2.5 px-3.5 ${errors.tipo_falta ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-bold text-slate-800 transition-all shadow-xs`}
                                                >
                                                    <option value="">-- Seleccione una Referencia / Infracción --</option>
                                                    {referencias.map(r => (
                                                        <option key={r.id} value={r.nombre}>REF: {r.nombre}</option>
                                                    ))}
                                                    <option value="OTRO">✏️ Escribir otra infracción personalizada...</option>
                                                </select>

                                                {(esFaltaPersonalizada || (data.tipo_falta !== '' && !referencias.some(r => r.nombre === data.tipo_falta))) && (
                                                    <input
                                                        type="text"
                                                        value={data.tipo_falta}
                                                        onChange={e => setData('tipo_falta', e.target.value)}
                                                        placeholder="Escriba aquí la infracción o motivo personalizado..."
                                                        className="w-full rounded-xl border border-emerald-400 bg-emerald-50/30 py-2.5 px-3.5 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs"
                                                        required
                                                    />
                                                )}
                                                {errors.tipo_falta && <p className="text-red-500 text-xs font-medium mt-1">{errors.tipo_falta}</p>}
                                            </div>

                                            <div className="lg:col-span-5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                    Art. / Letra del Reglamento <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.articulo_reglamento}
                                                    onChange={e => setData('articulo_reglamento', e.target.value)}
                                                    placeholder="Ej: Art. 209 Letra G"
                                                    className={`w-full rounded-xl border py-2.5 px-3.5 ${errors.articulo_reglamento ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                    required
                                                />
                                                {errors.articulo_reglamento && <p className="text-red-500 text-xs font-medium mt-1">{errors.articulo_reglamento}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* PASO 3: SANCIÓN, FECHA Y OBSERVACIONES */}
                                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                                3
                                            </span>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                                    Tipo de Sanción, Duración y Observaciones
                                                </h5>
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                                                    Indique si corresponde suspensión por partidos, por tiempo o Carta de Amonestación
                                                </p>
                                            </div>
                                        </div>

                                        {/* Selector visual del Tipo de Sanción */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
                                            <button
                                                type="button"
                                                onClick={() => setData(prev => ({
                                                    ...prev,
                                                    unidad_tiempo: 'PARTIDOS',
                                                    tipo_sancion: 'PARTIDOS',
                                                    estado: 'ACTIVO',
                                                }))}
                                                className={`py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                    data.unidad_tiempo === 'PARTIDOS'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                                }`}
                                            >
                                                ⚽ Suspensión por Partidos
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData(prev => ({
                                                    ...prev,
                                                    unidad_tiempo: prev.unidad_tiempo === 'AÑOS' ? 'AÑOS' : 'MESES',
                                                    tipo_sancion: 'TIEMPO',
                                                    estado: 'ACTIVO',
                                                }))}
                                                className={`py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                    data.unidad_tiempo === 'MESES' || data.unidad_tiempo === 'AÑOS'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                                }`}
                                            >
                                                🗓️ Suspensión por Meses / Años
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData(prev => ({
                                                    ...prev,
                                                    unidad_tiempo: 'AMONESTACION',
                                                    tipo_sancion: 'AMONESTACION',
                                                    cantidad_sancion: 1,
                                                    estado: 'CUMPLIDO',
                                                }))}
                                                className={`py-2.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                    data.unidad_tiempo === 'AMONESTACION'
                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                                }`}
                                            >
                                                📄 Carta de Amonestación
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                                            <div className="lg:col-span-7">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    {data.unidad_tiempo === 'AMONESTACION' ? 'Modalidad de Amonestación' : 'Cantidad / Duración de la Sanción'} <span className="text-red-500">*</span>
                                                </label>

                                                {data.unidad_tiempo === 'AMONESTACION' ? (
                                                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3">
                                                        <FileText size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                                        <div className="text-xs text-amber-950 font-medium leading-relaxed">
                                                            <span className="font-extrabold block text-amber-900">Carta de Amonestación Escrita (Sin suspensión)</span>
                                                            Genera el documento formal en PDF firmado por Presidencia y Secretaría sin restar fechas de partido.
                                                        </div>
                                                    </div>
                                                ) : reincidenciaAplica && data.unidad_tiempo === 'PARTIDOS' ? (
                                                    <div className="bg-amber-50/90 p-3.5 rounded-xl border-2 border-amber-300 text-xs space-y-2 shadow-xs">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="font-extrabold text-amber-950">Sanción Base por Infracción:</span>
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    required
                                                                    value={basePartidos}
                                                                    onChange={e => setBasePartidos(Math.max(1, parseInt(e.target.value) || 1))}
                                                                    className="w-20 border border-amber-300 bg-white text-center font-black text-slate-900 text-sm rounded-lg py-1.5 focus:ring-2 focus:ring-amber-500 shadow-xs"
                                                                />
                                                                <span className="font-bold text-amber-950">Partidos</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-amber-950 pt-1.5 border-t border-amber-200/80 font-bold">
                                                            <span>+ Recargo Reincidencia ({reincidenciaCount} previa{reincidenciaCount > 1 ? 's' : ''}):</span>
                                                            <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-xs">
                                                                + {reincidenciaCount} partido{reincidenciaCount > 1 ? 's' : ''}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-emerald-950 pt-1.5 border-t border-amber-300 font-extrabold text-xs">
                                                            <span>Total a Aplicar (Base + Reincidencia):</span>
                                                            <span className="font-black text-sm text-emerald-900 bg-emerald-200 px-3 py-1 rounded-lg border border-emerald-400 shadow-xs">
                                                                = {basePartidos + reincidenciaCount} Partidos
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : data.unidad_tiempo === 'PARTIDOS' ? (
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                required
                                                                value={data.cantidad_sancion}
                                                                onChange={e => setData('cantidad_sancion', Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-20 sm:w-24 rounded-xl border border-slate-300 bg-white py-2.5 text-center font-black text-slate-900 text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
                                                            />
                                                            <span className="text-sm font-extrabold text-slate-700">
                                                                Partido(s) de suspensión
                                                            </span>
                                                            <div className="flex items-center gap-1 sm:ml-auto">
                                                                {[1, 2, 3, 4, 5].map(num => (
                                                                    <button
                                                                        key={num}
                                                                        type="button"
                                                                        onClick={() => setData('cantidad_sancion', num)}
                                                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                                                            data.cantidad_sancion === num
                                                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        {num}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 shadow-xs bg-white">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            required
                                                            value={data.cantidad_sancion}
                                                            onChange={e => setData('cantidad_sancion', Math.max(1, parseInt(e.target.value) || 1))}
                                                            className="w-24 border-0 border-r border-slate-200 bg-slate-50 text-center font-black text-slate-900 text-base py-2.5 focus:ring-0"
                                                        />
                                                        <select
                                                            value={data.unidad_tiempo}
                                                            onChange={e => {
                                                                const unit = e.target.value as 'MESES' | 'AÑOS';
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    unidad_tiempo: unit,
                                                                    tipo_sancion: 'TIEMPO',
                                                                }));
                                                            }}
                                                            className="flex-1 border-0 bg-white font-bold text-slate-800 text-sm py-2.5 focus:ring-0"
                                                        >
                                                            <option value="MESES">Meses de suspensión</option>
                                                            <option value="AÑOS">Años de suspensión</option>
                                                        </select>
                                                    </div>
                                                )}
                                                {errors.cantidad_sancion && <p className="text-red-500 text-xs font-medium mt-1">{errors.cantidad_sancion}</p>}
                                            </div>

                                            <div className="lg:col-span-5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    Fecha de Resolución <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={data.fecha_resolucion}
                                                    onChange={e => setData('fecha_resolucion', e.target.value)}
                                                    className={`w-full rounded-xl border py-2.5 px-3.5 ${errors.fecha_resolucion ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                />
                                                {errors.fecha_resolucion && <p className="text-red-500 text-xs font-medium mt-1">{errors.fecha_resolucion}</p>}
                                            </div>
                                        </div>

                                        {/* Observación */}
                                        <div className="pt-1">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Descripción / Observación Adicional <span className="text-slate-400 font-medium lowercase">(opcional)</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={data.observacion}
                                                onChange={e => setData('observacion', e.target.value)}
                                                placeholder="Detalles adicionales sobre los hechos o consideraciones del fallo..."
                                                className="w-full rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-800 transition-all shadow-xs resize-none py-2.5 px-3.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer fijo siempre visible */}
                                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 bg-white shrink-0">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer text-center"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-sm text-white active:scale-[0.99] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                                            data.unidad_tiempo === 'AMONESTACION'
                                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <span>
                                                {editingSancionId
                                                    ? (data.unidad_tiempo === 'AMONESTACION' ? 'Actualizar Carta de Amonestación' : 'Actualizar Sanción')
                                                    : (data.unidad_tiempo === 'AMONESTACION' ? 'Guardar Carta de Amonestación' : 'Guardar Sanción')}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>

                    <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-2xl px-6 pt-4 mt-8 shadow-sm">
                            <button
                                onClick={() => setActiveTab('sanciones')}
                                className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${activeTab === 'sanciones' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Gavel size={18} />
                                    <span>Sanciones</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('notas')}
                                className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${activeTab === 'notas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center space-x-2">
                                    <FileText size={18} />
                                    <span>Notas de la Fecha</span>
                                </div>
                            </button>
                        </div>

                    {/* Sanciones Table */}
                    {activeTab === 'sanciones' && (
                        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200/60 border-t-0 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
                            <div className="flex items-center justify-between shrink-0">
                                <h2 className="text-lg font-bold text-slate-800">Registros Históricos</h2>
                                <span className="2xl:hidden px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                    {filteredSanciones.length} Sanciones
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full 2xl:w-auto">
                                <div className="relative flex-1 min-w-[200px] sm:w-64 max-w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar jugador, RUT o club..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white"
                                    />
                                </div>
                                <select
                                    value={filterCampeonato}
                                    onChange={(e) => { setFilterCampeonato(e.target.value); setFilterFase(''); }}
                                    className="flex-1 min-w-[140px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-green-500 font-medium text-slate-600"
                                >
                                    <option value="">Todos los Torneos</option>
                                    {campeonatos.map(camp => (
                                        <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterFase}
                                    onChange={(e) => setFilterFase(e.target.value)}
                                    className="flex-1 min-w-[130px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-green-500 font-medium text-slate-600"
                                >
                                    <option value="">Todas las Fases</option>
                                    {filterFasesDisponibles.map(f => (
                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterEstado}
                                    onChange={(e) => setFilterEstado(e.target.value)}
                                    className="flex-1 min-w-[130px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-green-500 font-medium text-slate-600"
                                >
                                    <option value="">Todos los Estados</option>
                                    <option value="ACTIVO">Activos</option>
                                    <option value="CUMPLIDO">Cumplidos</option>
                                    <option value="AMONESTACION">📄 Cartas de Amonestación</option>
                                </select>
                                <select
                                    value={filterFecha}
                                    onChange={(e) => setFilterFecha(e.target.value)}
                                    className="flex-1 min-w-[120px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-green-500 font-medium text-slate-600"
                                >
                                    <option value="">Todas las Fechas</option>
                                    {filterFechasDisponibles.map(n => (
                                        <option key={n} value={n}>Fecha {n}</option>
                                    ))}
                                </select>
                                <span className="hidden 2xl:inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold whitespace-nowrap shrink-0">
                                    {filteredSanciones.length} Sanciones
                                </span>
                            </div>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {paginatedSanciones.map((sancion) => (
                                <div key={sancion.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sancion.campeonato?.nombre || 'S/N'}</div>
                                            <div className="text-xs font-medium text-slate-600">{sancion.fase?.nombre || 'S/N'} • F{sancion.numero_fecha}</div>
                                        </div>
                                        {sancion.estado === 'ACTIVO' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm">
                                                <span className="w-1 h-1 rounded-full bg-amber-500 mr-1 animate-pulse"></span>
                                                ACTIVO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1"></span>
                                                CUMPLIDO
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 mb-4">
                                        {sancion.club?.crest ? (
                                            <img
                                                src={sancion.club.crest.startsWith('http') || sancion.club.crest.startsWith('/') ? sancion.club.crest : `/storage/${sancion.club.crest}`}
                                                alt={sancion.club.name}
                                                className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 bg-white"
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-extrabold text-slate-500 shadow-sm border border-slate-200">
                                                {(sancion.club?.name || 'TU').substring(0,2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">
                                                {sancion.jugador?.nombre || sancion.nombre_involucrado || 'Sanción al Club'}
                                            </div>
                                            <div className="font-medium text-xs text-slate-500">
                                                {sancion.tipo_involucrado === 'TURNO' && 'Turno • '}
                                                {sancion.tipo_involucrado === 'DIRIGENTE' && 'Dirigente • '}
                                                {sancion.club?.name || 'Sin club'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4 flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className={`flex items-center justify-center w-6 h-6 rounded ${
                                                sancion.tipo_sancion === 'PARTIDOS'
                                                    ? 'bg-red-100 text-red-600'
                                                    : sancion.tipo_sancion === 'AMONESTACION'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-orange-100 text-orange-600'
                                            }`}>
                                                {sancion.tipo_sancion === 'PARTIDOS'
                                                    ? <AlertCircle size={14} />
                                                    : sancion.tipo_sancion === 'AMONESTACION'
                                                        ? <FileText size={14} />
                                                        : <CalendarClock size={14} />}
                                            </div>
                                            <span className="font-extrabold text-sm text-slate-800">
                                                {sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION'
                                                    ? 'Carta de Amonestación'
                                                    : `${sancion.cantidad_sancion} ${sancion.unidad_tiempo.toLowerCase()}`}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedSancion(sancion)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(sancion)}
                                            className="text-slate-400 hover:text-green-600 transition-colors ml-2"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(sancion.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <a 
                                        href={route('tribunal.sanciones.oficio', sancion.id)} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl font-black text-xs border transition-colors ${
                                            sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION'
                                                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                                                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <FileDown size={16} />
                                        <span>
                                            {sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION'
                                                ? 'Descargar Carta de Amonestación PDF'
                                                : 'Descargar Oficio PDF'}
                                        </span>
                                    </a>
                                </div>
                            ))}
                            {filteredSanciones.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No se encontraron sanciones</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 tracking-wider">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold whitespace-nowrap">Torneo / Fecha</th>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold">Club y Sancionado</th>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold whitespace-nowrap">Sanción</th>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold text-center whitespace-nowrap">Estado</th>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold text-center whitespace-nowrap">Documento PDF</th>
                                        <th className="px-4 lg:px-6 py-3.5 font-bold text-right whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {paginatedSanciones.map((sancion) => (
                                        <tr key={sancion.id} className="hover:bg-green-50/30 transition-colors duration-200 group">
                                            <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                                                <div className="text-xs font-extrabold text-slate-900">{sancion.campeonato?.nombre || 'S/N'}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{sancion.fase?.nombre || 'S/N'} • Fecha {sancion.numero_fecha}</div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5">
                                                <div className="flex items-center space-x-3">
                                                    {sancion.jugador ? (
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-600 shadow-inner border border-slate-200/50 shrink-0">
                                                            {sancion.jugador.nombre.substring(0, 1).toUpperCase()}
                                                            {sancion.jugador.nombre.split(' ').length > 1 ? sancion.jugador.nombre.split(' ')[1].substring(0, 1).toUpperCase() : ''}
                                                        </div>
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner border border-slate-200/50 shrink-0">
                                                            <User size={16} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                                                                {sancion.jugador?.nombre || sancion.nombre_involucrado || 'Sanción al Club'}
                                                            </span>
                                                            {sancion.tipo_involucrado === 'TURNO' && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 whitespace-nowrap shrink-0">
                                                                    Turno
                                                                </span>
                                                            )}
                                                            {sancion.tipo_involucrado === 'DIRIGENTE' && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-200 whitespace-nowrap shrink-0">
                                                                    Dirigente
                                                                </span>
                                                            )}
                                                            {sanciones.filter(s => s.tipo_sancion !== 'AMONESTACION' && ((s.jugador?.id && sancion.jugador?.id && s.jugador.id === sancion.jugador.id) || (s.jugador?.rut && sancion.jugador?.rut && s.jugador.rut === sancion.jugador.rut))).length > 1 && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs inline-flex items-center gap-0.5 whitespace-nowrap shrink-0" title="Jugador Reincidente">
                                                                    ⚡ Reincidente
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center mt-0.5 space-x-1.5">
                                                            {sancion.club?.crest ? (
                                                                <img
                                                                    src={sancion.club.crest.startsWith('http') || sancion.club.crest.startsWith('/') ? sancion.club.crest : `/storage/${sancion.club.crest}`}
                                                                    alt={sancion.club.name}
                                                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <Shield size={12} className="text-slate-400 shrink-0" />
                                                            )}
                                                            <span className="font-medium text-xs text-slate-500 truncate">
                                                                {sancion.club?.name || (sancion.tipo_involucrado === 'TURNO' ? 'Turno de Cancha (Sin club)' : 'Sin club')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-xs whitespace-nowrap ${
                                                    sancion.tipo_sancion === 'PARTIDOS' 
                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                        : sancion.tipo_sancion === 'AMONESTACION'
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                    {sancion.tipo_sancion === 'PARTIDOS'
                                                        ? <AlertCircle size={15} className="text-red-500 shrink-0" />
                                                        : sancion.tipo_sancion === 'AMONESTACION'
                                                            ? <FileText size={15} className="text-amber-600 shrink-0" />
                                                            : <CalendarClock size={15} className="text-orange-500 shrink-0" />}
                                                    <span className="font-extrabold text-xs whitespace-nowrap">
                                                        {sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION' ? (
                                                            <span className="uppercase">Carta Amonestación</span>
                                                        ) : (
                                                            <>{sancion.cantidad_sancion} <span className="font-bold opacity-85 uppercase">{sancion.unidad_tiempo}</span></>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">
                                                {sancion.estado === 'ACTIVO' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse shrink-0"></span>
                                                        ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0"></span>
                                                        CUMPLIDO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">
                                                <a 
                                                    href={route('tribunal.sanciones.oficio', sancion.id)} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all shadow-xs whitespace-nowrap shrink-0 ${
                                                        sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION'
                                                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                    }`}
                                                    title={sancion.tipo_sancion === 'AMONESTACION' ? 'Descargar Carta de Amonestación PDF' : 'Descargar Oficio PDF'}
                                                >
                                                    <FileDown size={14} className={`shrink-0 ${sancion.tipo_sancion === 'AMONESTACION' ? 'text-amber-600' : 'text-emerald-600'}`} />
                                                    <span>
                                                        {sancion.tipo_sancion === 'AMONESTACION' || sancion.unidad_tiempo === 'AMONESTACION'
                                                            ? 'Carta Amonestación'
                                                            : 'Oficio PDF'}
                                                    </span>
                                                </a>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => setSelectedSancion(sancion)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={17} strokeWidth={2.2} />
                                                    </button>
                                                    {canManageSanciones && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleEdit(sancion)}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                title="Editar Sanción"
                                                            >
                                                                <Edit2 size={17} strokeWidth={2.2} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(sancion.id)}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                title="Eliminar Sanción"
                                                            >
                                                                <Trash2 size={17} strokeWidth={2.2} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSanciones.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <AlertCircle size={32} strokeWidth={1.5} className="mb-3 text-slate-300" />
                                                    <p className="text-sm font-medium text-slate-500">No hay sanciones registradas</p>
                                                    <p className="text-xs text-slate-400 mt-1">Usa el botón superior para ingresar la primera sanción.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar Sanciones */}
                        {filteredSanciones.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500">
                                    <span>
                                        Mostrando <strong className="text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredSanciones.length)}</strong> a <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredSanciones.length)}</strong> de <strong className="text-slate-800">{filteredSanciones.length}</strong> registros
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-medium">Mostrar:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                            className="py-1 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                                        >
                                            <option value={10}>10 por pág.</option>
                                            <option value={25}>25 por pág.</option>
                                            <option value={50}>50 por pág.</option>
                                            <option value={100}>100 por pág.</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all font-bold text-xs flex items-center gap-1"
                                        title="Página Anterior"
                                    >
                                        <ChevronLeft size={16} />
                                        <span className="hidden sm:inline">Anterior</span>
                                    </button>
                                    
                                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 shadow-xs">
                                        {currentPage} / {totalPagesSanciones}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesSanciones))}
                                        disabled={currentPage >= totalPagesSanciones}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all font-bold text-xs flex items-center gap-1"
                                        title="Página Siguiente"
                                    >
                                        <span className="hidden sm:inline">Siguiente</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Modal Detalle Sanción */}
                    <Modal show={!!selectedSancion} onClose={() => setSelectedSancion(null)} maxWidth="md">
                        {selectedSancion && (
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Detalle de la Infracción</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            {selectedSancion.jugador?.nombre || selectedSancion.nombre_involucrado || 'Sanción al Club'} • {selectedSancion.club?.name || 'Turno de Cancha'}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedSancion(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Infracción</div>
                                        <div className="font-semibold text-slate-800">{selectedSancion.tipo_falta}</div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reglamento Aplicado</div>
                                        <div className="font-semibold text-slate-800">{selectedSancion.articulo_reglamento}</div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observación Adicional</div>
                                        <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap">
                                            {selectedSancion.observacion || 'Ninguna observación adicional.'}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                        <div className="text-xs font-bold text-red-800 uppercase tracking-wider">Sanción</div>
                                        <div className="font-black text-lg text-red-600">
                                            {selectedSancion.tipo_sancion === 'AMONESTACION' || selectedSancion.unidad_tiempo === 'AMONESTACION'
                                                ? 'Carta de Amonestación Escrita'
                                                : `${selectedSancion.cantidad_sancion} ${selectedSancion.unidad_tiempo.toLowerCase()}`}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex gap-2">
                                    <a 
                                        href={route('tribunal.sanciones.oficio', selectedSancion.id)} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors inline-flex items-center justify-center space-x-2 text-sm"
                                    >
                                        <FileDown size={18} />
                                        <span>Ver Oficio PDF</span>
                                    </a>
                                    <button 
                                        onClick={() => setSelectedSancion(null)}
                                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors text-sm"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* SECCIÓN NOTAS DE LA FECHA */}
                    {activeTab === 'notas' && (
                        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200/60 border-t-0 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
                                <div className="flex items-center space-x-3 shrink-0">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Notas de la Fecha</h2>
                                        <p className="text-sm text-slate-500 font-medium">Multas, amonestaciones y observaciones generales a clubes</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full 2xl:w-auto">
                                    <div className="relative flex-1 min-w-[200px] sm:w-64 max-w-full">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar en notas..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
                                        />
                                    </div>
                                    <select
                                        value={filterCampeonato}
                                        onChange={(e) => { setFilterCampeonato(e.target.value); setFilterFase(''); }}
                                        className="flex-1 min-w-[140px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-600"
                                    >
                                        <option value="">Todos los Torneos</option>
                                        {campeonatos.map(camp => (
                                            <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterFase}
                                        onChange={(e) => setFilterFase(e.target.value)}
                                        className="flex-1 min-w-[130px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-600"
                                    >
                                        <option value="">Todas las Fases</option>
                                        {filterFasesDisponibles.map(f => (
                                            <option key={f.id} value={f.id}>{f.nombre}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterFecha}
                                        onChange={(e) => setFilterFecha(e.target.value)}
                                        className="flex-1 min-w-[120px] max-w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-600"
                                    >
                                        <option value="">Todas las Fechas</option>
                                        {filterFechasDisponibles.map(n => (
                                            <option key={n} value={n}>Fecha {n}</option>
                                        ))}
                                    </select>
                                    {isContextSelected && canManageNotas && (
                                        <button 
                                            onClick={() => {
                                                formNota.reset();
                                                formNota.clearErrors();
                                                setEditingNotaId(null);
                                                setIsNotaFormOpen(true);
                                            }}
                                            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                                        >
                                            <Plus size={16} />
                                            <span>Añadir Nota</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-50/50">
                                {filteredNotas.length > 0 ? (
                                    <>
                                        <ul className="space-y-4">
                                            {paginatedNotas.map((nota) => (
                                                <li key={nota.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-start transition-all hover:border-blue-300 hover:shadow-md">
                                                    <div className="flex gap-4">
                                                        <div className="hidden sm:flex shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-full items-center justify-center font-bold text-lg">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-col mb-2">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{nota.campeonato?.nombre || 'S/N'}</div>
                                                                <div className="text-xs font-medium text-slate-500">{nota.fase?.nombre || 'S/N'} • F{nota.numero_fecha}</div>
                                                            </div>
                                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                                {nota.club && (
                                                                    <span className="font-bold text-slate-900">{nota.club.name}: </span>
                                                                )}
                                                                {nota.nota}
                                                            </p>
                                                            {nota.monto && (
                                                                <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                                                                    Multa: ${new Intl.NumberFormat('es-CL').format(nota.monto)}.-
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {canManageNotas && (
                                                        <div className="flex gap-2 shrink-0">
                                                            <button 
                                                                onClick={() => handleEditNota(nota)}
                                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteNota(nota.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Pagination Bar Notas */}
                                        <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500">
                                                <span>
                                                    Mostrando <strong className="text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotas.length)}</strong> a <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredNotas.length)}</strong> de <strong className="text-slate-800">{filteredNotas.length}</strong> registros
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-medium">Mostrar:</span>
                                                    <select
                                                        value={itemsPerPage}
                                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                                        className="py-1 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                                                    >
                                                        <option value={10}>10 por pág.</option>
                                                        <option value={25}>25 por pág.</option>
                                                        <option value={50}>50 por pág.</option>
                                                        <option value={100}>100 por pág.</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all font-bold text-xs flex items-center gap-1"
                                                    title="Página Anterior"
                                                >
                                                    <ChevronLeft size={16} />
                                                    <span className="hidden sm:inline">Anterior</span>
                                                </button>
                                                
                                                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 shadow-xs">
                                                    {currentPage} / {totalPagesNotas}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesNotas))}
                                                    disabled={currentPage >= totalPagesNotas}
                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all font-bold text-xs flex items-center gap-1"
                                                    title="Página Siguiente"
                                                >
                                                    <span className="hidden sm:inline">Siguiente</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 font-medium">No hay notas registradas para esta fecha.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MODAL NOTA DE DISCIPLINA */}
                    <Modal show={isNotaFormOpen} onClose={() => setIsNotaFormOpen(false)} maxWidth="md">
                        <div className="bg-white p-6">
                            <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg mr-3">
                                    <FileText size={18} />
                                </span>
                                {editingNotaId ? 'Editar Nota' : 'Añadir Nota'}
                            </h4>

                            <form onSubmit={submitNota} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Club Involucrado (Opcional)</label>
                                    <select 
                                        value={formNota.data.club_id}
                                        onChange={e => formNota.setData('club_id', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                    >
                                        <option value="">Ninguno / General</option>
                                        {clubes.map(club => (
                                            <option key={club.id} value={club.id}>{club.name}</option>
                                        ))}
                                    </select>
                                    {formNota.errors.club_id && <div className="text-red-500 text-xs mt-1 font-medium">{formNota.errors.club_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detalle de la Nota*</label>
                                    <textarea 
                                        value={formNota.data.nota}
                                        onChange={e => formNota.setData('nota', e.target.value)}
                                        rows={4}
                                        placeholder="Ej: Se Multa a Club Valencia por no presentación en serie 3era adulta..."
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none"
                                        required
                                    />
                                    {formNota.errors.nota && <div className="text-red-500 text-xs mt-1 font-medium">{formNota.errors.nota}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Monto de Multa ($) (Opcional)</label>
                                    <input 
                                        type="number"
                                        value={formNota.data.monto}
                                        onChange={e => formNota.setData('monto', e.target.value)}
                                        min="0"
                                        placeholder="Ej: 50000"
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                    />
                                    {formNota.errors.monto && <div className="text-red-500 text-xs mt-1 font-medium">{formNota.errors.monto}</div>}
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsNotaFormOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={formNota.processing}
                                        className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
                                    >
                                        {formNota.processing ? 'Guardando...' : (editingNotaId ? 'Actualizar' : 'Añadir')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            <Modal show={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({isOpen: false, type: 'sancion', id: null})} maxWidth="sm">
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} strokeWidth={2} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">¿Estás seguro?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">
                            Estás a punto de eliminar este registro permanentemente. Esta acción no se puede deshacer.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button 
                                onClick={() => setDeleteConfirm({isOpen: false, type: 'sancion', id: null})}
                                className="w-full px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="w-full px-4 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 transition-colors flex items-center justify-center"
                            >
                                <Trash2 size={18} className="mr-2" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Custom Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 pl-4 pr-6 py-3 transition-all animate-in fade-in slide-in-from-bottom-5">
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={20} className="text-green-400 mr-3 shrink-0" />
                    ) : (
                        <XCircle size={20} className="text-red-400 mr-3 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast({show: false, message: '', type: null})} className="ml-6 text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
