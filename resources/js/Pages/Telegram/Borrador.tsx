import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Send, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, UserPlus } from 'lucide-react';

interface Club { id: number; name: string }
interface Jugador { id: number; nombre: string; club_id: number | null }
interface Fase { id: number; nombre: string; cantidad_fechas: number }
interface Campeonato { id: number; nombre: string; fases: Fase[] }

interface Item {
    tipo: 'SANCION' | 'NOTA' | 'ERROR';
    linea: string;
    incluir: boolean;
    avisos: string[];
    club_id?: number | null;
    club_texto?: string | null;
    // Sanción
    jugador_id?: number | null;
    jugador_nombre?: string | null;
    articulo?: string | null;
    tipo_falta?: string | null;
    cantidad?: number | null;
    unidad?: 'PARTIDOS' | 'MESES' | 'AÑOS' | 'AMONESTACION' | null;
    reincidencia?: boolean;
    sanciones_previas?: number;
    // Nota
    nota?: string | null;
    monto?: number | null;
}

interface Borrador {
    id: number;
    texto_original: string;
    telegram_usuario: string | null;
    items: Item[];
    estado: 'PENDIENTE' | 'APROBADO' | 'DESCARTADO';
    campeonato_id: number | null;
    fase_id: number | null;
    numero_fecha: number | null;
    fecha_resolucion: string | null;
    created_at: string;
    revisor?: { name: string } | null;
    resultado?: { sanciones: number[]; notas: number[] } | null;
}

interface Props {
    borrador: Borrador;
    clubes: Club[];
    jugadores: Jugador[];
    campeonatos: Campeonato[];
}

const input = 'w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100';
const label = 'block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1';

