import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Send, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

interface Borrador {
    id: number;
    telegram_usuario: string | null;
    modulo: 'DISCIPLINA' | 'ETICA';
    items: { tipo: string; avisos?: string[] }[];
    estado: 'PENDIENTE' | 'APROBADO' | 'DESCARTADO';
    numero_fecha: number | null;
    fase?: { nombre: string } | null;
    campeonato?: { nombre: string } | null;
    revisor?: { name: string } | null;
    created_at: string;
    revisado_at: string | null;
}

const ESTADOS = {
    PENDIENTE: { label: 'Pendiente', clase: 'bg-amber-100 text-amber-800', icono: Clock },
    APROBADO: { label: 'Aprobado', clase: 'bg-emerald-100 text-emerald-800', icono: CheckCircle2 },
    DESCARTADO: { label: 'Descartado', clase: 'bg-slate-100 text-slate-600', icono: XCircle },
};

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

export default function Borradores({ borradores, botConfigurado }: { borradores: Borrador[]; botConfigurado: boolean }) {
    const { flash } = usePage<any>().props;
    const pendientes = borradores.filter(b => b.estado === 'PENDIENTE').length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-sm">
                        <Send size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Borradores de Telegram</h2>
                        <p className="text-xs text-slate-500 font-medium">Registros de disciplina y ética dictados al bot, pendientes de revisión</p>
                    </div>
                </div>
            }
        >
            <Head title="Borradores Telegram" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-5">
                    {flash?.success && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold">{flash.error}</div>
                    )}
                    {!botConfigurado && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
                            El bot aún no está configurado: falta <code>TELEGRAM_BOT_TOKEN</code> en el archivo <code>.env</code>.
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Recibidos</h3>
                            <p className="text-sm text-slate-500">
                                {pendientes > 0 ? `${pendientes} pendiente(s) de aprobar.` : 'No hay borradores pendientes.'}
                                {' '}Nada se registra en el sistema hasta aprobar el borrador.
                            </p>
                        </div>

                        {borradores.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 text-sm font-semibold">
                                Todavía no llegan mensajes al bot.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {borradores.map(b => {
                                    const estado = ESTADOS[b.estado];
                                    const Icono = estado.icono;
                                    const registros = b.items.filter(i => i.tipo !== 'ERROR').length;
                                    const avisos = b.items.reduce((n, i) => n + (i.avisos?.length ?? 0), 0);
                                    return (
                                        <li key={b.id}>
                                            <Link
                                                href={route('telegram.borradores.show', b.id)}
                                                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-black text-slate-900">Borrador #{b.id}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                                            b.modulo === 'ETICA' ? 'bg-indigo-100 text-indigo-800' : 'bg-sky-100 text-sky-800'
                                                        }`}>
                                                            {b.modulo === 'ETICA' ? 'Ética' : 'Disciplina'}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${estado.clase}`}>
                                                            <Icono size={12} /> {estado.label}
                                                        </span>
                                                        {b.estado === 'PENDIENTE' && avisos > 0 && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-100 text-orange-800">
                                                                <AlertTriangle size={12} /> {avisos} aviso(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-semibold mt-1">
                                                        {registros} registro(s)
                                                        {b.fase && ` · ${b.fase.nombre}`}
                                                        {b.numero_fecha && ` · Fecha ${b.numero_fecha}`}
                                                        {' · '}{b.telegram_usuario ?? 'Telegram'} · {fechaHora(b.created_at)}
                                                        {b.revisor && ` · Revisado por ${b.revisor.name}`}
                                                    </p>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-400 shrink-0" />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
