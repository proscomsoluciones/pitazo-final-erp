import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Users, Plus, Edit2, Trash2, CheckCircle2, XCircle, X, Shield, Lock } from 'lucide-react';

export default function UsersIndex({ users, roles }: { users: any[], roles: string[] }) {
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
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
    });

    const handleEdit = (user: any) => {
        setData({
            name: user.name,
            email: user.email,
            password: '',
            roles: user.roles,
        });
        setEditingUserId(user.id);
        setIsFormOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUserId) {
            put(route('users.update', editingUserId), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    clearErrors();
                },
            });
        } else {
            post(route('users.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    clearErrors();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            router.delete(route('users.destroy', id));
        }
    };

    const toggleRole = (role: string) => {
        const currentRoles = data.roles;
        if (currentRoles.includes(role)) {
            setData('roles', currentRoles.filter(r => r !== role));
        } else {
            setData('roles', [...currentRoles, role]);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Usuarios" />

            <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Users size={24} className="text-blue-600" />
                            Gestión de Usuarios
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Administra los accesos y roles del sistema.</p>
                    </div>
                    <button 
                        onClick={() => {
                            reset();
                            clearErrors();
                            setEditingUserId(null);
                            setIsFormOpen(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Añadir Usuario</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Correo</th>
                                    <th className="px-6 py-4">Roles</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map((role: string) => (
                                                    <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {role}
                                                    </span>
                                                ))}
                                                {user.roles.length === 0 && <span className="text-slate-400 text-xs italic">Sin roles</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
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

                <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="lg">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {editingUserId ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                                {editingUserId ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    required
                                />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Contraseña {editingUserId && <span className="text-slate-400 font-normal">(Opcional, dejar en blanco para mantener)</span>}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className="w-full pl-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        required={!editingUserId}
                                    />
                                </div>
                                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Asignar Roles</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {roles.map(role => (
                                        <label key={role} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${data.roles.includes(role) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                checked={data.roles.includes(role)}
                                                onChange={() => toggleRole(role)}
                                            />
                                            <span className="ml-2 text-sm font-medium text-slate-700">{role}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.roles && <div className="text-red-500 text-xs mt-1">{errors.roles}</div>}
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
                                    className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
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
