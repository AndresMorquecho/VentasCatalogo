import { useToast } from "@/shared/ui/use-toast";

/**
 * Shared Notification Service
 * Use this to handle success/error toasts consistently across the app.
 */
export const useNotifications = () => {
    const { showToast } = useToast();

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
        // Extract message from error object (Axios/Standard/Backend)
        const message = err?.message || err?.error?.message || err?.error || defaultMessage;

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

    return { notifySuccess, notifyError, notifyDelete };
};
