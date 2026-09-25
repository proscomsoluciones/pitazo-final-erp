import { PropsWithChildren, ReactNode, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    Menu, X, LogOut, Shield, Users, KeyRound, ChevronDown,
    Trophy, Building2, Scale, LayoutDashboard, Gavel, UserCheck, Bell, History,
    Check, CheckCheck, Trash2, HeartHandshake
} from 'lucide-react';

function SwipeableNotificationItem({ n }: { n: any }) {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const handleStart = (clientX: number) => {
        setStartX(clientX);
        setIsDragging(true);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;
        const diff = clientX - startX;
        const clamped = Math.max(-140, Math.min(140, diff));
        setOffsetX(clamped);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (offsetX < -60) {
            // Swiped Left -> Mark as read
            setOffsetX(-350);
            setTimeout(() => {
                router.post(route('auditoria.mark-read', n.id), {}, { preserveScroll: true, preserveState: true });
            }, 150);
        } else if (offsetX > 60) {
            // Swiped Right -> Delete notification
            setOffsetX(350);
            setTimeout(() => {
                router.delete(route('auditoria.destroy', n.id), { preserveScroll: true, preserveState: true });
            }, 150);
        } else {
            setOffsetX(0);
        }
    };

    const markReadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(route('auditoria.mark-read', n.id), {}, { preserveScroll: true, preserveState: true });
    };

    const deleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.delete(route('auditoria.destroy', n.id), { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="relative overflow-hidden bg-slate-100 select-none group">
            {/* Action underlay revealed during swipe */}
            <div className="absolute inset-0 flex items-center justify-between px-4 font-extrabold text-xs">
                {/* Swipe Right Action: DELETE */}
                <div 
                    onClick={deleteClick}
                    className={`flex items-center space-x-1.5 transition-all cursor-pointer ${
                        offsetX > 20 ? 'opacity-100 scale-100 text-red-600' : 'opacity-20 scale-90 text-slate-400'
                    }`}
                >
                    <Trash2 size={16} className="text-red-600" />
                    <span className="text-red-600 uppercase tracking-wider text-[10px]">Eliminar</span>
                </div>

                {/* Swipe Left Action: MARK AS READ */}
                <div 
                    onClick={markReadClick}
                    className={`flex items-center space-x-1.5 transition-all cursor-pointer ${
                        offsetX < -20 ? 'opacity-100 scale-100 text-emerald-600' : 'opacity-20 scale-90 text-slate-400'
                    }`}
                >
                    <span className="text-emerald-600 uppercase tracking-wider text-[10px]">Leído</span>
                    <CheckCheck size={16} className="text-emerald-600" />
                </div>
            </div>

            {/* Foreground notification card */}
            <div
                onMouseDown={(e) => handleStart(e.clientX)}
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                onTouchEnd={handleEnd}
                style={{ transform: `translateX(${offsetX}px)` }}
                className={`relative z-10 p-3.5 bg-white hover:bg-slate-50/90 transition-transform duration-150 ease-out border-b border-slate-100 cursor-grab active:cursor-grabbing ${
                    !n.is_read ? 'bg-emerald-50/30' : ''
                }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 min-w-0">
                        {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Sin leer" />
                        )}
                        <span className={`font-black text-xs truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-800'}`}>
                            {n.user_name}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            n.action === 'CREAR' ? 'bg-emerald-100 text-emerald-800' :
                            n.action === 'EDITAR' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {n.action}
                        </span>

                        {/* Desktop Hover Quick Action Buttons */}
                        <div className="hidden group-hover:flex items-center space-x-1 ml-1" onClick={(e) => e.stopPropagation()}>
                            {!n.is_read && (
                                <button
                                    onClick={markReadClick}
                                    title="Marcar como leído"
                                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors"
                                >
                                    <Check size={14} />
                                </button>
                            )}
                            <button
                                onClick={deleteClick}
                                title="Eliminar notificación"
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-slate-800 text-xs font-bold leading-normal mt-1">
                    {n.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold pt-1">
                    <span>{n.fecha_hora}</span>
                    <span className="text-slate-700 font-extrabold">{n.hace_tiempo}</span>
                </div>
            </div>
        </div>
    );
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage<any>().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    
    const isSuperAdmin = user?.roles?.some((r: any) => {
        const name = typeof r === 'string' ? r : r?.name;
        return ['Super admin', 'Super Admin'].includes(name);
    }) || user?.roles?.includes('Super admin') || user?.roles?.includes('Super Admin');

    const isAdminOrSuperAdmin = user?.roles?.some((r: any) => {
        const name = typeof r === 'string' ? r : r?.name;
        return ['Super admin', 'Super Admin', 'Administrador', 'Admin'].includes(name);
    }) || user?.roles?.includes('Admin') || user?.roles?.includes('Administrador');

    const hasPermission = (p: string) => {
        if (isSuperAdmin || isAdminOrSuperAdmin) return true;
        if (user?.permissions?.includes(p)) return true;
        if (user?.roles?.some((r: any) => {
            const name = typeof r === 'string' ? r : r?.name;
            return ['Presidente', 'Secretario', 'Comite disciplina', 'Comite etica', 'Admin', 'Tesorero'].includes(name);
        })) return true;
        return false;
    };

    const notifications = usePage<any>().props.notifications || [];
    const unreadNotifications = notifications.filter((n: any) => !n.is_read);

    // Verificaciones de estado activo para categorías
    const isInicioActive = route().current('dashboard');
    const isComitesActive = route().current('tribunal.*') || route().current('etica.*') || route().current('fondos.*');
    const isDeportivaActive = route().current('jugadores.*') || route().current('clubes.*') || route().current('torneos.*');
    const isAsociacionActive = route().current('configuracion.asociacion*') || route().current('users.*') || route().current('roles.*') || route().current('permissions.*') || route().current('auditoria.*');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            
            {/* ── ENCABEZADO SUPERIOR (LOGO Y USUARIO) ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* Logo Institucional */}
                        <Link href={route('dashboard')} className="flex items-center space-x-3 group">
                            <img src="/img/logo_pitazo.png" alt="Pitazo Final ERP" className="h-16 w-auto transition-transform group-hover:scale-105" />
                            <div className="hidden sm:block border-l border-slate-200 pl-3">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block leading-none">
                                    Gestión Deportiva
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mt-0.5">
                                    & Sanciones
                                </span>
                            </div>
                        </Link>

                        {/* Botón Menú Móvil */}
                        <div className="flex items-center space-x-2 md:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                                className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                aria-label="Abrir Menú"
                            >
                                {showingNavigationDropdown ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>

                        {/* Dropdown de Usuario y Notificaciones (Escritorio) */}
                        <div className="hidden md:flex items-center space-x-3">
                            {/* Campana de Notificaciones de Auditoría (Super Admin / Admin) */}
                            {isAdminOrSuperAdmin && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button 
                                            className="relative p-2.5 rounded-xl text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 transition-all border border-slate-200/80 flex items-center justify-center cursor-pointer"
                                            title="Notificaciones de Auditoría"
                                        >
                                            <Bell size={18} className="text-slate-700" />
                                            {unreadNotifications.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
                                                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                                                </span>
                                            )}
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="right" width="96">
                                        <div className="w-[420px] max-w-[90vw]">
                                            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    <History size={16} className="text-slate-700 shrink-0" />
                                                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider whitespace-nowrap">Historial de Auditoría</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 shrink-0">
                                                    {unreadNotifications.length > 0 ? (
                                                        <button
                                                            onClick={() => router.post(route('auditoria.mark-all-read'), {}, { preserveScroll: true })}
                                                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
                                                            title="Marcar todas como leídas"
                                                        >
                                                            {unreadNotifications.length} sin leer
                                                        </button>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                                            Al día
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {notifications.length > 0 && (
                                                <div className="bg-slate-100/70 px-3.5 py-1 text-[10px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-100">
                                                    <span>Eliminar ⟶</span>
                                                    <span>⟵ Leído</span>
                                                </div>
                                            )}

                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n: any) => (
                                                        <SwipeableNotificationItem key={n.id} n={n} />
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                                                        Sin cambios recientes registrados.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                                                <Link
                                                    href={route('auditoria.index')}
                                                    className="block w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shadow-xs"
                                                >
                                                    Ver Módulo de Auditoría Completo
                                                </Link>
                                            </div>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all bg-slate-100/80 hover:bg-slate-200/80 px-4 py-2 rounded-xl border border-slate-200/80">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-bold text-xs text-slate-900">{user.name}</span>
                                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">{user.roles?.[0]?.name || user.roles?.[0] || 'Usuario'}</span>
                                        </div>
                                        <ChevronDown size={14} className="text-slate-400 ml-1" />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right">
                                    <Dropdown.Link href={route('profile.edit')} className="font-semibold text-slate-700 flex items-center gap-2">
                                        <UserCheck size={16} /> Mi Perfil
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="text-red-600 font-bold flex items-center justify-between">
                                        Cerrar Sesión
                                        <LogOut size={16} className="ml-2" />
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* ── BARRA DE NAVEGACIÓN POR CATEGORÍAS (SIN EMOJIS, VECTORES PROFESIONALES) ── */}
                <nav className="hidden md:block bg-slate-100/70 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
                    <div className="max-w-7xl mx-auto flex items-center justify-start space-x-3">
                        
                        {/* Categoría 1: Inicio */}
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                                isInicioActive 
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/70 shadow-xs'
                            }`}
                        >
                            <LayoutDashboard size={18} />
                            <span>Inicio</span>
                        </Link>

                        {/* Categoría 2: Comités Disciplinarios */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                                    isComitesActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/70 shadow-xs'
                                }`}>
                                    <Scale size={18} />
                                    <span>Comités & Resoluciones</span>
                                    <ChevronDown size={15} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64">
                                {hasPermission('ver tribunal') && (
                                    <Dropdown.Link href={route('tribunal.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <Gavel size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Comité de Disciplina</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Sanciones y Actas de fechas</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                                {hasPermission('ver etica') && (
                                    <Dropdown.Link href={route('etica.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Comité de Ética</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Casos y dictámenes éticos</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                                {hasPermission('ver fondos') && (
                                    <Dropdown.Link href={route('fondos.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <HeartHandshake size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Fondo Solidario</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Aportes a jugadores afectados</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                            </Dropdown.Content>
                        </Dropdown>

                        {/* Categoría 3: Gestión Deportiva */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                                    isDeportivaActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/70 shadow-xs'
                                }`}>
                                    <Trophy size={18} />
                                    <span>Gestión Deportiva</span>
                                    <ChevronDown size={15} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64">
                                {hasPermission('ver jugadores') && (
                                    <Dropdown.Link href={route('jugadores.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Jugadores</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Registro de futbolistas</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                                {hasPermission('ver clubes') && (
                                    <Dropdown.Link href={route('clubes.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Clubes</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Instituciones afiliadas</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                                {hasPermission('ver torneos') && (
                                    <Dropdown.Link href={route('torneos.index')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                            <Trophy size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-sm leading-tight">Torneos y Fases</span>
                                            <span className="block text-xs text-slate-600 font-bold mt-0.5">Campeonatos y calendario</span>
                                        </div>
                                    </Dropdown.Link>
                                )}
                            </Dropdown.Content>
                        </Dropdown>

                        {/* Categoría 4: Asociación y Ajustes */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                                    isAsociacionActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/70 shadow-xs'
                                }`}>
                                    <Building2 size={18} />
                                    <span>Asociación & Ajustes</span>
                                    <ChevronDown size={15} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64">
                                <Dropdown.Link href={route('configuracion.asociacion')} className="flex items-center gap-3 font-extrabold text-slate-900 py-3">
                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-900 font-bold shrink-0">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-black text-slate-900 text-sm leading-tight">Datos de la Asociación</span>
                                        <span className="block text-xs text-slate-600 font-bold mt-0.5">Firmantes, RUT y membrete</span>
                                    </div>
                                </Dropdown.Link>
                                
                                {isAdminOrSuperAdmin && (
                                    <Dropdown.Link href={route('auditoria.index')} className="flex items-center gap-3 font-black text-slate-900 text-sm py-2.5 border-t border-slate-100 my-1">
                                        <History size={18} className="text-emerald-600" /> <span>Historial de Auditoría</span>
                                    </Dropdown.Link>
                                )}
                                
                                {isSuperAdmin && (
                                    <>
                                        <Dropdown.Link href={route('users.index')} className="flex items-center gap-3 font-black text-slate-900 text-sm py-2.5">
                                            <Users size={18} className="text-slate-600" /> <span>Usuarios del Sistema</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('roles.index')} className="flex items-center gap-3 font-black text-slate-900 text-sm py-2.5">
                                            <Shield size={18} className="text-slate-600" /> <span>Roles y Permisos</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('permissions.index')} className="flex items-center gap-3 font-black text-slate-900 text-sm py-2.5">
                                            <KeyRound size={18} className="text-slate-600" /> <span>Catálogo de Permisos</span>
                                        </Dropdown.Link>
                                    </>
                                )}
                            </Dropdown.Content>
                        </Dropdown>

                    </div>
                </nav>
            </header>

            {/* ── NAVEGACIÓN MÓVIL ── */}
            {showingNavigationDropdown && (
                <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
                    <Link href={route('dashboard')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-3 rounded-xl font-bold bg-slate-100 text-slate-900">
                        <LayoutDashboard size={20} /> <span>Inicio</span>
                    </Link>
                    
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 px-2 tracking-wider">Comités</p>
                        <Link href={route('tribunal.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Gavel size={18} /> <span>Comité de Disciplina</span>
                        </Link>
                        <Link href={route('etica.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Building2 size={18} /> <span>Comité de Ética</span>
                        </Link>
                        <Link href={route('fondos.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <HeartHandshake size={18} /> <span>Fondo Solidario</span>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 px-2 tracking-wider">Gestión Deportiva</p>
                        <Link href={route('jugadores.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Users size={18} /> <span>Jugadores</span>
                        </Link>
                        <Link href={route('clubes.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Shield size={18} /> <span>Clubes</span>
                        </Link>
                        <Link href={route('torneos.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Trophy size={18} /> <span>Torneos y Fases</span>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 px-2 tracking-wider">Asociación</p>
                        <Link href={route('configuracion.asociacion')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                            <Building2 size={18} /> <span>Datos de la Asociación</span>
                        </Link>
                        {isAdminOrSuperAdmin && (
                            <Link href={route('auditoria.index')} onClick={() => setShowingNavigationDropdown(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold bg-slate-50 text-slate-800">
                                <History size={18} className="text-emerald-600" /> <span>Historial de Auditoría</span>
                            </Link>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                        <Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200">
                            <LogOut size={18} />
                            <span>Cerrar Sesión</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* ── ÁREA PRINCIPAL DE CONTENIDO ── */}
            <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col justify-between">
                <div>
                    {header && (
                        <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8">
                            <div className="max-w-7xl mx-auto">
                                {header}
                            </div>
                        </div>
                    )}
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </div>

                {/* ── PIE DE PÁGINA (FOOTER) ── */}
                <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-2">
                            <img src="/img/logo_pitazo.png" alt="Pitazo Final ERP" className="h-5 w-auto object-contain opacity-85" />
                            <span>&copy; {new Date().getFullYear()} Pitazo Final ERP &bull; Todos los derechos reservados.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/70">
                            <span>Sistema diseñado por</span>
                            <span className="font-black text-emerald-700 tracking-wide uppercase">PROSOCM</span>
                        </div>
                    </div>
                </footer>
            </main>

        </div>
    );
}
