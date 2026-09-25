import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    History, Search, Shield, User, Clock, 
    PlusCircle, Edit3, Trash2, Filter, 
    ChevronLeft, ChevronRight, Activity, Calendar
} from 'lucide-react';

interface AuditItem {
    id: number;
    user_id: number | null;
    user_name: string;
    user_role: string | null;
    action: 'CREAR' | 'EDITAR' | 'ELIMINAR';
    modulo: string;
    description: string;
    ip_address: string | null;
    fecha_hora: string;
    hace_tiempo: string;
}

export default function AuditLogIndex({ logs = [] }: { logs: AuditItem[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [moduloFilter, setModuloFilter] = useState('');
    
    // Pagination
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesAction = actionFilter ? log.action === actionFilter : true;
            const matchesModulo = moduloFilter ? log.modulo === moduloFilter : true;

            return matchesSearch && matchesAction && matchesModulo;
        });
    }, [logs, searchTerm, actionFilter, moduloFilter]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const modulosDisponibles = useMemo(() => {
        return Array.from(new Set(logs.map(l => l.modulo).filter(Boolean)));
    }, [logs]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREAR':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 gap-1.5 shadow-2xs">
                        <PlusCircle size={13} className="text-emerald-600" />
                        CREACIÓN
                    </span>
                );
            case 'EDITAR':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200/80 gap-1.5 shadow-2xs">
                        <Edit3 size={13} className="text-amber-600" />
                        EDICIÓN
                    </span>
                );
            case 'ELIMINAR':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-200/80 gap-1.5 shadow-2xs">
                        <Trash2 size={13} className="text-red-600" />
                        ELIMINACIÓN
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {action}
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-900 text-emerald-400 rounded-xl shadow-xs">
                        <History size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Módulo de Auditoría</h2>
                        <p className="text-xs text-slate-500 font-medium">Registro cronológico detallado de cambios y operaciones del sistema</p>
                    </div>
                </div>
            }
        >
            <Head title="Módulo de Auditoría" />

            <div className="py-6 space-y-6">

                {/* Tarjetas de Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Registros</span>
                            <span className="text-2xl font-black text-slate-900 mt-1 block">{logs.length}</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                            <Activity size={24} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Modificaciones / Ediciones</span>
                            <span className="text-2xl font-black text-amber-600 mt-1 block">
                                {logs.filter(l => l.action === 'EDITAR').length}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Edit3 size={24} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Eliminaciones Registradas</span>
                            <span className="text-2xl font-black text-red-600 mt-1 block">
                                {logs.filter(l => l.action === 'ELIMINAR').length}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            <Trash2 size={24} />
                        </div>
                    </div>
                </div>

                {/* Contenedor Principal de la Tabla */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
                    
                    {/* Barra de Filtros */}
                    <div className="p-6 border-b border-slate-100 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 bg-slate-50/40">
                        <div className="flex items-center space-x-2 shrink-0">
                            <Filter size={18} className="text-slate-400" />
                            <h3 className="text-base font-bold text-slate-800">Filtros de Auditoría</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full 2xl:w-auto">
                            <div className="relative flex-1 min-w-[220px] sm:w-64 max-w-full">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por usuario o detalle..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-2 focus:ring-slate-900 font-medium"
                                />
                            </div>

                            <select
                                value={actionFilter}
                                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                                className="flex-1 min-w-[140px] max-w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-slate-900"
                            >
                                <option value="">Todas las Acciones</option>
                                <option value="CREAR">Creaciones</option>
                                <option value="EDITAR">Ediciones</option>
                                <option value="ELIMINAR">Eliminaciones</option>
                            </select>

                            <select
                                value={moduloFilter}
                                onChange={(e) => { setModuloFilter(e.target.value); setCurrentPage(1); }}
                                className="flex-1 min-w-[140px] max-w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-slate-900"
                            >
                                <option value="">Todos los Módulos</option>
                                {modulosDisponibles.map(mod => (
                                    <option key={mod} value={mod}>{mod}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tabla Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-extrabold">Fecha y Hora Exacta</th>
                                    <th className="px-6 py-4 font-extrabold">Usuario Responsable</th>
                                    <th className="px-6 py-4 font-extrabold text-center">Acción</th>
                                    <th className="px-6 py-4 font-extrabold">Módulo</th>
                                    <th className="px-6 py-4 font-extrabold">Detalle / Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span>{log.fecha_hora}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-semibold mt-0.5 ml-5">
                                                {log.hace_tiempo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                                    {log.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-slate-900 text-xs block">{log.user_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{log.user_role || 'Usuario'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                                {log.modulo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-800 max-w-md">
                                            <p className="leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                {log.description}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <History size={36} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                                            <p className="text-sm font-bold text-slate-600">No se encontraron registros de auditoría</p>
                                            <p className="text-xs text-slate-400 mt-1">Los cambios futuros en sanciones aparecerán registrados aquí.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Vista Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {paginatedLogs.map((log) => (
                            <div key={log.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                            {log.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 text-xs block">{log.user_name}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{log.user_role || 'Usuario'}</span>
                                        </div>
                                    </div>
                                    {getActionBadge(log.action)}
                                </div>
                                <div className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {log.description}
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold pt-1">
                                    <span>{log.fecha_hora}</span>
                                    <span>{log.hace_tiempo}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Barra de Paginación */}
                    {filteredLogs.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500">
                                <span>
                                    Mostrando <strong className="text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}</strong> a <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> de <strong className="text-slate-800">{filteredLogs.length}</strong> registros
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-medium">Mostrar:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="py-1 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 shadow-xs cursor-pointer"
                                    >
                                        <option value={10}>10 por pág.</option>
                                        <option value={25}>25 por pág.</option>
                                        <option value={50}>50 por pág.</option>
                                        <option value={100}>100 por pág.</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} />
                                    <span className="hidden sm:inline">Anterior</span>
                                </button>

                                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 shadow-xs">
                                    {currentPage} / {totalPages}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center gap-1"
                                >
                                    <span className="hidden sm:inline">Siguiente</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
