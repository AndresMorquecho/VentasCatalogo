import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);

    const showToast = (msg: string, type: ToastType = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

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
            default:
                return null;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-[9999] p-4 rounded-md shadow-lg flex items-center gap-2 transition-opacity duration-300 ${getToastStyles(toast.type)}`}>
                    {getToastIcon(toast.type)}
                    <span className="font-medium">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        return { showToast: () => console.warn("ToastProvider missing") };
    }
    return context;
};
