import React, { useState } from 'react';
import { 
  Sparkles, 
  Bookmark, 
  Crown, 
  Lock, 
  LogOut,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useMembership } from '../context/MembershipContext';

export type MainTabId = 'ai' | 'saved' | 'admin';

interface HeaderProps {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
  savedCount: number;
}

// Official Google Multicolor SVG Icon
const GoogleIcon = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
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

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, savedCount }) => {
  const { 
    currentUser, 
    isMasterAdmin, 
    loginWithGoogle,
    openLoginModal, 
    logout, 
    daysRemaining, 
    hasAccessToTab 
  } = useMembership();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const hasAIAccess = hasAccessToTab('ai');

  const handleDirectGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.warn('Google login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with Brand & Google Gmail Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 shadow-md shadow-red-950/50">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-zinc-950 rounded-full flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-cinzel">
                OLVIS BOLT
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-sans font-bold border border-red-500/30">
                  STUDIO
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right action area: Strictly Gmail Authentication (Iniciar Sesión directa con Google / Registrarse con Gmail) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!currentUser ? (
            <>
              {/* Botón Iniciar Sesión: Abre directamente el selector de cuentas de Google Gmail */}
              <button
                type="button"
                onClick={handleDirectGoogleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-all shadow-sm hover:border-zinc-600 active:scale-95 cursor-pointer disabled:opacity-60"
                title="Selecciona directamente tu cuenta de Gmail Google para iniciar sesión"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <GoogleIcon className="w-4 h-4" />
                )}
                <span>{isLoggingIn ? 'Abriendo Google...' : 'Iniciar Sesión'}</span>
              </button>

              {/* Botón Registrarse: Abre el registro exclusivo con Gmail */}
              <button
                type="button"
                onClick={() => openLoginModal('register')}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:brightness-110 shadow-md shadow-red-950/50 border border-amber-500/40 transition-all active:scale-95 cursor-pointer"
                title="Registrarse a través de Gmail Google"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Registrarse</span>
              </button>
            </>
          ) : (
            /* Botón de sesión iniciada que muestra el Gmail del usuario y su foto */
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 transition-all shadow-sm hover:border-zinc-600 active:scale-95 cursor-pointer"
                title="Sesión iniciada con Gmail • Clic para ver opciones"
              >
                {/* Foto de perfil de Gmail */}
                <div className="relative shrink-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || currentUser.email}
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-xs font-bold text-white border border-amber-400/40">
                      {(currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                </div>

                {/* Gmail del usuario */}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white max-w-[130px] sm:max-w-[180px] md:max-w-[240px] truncate">
                    {currentUser.email}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span>Sesión iniciada</span>
                    {isMasterAdmin && (
                      <span className="text-amber-400 font-bold">• 👑 Admin</span>
                    )}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menú Desplegable al hacer clic */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/50"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-sm font-bold text-white">
                        {(currentUser.email || 'G')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name || 'Usuario'}</p>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.2 rounded-full font-medium">
                        Google Gmail
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-zinc-300">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400">Estado de Membresía:</span>
                      <span className="font-bold text-amber-300">
                        {isMasterAdmin
                          ? '👑 Super Admin'
                          : currentUser.plan === '1_year'
                          ? '⭐ Plan 1 Año'
                          : currentUser.plan === '3_months'
                          ? '⚡ Plan 3 Meses'
                          : currentUser.plan === '1_month'
                          ? '🎟️ Plan 1 Mes'
                          : 'Plan Gratis'}
                      </span>
                    </div>
                    {daysRemaining !== null && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Días restantes:</span>
                        <span className="font-mono text-zinc-200">{daysRemaining} días</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-800/40 text-xs font-semibold text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 border-t border-zinc-900/80 overflow-x-auto scrollbar-none py-1.5">
          
          {/* Tab 1: Creación con IA */}
          <button
            onClick={() => onTabChange('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-red-600/30 to-amber-900/30 text-amber-200 border border-red-500/50 shadow-md shadow-red-950/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Estudio de Creación con IA</span>
            {!hasAIAccess && !isMasterAdmin && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </button>

          {/* Tab 2: Proyectos Guardados */}
          <button
            onClick={() => onTabChange('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
            }`}
          >
            <Bookmark className="w-4 h-4 text-zinc-400" />
            <span>Temáticas Guardadas</span>
            <span className="text-[10px] hidden sm:inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {savedCount}
            </span>
          </button>

          {/* Tab 3: EXCLUSIVE ADMIN PANEL (STRICTLY FOR OLVIS: olvischavezmustafa@gmail.com) */}
          {currentUser && currentUser.email.trim().toLowerCase() === 'olvischavezmustafa@gmail.com' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-zinc-950 font-extrabold border border-amber-300 shadow-lg shadow-amber-950/60'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/40'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300 fill-current" />
              <span>⚙️ Panel Admin (Olvis)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-200 font-mono">
                olvischavezmustafa@gmail.com
              </span>
            </button>
          )}

        </nav>
      </div>
    </header>
  );
};
