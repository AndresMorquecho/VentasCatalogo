import { useToast } from "@/shared/ui/use-toast";

/**
 * Shared Notification Service
 * Use this to handle success/error toasts consistently across the app.
 */
export const useNotifications = () => {
    const { showToast, dismissToast } = useToast();

    /**
     * Notify success after a CRUD action
     */
    const notifySuccess = (message: string) => {
        showToast(message, 'success');
    };

    /**
     * Notify error with a user-friendly message.
     * Extracts message from Error object if available.
     */
    const notifyError = (err: any, defaultMessage: string = 'Ocurrió un error inesperado') => {
        // Extract message from error object (Axios/Standard/Backend/String)
        let message = defaultMessage;
        
        if (typeof err === 'string') {
            message = err;
        } else if (err?.response?.data?.error) {
            message = typeof err.response.data.error === 'string' ? err.response.data.error : defaultMessage;
        } else if (err?.response?.data?.message) {
            message = err.response.data.message;
        } else if (err?.message) {
            message = err.message;
        } else if (err?.error?.message) {
            message = err.error.message;
        } else if (err?.error) {
            message = typeof err.error === 'string' ? err.error : defaultMessage;
        }

        // Log to console for dev, but show toast for user
        console.error('[Notification Error]:', err);

        showToast(message, 'error');
    };

    /**
     * Helper for delete actions (common confirmation)
     */
    const notifyDelete = (itemType: string) => {
        showToast(`${itemType} eliminado correctamente`, 'success');
    };

    const notifyLoading = (message: string = 'Procesando...') => {
        showToast(message, 'loading', 0);
    };

    const dismiss = () => {
        dismissToast();
    };

    return { notifySuccess, notifyError, notifyDelete, notifyLoading, dismiss };
};
