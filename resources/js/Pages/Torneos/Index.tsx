import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Trophy, Plus, Edit2, CheckCircle2, XCircle, Map, Layers } from 'lucide-react';

interface Fase {
    id: number;
    campeonato_id: number;
    nombre: string;
    cantidad_fechas: number;
}

interface Campeonato {
    id: number;
    nombre: string;
    estado: string;
    fases: Fase[];
}

export default function TorneosIndex({ campeonatos }: { campeonatos: Campeonato[] }) {
    const { auth } = usePage<any>().props;
    const canManageTorneos = auth?.user?.permissions?.includes('gestionar torneos') || auth?.user?.roles?.includes('Super admin');

    const [isCampModalOpen, setIsCampModalOpen] = useState(false);
    const [isFaseModalOpen, setIsFaseModalOpen] = useState(false);
    const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
    const [editingCampId, setEditingCampId] = useState<number | null>(null);
    const [editingFaseId, setEditingFaseId] = useState<number | null>(null);

    const campForm = useForm({
        nombre: '',
        estado: 'ACTIVO'
    });

    const faseForm = useForm({
        campeonato_id: '',
        nombre: '',
        cantidad_fechas: 1
    });

    const openFaseModal = (campId: number, fase?: Fase) => {
        setSelectedCampId(campId);
        if (fase) {
            setEditingFaseId(fase.id);
            faseForm.setData({
                campeonato_id: campId.toString(),
                nombre: fase.nombre,
                cantidad_fechas: fase.cantidad_fechas
            });
        } else {
            setEditingFaseId(null);
            faseForm.setData({
                campeonato_id: campId.toString(),
                nombre: '',
                cantidad_fechas: 1
            });
        }
        setIsFaseModalOpen(true);
    };

    const openCampModal = (camp?: Campeonato) => {
        if (camp) {
            setEditingCampId(camp.id);
            campForm.setData({
                nombre: camp.nombre,
                estado: camp.estado
            });
        } else {
            setEditingCampId(null);
            campForm.setData({
                nombre: '',
                estado: 'ACTIVO'
            });
        }
        setIsCampModalOpen(true);
    };

    const submitCamp = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCampId) {
            campForm.put(route('torneos.campeonato.update', editingCampId), {
                onSuccess: () => {
                    campForm.reset();
                    setIsCampModalOpen(false);
                    setEditingCampId(null);
                }
            });
        } else {
            campForm.post(route('torneos.campeonato.store'), {
                onSuccess: () => {
                    campForm.reset();
                    setIsCampModalOpen(false);
                }
            });
        }
    };

    const submitFase = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaseId) {
            faseForm.put(route('torneos.fase.update', editingFaseId), {
                onSuccess: () => {
                    faseForm.reset();
                    setIsFaseModalOpen(false);
                    setEditingFaseId(null);
                }
            });
        } else {
            faseForm.post(route('torneos.fase.store'), {
                onSuccess: () => {
                    faseForm.reset();
                    setIsFaseModalOpen(false);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold tracking-tight text-slate-900">Configuración de Torneos</h2>}
        >
            <Head title="Torneos" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <Trophy size={28} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Estructura de Campeonatos</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Administra los torneos, sus fases y la cantidad de fechas</p>
                            </div>
                        </div>
                        {canManageTorneos && (
                        <button 
                            onClick={() => openCampModal()}
                            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            <span>Nuevo Campeonato</span>
                        </button>
                        )}
                    </div>

                    {/* Lista de Campeonatos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campeonatos.map(camp => (
                            <div key={camp.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        {camp.estado === 'ACTIVO' ? (
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={20} className="text-slate-400" />
                                        )}
                                        <h4 className="font-bold text-slate-800 text-lg">{camp.nombre}</h4>
                                        {canManageTorneos && (
                                        <button 
                                            onClick={() => openCampModal(camp)}
                                            className="text-slate-400 hover:text-green-600 transition-colors ml-2"
                                            title="Editar Campeonato"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        )}
                                    </div>
                                    {canManageTorneos && (
                                    <button 
                                        onClick={() => openFaseModal(camp.id)}
                                        className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1"
                                    >
                                        <Plus size={14} />
                                        <span>Añadir Fase</span>
                                    </button>
                                    )}
                                </div>
                                <div className="p-5">
                                    {camp.fases.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-xl">
                                            No hay fases creadas. Añade "Apertura" o "Clausura".
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {camp.fases.map(fase => (
                                                <div key={fase.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center space-x-3">
                                                        <Map size={18} className="text-slate-400" />
                                                        <span className="font-bold text-slate-700">{fase.nombre}</span>
                                                        {canManageTorneos && (
                                                        <button 
                                                            onClick={() => openFaseModal(camp.id, fase)}
                                                            className="text-slate-400 hover:text-green-600 transition-colors ml-2"
                                                            title="Editar Fase"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        )}
                                                    </div>
                                                    <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 shadow-sm flex items-center space-x-1">
                                                        <Layers size={12} className="text-slate-400 mr-1"/>
                                                        {fase.cantidad_fechas} Fechas
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {campeonatos.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
                            <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Aún no hay campeonatos</h3>
                            <p className="text-slate-500 mt-1 mb-6 font-medium">Comienza creando tu primera temporada o campeonato.</p>
                            {canManageTorneos && (
                            <button 
                                onClick={() => openCampModal()}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold text-sm shadow-xs hover:bg-emerald-700 transition-all inline-flex items-center gap-2"
                            >
                                <Plus size={18} /> Crear Campeonato
                            </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Campeonato */}
            <Modal show={isCampModalOpen} onClose={() => { setIsCampModalOpen(false); setEditingCampId(null); }} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy size={20} className="text-emerald-600" />
                        {editingCampId ? 'Editar Campeonato' : 'Crear Nuevo Campeonato'}
                    </h3>
                    <form onSubmit={submitCamp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre del Campeonato *</label>
                            <input 
                                type="text" required
                                value={campForm.data.nombre}
                                onChange={e => campForm.setData('nombre', e.target.value)}
                                placeholder="Ej: Temporada Oficial 2026"
                                className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estado *</label>
                            <select 
                                value={campForm.data.estado}
                                onChange={e => campForm.setData('estado', e.target.value)}
                                className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200/80">
                            <button type="button" onClick={() => setIsCampModalOpen(false)} className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold transition shadow-xs">Cancelar</button>
                            <button type="submit" disabled={campForm.processing} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-extrabold text-sm shadow-xs">Guardar Campeonato</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Fase */}
            <Modal show={isFaseModalOpen} onClose={() => { setIsFaseModalOpen(false); setEditingFaseId(null); }} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy size={20} className="text-emerald-600" />
                        {editingFaseId ? 'Editar Fase' : 'Añadir Fase al Torneo'}
                    </h3>
                    <form onSubmit={submitFase} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre de la Fase *</label>
                            <input 
                                type="text" required
                                value={faseForm.data.nombre}
                                onChange={e => faseForm.setData('nombre', e.target.value)}
                                placeholder="Ej: Apertura, Clausura, Liguilla Final"
                                className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cantidad de Fechas *</label>
                            <input 
                                type="number" min="1" max="100" required
                                value={faseForm.data.cantidad_fechas}
                                onChange={e => faseForm.setData('cantidad_fechas', parseInt(e.target.value))}
                                className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                            />
                            <p className="text-xs text-slate-500 mt-1.5 font-medium">El sistema generará automáticamente las jornadas del 1 al {faseForm.data.cantidad_fechas || 1}.</p>
                        </div>
                        <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200/80">
                            <button type="button" onClick={() => setIsFaseModalOpen(false)} className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold transition shadow-xs">Cancelar</button>
                            <button type="submit" disabled={faseForm.processing} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-extrabold text-sm shadow-xs">Guardar Fase</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
