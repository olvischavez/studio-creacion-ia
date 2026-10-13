import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Send, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Globe, 
  Coins, 
  CheckCircle2, 
  Image as ImageIcon,
  Maximize2 
} from 'lucide-react';
import { useMembership } from '../context/MembershipContext';
import { MembershipPlan, QRPaymentSettings, DEFAULT_QR_SETTINGS } from '../types/membership';
import { db, doc, setDoc, onSnapshot } from '../lib/firebase';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: MembershipPlan;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = '1_month'
}) => {
  const { currentUser } = useMembership();

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>(
    defaultPlan === 'free' || defaultPlan === 'admin' || defaultPlan === 'lifetime' ? '1_month' : defaultPlan
  );
  const [selectedMethod, setSelectedMethod] = useState<'qr_bolivia' | 'binance'>('qr_bolivia');
  const [qrSettings, setQrSettings] = useState<QRPaymentSettings>(DEFAULT_QR_SETTINGS);

  // Form to notify payment
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyName, setNotifyName] = useState('');
  const [notifyReference, setNotifyReference] = useState('');
  const [notifyNote, setNotifyNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Pre-fill email from current logged-in user
  useEffect(() => {
    if (currentUser?.email && !currentUser.email.includes('invitado')) {
      setNotifyEmail(currentUser.email);
      if (currentUser.name) setNotifyName(currentUser.name);
    }
  }, [currentUser]);

  // Fetch QR settings with real-time Firestore sync & backend fallback
  useEffect(() => {
    if (isOpen) {
      setSubmitSuccess(false);
      setErrorMessage(null);

      // 1. Fetch from server API
      fetch('/api/payments/qr-config')
        .then(r => r.json())
        .then(data => {
          if (data.settings) setQrSettings(data.settings);
        })
        .catch(err => console.warn('Could not load QR config from API:', err));

      // 2. Real-time Firestore sync
      try {
        const unsub = onSnapshot(doc(db, 'settings', 'qrSettings'), (snap) => {
          if (snap.exists()) {
            setQrSettings(snap.data() as QRPaymentSettings);
          }
        });
        return () => unsub();
      } catch (err) {
        console.warn('Firestore QR settings sync notice:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Exact prices and plan details based on selected payment method and admin configuration
  const getActivePlanDetails = () => {
    const isBolivia = selectedMethod === 'qr_bolivia';

    switch (selectedPlan) {
      case '3_months':
        return {
          id: '3_months' as MembershipPlan,
          title: 'Plan Trimestral',
          duration: '3 Meses (90 Días)',
          priceText: isBolivia 
            ? `${qrSettings.priceBs3Months} Bs.` 
            : `$${qrSettings.priceBinance3Months || qrSettings.priceUsd3Months} USD`,
          rawAmount: isBolivia 
            ? qrSettings.priceBs3Months 
            : (qrSettings.priceBinance3Months || qrSettings.priceUsd3Months),
          currency: isBolivia ? 'BOB' : 'USDT',
          discount: 'Ahorro del 15%',
          badge: 'MÁS POPULAR',
        };
      case '1_year':
        return {
          id: '1_year' as MembershipPlan,
          title: 'Plan Anual',
          duration: '1 Año Completo (365 Días)',
          priceText: isBolivia 
            ? `${qrSettings.priceBs1Year} Bs.` 
            : `$${qrSettings.priceBinance1Year || qrSettings.priceUsd1Year} USD`,
          rawAmount: isBolivia 
            ? qrSettings.priceBs1Year 
            : (qrSettings.priceBinance1Year || qrSettings.priceUsd1Year),
          currency: isBolivia ? 'BOB' : 'USDT',
          discount: 'Ahorro del 35%',
          badge: 'MEJOR VALOR',
        };
      default:
        return {
          id: '1_month' as MembershipPlan,
          title: 'Plan Mensual',
          duration: '1 Mes (30 Días)',
          priceText: isBolivia 
            ? `${qrSettings.priceBs1Month} Bs.` 
            : `$${qrSettings.priceBinance1Month || qrSettings.priceUsd1Month} USD`,
          rawAmount: isBolivia 
            ? qrSettings.priceBs1Month 
            : (qrSettings.priceBinance1Month || qrSettings.priceUsd1Month),
          currency: isBolivia ? 'BOB' : 'USDT',
          discount: null,
          badge: 'ACCESO MENSUAL',
        };
    }
  };

  const planInfo = getActivePlanDetails();

  const handleNotifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) {
      setErrorMessage('Por favor coloca tu correo electrónico para que Olvis pueda activar tu cuenta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const amount = selectedMethod === 'qr_bolivia' 
      ? `${planInfo.rawAmount} Bs` 
      : `${planInfo.rawAmount} USDT`;
    const currency = selectedMethod === 'qr_bolivia' ? 'BOB' : 'USDT';

    try {
      const noticeId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Save to Firebase Firestore
      try {
        await setDoc(doc(db, 'paymentNotices', noticeId), {
          id: noticeId,
          email: notifyEmail.trim().toLowerCase(),
          name: notifyName.trim() || undefined,
          plan: selectedPlan,
          amount,
          currency,
          method: selectedMethod,
          reference: notifyReference.trim(),
          note: notifyNote.trim(),
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch (firestoreErr) {
        console.warn('Firestore payment notice save notice:', firestoreErr);
      }

      // 2. Server notification
      const res = await fetch('/api/payments/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          name: notifyName.trim() || undefined,
          plan: selectedPlan,
          amount,
          currency,
          method: selectedMethod,
          reference: notifyReference.trim(),
          note: notifyNote.trim()
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        setErrorMessage(data.error || 'Hubo un error al enviar el aviso de pago.');
      }
    } catch (err: any) {
      setErrorMessage('Error de conexión al enviar el aviso de pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 overflow-hidden my-auto max-h-[95vh] overflow-y-auto scrollbar-thin">
        
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors z-10 cursor-pointer"
          title="Cerrar ventana de pago"
        >
          ✕
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> PAGO DIRECTO POR QR
            </span>
            <span className="text-zinc-400 text-xs">• Sin comisiones bancarias</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Activa tu Membresía Pro con QR
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400">
            Selecciona tu método de pago y el plan que prefieras para escanear el código QR correspondiente.
          </p>
        </div>

        {/* PASO 1: SELECCIONAR MÉTODO DE PAGO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Elige tu Método de Pago por QR:</span>
          </label>

          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            {/* Botón QR Bolivia */}
            <button
              type="button"
              onClick={() => setSelectedMethod('qr_bolivia')}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMethod === 'qr_bolivia'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-base">🇧🇴</span>
              <span>QR Bolivia (Bs.)</span>
            </button>

            {/* Botón Binance QR */}
            <button
              type="button"
              onClick={() => setSelectedMethod('binance')}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedMethod === 'binance'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 shadow-md font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Binance QR (Dólares / USDT)</span>
            </button>
          </div>
        </div>

        {/* PASO 2: SELECCIONAR PLAN DE MEMBRESÍA (ADAPTADO EXACTAMENTE A LA MONEDA SELECCIONADA) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Elige tu Plan de Membresía:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Plan 1: 1 Mes */}
            <button
              type="button"
              onClick={() => setSelectedPlan('1_month')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                selectedPlan === '1_month'
                  ? selectedMethod === 'qr_bolivia'
                    ? 'bg-gradient-to-b from-red-950/70 to-zinc-900 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                    : 'bg-gradient-to-b from-amber-950/70 to-zinc-900 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                1 Mes
              </div>
              <div className="text-xl font-black text-white mt-0.5 font-mono">
                {selectedMethod === 'qr_bolivia' 
                  ? `${qrSettings.priceBs1Month} Bs.` 
                  : `$${qrSettings.priceBinance1Month || qrSettings.priceUsd1Month} USD`}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Tiempo: 30 Días de Acceso
              </div>
            </button>

            {/* Plan 2: 3 Meses */}
            <button
              type="button"
              onClick={() => setSelectedPlan('3_months')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                selectedPlan === '3_months'
                  ? selectedMethod === 'qr_bolivia'
                    ? 'bg-gradient-to-b from-red-950/70 to-zinc-900 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                    : 'bg-gradient-to-b from-amber-950/70 to-zinc-900 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-extrabold shadow-sm">
                MÁS POPULAR
              </span>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                3 Meses
              </div>
              <div className="text-xl font-black text-white mt-0.5 font-mono">
                {selectedMethod === 'qr_bolivia' 
                  ? `${qrSettings.priceBs3Months} Bs.` 
                  : `$${qrSettings.priceBinance3Months || qrSettings.priceUsd3Months} USD`}
              </div>
              <div className="text-[11px] text-amber-200/90 mt-1 font-medium flex items-center justify-between">
                <span>Tiempo: 90 Días</span>
                <span className="text-amber-400 font-bold">• Ahorro 15%</span>
              </div>
            </button>

            {/* Plan 3: 1 Año Completo */}
            <button
              type="button"
              onClick={() => setSelectedPlan('1_year')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                selectedPlan === '1_year'
                  ? selectedMethod === 'qr_bolivia'
                    ? 'bg-gradient-to-b from-red-950/70 to-zinc-900 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                    : 'bg-gradient-to-b from-amber-950/70 to-zinc-900 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[9px] font-extrabold shadow-sm">
                MEJOR VALOR
              </span>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                1 Año Completo
              </div>
              <div className="text-xl font-black text-white mt-0.5 font-mono">
                {selectedMethod === 'qr_bolivia' 
                  ? `${qrSettings.priceBs1Year} Bs.` 
                  : `$${qrSettings.priceBinance1Year || qrSettings.priceUsd1Year} USD`}
              </div>
              <div className="text-[11px] text-emerald-300/90 mt-1 font-medium flex items-center justify-between">
                <span>Tiempo: 365 Días</span>
                <span className="text-emerald-400 font-bold">• Ahorro 35%</span>
              </div>
            </button>
          </div>
        </div>

        {/* PASO 3: CÓDIGO QR Y MONTO EXACTO (SIN TITULAR NI UBICACIÓN - TAMAÑO GRANDE) */}
        <div className="p-5 sm:p-7 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner">
          {selectedMethod === 'qr_bolivia' ? (
            /* QR BOLIVIA: SOLO SALE EL QR SUBIDO EN PANEL ADMIN Y EL MONTO EXACTO */
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              
              {/* Imagen del QR Bolivia en tamaño grande para escaneo rápido con cámara */}
              <div 
                onClick={() => qrSettings.boliviaQrImageUrl && setIsQrZoomed(true)}
                className={`relative p-4 sm:p-6 rounded-3xl bg-white border-4 border-red-500/80 shadow-2xl flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full mx-auto transition-transform ${
                  qrSettings.boliviaQrImageUrl ? 'cursor-zoom-in hover:scale-[1.02]' : ''
                }`}
                title={qrSettings.boliviaQrImageUrl ? 'Haz clic para ver el QR en pantalla completa' : ''}
              >
                {qrSettings.boliviaQrImageUrl ? (
                  <img 
                    src={qrSettings.boliviaQrImageUrl} 
                    alt="Código QR Simple Bolivia" 
                    className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain rounded-2xl bg-white select-none"
                    style={{ imageRendering: 'auto' }}
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex flex-col items-center justify-center bg-zinc-100 rounded-2xl p-4 text-zinc-900 border border-zinc-300">
                    <QrCode className="w-40 h-40 text-zinc-900" />
                    <span className="text-xs font-black uppercase text-red-600 mt-3 tracking-wider">
                      🇧🇴 QR SIMPLE BOLIVIA
                    </span>
                    <span className="text-[10px] text-zinc-500 text-center mt-1">
                      (Sube la foto de tu QR en el panel admin)
                    </span>
                  </div>
                )}

                {qrSettings.boliviaQrImageUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQrZoomed(true);
                    }}
                    className="mt-3.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 flex items-center gap-2 shadow-md cursor-pointer transition-all"
                    title="Ampliar código QR a pantalla completa"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ampliar QR a Pantalla Completa</span>
                  </button>
                )}
              </div>

              {/* Monto Exacto del Plan Elegido en Bolivianos */}
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold">
                  <span>🇧🇴 Simple QR Bolivia</span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  Monto Exacto: {planInfo.rawAmount} Bs.
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Abre la aplicación de cualquier banco o billetera de Bolivia (Banco Unión, BNB, BCP, Bisa, Mercantil, Tigo Money) y escanea el código QR para transferir <strong className="text-white">{planInfo.rawAmount} Bolivianos</strong> para tu plan de <strong className="text-amber-300">{planInfo.duration}</strong>.
                </p>
              </div>

            </div>
          ) : (
            /* BINANCE QR: SOLO SALE LA IMAGEN SUBIDA EN PANEL ADMIN Y EL MONTO EXACTO EN DÓLARES */
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              
              {/* Imagen del QR Binance en tamaño grande para escaneo rápido con cámara */}
              <div 
                onClick={() => qrSettings.binanceQrImageUrl && setIsQrZoomed(true)}
                className={`relative p-4 sm:p-6 rounded-3xl bg-white border-4 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full mx-auto transition-transform ${
                  qrSettings.binanceQrImageUrl ? 'cursor-zoom-in hover:scale-[1.02]' : ''
                }`}
                title={qrSettings.binanceQrImageUrl ? 'Haz clic para ver el QR en pantalla completa' : ''}
              >
                {qrSettings.binanceQrImageUrl ? (
                  <img 
                    src={qrSettings.binanceQrImageUrl} 
                    alt="Código QR Binance Pay" 
                    className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain rounded-2xl bg-white p-2 select-none"
                    style={{ imageRendering: 'auto' }}
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex flex-col items-center justify-center bg-black rounded-2xl p-4 text-amber-400 border border-amber-500/40">
                    <QrCode className="w-40 h-40 text-amber-400" />
                    <span className="text-xs font-black uppercase text-amber-400 mt-3 tracking-wider">
                      BINANCE PAY (USDT)
                    </span>
                    <span className="text-[10px] text-zinc-500 text-center mt-1">
                      (Sube la foto de tu QR en el panel admin)
                    </span>
                  </div>
                )}

                {qrSettings.binanceQrImageUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQrZoomed(true);
                    }}
                    className="mt-3.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 flex items-center gap-2 shadow-md cursor-pointer transition-all"
                    title="Ampliar código QR a pantalla completa"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ampliar QR a Pantalla Completa</span>
                  </button>
                )}
              </div>

              {/* Monto Exacto del Plan Elegido en Dólares / USDT */}
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <span>🌐 Binance Pay (Internacional)</span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                  Monto Exacto: ${planInfo.rawAmount} USD
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Abre la aplicación de Binance y escanea el código QR para enviar <strong className="text-white">${planInfo.rawAmount} USD (USDT)</strong> para tu plan de <strong className="text-amber-300">{planInfo.duration}</strong>.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* PASO 4: FORMULARIO DE AVISO DE PAGO */}
        <div className="rounded-2xl bg-gradient-to-b from-red-950/40 to-zinc-950 border-2 border-red-500/40 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-md">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                ¿Ya realizaste tu pago? Coloca tu correo para avisarle a Olvis:
              </h3>
              <p className="text-xs text-zinc-400">
                Monto que registrarás: <strong className="text-emerald-400">{planInfo.priceText}</strong> ({planInfo.duration})
              </p>
            </div>
          </div>

          {submitSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>¡Aviso de pago enviado con éxito a Olvis Chávez!</span>
              </div>
              <p className="text-emerald-300 text-xs">
                Hemos registrado tu notificación para la cuenta <strong className="text-white underline">{notifyEmail}</strong> con el {planInfo.title} ({planInfo.priceText}). Olvis verificará tu comprobante y activará tu membresía de inmediato.
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Entendido, volver a la aplicación
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNotifyPayment} className="space-y-3">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    <span>Tu Correo (Gmail o Email):</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="tu-correo@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Tu Nombre o Remitente (Opcional):
                  </label>
                  <input
                    type="text"
                    value={notifyName}
                    onChange={(e) => setNotifyName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Nº de Comprobante / TxID (Opcional):
                  </label>
                  <input
                    type="text"
                    value={notifyReference}
                    onChange={(e) => setNotifyReference(e.target.value)}
                    placeholder="Ej: 19482049 o Hash TxID"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Mensaje para Olvis (Opcional):
                  </label>
                  <input
                    type="text"
                    value={notifyNote}
                    onChange={(e) => setNotifyNote(e.target.value)}
                    placeholder="Ej: Ya transferí el monto exacto"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botón Principal para Notificar Pago */}
              <button
                type="submit"
                disabled={isSubmitting || !notifyEmail.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando aviso de pago a Olvis...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Avisar a Olvis que ya pagué ({planInfo.priceText})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Pie del modal */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span>⚡ Activación directa por Olvis Chávez Mustafa</span>
          <span className="text-emerald-400 font-bold">
            Verificación manual de tu comprobante
          </span>
        </div>

      </div>

      {/* MODAL OVERLAY: CÓDIGO QR EN PANTALLA COMPLETA PARA ESCANEO INSTANTÁNEO */}
      {isQrZoomed && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl animate-fade-in cursor-zoom-out"
          onClick={() => setIsQrZoomed(false)}
        >
          <div 
            className="relative max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-center space-y-4 shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              title="Cerrar ampliación"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                selectedMethod === 'qr_bolivia'
                  ? 'bg-red-950/80 border-red-500/50 text-red-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              }`}>
                {selectedMethod === 'qr_bolivia' ? '🇧🇴 QR Bolivia Simple' : '🌐 Binance Pay (USDT)'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight pt-1">
                Monto Exacto: {planInfo.priceText}
              </div>
              <p className="text-xs text-zinc-400">
                {planInfo.duration} • Apunta la cámara directamente al código QR abajo
              </p>
            </div>

            {/* Imagen Gigante con fondo blanco de máximo contraste */}
            <div className="p-4 sm:p-6 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-4 border-zinc-200">
              <img
                src={selectedMethod === 'qr_bolivia' ? qrSettings.boliviaQrImageUrl : qrSettings.binanceQrImageUrl}
                alt="Código QR en Pantalla Completa"
                className="w-72 h-72 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] object-contain rounded-xl select-none"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsQrZoomed(false)}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 cursor-pointer transition-all"
            >
              Cerrar Vista Ampliada
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
