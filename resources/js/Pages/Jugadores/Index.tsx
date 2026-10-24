import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, User, Search, X, CheckCircle2, XCircle } from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Modal from '@/Components/Modal';

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

const inputClass = "w-full rounded-lg border-slate-300 bg-white py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 shadow-xs";
const labelClass = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1";

export default function Index({ jugadores, clubes }: { jugadores: Jugador[], clubes: Club[] }) {
    const { auth, flash } = usePage<any>().props;
    const canManageJugadores = auth?.user?.permissions?.includes('gestionar jugadores') || auth?.user?.roles?.includes('Super admin');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJugador, setEditingJugador] = useState<Jugador | null>(null);
    const [jugadorToDelete, setJugadorToDelete] = useState<Jugador | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | null }>({ show: false, message: '', type: null });

    useEffect(() => {
        if (flash?.success) {
            setToast({ show: true, message: flash.success, type: 'success' });
            const t = setTimeout(() => setToast({ show: false, message: '', type: null }), 4000);
            return () => clearTimeout(t);
        }
        if (flash?.error) {
            setToast({ show: true, message: flash.error, type: 'error' });
            const t = setTimeout(() => setToast({ show: false, message: '', type: null }), 4000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        rut: '',
        nombre: '',
        club_id: '' as string | number,
    });

    const filteredJugadores = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return jugadores;
        const termRut = term.replace(/[.\-\s]/g, '');
        return jugadores.filter(j =>
            j.nombre.toLowerCase().includes(term) ||
            (termRut && (j.rut || '').toLowerCase().replace(/[.\-\s]/g, '').includes(termRut)) ||
            (j.club?.name || '').toLowerCase().includes(term)
        );
    }, [jugadores, search]);

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

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingJugador(null);
        reset();
        clearErrors();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => closeForm(),
            onError: () => setToast({ show: true, message: 'Revisa los datos del formulario.', type: 'error' }),
        };
        if (editingJugador) {
            put(route('jugadores.update', editingJugador.id), options);
        } else {
            post(route('jugadores.store'), options);
        }
    };

    const confirmDelete = () => {
        if (jugadorToDelete) {
            setIsDeleting(true);
            router.delete(route('jugadores.destroy', jugadorToDelete.id), {
                preserveScroll: true,
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

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm rounded-2xl border border-slate-100">
                        <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Listado de Jugadores</h3>
                                    <p className="text-sm text-slate-500">Administra los jugadores inscritos en la asociación.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Buscar nombre, RUT o club"
                                            className="w-full sm:w-64 rounded-lg border-slate-300 bg-white py-2 pl-9 pr-8 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        {search && (
                                            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {canManageJugadores && (
                                        <button
                                            onClick={() => openForm()}
                                            className="shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-extrabold text-sm shadow-xs flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Nuevo Jugador
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 mb-2">
                                {search ? `${filteredJugadores.length} de ${jugadores.length} jugadores` : `${jugadores.length} jugadores`}
                            </p>

                            <div className="overflow-auto max-h-[calc(100vh-17rem)] min-h-[16rem] rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">ID</th>
                                            <th className="px-4 py-2.5 font-semibold">RUT</th>
                                            <th className="px-4 py-2.5 font-semibold">Nombre</th>
                                            <th className="px-4 py-2.5 font-semibold">Club Actual</th>
                                            <th className="px-4 py-2.5 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredJugadores.map((jugador) => (
                                            <tr key={jugador.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-900">{jugador.id}</td>
                                                <td className="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{jugador.rut || '-'}</td>
                                                <td className="px-4 py-2 font-medium text-slate-800">{jugador.nombre}</td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {jugador.club ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {jugador.club.name}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                                                    {canManageJugadores && (
                                                        <>
                                                            <button onClick={() => openForm(jugador)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                                                            <button onClick={() => setJugadorToDelete(jugador)} className="text-red-600 hover:text-red-800 font-medium transition-colors">Eliminar</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredJugadores.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                    {search ? 'No hay jugadores que coincidan con la búsqueda.' : 'No hay jugadores registrados.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isFormOpen} onClose={closeForm} maxWidth="lg">
                <form onSubmit={submit}>
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
                        <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                            <User size={18} className="text-emerald-600" />
                            {editingJugador ? 'Editar Jugador' : 'Nuevo Jugador'}
                        </h4>
                        <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        <div>
                            <label className={labelClass}>Nombre Completo *</label>
                            <input
                                type="text"
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className={inputClass}
                                required
                                autoFocus
                            />
                            {errors.nombre && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.nombre}</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>RUT (Opcional)</label>
                                <input
                                    type="text"
                                    value={data.rut}
                                    onChange={e => setData('rut', e.target.value)}
                                    className={inputClass}
                                    placeholder="12345678-9"
                                />
                                {errors.rut && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.rut}</span>}
                            </div>
                            <div>
                                <label className={labelClass}>Club Actual (Opcional)</label>
                                <select
                                    value={data.club_id}
                                    onChange={e => setData('club_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Sin club</option>
                                    {clubes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {errors.club_id && <span className="text-rose-600 text-xs mt-1 font-bold block">{errors.club_id}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={closeForm}
                            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold transition shadow-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-extrabold text-sm disabled:opacity-50 shadow-xs"
                        >
                            {processing ? 'Guardando…' : editingJugador ? 'Guardar Cambios' : 'Guardar Jugador'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteModal
                show={!!jugadorToDelete}
                title={`¿Eliminar a ${jugadorToDelete?.nombre}?`}
                description="Esta acción eliminará la ficha del jugador del catálogo de la asociación."
                onConfirm={confirmDelete}
                onClose={() => setJugadorToDelete(null)}
                processing={isDeleting}
            />

            {toast.show && (
                <div className={`fixed bottom-5 right-5 z-50 flex items-center rounded-xl shadow-xl border pl-4 pr-5 py-3.5 transition-all animate-in fade-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-red-700 border-red-600'}`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={20} className="text-green-400 mr-3 shrink-0" />
                        : <XCircle size={20} className="text-red-200 mr-3 shrink-0" />
                    }
                    <span className="text-sm font-semibold text-white">{toast.message}</span>
                    <button onClick={() => setToast({ show: false, message: '', type: null })} className="ml-5 text-white/50 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
