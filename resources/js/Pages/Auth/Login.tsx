import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Iniciar Sesión" />

            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <img src="/img/logo_pitazo.png" alt="Pitazo Final ERP" className="h-48 w-auto object-contain" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight hidden">Iniciar Sesión</h2>
            </div>

            {status && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200 text-center">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Correo Electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium shadow-xs"
                        placeholder="admin@anfa.cl"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <p className="mt-1.5 text-xs text-rose-600 font-bold">{errors.email}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Contraseña
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium shadow-xs"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <p className="mt-1.5 text-xs text-rose-600 font-bold">{errors.password}</p>
                    )}
                </div>

                <div className="flex items-center mt-4">
                    <Checkbox
                        id="remember_me"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="remember_me" className="ml-2 block text-xs font-bold text-slate-700 cursor-pointer">
                        Recordarme en este dispositivo
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-xs text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Iniciando sesión…' : 'Ingresar al Sistema'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
