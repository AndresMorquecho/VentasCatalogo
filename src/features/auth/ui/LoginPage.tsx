import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { Eye, EyeOff, Loader2, User, Lock as LockIcon } from 'lucide-react';

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
      {/* SECCIÓN IZQUIERDA: Banner con formas geométricas */}
      <div className="hidden md:flex md:w-3/5 bg-white relative items-center justify-center overflow-hidden border-r">
        {/* Formas geométricas de fondo (evocando el diseño plegado) - Colores de Marca Vibrantes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
          {/* Polígonos con colores exactos del logo (Teal, Purple, Amber) */}
          <div className="absolute top-[-5%] left-[-10%] w-[45%] h-[55%] bg-[#23807D]/15 rotate-[15deg]" 
               style={{ clipPath: 'polygon(0% 0%, 100% 0%, 70% 100%, 0% 85%)' }} />
          
          <div className="absolute top-[5%] right-[-10%] w-[40%] h-[50%] bg-[#5B2C82]/15 -rotate-[20deg]" 
               style={{ clipPath: 'polygon(20% 0%, 100% 10%, 75% 100%, 0% 75%)' }} />
          
          <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[60%] bg-[#F2C94C]/20 -rotate-[10deg]" 
               style={{ clipPath: 'polygon(10% 20%, 95% 0%, 100% 90%, 5% 100%)' }} />
          
          <div className="absolute bottom-0 right-[-15%] w-[45%] h-[55%] bg-[#00D1D1]/10 rotate-[25deg]" 
               style={{ clipPath: 'polygon(0% 30%, 85% 0%, 100% 100%, 15% 95%)' }} />
          
          {/* Formas centrales con degradados sutiles */}
          <div className="absolute left-[25%] top-[35%] w-[30%] h-[35%] bg-[#5B2C82]/10 rotate-[45deg] blur-[100px] rounded-full" />
          <div className="absolute right-[20%] bottom-[30%] w-[35%] h-[40%] bg-[#23807D]/10 -rotate-[30deg] blur-[120px] rounded-full" />
          
          {/* Líneas geométricas abstractas más visibles */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(45deg, #23807D 0.5px, transparent 0.5px), linear-gradient(-45deg, #5B2C82 0.5px, transparent 0.5px)', backgroundSize: '80px 80px' }} />
        </div>

        {/* Imagen el logo centrada */}
        <div className="relative z-10 w-full p-12 drop-shadow-2xl">
          <img
            src="/images/BannerHeader.jpg"
            alt="Banner Monchito"
            className="w-full h-auto object-contain max-h-[85vh]"
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: Formulario */}
      <div className="flex-1 bg-gradient-to-br from-[#E0F7F7] to-white flex items-center justify-center p-6 md:p-12 lg:p-20 relative">
        {/* Adornos sutiles */}
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-cyan-100/50 rounded-bl-full" />
        <div className="absolute top-10 right-10 w-16 h-16 bg-white/20 rounded-full blur-xl" />

        <div className="w-full max-w-sm space-y-8 md:space-y-12 z-10 animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Logo móvil (solo visible en mobile) */}
          <div className="flex md:hidden justify-center mb-8">
            <img
              src="/images/mochitopng.png"
              alt="Logo Monchito"
              className="w-48 h-auto object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A184D] tracking-tight">Log in</h2>
            <p className="text-slate-500 text-sm md:text-base font-medium opacity-80">Gestiona tu catálogo de ventas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                  Usuario o Email
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <User size={18} />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    className="h-12 bg-slate-100/60 border-none rounded-xl pl-12 pr-4 text-slate-800 text-base focus-visible:ring-2 focus-visible:ring-cyan-400/50 transition-all shadow-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isSubmitLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" title="Contraseña" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest hover:text-cyan-700 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <LockIcon size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-slate-100/60 border-none rounded-xl pl-12 pr-12 text-slate-800 text-base focus-visible:ring-2 focus-visible:ring-cyan-400/50 transition-all shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 md:h-14 bg-[#23807D] hover:bg-[#1B6664] text-white text-base md:text-lg font-bold rounded-full shadow-lg shadow-[#23807D]/20 transition-all active:scale-[0.98] mt-2 active:bg-[#165351]"
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? (
                <Loader2 className="animate-spin text-white" size={24} />
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="pt-8 md:pt-12 flex items-center justify-center gap-2 text-[9px] md:text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              <span>VENTASCATALOGO v2.4.0</span>
              <span className="text-slate-200">|</span>
              <div className="flex items-center gap-1">
                <LockIcon size={10} className="mb-0.5" />
                <span>SECURE ACCESS</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
