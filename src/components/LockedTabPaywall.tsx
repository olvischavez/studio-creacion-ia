import React from 'react';
import { Lock, Sparkles, CheckCircle, ArrowRight, QrCode, Database } from 'lucide-react';
import { useMembership } from '../context/MembershipContext';

interface LockedTabPaywallProps {
  tabName: string;
  description?: string;
}

export const LockedTabPaywall: React.FC<LockedTabPaywallProps> = ({ 
  tabName, 
  description = 'Esta sección y sus herramientas de inteligencia artificial están reservadas para miembros con suscripción activa.' 
}) => {
  const { setQrPaymentModalOpen } = useMembership();
  const isSavedTab = tabName.toLowerCase().includes('temática') || tabName.toLowerCase().includes('guardada');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/40">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ACCESO A SUSCRIPTORES
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-cinzel tracking-tight">
          {tabName} Requiere Plan Activo
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto">
          {description}
        </p>

        {isSavedTab && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mt-2">
            <Database className="w-3.5 h-3.5" />
            <span>Tus temáticas guardadas permanecen intactas en tu base de datos de Gmail</span>
          </div>
        )}
      </div>

      {/* Feature perks */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left max-w-lg mx-auto space-y-3">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block border-b border-zinc-800 pb-2">
          Lo que desbloqueas con tu membresía:
        </span>
        <div className="space-y-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Historias y Documentales (10 Actos de 6 Clips con continuidad total)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Historias Cortas (Shorts)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Descarga de voz en off de todos los clips en Audio WAV (.wav) en Español e Inglés</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Guiones completos (.txt) y guardado en tu base de datos de usuario</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setQrPaymentModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Ver QR para Pagar (Bolivia & Binance)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Aceptamos transferencias por QR Simple para Bolivia (en Bs.) y Binance Pay (USDT). Una vez verificado tu pago, Olvis activa tu acceso de forma inmediata.
      </p>
    </div>
  );
};
