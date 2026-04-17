import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { forgotPassword } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setIsSent(true);
            showToast('Instrucciones enviadas', 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al solicitar recuperación', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F7F7] to-white p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-[#1A184D]">Recuperar Contraseña</h1>
                    <p className="text-slate-500 text-sm">
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu cuenta.
                    </p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                Correo Electrónico
                            </Label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                    <Mail size={18} />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    className="h-12 bg-slate-100/60 border-none rounded-xl pl-12 pr-4"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#23807D] hover:bg-[#1B6664] text-white font-bold rounded-full shadow-lg"
                            disabled={isLoading || !email}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Instrucciones'}
                        </Button>
                    </form>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <Mail size={24} />
                        </div>
                        <p className="text-emerald-800 font-medium">
                            Si el correo <b>{email}</b> está registrado, recibirás un enlace en unos minutos.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                            Probar con otro correo
                        </Button>
                    </div>
                )}

                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-[#23807D] transition-colors text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={16} />
                    Volver al inicio de sesión
                </button>
            </div>
        </div>
    );
}
