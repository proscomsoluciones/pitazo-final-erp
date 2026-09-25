import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { KeyRound, Plus, Edit2, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';

export default function PermissionsIndex({ permissions }: { permissions: any[] }) {
    const { flash } = usePage<any>().props;
    const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | null}>({show: false, message: '', type: null});

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

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
    });

    const handleEdit = (permission: any) => {
        setData({
            name: permission.name,
        });
        setEditingPermissionId(permission.id);
        setIsFormOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPermissionId) {
            put(route('permissions.update', editingPermissionId), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    clearErrors();
                },
            });
        } else {
            post(route('permissions.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    clearErrors();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este permiso? Esto podría afectar a los roles que lo utilizan.')) {
            router.delete(route('permissions.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Permisos" />

            <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <KeyRound size={24} className="text-emerald-600" />
                            Gestión de Permisos
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Registra nuevos permisos internos para el sistema.</p>
                    </div>
                    <button 
                        onClick={() => {
                            reset();
                            clearErrors();
                            setEditingPermissionId(null);
                            setIsFormOpen(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Añadir Permiso</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-amber-50 border-b border-amber-100">
                        <p className="text-sm text-amber-800 font-medium">
                            <strong className="font-bold">Nota técnica:</strong> Crear un permiso aquí lo hará disponible para asignarlo a Roles, pero no tendrá efecto en el sistema hasta que un desarrollador lo vincule a una ruta o botón en el código fuente (ej. <code className="bg-amber-100 px-1 rounded">hasPermission('nuevo permiso')</code>).
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-16">ID</th>
                                    <th className="px-6 py-4">Nombre del Permiso (Clave Interna)</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {permissions.map((perm) => (
                                    <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-slate-500">{perm.id}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                {perm.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(perm)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(perm.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {editingPermissionId ? <Edit2 size={20} className="text-emerald-600" /> : <Plus size={20} className="text-emerald-600" />}
                                {editingPermissionId ? 'Editar Permiso' : 'Nuevo Permiso Interno'}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre (ej. <span className="font-mono text-xs font-normal">view reportes</span>)</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm font-mono"
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-slate-600 font-bold text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors mr-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>

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
