import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import {
    Shield, Plus, Edit2, Trash2, CheckCircle2, XCircle, X,
    Eye, Settings2, Users, Gavel, Trophy, Building2, Scale,
    FileText, Crown, KeyRound, Lock
} from 'lucide-react';

// ─── Config de módulos ────────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
    { module: 'Clubes',          emoji: '🏟️', view: 'ver clubes',     manage: 'gestionar clubes'    },
    { module: 'Jugadores',       emoji: '👤', view: 'ver jugadores',   manage: 'gestionar jugadores' },
    { module: 'Torneos',         emoji: '🏆', view: 'ver torneos',     manage: 'gestionar torneos'   },
    { module: 'Tribunal',        emoji: '⚖️', view: 'ver tribunal',    manage: null                  },
    { module: 'Sanciones',       emoji: '🚨', view: null,             manage: 'gestionar sanciones'  },
    { module: 'Notas Disciplina',emoji: '📋', view: null,             manage: 'gestionar notas'      },
];

// Icono + colores por nombre de rol
const ROLE_META: Record<string, { icon: React.ReactNode; gradient: string; badge: string }> = {
    'Super admin':     { icon: <Crown size={22} />,    gradient: 'from-amber-500 to-orange-500',   badge: 'bg-amber-100 text-amber-800 border-amber-200'   },
    'Presidente':      { icon: <Shield size={22} />,   gradient: 'from-emerald-600 to-violet-600',  badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    'Secretario':      { icon: <FileText size={22} />, gradient: 'from-sky-500 to-cyan-500',       badge: 'bg-sky-100 text-sky-800 border-sky-200'         },
    'Comite disciplina':{ icon: <Gavel size={22} />,  gradient: 'from-rose-500 to-pink-500',      badge: 'bg-rose-100 text-rose-800 border-rose-200'       },
    'Comite etica':    { icon: <Scale size={22} />,    gradient: 'from-purple-500 to-fuchsia-500', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
};

const defaultMeta = { icon: <Users size={22} />, gradient: 'from-slate-500 to-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' };

function getRoleMeta(name: string) {
    return ROLE_META[name] ?? defaultMeta;
}

export default function RolesIndex({ roles, permissions }: { roles: any[]; permissions: string[] }) {
    const { flash } = usePage<any>().props;
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

    const [isFormOpen, setIsFormOpen]     = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const openCreate = () => { reset(); clearErrors(); setEditingRoleId(null); setIsFormOpen(true); };
    const handleEdit = (role: any) => { setData({ name: role.name, permissions: role.permissions }); setEditingRoleId(role.id); setIsFormOpen(true); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: () => { setIsFormOpen(false); reset(); clearErrors(); } };
        editingRoleId ? put(route('roles.update', editingRoleId), opts) : post(route('roles.store'), opts);
    };

    const handleDelete = (id: number) => {
        router.delete(route('roles.destroy', id), { onSuccess: () => setDeleteConfirmId(null) });
    };

    const toggle = (perm: string) => {
        setData('permissions', data.permissions.includes(perm)
            ? data.permissions.filter(p => p !== perm)
            : [...data.permissions, perm]);
    };

    const knownPerms = PERMISSION_GROUPS.flatMap(g => [g.view, g.manage].filter(Boolean) as string[]);
    const extraPerms = permissions.filter(p => !knownPerms.includes(p));

    const viewPerms    = (perms: string[]) => perms.filter(p => p.startsWith('ver '));
    const managePerms  = (perms: string[]) => perms.filter(p => p.startsWith('gestionar '));
    const otherPerms   = (perms: string[]) => perms.filter(p => !p.startsWith('ver ') && !p.startsWith('gestionar '));

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Roles" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                                <KeyRound size={20} />
                            </div>
                            Gestión de Roles
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5 ml-12">Define qué puede hacer cada tipo de usuario en el sistema.</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                    >
                        <Plus size={16} />
                        Nuevo Rol
                    </button>
                </div>

                {/* ── Grid de Roles ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {roles.map(role => {
                        const meta = getRoleMeta(role.name);
                        const vp = viewPerms(role.permissions);
                        const mp = managePerms(role.permissions);
                        const op = otherPerms(role.permissions);
                        const isSuperAdmin = role.name === 'Super admin';

                        return (
                            <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                {/* Cabecera con gradiente */}
                                <div className={`bg-gradient-to-r ${meta.gradient} p-5 flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-base leading-tight">{role.name}</h3>
                                            <p className="text-white/70 text-xs mt-0.5">
                                                {isSuperAdmin ? 'Acceso total' : `${role.permissions.length} permiso${role.permissions.length !== 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                    {!isSuperAdmin && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(role)}
                                                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(role.id)}
                                                className="p-1.5 rounded-lg bg-white/15 hover:bg-red-500/80 text-white transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                    {isSuperAdmin && (
                                        <div className="p-1.5 rounded-lg bg-white/20 text-white">
                                            <Lock size={15} />
                                        </div>
                                    )}
                                </div>

                                {/* Cuerpo */}
                                <div className="p-5 flex-1 space-y-3">
                                    {isSuperAdmin ? (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                            <Crown size={16} className="text-amber-600 shrink-0" />
                                            <p className="text-xs font-semibold text-amber-800">Acceso irrestricto a todos los módulos del sistema.</p>
                                        </div>
                                    ) : role.permissions.length === 0 ? (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <XCircle size={16} className="text-slate-400 shrink-0" />
                                            <p className="text-xs text-slate-500 italic">Sin permisos asignados</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Ver */}
                                            {vp.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Eye size={12} className="text-sky-500" />
                                                        <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Acceso de lectura</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {vp.map(p => (
                                                            <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                                                {p.replace('ver ', '')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Gestionar */}
                                            {mp.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Settings2 size={12} className="text-violet-500" />
                                                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Gestión completa</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {mp.map(p => (
                                                            <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                                                {p.replace('gestionar ', '')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Otros */}
                                            {op.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {op.map(p => (
                                                        <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Modal Crear / Editar ── */}
            <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="2xl">
                <div className="flex flex-col max-h-[90vh]">
                    {/* Header modal */}
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${editingRoleId ? 'bg-emerald-100 text-emerald-600' : 'bg-green-100 text-green-600'}`}>
                                {editingRoleId ? <Edit2 size={16} /> : <Plus size={16} />}
                            </div>
                            {editingRoleId ? 'Editar Rol' : 'Nuevo Rol'}
                        </h2>
                        <button onClick={() => setIsFormOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                            {/* Nombre del Rol */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del Rol</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej: Coordinador"
                                    className="w-full rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Permisos */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-slate-700">Permisos por Módulo</label>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {data.permissions.length} seleccionado{data.permissions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {PERMISSION_GROUPS.map(group => {
                                        const hasView   = group.view   && permissions.includes(group.view);
                                        const hasManage = group.manage && permissions.includes(group.manage);
                                        if (!hasView && !hasManage) return null;
                                        const viewChecked   = Boolean(hasView   && data.permissions.includes(group.view!));
                                        const manageChecked = Boolean(hasManage && data.permissions.includes(group.manage!));

                                        return (
                                            <div key={group.module} className="rounded-xl border border-slate-200 overflow-hidden">
                                                {/* Cabecera módulo */}
                                                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                                                    <span className="text-sm">{group.emoji}</span>
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{group.module}</span>
                                                </div>
                                                {/* Opciones */}
                                                <div className={`grid ${hasView && hasManage ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                    {/* Ver */}
                                                    {hasView && (
                                                        <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors border-r border-slate-100 ${viewChecked ? 'bg-sky-50' : 'bg-white hover:bg-sky-50/50'}`}>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${viewChecked ? 'bg-sky-500 border-sky-500' : 'border-slate-300'}`}>
                                                                {viewChecked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                            <input type="checkbox" className="sr-only" checked={viewChecked} onChange={() => toggle(group.view!)} />
                                                            <div>
                                                                <div className="flex items-center gap-1">
                                                                    <Eye size={12} className="text-sky-500" />
                                                                    <span className="text-xs font-bold text-sky-700">Ver</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Solo lectura</p>
                                                            </div>
                                                        </label>
                                                    )}
                                                    {/* Gestionar */}
                                                    {hasManage && (
                                                        <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${manageChecked ? 'bg-violet-50' : 'bg-white hover:bg-violet-50/50'}`}>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${manageChecked ? 'bg-violet-500 border-violet-500' : 'border-slate-300'}`}>
                                                                {manageChecked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                            <input type="checkbox" className="sr-only" checked={manageChecked} onChange={() => toggle(group.manage!)} />
                                                            <div>
                                                                <div className="flex items-center gap-1">
                                                                    <Settings2 size={12} className="text-violet-500" />
                                                                    <span className="text-xs font-bold text-violet-700">Gestionar</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Crear, editar y eliminar</p>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Permisos extra */}
                                    {extraPerms.length > 0 && (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                                                <span className="text-sm">🔑</span>
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Otros Permisos</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                                                {extraPerms.map(perm => {
                                                    const checked = data.permissions.includes(perm);
                                                    return (
                                                        <label key={perm} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${checked ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                                                {checked && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(perm)} />
                                                            <span className="font-medium text-slate-700 truncate">{perm}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.permissions && <p className="text-red-500 text-xs mt-1">{errors.permissions}</p>}
                            </div>
                        </div>

                        {/* Footer modal */}
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={processing} className="px-5 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm disabled:opacity-50">
                                {processing ? 'Guardando…' : 'Guardar Rol'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Modal Confirmar Eliminar ── */}
            <Modal show={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={26} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">¿Eliminar este rol?</h3>
                    <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer. Los usuarios con este rol podrían perder acceso.</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 text-slate-600 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 active:scale-95 transition-all">
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Toast ── */}
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
