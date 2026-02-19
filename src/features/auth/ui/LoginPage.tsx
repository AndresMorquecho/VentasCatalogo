
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/auth';
import { useLogin } from '../model/useLogin';

export function LoginPage() {
    const { user } = useAuth();
    const { form, status, errorMessage, handleChange, handleSubmit } = useLogin();
    const [showPassword, setShowPassword] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const isLoading = status === 'loading';
    const hasError = status === 'error';

    return (
        /* ─── Full-screen sky background ─────────────────────────────────── */
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: 'linear-gradient(160deg, #cceeff 0%, #a8d8f0 30%, #7ec8e3 60%, #b8e4f7 100%)',
            }}
        >
            {/* subtle cloud texture overlays */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: 220, height: 100, borderRadius: 60, background: 'rgba(255,255,255,0.45)', filter: 'blur(20px)' }} />
                <div style={{ position: 'absolute', top: '60%', left: '15%', width: 300, height: 120, borderRadius: 80, background: 'rgba(255,255,255,0.35)', filter: 'blur(24px)' }} />
                <div style={{ position: 'absolute', top: '25%', right: '8%', width: 180, height: 80, borderRadius: 50, background: 'rgba(255,255,255,0.30)', filter: 'blur(18px)' }} />
                <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 260, height: 100, borderRadius: 70, background: 'rgba(255,255,255,0.40)', filter: 'blur(22px)' }} />
            </div>

            {/* ─── Split card ──────────────────────────────────────────────── */}
            <div
                className="relative flex w-full overflow-hidden"
                style={{
                    maxWidth: 860,
                    minHeight: 520,
                    borderRadius: 28,
                    boxShadow: '0 32px 80px rgba(0,90,140,0.18), 0 8px 24px rgba(0,0,0,0.10)',
                }}
            >
                {/* ── LEFT panel — illustrative ──────────────────────────── */}
                <div
                    className="relative hidden md:flex flex-col items-center justify-center flex-shrink-0"
                    style={{
                        width: '45%',
                        background: 'linear-gradient(160deg, #5bc8f5 0%, #38aee0 50%, #2196c4 100%)',
                        clipPath: 'ellipse(92% 100% at 0% 50%)',   /* wave cut to the right */
                        paddingRight: 32,
                    }}
                >
                    {/* decorative mini clouds */}
                    <div style={{ position: 'absolute', top: '12%', left: '8%', width: 80, height: 36, borderRadius: 30, background: 'rgba(255,255,255,0.35)', filter: 'blur(4px)' }} />
                    <div style={{ position: 'absolute', top: '20%', left: '28%', width: 50, height: 22, borderRadius: 20, background: 'rgba(255,255,255,0.28)', filter: 'blur(3px)' }} />
                    <div style={{ position: 'absolute', bottom: '18%', left: '6%', width: 110, height: 44, borderRadius: 34, background: 'rgba(255,255,255,0.30)', filter: 'blur(5px)' }} />
                    <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 70, height: 28, borderRadius: 24, background: 'rgba(255,255,255,0.25)', filter: 'blur(3px)' }} />

                    {/* Logo */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 170, height: 170,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        }}>
                            <img
                                src="/images/mochitopng.png"
                                alt="Logo"
                                style={{ width: 130, height: 130, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
                            />
                        </div>
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <p style={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.2, textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                                Sistema de Gestión
                            </p>
                            <p style={{ fontSize: 13, opacity: 0.80, marginTop: 4 }}>
                                Acceso exclusivo para personal
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT panel — form ─────────────────────────────────── */}
                <div
                    className="flex-1 flex flex-col justify-center"
                    style={{
                        background: '#ffffff',
                        padding: '48px 52px',
                    }}
                >
                    {/* Mobile logo (only visible when left panel is hidden) */}
                    <div className="flex md:hidden items-center gap-3 mb-6">
                        <img src="/images/mochitopng.png" alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                        <span style={{ fontWeight: 700, fontSize: 17, color: '#1a2d3d' }}>Sistema de Gestión</span>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2d3d', marginBottom: 8, lineHeight: 1.2 }}>
                        Iniciar Sesión
                    </h1>
                    <p style={{ fontSize: 14, color: '#8fa3b1', marginBottom: 36 }}>
                        Ingresa tus credenciales para continuar
                    </p>

                    {/* Error banner */}
                    {hasError && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            background: '#fff1f2', border: '1px solid #fecdd3',
                            borderRadius: 12, padding: '12px 16px',
                            marginBottom: 24,
                        }}>
                            <AlertCircle style={{ width: 16, height: 16, color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: 13, color: '#e11d48', lineHeight: 1.4 }}>{errorMessage}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="login-email"
                                style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#8fa3b1', textTransform: 'uppercase', marginBottom: 8 }}
                            >
                                Correo Electrónico
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                placeholder="usuario@empresa.com"
                                value={form.email}
                                onChange={e => handleChange('email', e.target.value)}
                                disabled={isLoading}
                                style={{
                                    display: 'block', width: '100%',
                                    fontSize: 14, color: '#1a2d3d',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: `2px solid ${hasError ? '#fca5a5' : '#d1dde6'}`,
                                    outline: 'none',
                                    paddingBottom: 10,
                                    transition: 'border-color 0.2s',
                                    letterSpacing: 0.5,
                                    opacity: isLoading ? 0.6 : 1,
                                }}
                                onFocus={e => { e.currentTarget.style.borderBottomColor = '#38aee0'; }}
                                onBlur={e => { e.currentTarget.style.borderBottomColor = hasError ? '#fca5a5' : '#d1dde6'; }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="login-password"
                                style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#8fa3b1', textTransform: 'uppercase', marginBottom: 8 }}
                            >
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••••"
                                    value={form.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                    disabled={isLoading}
                                    style={{
                                        display: 'block', width: '100%',
                                        fontSize: 14, color: '#1a2d3d',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: `2px solid ${hasError ? '#fca5a5' : '#d1dde6'}`,
                                        outline: 'none',
                                        paddingBottom: 10,
                                        paddingRight: 36,
                                        transition: 'border-color 0.2s',
                                        letterSpacing: form.password && !showPassword ? 4 : 0.5,
                                        opacity: isLoading ? 0.6 : 1,
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderBottomColor = '#38aee0'; }}
                                    onBlur={e => { e.currentTarget.style.borderBottomColor = hasError ? '#fca5a5' : '#d1dde6'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    disabled={isLoading}
                                    style={{
                                        position: 'absolute', right: 0, bottom: 8,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#8fa3b1', padding: 0, lineHeight: 0,
                                        opacity: isLoading ? 0.5 : 1,
                                    }}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword
                                        ? <EyeOff style={{ width: 16, height: 16 }} />
                                        : <Eye style={{ width: 16, height: 16 }} />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div style={{ marginTop: 8 }}>
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%', padding: '14px 0',
                                    borderRadius: 50,
                                    background: isLoading
                                        ? '#90c9e8'
                                        : 'linear-gradient(90deg, #38aee0 0%, #2196c4 100%)',
                                    color: '#fff',
                                    fontWeight: 700, fontSize: 15,
                                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 6px 24px rgba(33,150,196,0.35)',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    letterSpacing: 0.3,
                                }}
                                onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'; }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                                        Verificando...
                                    </>
                                ) : (
                                    'Ingresar al Sistema'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <p style={{ marginTop: 36, fontSize: 12, color: '#b0c4ce', textAlign: 'center' }}>
                        Acceso restringido — Solo personal autorizado
                    </p>
                </div>
            </div>

            {/* Spin keyframes injected inline */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
