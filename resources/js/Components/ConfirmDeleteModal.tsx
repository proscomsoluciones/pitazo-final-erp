import Modal from '@/Components/Modal';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    show: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    processing?: boolean;
}

export default function ConfirmDeleteModal({
    show,
    title = '¿Confirmar eliminación?',
    description = 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este registro permanentemente?',
    confirmText = 'Sí, eliminar',
    cancelText = 'Cancelar',
    onConfirm,
    onClose,
    processing = false,
}: ConfirmDeleteModalProps) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-4 shrink-0 shadow-xs">
                        <AlertTriangle size={24} />
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {title}
                </h3>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 mb-6">
                    {description}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 active:scale-95 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Trash2 size={15} />
                        {processing ? 'Eliminando…' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
