import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  AlertCircle, 
  LogOut, 
  Loader2,
  Flame
} from 'lucide-react';
import { useMembership } from '../context/MembershipContext';

// Official Google Multicolor SVG Icon
const GoogleIcon = ({ className = "w-5 h-5 shrink-0" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginMembershipModal: React.FC = () => {
  const { 
    currentUser, 
    isMasterAdmin,
    loginModalOpen, 
    setLoginModalOpen, 
    loginWithGoogle,
    logout 
  } = useMembership();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!loginModalOpen) return null;

  // Handle Register with Real Google / Firebase Auth
  const handleGoogleOneClick = async () => {
    setIsProcessing(true);
    setFeedback(null);
    const res = await loginWithGoogle();
    setIsProcessing(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: '¡Registro completado con éxito mediante tu cuenta de Gmail Google!'
      });
      setTimeout(() => {
        setLoginModalOpen(false);
      }, 1200);
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'No se pudo completar con Google. Solo cuentas @gmail.com permitidas.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden my-auto">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        {/* Modal Close Button */}
        <button
          onClick={() => {
            setLoginModalOpen(false);
            setFeedback(null);
          }}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors z-10 cursor-pointer"
          title="Cerrar ventana"
        >
          ✕
        </button>

        {/* Header / Hero Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>REGISTRARSE CON GMAIL</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            Listo para crear ideas y automatizar tu Contenido. Regístrate.
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Habilitado para registrarse a través de Gmail google. Tus temáticas, guiones y audios se guardarán de forma segura en tu base de datos para no perder tus datos.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/70 border-red-500/50 text-red-200'
          }`}>
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current User Status (if logged in) */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/50 shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                      {currentUser.email.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{currentUser.name || currentUser.email}</span>
                    {isMasterAdmin && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        👑 Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[220px]">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                Sesión Activa
              </span>
            </div>

            <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-end text-xs text-zinc-400">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                title="Cerrar sesión actual"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* REGISTRARSE A TRAVES DE GMAIL - BOTON UNICO */}
        <div className="space-y-4 pt-1">
          
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleGoogleOneClick}
            className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 group cursor-pointer border border-zinc-200 active:scale-98"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>Registrarse a traves de Gmail</span>
          </button>

          {/* Database Notice */}
          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
            <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block font-semibold">Habilitado para Gmail & Base de Datos Segura</strong>
              <span>
                Tus temáticas, guiones y audios se sincronizan automáticamente en tu base de datos para no perder tus datos.
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
