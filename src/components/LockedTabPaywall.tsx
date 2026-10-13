import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  QrCode, 
  Database,
  Image as ImageIcon,
  Maximize2,
  Send,
  Coins,
  Globe
} from 'lucide-react';
import { useMembership } from '../context/MembershipContext';
import { QRPaymentSettings, DEFAULT_QR_SETTINGS } from '../types/membership';
import { db, doc, onSnapshot } from '../lib/firebase';

interface LockedTabPaywallProps {
  tabName: string;
  description?: string;
}

export const LockedTabPaywall: React.FC<LockedTabPaywallProps> = ({ 
  tabName, 
  description = 'Esta sección y sus herramientas de inteligencia artificial están reservadas para miembros con suscripción activa.' 
}) => {
  const { setQrPaymentModalOpen } = useMembership();
  const [qrSettings, setQrSettings] = useState<QRPaymentSettings>(DEFAULT_QR_SETTINGS);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const isSavedTab = tabName.toLowerCase().includes('temática') || tabName.toLowerCase().includes('guardada');

  // Real-time synchronization of QR images and prices from Firestore
  useEffect(() => {
    // 1. Fallback / initial load from API
    fetch('/api/payments/qr-config')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setQrSettings(data.settings);
      })
      .catch(() => {});

    // 2. Real-time Firestore sync
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'qrSettings'), (snap) => {
        if (snap.exists()) {
          setQrSettings(snap.data() as QRPaymentSettings);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firestore QR listener notice in paywall:', e);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-center space-y-8">
      
      {/* Icon & Title */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/40">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ACCESO A SUSCRIPTORES
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-tight">
            {tabName} Requiere Plan Activo
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            {description}
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mt-2">
            <Database className="w-3.5 h-3.5" />
            <span>Tus temáticas guardadas permanecen 100% protegidas en tu base de datos</span>
          </div>
        </div>
      </div>

      {/* Feature Perks */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left max-w-xl mx-auto space-y-2.5">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block border-b border-zinc-800 pb-2">
          Herramientas incluidas con tu suscripción:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Historias y Documentales (10 Actos)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Historias Cortas (Shorts)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audio Voz en off (.WAV)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Guiones completos (.TXT)</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CÓDIGOS QR DINÁMICOS (BOLIVIA & BINANCE) */}
      <div className="space-y-4 pt-2">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Paga con tu Código QR y Activa tu Cuenta</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Escanea el código QR que prefieras, realiza tu pago y avisa a Olvis para que active tu acceso de inmediato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
          
          {/* Card 1: QR BANCO DE BOLIVIA */}
          <div className="rounded-3xl bg-zinc-900/90 border border-red-500/30 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold">
                  🇧🇴 QR BANCO DE BOLIVIA
                </span>
                <span className="text-xs font-bold text-zinc-400">Bs. (Bolivianos)</span>
              </div>

              {/* QR Image preview */}
              <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-zinc-950 rounded-2xl border border-zinc-800 p-2 flex items-center justify-center overflow-hidden group">
                {qrSettings.boliviaQrImageUrl ? (
                  <>
                    <img 
                      src={qrSettings.boliviaQrImageUrl} 
                      alt="Código QR Simple Bolivia" 
                      className="w-full h-full object-contain rounded-xl cursor-zoom-in group-hover:scale-105 transition-transform"
                      onClick={() => setZoomedImage(qrSettings.boliviaQrImageUrl || null)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(qrSettings.boliviaQrImageUrl || null)}
                      className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <QrCode className="w-12 h-12 text-zinc-700 mx-auto" />
                    <span className="text-[11px] text-zinc-500 block">
                      Foto de QR disponible en el panel.
                    </span>
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="space-y-1 text-xs text-zinc-300 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Banco:</span>
                  <span className="font-semibold text-white">{qrSettings.boliviaBankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Titular:</span>
                  <span className="font-semibold text-white">{qrSettings.boliviaAccountHolder}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800/80 pt-1 mt-1 font-mono text-[11px]">
                  <span className="text-zinc-400">Precios:</span>
                  <span className="text-emerald-400 font-bold">
                    30d: {qrSettings.priceBs1Month}Bs • 90d: {qrSettings.priceBs3Months}Bs • 365d: {qrSettings.priceBs1Year}Bs
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQrPaymentModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Avisar que pagué por QR Bolivia</span>
            </button>
          </div>

          {/* Card 2: QR BINANCE INTERNACIONAL */}
          <div className="rounded-3xl bg-zinc-900/90 border border-amber-500/30 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  🌐 BINANCE PAY (INTERNACIONAL)
                </span>
                <span className="text-xs font-bold text-zinc-400">USDT / Crypto</span>
              </div>

              {/* QR Image preview */}
              <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-zinc-950 rounded-2xl border border-zinc-800 p-2 flex items-center justify-center overflow-hidden group">
                {qrSettings.binanceQrImageUrl ? (
                  <>
                    <img 
                      src={qrSettings.binanceQrImageUrl} 
                      alt="Código QR Binance Pay" 
                      className="w-full h-full object-contain rounded-xl cursor-zoom-in group-hover:scale-105 transition-transform"
                      onClick={() => setZoomedImage(qrSettings.binanceQrImageUrl || null)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(qrSettings.binanceQrImageUrl || null)}
                      className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Coins className="w-12 h-12 text-zinc-700 mx-auto" />
                    <span className="text-[11px] text-zinc-500 block">
                      Foto de QR Binance disponible en el panel.
                    </span>
                  </div>
                )}
              </div>

              {/* Binance Details */}
              <div className="space-y-1 text-xs text-zinc-300 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Binance Pay ID:</span>
                  <span className="font-mono font-bold text-amber-300 select-all">{qrSettings.binancePayId || '802891392'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Red:</span>
                  <span className="font-semibold text-white">{qrSettings.binanceNetwork || 'USDT TRC20 / BEP20'}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800/80 pt-1 mt-1 font-mono text-[11px]">
                  <span className="text-zinc-400">Precios:</span>
                  <span className="text-amber-400 font-bold">
                    30d: ${qrSettings.priceBinance1Month || qrSettings.priceUsd1Month} • 90d: ${qrSettings.priceBinance3Months || qrSettings.priceUsd3Months} • 365d: ${qrSettings.priceBinance1Year || qrSettings.priceUsd1Year}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQrPaymentModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/50 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Avisar que pagué por Binance</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Action Button to Send Payment Notice */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setQrPaymentModalOpen(true)}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black text-sm sm:text-base inline-flex items-center justify-center gap-2.5 shadow-2xl shadow-red-950/70 transition-all cursor-pointer active:scale-98"
        >
          <Send className="w-5 h-5" />
          <span>Ya pagué: Enviar Comprobante a Olvis para Activar Mi Cuenta</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Zoom de Imagen QR */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <h4 className="text-sm font-bold text-white">Código QR para Pago</h4>
            <div className="w-full aspect-square max-w-sm mx-auto bg-white p-3 rounded-2xl">
              <img src={zoomedImage} alt="QR Zoom" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-zinc-400">Toca en cualquier parte para cerrar</p>
          </div>
        </div>
      )}

    </div>
  );
};
