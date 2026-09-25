import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, User } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface Club {
    id: number;
    name: string;
}

interface Jugador {
    id: number;
    rut: string | null;
    nombre: string;
    club_id: number | null;
    club?: Club;
}

export default function Index({ jugadores, clubes }: { jugadores: Jugador[], clubes: Club[] }) {
    const { auth } = usePage<any>().props;
    const canManageJugadores = auth?.user?.permissions?.includes('gestionar jugadores') || auth?.user?.roles?.includes('Super admin');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJugador, setEditingJugador] = useState<Jugador | null>(null);
    const [jugadorToDelete, setJugadorToDelete] = useState<Jugador | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        rut: '',
        nombre: '',
        club_id: '' as string | number,
    });

    const openForm = (jugador?: Jugador) => {
        clearErrors();
        if (jugador) {
            setEditingJugador(jugador);
            setData({ 
                rut: jugador.rut || '', 
                nombre: jugador.nombre, 
                club_id: jugador.club_id || ''
            });
        } else {
            setEditingJugador(null);
            setData({ rut: '', nombre: '', club_id: '' });
        }
        setIsFormOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingJugador) {
            put(route('jugadores.update', editingJugador.id), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        } else {
            post(route('jugadores.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        }
    };

    const confirmDelete = () => {
        if (jugadorToDelete) {
            setIsDeleting(true);
            router.delete(route('jugadores.destroy', jugadorToDelete.id), {
                onSuccess: () => {
                    setJugadorToDelete(null);
                    setIsDeleting(false);
                },
                onError: () => setIsDeleting(false),
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Gestión de Jugadores</h2>}
        >
            <Head title="Jugadores" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-2xl border border-slate-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Listado de Jugadores</h3>
                                    <p className="text-sm text-slate-500">Administra los jugadores inscritos en la asociación.</p>
                                </div>
                                {canManageJugadores && (
                                    <button 
                                        onClick={() => openForm()}
                                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-extrabold text-sm shadow-xs flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Nuevo Jugador
                                    </button>
                                )}
                            </div>

                            {isFormOpen && (
                                <div className="mb-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-xs">
                                    <h4 className="font-extrabold text-slate-900 mb-5 text-base flex items-center gap-2">
                                        <User size={18} className="text-emerald-600" />
                                        {editingJugador ? 'Editar Ficha de Jugador' : 'Registrar Nuevo Jugador'}
                                    </h4>
                                    <form onSubmit={submit} className="space-y-5 max-w-2xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">RUT (Opcional)</label>
                                                <input 
                                                    type="text" 
                                                    value={data.rut}
                                                    onChange={e => setData('rut', e.target.value)}
                                                    className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                                                    placeholder="12345678-9"
                                                />
                                                {errors.rut && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.rut}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                                                <input 
                                                    type="text" 
                                                    value={data.nombre}
                                                    onChange={e => setData('nombre', e.target.value)}
                                                    className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                                                    required
                                                />
                                                {errors.nombre && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.nombre}</span>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Actual (Opcional)</label>
                                                <select 
                                                    value={data.club_id}
                                                    onChange={e => setData('club_id', e.target.value)}
                                                    className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs"
                                                >
                                                    <option value="">Seleccione un Club</option>
                                                    {clubes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                {errors.club_id && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.club_id}</span>}
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/80">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsFormOpen(false)}
                                                className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold transition shadow-xs"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={processing}
                                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-extrabold text-sm disabled:opacity-50 shadow-xs"
                                            >
                                                Guardar Jugador
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">ID</th>
                                            <th className="px-6 py-4 font-semibold">RUT</th>
                                            <th className="px-6 py-4 font-semibold">Nombre</th>
                                            <th className="px-6 py-4 font-semibold">Club Actual</th>
                                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {jugadores.map((jugador) => (
                                            <tr key={jugador.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{jugador.id}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{jugador.rut || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{jugador.nombre}</td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {jugador.club ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {jugador.club.name}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-3">
                                                    {canManageJugadores && (
                                                        <>
                                                            <button onClick={() => openForm(jugador)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                                                            <button onClick={() => setJugadorToDelete(jugador)} className="text-red-600 hover:text-red-800 font-medium transition-colors">Eliminar</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {jugadores.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay jugadores registrados.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal 
                show={!!jugadorToDelete}
                title={`¿Eliminar a ${jugadorToDelete?.nombre}?`}
                description="Esta acción eliminará la ficha del jugador del catálogo de la asociación."
                onConfirm={confirmDelete}
                onClose={() => setJugadorToDelete(null)}
                processing={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
