import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { Loader2, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resetPassword } = useAuth();
    const { showToast } = useToast();
    
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            showToast('Token de recuperación no válido', 'error');
            navigate('/login');
        }
    }, [token, navigate, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 4) {
            showToast('La contraseña debe tener al menos 4 caracteres', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(token || '', password);
            setIsSuccess(true);
            showToast('Contraseña restablecida correctamente', 'success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al restablecer contraseña', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F7F7] to-white p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-[#1A184D]">Nueva Contraseña</h1>
                    <p className="text-slate-500 text-sm">
                        Ingresa tu nueva contraseña para acceder al sistema.
                    </p>
                </div>

                {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pw" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                    Contraseña Nueva
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Lock size={18} />
                                    </div>
                                    <Input
                                        id="pw"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="h-12 bg-slate-100/60 border-none rounded-xl pl-12 pr-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pw-confirm" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                    Confirmar Contraseña
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Lock size={18} />
                                    </div>
                                    <Input
                                        id="pw-confirm"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="h-12 bg-slate-100/60 border-none rounded-xl pl-12 pr-4"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#23807D] hover:bg-[#1B6664] text-white font-bold rounded-full shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Restablecer Contraseña'}
                        </Button>
                    </form>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-emerald-900">¡Todo listo!</h2>
                        <p className="text-emerald-800">
                            Tu contraseña ha sido actualizada. Serás redirigido al inicio de sesión en unos segundos...
                        </p>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/login')}>
                            Ir al Login ahora
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
