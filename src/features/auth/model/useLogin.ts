
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth';

export type LoginStatus = 'idle' | 'loading' | 'error';

export type LoginForm = {
    email: string;
    password: string;
};

type UseLoginReturn = {
    form: LoginForm;
    status: LoginStatus;
    errorMessage: string;
    handleChange: (field: keyof LoginForm, value: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
};

export function useLogin(): UseLoginReturn {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
    const [status, setStatus] = useState<LoginStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = useCallback((field: keyof LoginForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear error on any change
        if (status === 'error') {
            setStatus('idle');
            setErrorMessage('');
        }
    }, [status]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!form.email.trim()) {
            setStatus('error');
            setErrorMessage('El correo electrónico es obligatorio.');
            return;
        }
        if (!form.password) {
            setStatus('error');
            setErrorMessage('La contraseña es obligatoria.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            // AuthProvider.login → usersApi.login → auditService (LOGIN / LOGIN_FAILED)
            await login(form.email.trim(), form.password);
            // On success: redirect to dashboard
            navigate('/', { replace: true });
        } catch (err: unknown) {
            setStatus('error');
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión. Intente de nuevo.';
            setErrorMessage(message);
        }
    }, [form, login, navigate]);

    return { form, status, errorMessage, handleChange, handleSubmit };
}
