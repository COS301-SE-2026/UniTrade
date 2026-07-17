import React, { useCallback,useState} from 'react';
import { IconCheck, IconX, IconAlertTriangle} from '@tabler/icons-react';
import { ToastContext, type ToastType } from './ToastContext';


interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}





const styles: Record<ToastType, { bg: string; icon: React.ReactNode}> = {
    success: { bg: 'bg-emerald-600', icon: <IconCheck size={18} />},
    error: {bg: 'bg-rose-600', icon: <IconAlertTriangle size={18} />},
    info: { bg: 'bg-navy-800', icon: <IconCheck size={18} />},
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, message}]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
                {toasts.map((t) => (
                    <div
                    key={t.id}
                    className={`${styles[t.type].bg} text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]`}
                    >
                 <span className="mt-0.5 shrink-0">{styles[t.type].icon}</span>
                 <p className="text-sm font-medium flex-1">{t.message}</p>
                 <button onClick={() => dismiss(t.id)} className="text-white/70 hover:text-white shrink-0">
                    <IconX size={16} />
                 </button>
                 </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
