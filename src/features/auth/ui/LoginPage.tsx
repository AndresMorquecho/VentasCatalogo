import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      await login(username, password);
      showToast('¡Bienvenido de nuevo!', 'success');
      navigate('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Credenciales incorrectas', 'error');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* SECCIÓN IZQUIERDA: Logo con fondo blanco */}
      <div className="hidden md:flex md:w-1/2 bg-white relative items-center justify-center p-12">
        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-left-8 duration-700">
          <img
            src="/images/mochitopng.png"
            alt="Logo Mochito"
            className="w-full h-auto object-contain max-h-[500px]"
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: Formulario Minimalista */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 md:p-24 lg:p-32 relative">
        {/* Adorno sutil para que no sea tan vacío */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#A1EFEF]/10 rounded-bl-full" />

        <div className="w-full max-w-sm space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-[#1A184D] tracking-tight">Log in</h2>
            <p className="text-gray-400 text-sm font-medium">Gestiona tu catálogo de ventas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">
                  Usuario o Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  className="border-t-0 border-x-0 border-b-2 border-gray-100 rounded-none px-1 h-12 text-lg focus-visible:ring-0 focus-visible:border-[#00D1D1] transition-all bg-transparent shadow-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isSubmitLoading}
                />
              </div>

              <div className="space-y-1 relative">
                <Label htmlFor="password" title="Contraseña" className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="border-t-0 border-x-0 border-b-2 border-gray-100 rounded-none px-1 h-12 text-lg focus-visible:ring-0 focus-visible:border-[#00D1D1] transition-all bg-transparent shadow-none pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A184D] transition-colors p-2"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-[#A1EFEF] hover:bg-[#8EDEDE] text-[#1A184D] text-lg font-bold rounded-full shadow-lg shadow-[#A1EFEF]/20 transition-all active:scale-[0.98] mt-4"
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? (
                <Loader2 className="animate-spin text-[#1A184D]" size={24} />
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="pt-8 text-center text-[10px] text-gray-300 font-mono tracking-widest uppercase">
              VentasCatalogo v2.4.0 — Secure Access
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
