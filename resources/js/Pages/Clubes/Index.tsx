import { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { 
    Plus, Shield, UploadCloud, X, Trash2, Edit2, CheckCircle2, 
    Image as ImageIcon, RefreshCw 
} from 'lucide-react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

interface Club {
    id: number;
    name: string;
    crest: string | null;
}

export default function Index({ clubes }: { clubes: Club[] }) {
    const { auth } = usePage<any>().props;
    const canManageClubes = auth?.user?.permissions?.includes('gestionar clubes') || auth?.user?.roles?.includes('Super admin');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClub, setEditingClub] = useState<Club | null>(null);
    const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        crest_file: null as File | null,
        _method: 'POST',
    });

    const openForm = (club?: Club) => {
        clearErrors();
        if (club) {
            setEditingClub(club);
            setData({ name: club.name, crest_file: null, _method: 'PUT' });
            setPreviewUrl(club.crest ? (club.crest.startsWith('http') || club.crest.startsWith('/') ? club.crest : `/storage/${club.crest}`) : null);
        } else {
            setEditingClub(null);
            setData({ name: '', crest_file: null, _method: 'POST' });
            setPreviewUrl(null);
        }
        setIsFormOpen(true);
    };

    const handleFile = (file: File) => {
        if (file.type.startsWith('image/')) {
            setData('crest_file', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const removeCrest = () => {
        setData('crest_file', null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingClub ? route('clubes.update', editingClub.id) : route('clubes.store');
        post(url, {
            onSuccess: () => {
                setIsFormOpen(false);
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const confirmDelete = () => {
        if (clubToDelete) {
            setIsDeleting(true);
            router.delete(route('clubes.destroy', clubToDelete.id), {
                onSuccess: () => {
                    setClubToDelete(null);
                    setIsDeleting(false);
                },
                onError: () => {
                    setIsDeleting(false);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Clubes</h2>}
        >
            <Head title="Clubes" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-xs rounded-2xl border border-slate-200/80">
                        <div className="p-6 md:p-8">
                            
                            {/* Cabecera del Módulo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Listado de Clubes Institucionales</h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Administra las instituciones y equipos afiliados a la asociación</p>
                                </div>
                                {canManageClubes && (
                                    <button 
                                        onClick={() => {
                                            if (isFormOpen) {
                                                setIsFormOpen(false);
                                            } else {
                                                openForm();
                                            }
                                        }}
                                        className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 ${
                                            isFormOpen 
                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300' 
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                    >
                                        {isFormOpen ? <><X size={18} /> Cerrar Formulario</> : <><Plus size={18} /> Nuevo Club</>}
                                    </button>
                                )}
                            </div>

                            {/* Formulario con Uploader Interactivo Moderno */}
                            {isFormOpen && (
                                <div className="mb-8 bg-slate-50/80 p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs animate-in fade-in slide-in-from-top-4">
                                    <h4 className="font-black text-slate-900 mb-6 text-base flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                                        <Shield size={20} className="text-emerald-600" />
                                        {editingClub ? `Editar Ficha: ${editingClub.name}` : 'Registrar Nuevo Club Institucional'}
                                    </h4>
                                    
                                    <form onSubmit={submit} className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                            
                                            {/* Campo Nombre del Club */}
                                            <div className="lg:col-span-7 space-y-5 flex flex-col justify-center">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                        Nombre Oficial del Club *
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        value={data.name}
                                                        onChange={e => setData('name', e.target.value)}
                                                        className="w-full rounded-xl border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-semibold text-slate-900 shadow-xs px-4 py-3.5"
                                                        placeholder="Ej: Club Deportivo Santa Rosa"
                                                        required
                                                    />
                                                    {errors.name && <span className="text-rose-600 text-xs mt-1.5 font-bold block">{errors.name}</span>}
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Información Institucional</p>
                                                    <p className="text-xs text-slate-500">
                                                        El club registrado formará parte del catálogo oficial de la asociación y podrá ser asignado en actas de sanciones, jugadores y fixture de torneos.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Uploader Interactivo Moderno (Dropzone) */}
                                            <div className="lg:col-span-5 flex flex-col">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    Escudo Institucional
                                                </label>
                                                
                                                <input 
                                                    ref={fileInputRef}
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />

                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={`flex-1 min-h-[180px] rounded-2xl border-2 border-dashed transition-all cursor-pointer p-5 flex flex-col items-center justify-center text-center relative group ${
                                                        isDragging 
                                                            ? 'border-emerald-500 bg-emerald-100/60 scale-[1.01]' 
                                                            : previewUrl 
                                                                ? 'border-emerald-300 bg-white hover:border-emerald-400' 
                                                                : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/40'
                                                    }`}
                                                >
                                                    {previewUrl ? (
                                                        <div className="flex flex-col items-center space-y-3 w-full">
                                                            <div className="relative">
                                                                <img 
                                                                    src={previewUrl} 
                                                                    alt="Vista Previa Escudo" 
                                                                    className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-xs transition-transform group-hover:scale-105"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeCrest();
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-md hover:bg-rose-700 transition-transform active:scale-95"
                                                                    title="Eliminar escudo"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                                                <CheckCircle2 size={14} /> Escudo seleccionado
                                                            </div>
                                                            <span className="text-[11px] text-slate-400 font-semibold group-hover:text-emerald-600 transition-colors">
                                                                Haz clic o arrastra para cambiar la imagen
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-xs">
                                                                <UploadCloud size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-extrabold text-slate-800">
                                                                    Arrastra la imagen o <span className="text-emerald-600 underline">examina tus archivos</span>
                                                                </p>
                                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                                    PNG, JPG o WEBP (Recomendado 500x500 px)
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors.crest_file && <span className="text-rose-600 text-xs mt-1.5 font-bold block">{errors.crest_file as string}</span>}
                                            </div>

                                        </div>

                                        {/* Acciones del Formulario */}
                                        <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-200/80">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsFormOpen(false)}
                                                className="px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold transition-all shadow-xs"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={processing}
                                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-extrabold text-sm disabled:opacity-50 shadow-xs flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={18} />
                                                {editingClub ? 'Guardar Cambios' : 'Registrar Club'}
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
                                            <th className="px-6 py-4 font-semibold">Escudo</th>
                                            <th className="px-6 py-4 font-semibold">Nombre</th>
                                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {clubes.map((club) => (
                                            <tr key={club.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{club.id}</td>
                                                <td className="px-6 py-4">
                                                    {club.crest ? (
                                                        <img 
                                                            src={club.crest.startsWith('http') || club.crest.startsWith('/') ? club.crest : `/storage/${club.crest}`} 
                                                            alt={club.name} 
                                                            className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-slate-50 p-0.5 shadow-xs" 
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-black border border-slate-200">
                                                            {club.name.substring(0,2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{club.name}</td>
                                                <td className="px-6 py-4 text-right space-x-3">
                                                    {canManageClubes && (
                                                        <>
                                                            <button onClick={() => openForm(club)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                                                            <button onClick={() => setClubToDelete(club)} className="text-rose-600 hover:text-rose-800 font-bold transition-colors">Eliminar</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {clubes.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay clubes registrados.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Moderno de Confirmación de Eliminación */}
            <ConfirmDeleteModal 
                show={!!clubToDelete}
                title={`¿Eliminar ${clubToDelete?.name}?`}
                description="Esta acción eliminará la institución del catálogo de la asociación. Los registros históricos de partidos y actas pasadas mantendrán la integridad."
                onConfirm={confirmDelete}
                onClose={() => setClubToDelete(null)}
                processing={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
