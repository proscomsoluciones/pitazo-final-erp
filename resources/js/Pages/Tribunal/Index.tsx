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
    rut: string;
    nombre: string;
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
    club: Club;
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

    const handleGuardarNuevaReferencia = () => {
        if (!nuevaReferencia.trim()) return;
        router.post(route('referencias-oficio.store'), {
            nombre: nuevaReferencia.trim(),
            modulo: 'TRIBUNAL'
        }, {
            onSuccess: () => {
                setData('tipo_falta', nuevaReferencia.trim());
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
        club_id: '',
        jugador_rut: '',
        jugador_nombre: '',
        articulo_reglamento: '',
        tipo_falta: '',
        tipo_sancion: 'PARTIDOS' as 'PARTIDOS' | 'TIEMPO',
        cantidad_sancion: 1,
        unidad_tiempo: 'PARTIDOS' as 'PARTIDOS' | 'MESES' | 'AÑOS',
        fecha_resolucion: new Date().toISOString().split('T')[0],
        estado: 'ACTIVO',
        observacion: ''
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSancionId, setEditingSancionId] = useState<number | null>(null);
    const [basePartidos, setBasePartidos] = useState<number>(1);

    // Detección de Reincidencia: calcular sanciones previas del jugador (+1 partido por antecedente)
    const antecedenteSanciones = useMemo(() => {
        const cleanRut = data.jugador_rut ? data.jugador_rut.replace(/[^kK0-9]/g, '').toLowerCase() : '';
        const cleanName = data.jugador_nombre ? data.jugador_nombre.trim().toLowerCase() : '';

        if (!cleanRut && !cleanName) return [];

        return sanciones.filter(s => {
            if (editingSancionId && s.id === editingSancionId) return false;
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
        if (reincidenciaCount <= 0) return false;
        if (esLiguilla && data.unidad_tiempo === 'PARTIDOS') return false;
        return true;
    }, [reincidenciaCount, esLiguilla, data.unidad_tiempo]);

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
        
        if (editingSancionId) {
            put(route('tribunal.sanciones.update', editingSancionId), {
                onSuccess: () => {
                    resetForm();
                    setIsFormOpen(false);
                },
            });
        } else {
            post(route('tribunal.sanciones.store'), {
                onSuccess: () => {
                    resetForm();
                    setIsFormOpen(false);
                },
            });
        }
    };

    const resetForm = () => {
        reset('club_id', 'jugador_rut', 'jugador_nombre', 'articulo_reglamento', 'tipo_falta', 'observacion', 'cantidad_sancion', 'tipo_sancion', 'unidad_tiempo', 'fecha_resolucion', 'estado');
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
        setData({
            ...data,
            club_id: sancion.club_id.toString(),
            jugador_rut: sancion.jugador?.rut || '',
            jugador_nombre: sancion.jugador?.nombre || '',
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
            campeonato_id: nota.campeonato_id.toString(),
            fase_id: nota.fase_id.toString(),
            numero_fecha: nota.numero_fecha.toString(),
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
            (sancion.jugador?.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sancion.club.name).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCampeonato = filterCampeonato ? sancion.campeonato?.id.toString() === filterCampeonato : true;
        const matchesFase = filterFase ? sancion.fase?.id.toString() === filterFase : true;
        const matchesEstado = filterEstado ? sancion.estado === filterEstado : true;
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Comité de Disciplina</h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Gestión de sanciones y penalizaciones</p>
                            </div>
                            {isContextSelected && canManageSanciones && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                        onClick={() => {
                                            resetForm();
                                            setIsFormOpen(true);
                                        }}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-sm transition-all duration-200 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 active:scale-[0.98] gap-2 border border-emerald-400/20"
                                    >
                                        <Plus size={18} className="stroke-[2.5]" />
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
                    <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="2xl">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between relative overflow-hidden">
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                                <div className="flex items-center space-x-3.5 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shadow-inner">
                                        <Gavel size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                                            {editingSancionId ? 'Editar Sanción Disciplinaria' : 'Formulario de Ingreso de Sanción'}
                                        </h4>
                                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                                            {editingSancionId ? 'Modifique los datos de la sanción seleccionada' : 'Ingrese los detalles para registrar en el acta oficial'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all relative z-10"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 sm:p-8 space-y-6">
                                {/* Context Banner */}
                                <div className="bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Trophy size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Aplicando Sanción en</span>
                                            <span className="text-xs font-extrabold text-slate-800">
                                                {campeonatos.find(c => c.id.toString() === data.campeonato_id)?.nombre || 'Sin Campeonato'} 
                                                <span className="text-emerald-600 font-semibold mx-1.5">•</span>
                                                Fecha {data.numero_fecha || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs self-start sm:self-center">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Acta Oficial
                                    </span>
                                </div>

                                <form onSubmit={submit} className="space-y-6">
                                    {/* Fila 1: Club */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Club Afectado <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Shield size={16} />
                                            </div>
                                            <select 
                                                value={data.club_id}
                                                onChange={e => setData('club_id', e.target.value)}
                                                className={`pl-10 w-full rounded-xl border ${errors.club_id ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                required
                                            >
                                                <option value="">Seleccione un Club...</option>
                                                {clubes.map(club => (
                                                    <option key={club.id} value={club.id}>{club.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.club_id && <p className="text-red-500 text-xs font-medium mt-1">{errors.club_id}</p>}
                                    </div>

                                    {/* Fila 2: Jugador (RUT + Nombre) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    RUT Jugador <span className="text-red-500">*</span>
                                                </label>
                                                {jugadores.some(j => j.rut === data.jugador_rut) && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                        ✓ Encontrado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <User size={16} />
                                                </div>
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
                                                        finalRut = finalRut.toUpperCase();
                                                        setData('jugador_rut', finalRut);
                                                        const existingPlayer = jugadores.find(j => j.rut === finalRut || j.rut === `${body}-${dv}`.toUpperCase());
                                                        if (existingPlayer) {
                                                            setData(prev => ({...prev, jugador_nombre: existingPlayer.nombre, jugador_rut: finalRut}));
                                                        }
                                                    }}
                                                    placeholder="Ej: 11.111.111-1"
                                                    className={`pl-10 w-full rounded-xl border ${errors.jugador_rut ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                    required
                                                />
                                            </div>
                                            {errors.jugador_rut && <p className="text-red-500 text-xs font-medium mt-1">{errors.jugador_rut}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Nombres y Apellidos <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                value={data.jugador_nombre}
                                                onChange={e => setData('jugador_nombre', e.target.value)}
                                                placeholder="Nombre completo del sancionado..."
                                                className={`w-full rounded-xl border ${errors.jugador_nombre ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                required
                                            />
                                            {errors.jugador_nombre && <p className="text-red-500 text-xs font-medium mt-1">{errors.jugador_nombre}</p>}
                                        </div>
                                    </div>

                                    {/* Alerta y Control de Reincidencia */}
                                    {reincidenciaCount > 0 && (
                                        esLiguilla && data.unidad_tiempo === 'PARTIDOS' ? (
                                            <div className="p-4 rounded-xl bg-sky-50/90 border-2 border-sky-300/80 shadow-xs space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center space-x-2 text-sky-950 font-black text-xs uppercase tracking-wider">
                                                        <Info size={18} className="text-sky-600 shrink-0" />
                                                        <span>🏆 Liguilla Detectada: Exención de Reincidencia por Partidos</span>
                                                    </div>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-200 text-sky-900 uppercase shrink-0">
                                                        Sin recargo de partidos
                                                    </span>
                                                </div>
                                                <p className="text-xs text-sky-950 font-semibold leading-relaxed">
                                                    En la fase de <strong>Liguilla</strong>, las expulsiones previas <strong>no suman partidos adicionales</strong> a la sanción base (borrón de reincidencia por partidos). 
                                                    Este jugador registra {reincidenciaCount} antecedente(s) previo(s), pero se aplica únicamente la sanción base de <strong>{data.cantidad_sancion} partido(s)</strong>. Las reincidencias por tiempo (Meses/Años) sí se mantienen.
                                                </p>
                                                <div className="pt-2 border-t border-sky-200/60">
                                                    <p className="text-[10px] font-black text-sky-900 uppercase tracking-wider mb-1">
                                                        Historial de Antecedentes (Informativo):
                                                    </p>
                                                    <div className="max-h-24 overflow-y-auto divide-y divide-sky-200/50 pr-1">
                                                        {antecedenteSanciones.map(prev => (
                                                            <div key={prev.id} className="py-1 flex items-center justify-between text-[11px] text-sky-900 font-medium">
                                                                <div className="truncate max-w-[260px]">
                                                                    <span className="font-bold">• {prev.tipo_falta}</span> ({prev.articulo_reglamento})
                                                                </div>
                                                                <span className="font-extrabold text-sky-950 bg-sky-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                                                    {prev.cantidad_sancion} {prev.unidad_tiempo}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300/80 shadow-xs space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center space-x-2 text-amber-950 font-black text-xs uppercase tracking-wider">
                                                        <AlertCircle size={18} className="text-amber-600 shrink-0 animate-bounce" />
                                                        <span>⚠️ Jugador Reincidente ({reincidenciaCount} sanción{reincidenciaCount > 1 ? 'es' : ''} previa{reincidenciaCount > 1 ? 's' : ''})</span>
                                                    </div>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase shrink-0">
                                                        {data.unidad_tiempo === 'PARTIDOS' ? `+${reincidenciaCount} Partido${reincidenciaCount > 1 ? 's' : ''} por reincidencia` : `Reincidencia por Tiempo`}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                                                    Este jugador registra <strong>{reincidenciaCount} expulsión/es previa(s)</strong> en el sistema (independientemente del motivo anterior).
                                                    {data.unidad_tiempo === 'PARTIDOS' 
                                                        ? ' Según el reglamento, se recarga +1 partido adicional por cada antecedente previo a la sanción base de la falta actual.' 
                                                        : ' Las sanciones expresadas en tiempo (Meses/Años) mantienen la reincidencia activa.'}
                                                </p>

                                                {data.unidad_tiempo === 'PARTIDOS' && (
                                                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                        <div className="text-amber-950 font-bold">
                                                            <span>Cálculo recomendado: </span>
                                                            <span className="font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                                Base ({basePartidos}) + Reincidencia (+{reincidenciaCount}) = Total {basePartidos + reincidenciaCount} Partidos
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const totalPartidos = basePartidos + reincidenciaCount;
                                                                const notaReincid = `[Reincidencia +${reincidenciaCount} partido(s) extra por ${reincidenciaCount} sanción(es) previa(s)]`;
                                                                let nuevaObs = data.observacion;
                                                                if (!nuevaObs.includes('Reincidencia')) {
                                                                    nuevaObs = nuevaObs ? `${nuevaObs} ${notaReincid}` : notaReincid;
                                                                }
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    cantidad_sancion: totalPartidos,
                                                                    observacion: nuevaObs
                                                                }));
                                                            }}
                                                            className="inline-flex items-center justify-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                                                        >
                                                            Aplicar +{reincidenciaCount} Partido{reincidenciaCount > 1 ? 's' : ''} a la Sanción
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Listado desplegable de antecedentes del jugador */}
                                                <div className="pt-2 border-t border-amber-200/50">
                                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1">
                                                        Historial de Sanciones Previas:
                                                    </p>
                                                    <div className="max-h-28 overflow-y-auto divide-y divide-amber-200/60 pr-1">
                                                        {antecedenteSanciones.map(prev => (
                                                            <div key={prev.id} className="py-1 flex items-center justify-between text-[11px] text-amber-900 font-medium">
                                                                <div className="truncate max-w-[260px]">
                                                                    <span className="font-bold">• {prev.tipo_falta}</span> ({prev.articulo_reglamento})
                                                                </div>
                                                                <span className="font-extrabold text-amber-950 bg-amber-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                                                    {prev.cantidad_sancion} {prev.unidad_tiempo}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* Fila 3: Infracción & Artículo */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Tipo Infracción / REF <span className="text-red-500">*</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreandoReferencia(!isCreandoReferencia)}
                                                    className="inline-flex items-center text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
                                                >
                                                    <Plus size={12} className="mr-1" />
                                                    Nueva referencia
                                                </button>
                                            </div>

                                            {isCreandoReferencia && (
                                                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={nuevaReferencia}
                                                        onChange={e => setNuevaReferencia(e.target.value)}
                                                        placeholder="Nombre nueva referencia..."
                                                        className="flex-1 rounded-lg border-emerald-300 text-xs font-bold text-slate-900 py-1.5 px-3 focus:ring-2 focus:ring-emerald-600"
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
                                                        className="px-2 py-1.5 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            )}

                                            <select 
                                                value={referencias.some(r => r.nombre === data.tipo_falta) ? data.tipo_falta : (data.tipo_falta ? 'OTRO' : '')}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== 'OTRO') {
                                                        setData('tipo_falta', val);
                                                    } else if (data.tipo_falta && referencias.some(r => r.nombre === data.tipo_falta)) {
                                                        setData('tipo_falta', '');
                                                    }
                                                }}
                                                className={`w-full rounded-xl border ${errors.tipo_falta ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs mb-2`}
                                            >
                                                <option value="">Seleccione una Referencia / Infracción...</option>
                                                {referencias.map(r => (
                                                    <option key={r.id} value={r.nombre}>REF: {r.nombre}</option>
                                                ))}
                                                <option value="OTRO">✏️ Otra referencia personalizada...</option>
                                            </select>

                                            {(!referencias.some(r => r.nombre === data.tipo_falta)) && (
                                                <input
                                                    type="text"
                                                    value={data.tipo_falta}
                                                    onChange={e => setData('tipo_falta', e.target.value)}
                                                    placeholder="Escriba la infracción personalizada..."
                                                    className="w-full rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs"
                                                    required
                                                />
                                            )}
                                            {errors.tipo_falta && <p className="text-red-500 text-xs font-medium mt-1">{errors.tipo_falta}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Art. / Letra Reglamento <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                value={data.articulo_reglamento}
                                                onChange={e => setData('articulo_reglamento', e.target.value)}
                                                placeholder="Ej: Art 209 Letra G"
                                                className={`w-full rounded-xl border ${errors.articulo_reglamento ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                                required 
                                            />
                                            {errors.articulo_reglamento && <p className="text-red-500 text-xs font-medium mt-1">{errors.articulo_reglamento}</p>}
                                        </div>
                                    </div>

                                    {/* Fila 4: Duración & Fecha */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Duración de la Sanción <span className="text-red-500">*</span>
                                            </label>

                                            {reincidenciaAplica && data.unidad_tiempo === 'PARTIDOS' ? (
                                                <div className="bg-amber-50/90 p-3.5 rounded-xl border-2 border-amber-300 text-xs space-y-2.5 shadow-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-extrabold text-amber-950">Sanción Base por Infracción:</span>
                                                        <div className="flex items-center space-x-1.5">
                                                            <input 
                                                                type="number" min="1" required
                                                                value={basePartidos}
                                                                onChange={e => setBasePartidos(Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-16 border border-amber-300 bg-white text-center font-black text-slate-900 text-sm rounded-lg py-1 focus:ring-2 focus:ring-amber-500 shadow-xs"
                                                            />
                                                            <span className="font-bold text-amber-950">partidos</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-amber-950 pt-1.5 border-t border-amber-200/80 font-bold">
                                                        <span>+ Recargo Reincidencia ({reincidenciaCount} expulsión{reincidenciaCount > 1 ? 'es' : ''} previa{reincidenciaCount > 1 ? 's' : ''}):</span>
                                                        <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-xs">+ {reincidenciaCount} partido{reincidenciaCount > 1 ? 's' : ''}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-emerald-950 pt-1.5 border-t border-amber-300 font-extrabold text-xs">
                                                        <span>Total a Aplicar (Base + Reincidencia):</span>
                                                        <span className="font-black text-sm text-emerald-900 bg-emerald-200 px-3 py-1 rounded-lg border border-emerald-400 shadow-xs">
                                                            = {basePartidos + reincidenciaCount} Partidos
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 shadow-xs bg-slate-50/50">
                                                        <input 
                                                            type="number" min="1" required
                                                            value={data.cantidad_sancion}
                                                            onChange={e => setData('cantidad_sancion', parseInt(e.target.value) || 1)}
                                                            className="w-24 border-0 bg-transparent text-center font-extrabold text-slate-800 text-sm focus:ring-0"
                                                        />
                                                        <select 
                                                            value={data.unidad_tiempo}
                                                            onChange={e => {
                                                                const unit = e.target.value as 'PARTIDOS' | 'MESES' | 'AÑOS';
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    unidad_tiempo: unit,
                                                                    tipo_sancion: unit === 'PARTIDOS' ? 'PARTIDOS' : 'TIEMPO'
                                                                }));
                                                            }}
                                                            className="flex-1 border-0 border-l border-slate-200 bg-white font-semibold text-slate-700 text-sm focus:ring-0"
                                                        >
                                                            <option value="PARTIDOS">Partidos</option>
                                                            <option value="MESES">Meses</option>
                                                            <option value="AÑOS">Años</option>
                                                        </select>
                                                    </div>
                                                    {esLiguilla && reincidenciaCount > 0 && data.unidad_tiempo === 'PARTIDOS' && (
                                                        <p className="text-[11px] text-sky-700 font-semibold mt-1.5 flex items-center gap-1">
                                                            <Info size={13} className="shrink-0 text-sky-600" />
                                                            Liguilla activa: Exento de recargo por partidos (se mantiene reincidencia en meses/años).
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {errors.cantidad_sancion && <p className="text-red-500 text-xs font-medium mt-1">{errors.cantidad_sancion}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Fecha de Resolución <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="date" required
                                                value={data.fecha_resolucion}
                                                onChange={e => setData('fecha_resolucion', e.target.value)}
                                                className={`w-full rounded-xl border ${errors.fecha_resolucion ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-slate-800 transition-all shadow-xs`}
                                            />
                                            {errors.fecha_resolucion && <p className="text-red-500 text-xs font-medium mt-1">{errors.fecha_resolucion}</p>}
                                        </div>
                                    </div>

                                    {/* Fila 5: Observación */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Descripción / Observación <span className="text-slate-400 font-medium lowercase">(opcional)</span>
                                        </label>
                                        <textarea 
                                            rows={2}
                                            value={data.observacion}
                                            onChange={e => setData('observacion', e.target.value)}
                                            placeholder="Detalles adicionales sobre los hechos o consideraciones del fallo..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-800 transition-all shadow-xs resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsFormOpen(false)}
                                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={processing}
                                            className="px-6 py-2.5 rounded-xl font-extrabold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span>Guardando...</span>
                                                </>
                                            ) : (
                                                <span>{editingSancionId ? 'Actualizar Sanción' : 'Guardar Sanción'}</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
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
                                        {sancion.club.crest ? (
                                            <img
                                                src={sancion.club.crest.startsWith('http') || sancion.club.crest.startsWith('/') ? sancion.club.crest : `/storage/${sancion.club.crest}`}
                                                alt={sancion.club.name}
                                                className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 bg-white"
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-extrabold text-slate-500 shadow-sm border border-slate-200">
                                                {sancion.club.name.substring(0,2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{sancion.jugador?.nombre || 'Sanción al Club'}</div>
                                            <div className="font-medium text-xs text-slate-500">{sancion.club.name}</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4 flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className={`flex items-center justify-center w-6 h-6 rounded bg-${sancion.tipo_sancion === 'PARTIDOS' ? 'red' : 'orange'}-100 text-${sancion.tipo_sancion === 'PARTIDOS' ? 'red' : 'orange'}-600`}>
                                                {sancion.tipo_sancion === 'PARTIDOS' ? <AlertCircle size={14} /> : <CalendarClock size={14} />}
                                            </div>
                                            <span className="font-extrabold text-sm text-slate-800">
                                                {sancion.cantidad_sancion} {sancion.unidad_tiempo.toLowerCase()}
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
                                        className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                                    >
                                        <FileDown size={16} />
                                        <span>Ver / Descargar Oficio</span>
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
                                        <th className="px-6 py-4 font-bold">Torneo / Fecha</th>
                                        <th className="px-6 py-4 font-bold">Club y Jugador</th>
                                        <th className="px-6 py-4 font-bold">Sanción</th>
                                        <th className="px-6 py-4 font-bold text-center">Estado</th>
                                        <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {paginatedSanciones.map((sancion) => (
                                        <tr key={sancion.id} className="hover:bg-green-50/30 transition-colors duration-200 group">
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-extrabold text-slate-900">{sancion.campeonato?.nombre || 'S/N'}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{sancion.fase?.nombre || 'S/N'} • Fecha {sancion.numero_fecha}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {sancion.jugador ? (
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-extrabold text-slate-600 shadow-inner border border-slate-200/50">
                                                            {sancion.jugador.nombre.substring(0, 1).toUpperCase()}
                                                            {sancion.jugador.nombre.split(' ').length > 1 ? sancion.jugador.nombre.split(' ')[1].substring(0, 1).toUpperCase() : ''}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner border border-slate-200/50">
                                                            <User size={18} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-bold text-slate-900 group-hover:text-green-700 transition-colors">{sancion.jugador?.nombre || 'Sanción al Club'}</span>
                                                            {sanciones.filter(s => s.jugador?.rut && s.jugador?.rut === sancion.jugador?.rut).length > 1 && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs inline-flex items-center gap-0.5" title="Jugador Reincidente">
                                                                    ⚡ Reincidente
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center mt-0.5 space-x-1.5">
                                                            {sancion.club.crest ? (
                                                                <img
                                                                    src={sancion.club.crest.startsWith('http') || sancion.club.crest.startsWith('/') ? sancion.club.crest : `/storage/${sancion.club.crest}`}
                                                                    alt={sancion.club.name}
                                                                    className="w-4 h-4 rounded-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <Shield size={12} className="text-slate-400" />
                                                            )}
                                                            <span className="font-medium text-xs text-slate-500">{sancion.club.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border shadow-sm ${
                                                    sancion.tipo_sancion === 'PARTIDOS' 
                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                    <span className="mr-2">
                                                        {sancion.tipo_sancion === 'PARTIDOS' ? <AlertCircle size={16} className="text-red-500" /> : <CalendarClock size={16} className="text-orange-500" />}
                                                    </span>
                                                    <span className="font-extrabold text-sm">
                                                        {sancion.cantidad_sancion} <span className="text-xs font-bold opacity-80 uppercase ml-0.5">{sancion.unidad_tiempo}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {sancion.estado === 'ACTIVO' ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                                                        ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                                        CUMPLIDO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => setSelectedSancion(sancion)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={18} strokeWidth={2.5} />
                                                    </button>
                                                    {canManageSanciones && (
                                                        <div className="flex items-center space-x-1">
                                                            <button 
                                                                onClick={() => handleEdit(sancion)}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                title="Editar Sanción"
                                                            >
                                                                <Edit2 size={18} strokeWidth={2.5} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(sancion.id)}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                title="Eliminar Sanción"
                                                            >
                                                                <Trash2 size={18} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <a 
                                                        href={route('tribunal.sanciones.oficio', sancion.id)} 
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
                                                        title="Ver / Descargar Oficio PDF"
                                                    >
                                                        <FileDown size={18} strokeWidth={2.5} />
                                                    </a>
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
                                            {selectedSancion.jugador?.nombre || 'Sanción al Club'} • {selectedSancion.club.name}
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
                                            {selectedSancion.cantidad_sancion} {selectedSancion.unidad_tiempo.toLowerCase()}
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
