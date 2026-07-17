import { createContext} from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextValue {
    showToast: (type: ToastType, message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);