export default function Borrador({ borrador, clubes, jugadores, campeonatos }: Props) {
    const { errors, flash } = usePage<any>().props;
    const editable = borrador.estado === 'PENDIENTE';

    const [items, setItems] = useState<Item[]>(borrador.items);
    const [contexto, setContexto] = useState({
        campeonato_id: borrador.campeonato_id?.toString() ?? '',
        fase_id: borrador.fase_id?.toString() ?? '',
        numero_fecha: borrador.numero_fecha?.toString() ?? '',
        fecha_resolucion: borrador.fecha_resolucion?.substring(0, 10) ?? '',
    });
    const [enviando, setEnviando] = useState(false);

    const fases = useMemo(
        () => campeonatos.find(c => c.id.toString() === contexto.campeonato_id)?.fases ?? [],
        [campeonatos, contexto.campeonato_id],
    );
    const fechas = useMemo(() => {
        const fase = fases.find(f => f.id.toString() === contexto.fase_id);
        return fase ? Array.from({ length: fase.cantidad_fechas }, (_, i) => i + 1) : [];
    }, [fases, contexto.fase_id]);

    const actualizar = (i: number, cambios: Partial<Item>) =>
        setItems(prev => prev.map((item, j) => (j === i ? { ...item, ...cambios } : item)));

    const aprobar = () => {
        setEnviando(true);
        router.post(route('telegram.borradores.aprobar', borrador.id), { ...contexto, items } as any, {
            preserveScroll: true,
            onFinish: () => setEnviando(false),
        });
    };

    const descartar = () => {
        if (!confirm(`¿Descartar el borrador #${borrador.id}? No se registrará nada.`)) return;
        router.post(route('telegram.borradores.descartar', borrador.id));
    };

    const incluidos = items.filter(i => i.incluir).length;
    const erroresGenerales = Object.entries(errors ?? {}) as [string, string][];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-sm">
                        <Send size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Borrador #{borrador.id}</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Enviado por {borrador.telegram_usuario ?? 'Telegram'} el{' '}
                            {new Date(borrador.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Borrador #${borrador.id}`} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-5">
                    <Link href={route('telegram.borradores.index')} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900">
                        <ArrowLeft size={16} /> Volver a borradores
                    </Link>

                    {flash?.error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold">{flash.error}</div>
                    )}
                    {erroresGenerales.length > 0 && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                            <p className="font-black mb-1">Corrige lo siguiente antes de aprobar:</p>
                            <ul className="list-disc pl-5 space-y-0.5">
                                {erroresGenerales.map(([campo, mensaje]) => (
                                    <li key={campo}>{describirCampo(campo)}: {mensaje}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!editable && (
                        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-2 ${
                            borrador.estado === 'APROBADO' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                            {borrador.estado === 'APROBADO' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            {borrador.estado === 'APROBADO'
                                ? `Aprobado: ${borrador.resultado?.sanciones.length ?? 0} sanción(es) y ${borrador.resultado?.notas.length ?? 0} nota(s) registradas`
                                : 'Descartado'}
                            {borrador.revisor && ` por ${borrador.revisor.name}`}.
                        </div>
                    )}

                    {/* Mensaje original */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
                        <span className={label}>Mensaje recibido</span>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-100">{borrador.texto_original}</pre>
                    </div>

                    {/* Fecha del registro */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">¿A qué fecha corresponde?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <span className={label}>Campeonato</span>
                                <select className={input} disabled={!editable} value={contexto.campeonato_id}
                                    onChange={e => setContexto({ ...contexto, campeonato_id: e.target.value, fase_id: '', numero_fecha: '' })}>
                                    <option value="">Seleccionar…</option>
                                    {campeonatos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <span className={label}>Fase</span>
                                <select className={input} disabled={!editable || !contexto.campeonato_id} value={contexto.fase_id}
                                    onChange={e => setContexto({ ...contexto, fase_id: e.target.value, numero_fecha: '' })}>
                                    <option value="">Seleccionar…</option>
                                    {fases.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <span className={label}>N° de fecha</span>
                                <select className={input} disabled={!editable || !contexto.fase_id} value={contexto.numero_fecha}
                                    onChange={e => setContexto({ ...contexto, numero_fecha: e.target.value })}>
                                    <option value="">Seleccionar…</option>
                                    {fechas.map(n => <option key={n} value={n}>Fecha {n}</option>)}
                                </select>
                            </div>
                            <div>
                                <span className={label}>Fecha de resolución</span>
                                <input type="date" className={input} disabled={!editable} value={contexto.fecha_resolucion}
                                    onChange={e => setContexto({ ...contexto, fecha_resolucion: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Registros */}
                    <div className="space-y-3">
                        {items.map((item, i) => (
                            <div key={i} className={`bg-white rounded-2xl shadow-xs border p-5 ${item.incluir ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black mr-2 ${
                                            item.tipo === 'SANCION' ? 'bg-sky-100 text-sky-800' : item.tipo === 'NOTA' ? 'bg-violet-100 text-violet-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.tipo === 'SANCION' ? 'Sanción' : item.tipo === 'NOTA' ? 'Multa / nota' : 'No se entendió'}
                                        </span>
                                        <span className="text-xs text-slate-500 italic break-words">“{item.linea}”</span>
                                    </div>
                                    {item.tipo !== 'ERROR' && (
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
                                            <input type="checkbox" className="rounded border-slate-300 text-sky-600" disabled={!editable}
                                                checked={item.incluir} onChange={e => actualizar(i, { incluir: e.target.checked })} />
                                            Registrar
                                        </label>
                                    )}
                                </div>

                                {item.avisos?.length > 0 && (
                                    <ul className="mb-3 space-y-1">
                                        {item.avisos.map((aviso, k) => (
                                            <li key={k} className="flex items-start gap-1.5 text-xs font-semibold text-orange-800 bg-orange-50 rounded-lg px-2.5 py-1.5">
                                                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {aviso}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {item.tipo === 'SANCION' && (
                                    <FilaSancion item={item} editable={editable && item.incluir} clubes={clubes} jugadores={jugadores}
                                        onChange={c => actualizar(i, c)} />
                                )}
                                {item.tipo === 'NOTA' && (
                                    <FilaNota item={item} editable={editable && item.incluir} clubes={clubes} onChange={c => actualizar(i, c)} />
                                )}
                            </div>
                        ))}
                    </div>

                    {editable && (
                        <div className="sticky bottom-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-sm font-bold text-slate-600">{incluidos} registro(s) marcados para registrar</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={descartar} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm">
                                    Descartar
                                </button>
                                <button onClick={aprobar} disabled={enviando || incluidos === 0}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm disabled:opacity-50">
                                    {enviando ? 'Registrando…' : 'Aprobar y registrar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function FilaSancion({ item, editable, clubes, jugadores, onChange }: {
    item: Item; editable: boolean; clubes: Club[]; jugadores: Jugador[]; onChange: (c: Partial<Item>) => void;
}) {
    const delClub = jugadores.filter(j => j.club_id === item.club_id);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
                <span className={label}>Club</span>
                <select className={input} disabled={!editable} value={item.club_id ?? ''}
                    onChange={e => onChange({ club_id: e.target.value ? Number(e.target.value) : null, jugador_id: null })}>
                    <option value="">Seleccionar…</option>
                    {clubes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="lg:col-span-2">
                <span className={label}>Jugador</span>
                <select className={input} disabled={!editable || !item.club_id} value={item.jugador_id ?? ''}
                    onChange={e => {
                        const jugador = delClub.find(j => j.id === Number(e.target.value));
                        onChange({ jugador_id: jugador?.id ?? null, jugador_nombre: jugador?.nombre ?? item.jugador_nombre });
                    }}>
                    <option value="">➕ Jugador nuevo</option>
                    {delClub.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                </select>
                {!item.jugador_id && (
                    <div className="relative mt-1.5">
                        <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={`${input} pl-8`} disabled={!editable} placeholder="Nombre completo del jugador nuevo"
                            value={item.jugador_nombre ?? ''} onChange={e => onChange({ jugador_nombre: e.target.value })} />
                    </div>
                )}
            </div>
            <div className="lg:col-span-2">
                <span className={label}>Artículo</span>
                <input className={input} disabled={!editable} value={item.articulo ?? ''} placeholder="Art. 211 Letra P"
                    onChange={e => onChange({ articulo: e.target.value })} />
            </div>
            <div className="lg:col-span-3">
                <span className={label}>Motivo</span>
                <input className={input} disabled={!editable} value={item.tipo_falta ?? ''}
                    onChange={e => onChange({ tipo_falta: e.target.value })} />
            </div>
            <div>
                <span className={label}>Cantidad</span>
                <input type="number" min={1} className={input} disabled={!editable || item.unidad === 'AMONESTACION'}
                    value={item.cantidad ?? ''} onChange={e => onChange({ cantidad: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
                <span className={label}>Unidad</span>
                <select className={input} disabled={!editable} value={item.unidad ?? ''}
                    onChange={e => onChange({ unidad: (e.target.value || null) as Item['unidad'], ...(e.target.value === 'AMONESTACION' ? { cantidad: 1 } : {}) })}>
                    <option value="">Seleccionar…</option>
                    <option value="PARTIDOS">Partidos</option>
                    <option value="MESES">Meses</option>
                    <option value="AÑOS">Años</option>
                    <option value="AMONESTACION">Amonestación</option>
                </select>
            </div>
            <div className="flex items-end pb-1.5">
                <label className="flex items-start gap-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-sky-600" disabled={!editable}
                        checked={!!item.reincidencia} onChange={e => onChange({ reincidencia: e.target.checked })} />
                    <span className="leading-tight">
                        Reincidencia (R)
                        {!!item.sanciones_previas && (
                            <span className="block text-xs text-slate-400 font-semibold">{item.sanciones_previas} previa(s)</span>
                        )}
                    </span>
                </label>
            </div>
        </div>
    );
}

function FilaNota({ item, editable, clubes, onChange }: {
    item: Item; editable: boolean; clubes: Club[]; onChange: (c: Partial<Item>) => void;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
                <span className={label}>Club</span>
                <select className={input} disabled={!editable} value={item.club_id ?? ''}
                    onChange={e => onChange({ club_id: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Sin club</option>
                    {clubes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="sm:col-span-2">
                <span className={label}>Detalle</span>
                <textarea rows={2} className={input} disabled={!editable} value={item.nota ?? ''}
                    onChange={e => onChange({ nota: e.target.value })} />
            </div>
            <div>
                <span className={label}>Monto ($)</span>
                <input type="number" min={0} className={input} disabled={!editable} value={item.monto ?? ''}
                    onChange={e => onChange({ monto: e.target.value ? Number(e.target.value) : null })} />
            </div>
        </div>
    );
}

// "items.2.club_id" -> "Registro 3, club"
function describirCampo(campo: string): string {
    const m = campo.match(/^items\.(\d+)\.(.+)$/);
    if (!m) return { campeonato_id: 'Campeonato', fase_id: 'Fase', numero_fecha: 'N° de fecha', fecha_resolucion: 'Fecha de resolución' }[campo] ?? campo;
    const nombres: Record<string, string> = {
        club_id: 'club', jugador_nombre: 'jugador', articulo: 'artículo', tipo_falta: 'motivo',
        cantidad: 'cantidad', unidad: 'unidad', nota: 'detalle', monto: 'monto',
    };
    return `Registro ${Number(m[1]) + 1}, ${nombres[m[2]] ?? m[2]}`;
}
