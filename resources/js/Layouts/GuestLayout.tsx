import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 pt-6 sm:pt-0 font-sans px-4">
            <div className="w-full max-w-md bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl border border-slate-100">
                {children}
            </div>
            
            <div className="mt-8 text-center text-xs text-slate-500 font-semibold space-y-1">
                <p>&copy; {new Date().getFullYear()} Pitazo Final ERP</p>
                <p className="text-[11px] text-slate-400 font-medium">Sistema diseñado por <strong className="text-emerald-700 font-black tracking-wide uppercase">PROSOCOM</strong></p>
            </div>
        </div>
    );
}
