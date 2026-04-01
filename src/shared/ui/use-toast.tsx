import { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    dismissToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const dismissToast = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast(null);
    };

    const showToast = (msg: string, type: ToastType = 'success', duration: number = 3000) => {
        dismissToast();
        setToast({ msg, type });
        
        if (duration > 0) {
            timerRef.current = setTimeout(() => setToast(null), duration);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-green-600 text-white';
            case 'error':
                return 'bg-red-600 text-white';
            case 'warning':
                return 'bg-yellow-500 text-black';
            case 'info':
                return 'bg-blue-600 text-white';
            case 'loading':
                return 'bg-slate-800 text-white border border-slate-700';
            default:
                return 'bg-gray-800 text-white';
        }
    };

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'info':
                return <Info size={20} />;
            case 'loading':
                return <Loader2 size={20} className="animate-spin text-indigo-400" />;
            default:
                return null;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-[9999] p-4 rounded-md shadow-xl flex items-center gap-3 transition-all duration-300 transform scale-100 ${getToastStyles(toast.type)}`}>
                    {getToastIcon(toast.type)}
                    <span className="font-medium text-sm">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        return { 
            showToast: () => console.warn("ToastProvider missing"),
            dismissToast: () => {} 
        };
    }
    return context;
};
