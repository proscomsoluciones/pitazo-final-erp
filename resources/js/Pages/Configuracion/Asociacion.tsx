import { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Building2, MapPin, Phone, Mail, Globe, User,
    Upload, Save, CheckCircle2, XCircle, X,
    Camera, AlertCircle, FileText, Crown, Gavel, ShieldAlert,
    Layers
} from 'lucide-react';

interface Config {
    id: number;
    nombre: string;
    rut: string | null;
    ciudad: string | null;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    sitio_web: string | null;
    nombre_presidente: string | null;
    nombre_secretario: string | null;
    etica_integrante_1: string | null;
    etica_integrante_2: string | null;
    etica_integrante_3: string | null;
    disciplina_presidente: string | null;
    disciplina_secretario: string | null;
    disciplina_integrante_3: string | null;
    logo_path: string | null;
    logo_url: string | null;
    descripcion: string | null;
}

function InputField({
    label, icon, id, type = 'text', value, onChange, placeholder, error
}: {
    label: string; icon: React.ReactNode; id: string; type?: string;
    value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="text-slate-400">{icon}</span>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl border text-sm px-3.5 py-2.5 bg-white font-medium text-slate-900 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-300'}`}
            />
            {error && <p className="text-rose-600 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
    );
}

type TabType = 'general' | 'directiva' | 'disciplina' | 'etica';

export default function AsociacionPage({ config }: { config: Config }) {
    const { flash } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | null }>({ show: false, message: '', type: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(config.logo_url);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        nombre:                 config.nombre || '',
        rut:                    config.rut || '',
        ciudad:                 config.ciudad || '',
        direccion:              config.direccion || '',
        telefono:               config.telefono || '',
        correo:                 config.correo || '',
        sitio_web:              config.sitio_web || '',
        nombre_presidente:      config.nombre_presidente || '',
        nombre_secretario:      config.nombre_secretario || '',
        etica_integrante_1:     config.etica_integrante_1 || '',
        etica_integrante_2:     config.etica_integrante_2 || '',
        etica_integrante_3:     config.etica_integrante_3 || '',
        disciplina_presidente:  config.disciplina_presidente || '',
        disciplina_secretario:  config.disciplina_secretario || '',
        disciplina_integrante_3:config.disciplina_integrante_3 || '',
        descripcion:            config.descripcion || '',
        logo:                   null as File | null,
        _method:                'POST',
    });

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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('configuracion.asociacion.update'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold tracking-tight text-slate-900">Configuración de la Asociación</h2>}
        >
            <Head title="Configuración de la Asociación" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

                {/* Header Superior */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 shrink-0">
                            <Building2 size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configuración Institucional</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Administre los datos institucionales, logo y firmantes de oficios de la asociación.
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs sm:text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{processing ? 'Guardando…' : 'Guardar Cambios'}</span>
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/70 rounded-2xl mb-6 shadow-inner no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                            activeTab === 'general'
                                ? 'bg-white text-emerald-950 shadow-md scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                        }`}
                    >
                        <Building2 size={16} className={activeTab === 'general' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>1. Datos Generales y Logo</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('directiva')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                            activeTab === 'directiva'
                                ? 'bg-white text-emerald-950 shadow-md scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                        }`}
                    >
                        <Crown size={16} className={activeTab === 'directiva' ? 'text-amber-500' : 'text-slate-400'} />
                        <span>2. Directiva General</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('disciplina')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                            activeTab === 'disciplina'
                                ? 'bg-white text-emerald-950 shadow-md scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                        }`}
                    >
                        <Gavel size={16} className={activeTab === 'disciplina' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>3. Comité de Disciplina</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('etica')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
                            activeTab === 'etica'
                                ? 'bg-white text-emerald-950 shadow-md scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                        }`}
                    >
                        <ShieldAlert size={16} className={activeTab === 'etica' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>4. Comité de Ética</span>
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    {/* TAB 1: DATOS GENERALES Y LOGO */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* LOGO DE LA ASOCIACIÓN */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                                <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                                    <Camera size={18} className="text-emerald-600" />
                                    Logo Institucional de la Asociación
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {/* Preview */}
                                    <div
                                        className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition-all shrink-0 group relative shadow-xs"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-3 transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Upload size={28} className="mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                                                <p className="text-xs text-slate-700 font-extrabold">Seleccionar Logo</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 bg-white rounded-xl text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition-all shadow-xs"
                                        >
                                            <Upload size={16} className="text-emerald-600" />
                                            {previewUrl ? 'Cambiar Imagen de Logo' : 'Subir Imagen de Logo'}
                                        </button>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            Formatos recomendados: <strong>PNG (Fondo transparente), JPG, SVG</strong>. Máximo <strong>2MB</strong>.<br />
                                            <span className="text-emerald-700 font-bold">Este logo se incluye automáticamente en todas las actas de sanciones y oficios impresos en PDF.</span>
                                        </p>
                                        {errors.logo && <p className="text-rose-600 text-xs font-bold mt-1">{errors.logo}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* DATOS GENERALES */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                    <Building2 size={18} className="text-emerald-500" />
                                    Información General e Identificación
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <InputField
                                            label="Nombre de la Asociación"
                                            icon={<Building2 size={14} />}
                                            id="nombre"
                                            value={data.nombre}
                                            onChange={v => setData('nombre', v)}
                                            placeholder="Ej: Asociación de Fútbol de Catemu"
                                            error={errors.nombre}
                                        />
                                    </div>
                                    <InputField
                                        label="RUT de la Asociación"
                                        icon={<FileText size={14} />}
                                        id="rut"
                                        value={data.rut}
                                        onChange={v => setData('rut', v)}
                                        placeholder="Ej: 75.141.900-7"
                                        error={errors.rut}
                                    />
                                    <InputField
                                        label="Ciudad"
                                        icon={<MapPin size={14} />}
                                        id="ciudad"
                                        value={data.ciudad}
                                        onChange={v => setData('ciudad', v)}
                                        placeholder="Ej: Catemu"
                                        error={errors.ciudad}
                                    />
                                    <InputField
                                        label="Dirección"
                                        icon={<MapPin size={14} />}
                                        id="direccion"
                                        value={data.direccion}
                                        onChange={v => setData('direccion', v)}
                                        placeholder="Calle y número"
                                        error={errors.direccion}
                                    />
                                    <InputField
                                        label="Teléfono"
                                        icon={<Phone size={14} />}
                                        id="telefono"
                                        type="tel"
                                        value={data.telefono}
                                        onChange={v => setData('telefono', v)}
                                        placeholder="+56 9 1234 5678"
                                        error={errors.telefono}
                                    />
                                    <InputField
                                        label="Correo Electrónico"
                                        icon={<Mail size={14} />}
                                        id="correo"
                                        type="email"
                                        value={data.correo}
                                        onChange={v => setData('correo', v)}
                                        placeholder="contacto@asociacion.cl"
                                        error={errors.correo}
                                    />
                                    <InputField
                                        label="Sitio Web"
                                        icon={<Globe size={14} />}
                                        id="sitio_web"
                                        type="url"
                                        value={data.sitio_web}
                                        onChange={v => setData('sitio_web', v)}
                                        placeholder="https://www.asociacion.cl"
                                        error={errors.sitio_web}
                                    />
                                    <div className="sm:col-span-2">
                                        <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <span className="text-slate-400"><FileText size={14} /></span>
                                            Descripción breve
                                        </label>
                                        <textarea
                                            id="descripcion"
                                            rows={2}
                                            value={data.descripcion}
                                            onChange={e => setData('descripcion', e.target.value)}
                                            placeholder="Descripción opcional de la asociación..."
                                            className="w-full rounded-xl border border-slate-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DIRECTIVA GENERAL */}
                    {activeTab === 'directiva' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in duration-200">
                            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <Crown size={18} className="text-amber-500" />
                                Directiva General de la Asociación
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                                Nombres que figurarán en el pie de página de los oficios de resolución y firmas oficiales de la asociación.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Presidente */}
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                                            <Crown size={18} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-extrabold text-emerald-900 block">Presidente Asociación</span>
                                            <span className="text-[11px] text-emerald-600 font-medium">Firmante Oficial N° 1</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.nombre_presidente}
                                        onChange={e => setData('nombre_presidente', e.target.value)}
                                        placeholder="Nombre completo del Presidente..."
                                        className="w-full rounded-xl border border-emerald-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 font-semibold text-slate-800"
                                    />
                                    {errors.nombre_presidente && <p className="text-red-500 text-xs mt-1 font-bold">{errors.nombre_presidente}</p>}
                                </div>

                                {/* Secretario */}
                                <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 space-y-3">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                                            <FileText size={18} className="text-sky-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-extrabold text-sky-900 block">Secretario General</span>
                                            <span className="text-[11px] text-sky-600 font-medium">Firmante Oficial N° 2</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.nombre_secretario}
                                        onChange={e => setData('nombre_secretario', e.target.value)}
                                        placeholder="Nombre completo del Secretario..."
                                        className="w-full rounded-xl border border-sky-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 font-semibold text-slate-800"
                                    />
                                    {errors.nombre_secretario && <p className="text-red-500 text-xs mt-1 font-bold">{errors.nombre_secretario}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: COMITÉ DE DISCIPLINA */}
                    {activeTab === 'disciplina' && (
                        <div className="bg-white rounded-2xl border border-blue-200/80 shadow-sm p-6 animate-in fade-in duration-200">
                            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                                <Gavel size={18} className="text-blue-600" />
                                Integrantes del Comité de Disciplina (3 Firmantes)
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                                Nombres de los integrantes encargados de firmar los fallos, actas de sanciones y resoluciones del Comité de Disciplina.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {/* Presidente Disciplina */}
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2 block">Presidente Comité</div>
                                    <input
                                        type="text"
                                        value={data.disciplina_presidente}
                                        onChange={e => setData('disciplina_presidente', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-blue-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-semibold text-slate-800"
                                    />
                                </div>

                                {/* Secretario Disciplina */}
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2 block">Secretario Comité</div>
                                    <input
                                        type="text"
                                        value={data.disciplina_secretario}
                                        onChange={e => setData('disciplina_secretario', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-blue-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-semibold text-slate-800"
                                    />
                                </div>

                                {/* Integrante Disciplina */}
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2 block">Vocal / Integrante Comité</div>
                                    <input
                                        type="text"
                                        value={data.disciplina_integrante_3}
                                        onChange={e => setData('disciplina_integrante_3', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-blue-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-semibold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: COMITÉ DE ÉTICA */}
                    {activeTab === 'etica' && (
                        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-6 animate-in fade-in duration-200">
                            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-emerald-600" />
                                Comisión del Comité de Ética (3 Firmantes)
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                                Integrantes encargados de firmar los oficios de Investigación, Citación e Inhabilitación emitidos por el Comité de Ética.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {/* Integrante 1 */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 block">Presidente Ética</div>
                                    <input
                                        type="text"
                                        value={data.etica_integrante_1}
                                        onChange={e => setData('etica_integrante_1', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-amber-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-semibold text-slate-800"
                                    />
                                </div>

                                {/* Integrante 2 */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 block">Secretario Ética</div>
                                    <input
                                        type="text"
                                        value={data.etica_integrante_2}
                                        onChange={e => setData('etica_integrante_2', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-amber-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-semibold text-slate-800"
                                    />
                                </div>

                                {/* Integrante 3 */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 space-y-3 shadow-xs">
                                    <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 block">Vocal Ética</div>
                                    <input
                                        type="text"
                                        value={data.etica_integrante_3}
                                        onChange={e => setData('etica_integrante_3', e.target.value)}
                                        placeholder="Nombre completo..."
                                        className="w-full rounded-xl border border-amber-200 text-sm px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-semibold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AVISO INFORMATIVO */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800">¿Cómo se utilizan estos datos en los documentos?</p>
                            <p className="text-xs sm:text-sm text-amber-700 mt-0.5 leading-relaxed">
                                El nombre de la asociación, ciudad, logo y los nombres de los firmantes se incluyen automáticamente en los <strong>Oficios de Sanción</strong>, <strong>Actas de Fecha</strong> y <strong>Resoluciones</strong> generadas en PDF.
                            </p>
                        </div>
                    </div>

                    {/* BOTÓN DE GUARDADO INFERIOR */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white rounded-xl font-extrabold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{processing ? 'Guardando…' : 'Guardar Configuración'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Toast de Notificación */}
            {toast.show && (
                <div className={`fixed bottom-5 right-5 z-50 flex items-center rounded-xl shadow-xl border pl-4 pr-5 py-3.5 animate-in fade-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-red-700 border-red-600'}`}>
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
