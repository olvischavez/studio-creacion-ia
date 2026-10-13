import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Users, 
  Check, 
  Trash2, 
  Clock, 
  Sliders, 
  Save, 
  RefreshCw, 
  Calendar, 
  Sparkles, 
  Lock, 
  Unlock, 
  Globe, 
  HelpCircle,
  Loader2, 
  QrCode,
  CheckCircle2, 
  AlertCircle,
  Send,
  XCircle,
  Eye,
  Flame,
  Upload,
  Image as ImageIcon,
  Edit3,
  CalendarDays,
  UserX,
  X
} from 'lucide-react';
import { useMembership } from '../context/MembershipContext';
import { 
  UserProfile, 
  GlobalTierConfig, 
  MembershipPlan, 
  TabId, 
  QRPaymentSettings,
  PendingPaymentNotification,
  ADMIN_EMAIL, 
  DEFAULT_TIER_CONFIG,
  DEFAULT_QR_SETTINGS
} from '../types/membership';
import { db, collection, onSnapshot, doc, setDoc } from '../lib/firebase';

export const AdminPanelTab: React.FC = () => {
  const { currentUser, setQrPaymentModalOpen } = useMembership();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tierConfig, setTierConfig] = useState<GlobalTierConfig>(DEFAULT_TIER_CONFIG);
  const [qrSettings, setQrSettings] = useState<QRPaymentSettings>(DEFAULT_QR_SETTINGS);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sub-tabs: No license keys! Direct activation system.
  const [adminView, setAdminView] = useState<'qr_payments' | 'users' | 'qr_settings' | 'permissions' | 'guide'>('qr_payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isSavingQr, setIsSavingQr] = useState(false);

  // Manual User Editing Modal State (in case of error or custom modification)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editPlan, setEditPlan] = useState<MembershipPlan>('1_month');
  const [editDaysToAdd, setEditDaysToAdd] = useState<number>(30);
  const [editExactDays, setEditExactDays] = useState<string>('');
  const [editCustomDate, setEditCustomDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'active' | 'expired' | 'suspended'>('active');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // File upload refs for Bolivia & Binance QRs
  const boliviaFileInputRef = useRef<HTMLInputElement>(null);
  const binanceFileInputRef = useRef<HTMLInputElement>(null);

  const isStrictMasterAdmin = Boolean(
    currentUser && currentUser.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  const currentAdminEmail = isStrictMasterAdmin && currentUser ? currentUser.email.trim().toLowerCase() : '';

  const fetchAdminData = async () => {
    if (!isStrictMasterAdmin || !currentAdminEmail) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // 1. Fetch Users & TierConfig
      const res = await fetch(`/api/memberships/admin/data?adminEmail=${encodeURIComponent(currentAdminEmail)}`, {
        headers: { 'x-admin-email': currentAdminEmail },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.tierConfig) setTierConfig(data.tierConfig);
      }

      // 2. Fetch QR Settings
      const qrRes = await fetch(`/api/payments/admin/qr-settings?adminEmail=${encodeURIComponent(currentAdminEmail)}`, {
        headers: { 'x-admin-email': currentAdminEmail },
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.settings) setQrSettings(qrData.settings);
      }

      // 3. Fetch Pending QR Payments
      const notifRes = await fetch(`/api/payments/admin/notifications?adminEmail=${encodeURIComponent(currentAdminEmail)}`, {
        headers: { 'x-admin-email': currentAdminEmail },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (Array.isArray(notifData.notifications)) {
          setPendingPayments(notifData.notifications);
        }
      }
    } catch (e) {
      console.warn('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isStrictMasterAdmin, currentAdminEmail]);

  // Real-time listener for user registrations & QR payments via Firestore
  useEffect(() => {
    if (!isStrictMasterAdmin) return;

    try {
      // 1. Listen for users
      const usersCol = collection(db, 'users');
      const unsubscribeUsers = onSnapshot(usersCol, (snap) => {
        if (!snap.empty) {
          const liveUsers: UserProfile[] = [];
          snap.forEach((d) => {
            const val = d.data() as UserProfile;
            if (val.email) liveUsers.push(val);
          });
          setUsers(prev => {
            const map = new Map<string, UserProfile>();
            prev.forEach(u => map.set(u.email.toLowerCase(), u));
            liveUsers.forEach(u => map.set(u.email.toLowerCase(), u));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        console.warn('Firestore live users listener notice:', err);
      });

      // 2. Listen for payment notices
      const noticesCol = collection(db, 'paymentNotices');
      const unsubscribeNotices = onSnapshot(noticesCol, (snap) => {
        if (!snap.empty) {
          const liveList: PendingPaymentNotification[] = [];
          snap.forEach((d) => {
            liveList.push({ id: d.id, ...d.data() } as PendingPaymentNotification);
          });
          liveList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPendingPayments(prev => {
            const map = new Map<string, PendingPaymentNotification>();
            prev.forEach(p => map.set(p.id, p));
            liveList.forEach(p => map.set(p.id, p));
            return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        }
      }, (err) => {
        console.warn('Firestore live payment notices notice:', err);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeNotices();
      };
    } catch (e) {
      console.warn('Firestore listeners init notice:', e);
    }
  }, [isStrictMasterAdmin]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 5000);
  };

  // Extend user days directly (+30d, +90d, +365d)
  const handleExtendUserDays = async (targetUser: UserProfile, addDays: number) => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    try {
      const res = await fetch('/api/memberships/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({
          adminEmail: currentAdminEmail,
          targetEmail: targetUser.email,
          updates: {
            extendDays: addDays,
            plan: addDays >= 365 ? '1_year' : addDays >= 90 ? '3_months' : '1_month',
            status: 'active',
            permissions: { ...tierConfig.paidPermissions }
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.email.toLowerCase() === targetUser.email.toLowerCase() ? data.user : u));
        
        // Sync to Firestore
        try {
          const safeId = targetUser.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
          await setDoc(doc(db, 'users', safeId), data.user, { merge: true });
        } catch (e) {
          console.warn('Firestore user sync notice:', e);
        }

        const label = addDays === 30 ? '1 Mes (30 días)' : addDays === 90 ? '3 Meses (90 días)' : '1 Año (365 días)';
        showNotification(`✓ Plan activado/extendido +${label} para ${targetUser.email}`);
      }
    } catch (err) {
      showNotification('Error al extender membresía');
    }
  };

  // Revoke / Remove plan if user didn't pay (preserves all saved themes in database)
  const handleRevokeUserPlan = async (targetUser: UserProfile) => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    if (targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showNotification('No puedes quitarle el plan a la cuenta Propietaria.');
      return;
    }

    if (!window.confirm(`¿Seguro de quitar el plan a ${targetUser.email}?\n\nRecuerda: Todas sus temáticas y documentales guardados permanecerán 100% seguros e intactos en su cuenta de Gmail para cuando vuelva a pagar.`)) {
      return;
    }

    try {
      const res = await fetch('/api/memberships/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({
          adminEmail: currentAdminEmail,
          targetEmail: targetUser.email,
          updates: {
            revokePlan: true,
            plan: 'free',
            status: 'expired',
            permissions: { ...tierConfig.freePermissions }
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.email.toLowerCase() === targetUser.email.toLowerCase() ? data.user : u));
        
        // Sync to Firestore
        try {
          const safeId = targetUser.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
          await setDoc(doc(db, 'users', safeId), data.user, { merge: true });
        } catch (e) {
          console.warn('Firestore user sync notice:', e);
        }

        showNotification(`✓ Plan retirado a ${targetUser.email}. Sus temáticas guardadas se mantienen 100% preservadas en su cuenta de Gmail.`);
      }
    } catch (err) {
      showNotification('Error al quitar el plan del usuario');
    }
  };

  // Open Edit User Modal (Manual modification in case of error)
  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditPlan(u.plan === 'free' ? '1_month' : u.plan);
    setEditStatus(u.status);
    setEditDaysToAdd(30);
    setEditExactDays('');
    if (u.expiresAt) {
      try {
        setEditCustomDate(new Date(u.expiresAt).toISOString().split('T')[0]);
      } catch (e) {
        setEditCustomDate('');
      }
    } else {
      setEditCustomDate('');
    }
  };

  // Save Manual User Edit
  const handleSaveManualUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isStrictMasterAdmin || !currentAdminEmail) return;
    setIsSavingEdit(true);

    try {
      const updates: any = {
        plan: editPlan,
        status: editStatus,
      };

      if (editPlan === 'free') {
        updates.revokePlan = true;
      } else if (editExactDays.trim() !== '') {
        const parsed = Number(editExactDays.trim());
        if (!isNaN(parsed)) {
          updates.setExactDays = parsed;
        }
      } else if (editCustomDate.trim() !== '') {
        const parsedDate = new Date(editCustomDate);
        if (!isNaN(parsedDate.getTime())) {
          // Set to end of chosen day
          parsedDate.setHours(23, 59, 59, 999);
          updates.expiresAt = parsedDate.toISOString();
        }
      } else if (editDaysToAdd > 0) {
        updates.extendDays = editDaysToAdd;
      }

      const res = await fetch('/api/memberships/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({
          adminEmail: currentAdminEmail,
          targetEmail: editingUser.email,
          updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.email.toLowerCase() === editingUser.email.toLowerCase() ? data.user : u));
        
        // Sync to Firestore
        try {
          const safeId = editingUser.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
          await setDoc(doc(db, 'users', safeId), data.user, { merge: true });
        } catch (e) {
          console.warn('Firestore user sync notice:', e);
        }

        showNotification(`✓ Usuario ${editingUser.email} modificado correctamente.`);
        setEditingUser(null);
      } else {
        showNotification('Error al actualizar datos del usuario');
      }
    } catch (err) {
      showNotification('Error de conexión al guardar cambios');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete user completely
  const handleDeleteUser = async (email: string) => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showNotification('No puedes eliminar al Propietario (tu propia cuenta)');
      return;
    }
    if (!window.confirm(`¿Seguro de eliminar al usuario ${email}?`)) return;

    try {
      const res = await fetch('/api/memberships/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({ adminEmail: currentAdminEmail, targetEmail: email }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()));
        showNotification(`Usuario ${email} eliminado`);
      }
    } catch (err) {
      showNotification('Error al eliminar usuario');
    }
  };

  // Approve User Payment Notification (with option for duration)
  const handleApprovePayment = async (notifId: string, overridePlan?: MembershipPlan, overrideDays?: number) => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    try {
      // 1. Update in Firestore
      try {
        await setDoc(doc(db, 'paymentNotices', notifId), {
          status: 'approved',
          reviewedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore approve notice:', e);
      }

      // 2. Server API Call
      const res = await fetch(`/api/payments/admin/approve/${notifId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentAdminEmail 
        },
        body: JSON.stringify({
          plan: overridePlan,
          durationDays: overrideDays
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`✓ ${data.message}`);
        // If user returned, sync user to Firestore
        if (data.user?.email) {
          try {
            const docId = data.user.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(db, 'users', docId), data.user, { merge: true });
          } catch (e) {
            console.warn('Firestore user update notice:', e);
          }
        }
        fetchAdminData();
      } else {
        showNotification(data.message || 'Error al aprobar pago');
      }
    } catch (err) {
      showNotification('Error de conexión al aprobar pago');
    }
  };

  // Reject User Payment Notification
  const handleRejectPayment = async (notifId: string) => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    if (!window.confirm('¿Deseas marcar este aviso como rechazado?')) return;
    try {
      // 1. Update in Firestore
      try {
        await setDoc(doc(db, 'paymentNotices', notifId), {
          status: 'rejected',
          reviewedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore reject notice:', e);
      }

      // 2. Server call
      const res = await fetch(`/api/payments/admin/reject/${notifId}`, {
        method: 'POST',
        headers: { 'x-admin-email': currentAdminEmail },
      });
      if (res.ok) {
        showNotification('Aviso de pago marcado como rechazado');
        setPendingPayments(prev => prev.map(p => p.id === notifId ? { ...p, status: 'rejected' } : p));
      }
    } catch (err) {
      showNotification('Error al rechazar pago');
    }
  };

  // Save QR Settings (Bolivia & Binance)
  const handleSaveQrSettings = async () => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    setIsSavingQr(true);
    try {
      const mergedSettings = {
        ...qrSettings,
        priceUsd1Month: qrSettings.priceBinance1Month || qrSettings.priceUsd1Month,
        priceUsd3Months: qrSettings.priceBinance3Months || qrSettings.priceUsd3Months,
        priceUsd1Year: qrSettings.priceBinance1Year || qrSettings.priceUsd1Year,
      };

      // 1. Save to Firestore
      try {
        await setDoc(doc(db, 'settings', 'qrSettings'), mergedSettings, { merge: true });
      } catch (fErr) {
        console.warn('Firestore QR settings save notice:', fErr);
      }

      // 2. Save to server backend
      const res = await fetch('/api/payments/admin/qr-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({
          adminEmail: currentAdminEmail,
          settings: mergedSettings,
        }),
      });
      if (res.ok) {
        showNotification('✓ ¡Fotos de Códigos QR y Precios guardados con éxito!');
        setQrSettings(mergedSettings);
      } else {
        showNotification('✓ Configuración guardada en la base de datos');
      }
    } catch (err) {
      showNotification('Error al guardar configuración de pagos QR');
    } finally {
      setIsSavingQr(false);
    }
  };

  // Upload image handler for Bolivia QR
  const handleBoliviaQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      if (base64Url) {
        setQrSettings(prev => ({ ...prev, boliviaQrImageUrl: base64Url }));
        showNotification('✓ Foto de QR Bolivia cargada con éxito. Recuerda pulsar "Guardar Fotos y Datos de Pago QR".');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload image handler for Binance QR
  const handleBinanceQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      if (base64Url) {
        setQrSettings(prev => ({ ...prev, binanceQrImageUrl: base64Url }));
        showNotification('✓ Foto de QR Binance cargada con éxito. Recuerda pulsar "Guardar Fotos y Datos de Pago QR".');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save global tier configuration
  const handleSaveTierConfig = async () => {
    if (!isStrictMasterAdmin || !currentAdminEmail) return;
    try {
      const res = await fetch('/api/memberships/admin/update-tier-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentAdminEmail },
        body: JSON.stringify({
          adminEmail: currentAdminEmail,
          tierConfig,
        }),
      });
      if (res.ok) {
        showNotification('✓ Configuración global de planes guardada exitosamente.');
      }
    } catch (err) {
      showNotification('Error al guardar configuración global');
    }
  };

  // STRICT ACCESS GUARD: Only olvischavezmustafa@gmail.com
  if (!isStrictMasterAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-cinzel">Acceso Restringido • Panel de Administrador</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Este panel de control es exclusivo y editable únicamente para la cuenta del propietario:
          <strong className="text-amber-400 block mt-1 font-mono">{ADMIN_EMAIL}</strong>
        </p>
        <p className="text-xs text-zinc-500">
          {currentUser ? `Tu cuenta actual (${currentUser.email}) no tiene permisos administrativos.` : 'Debes iniciar sesión con tu cuenta de Gmail Google.'}
        </p>
      </div>
    );
  }

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingPaymentsCount = pendingPayments.filter(p => p.status === 'pending').length;
  const filteredPayments = pendingPayments.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const activeUsersCount = users.filter(u => {
    if (u.plan === 'admin') return true;
    if (u.status !== 'active') return false;
    if (!u.expiresAt) return false;
    return new Date(u.expiresAt) > new Date();
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fade-in">
      
      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/90 via-zinc-900 to-amber-950/80 border border-amber-500/40 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/20">
                <Crown className="w-3.5 h-3.5 fill-current" /> PANEL DE CONTROL PROPIETARIO
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Activación Directa por Días (Sin Claves)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-tight flex items-center gap-2">
              <span>Gestión de Membresías & Pagos QR</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              Activa a tus usuarios por <strong className="text-amber-300">1 Mes (30 días)</strong>, <strong className="text-amber-300">3 Meses (90 días)</strong> o <strong className="text-amber-300">1 Año (365 días)</strong> al verificar su pago por QR Simple Bolivia o Binance Pay. Al activarse tienen acceso al Estudio IA y a Temáticas Guardadas. Si no pagan, se les retira el plan pero <strong className="text-emerald-400">sus temáticas guardadas se mantienen 100% seguras en su cuenta de Gmail</strong>.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center min-w-[95px] shadow-inner">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Usuarios</span>
              <strong className="text-xl font-black text-white font-mono">{users.length}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center min-w-[95px] shadow-inner">
              <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Con Plan Activo</span>
              <strong className="text-xl font-black text-emerald-300 font-mono">{activeUsersCount}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-center min-w-[95px] shadow-inner relative">
              <span className="text-[10px] text-red-300 font-semibold uppercase block">Avisos QR</span>
              <strong className="text-xl font-black text-red-300 font-mono">{pendingPaymentsCount}</strong>
              {pendingPaymentsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
            </div>

            <button
              type="button"
              onClick={fetchAdminData}
              className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-white hover:text-amber-300 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        
        {/* Tab 1: QR Payment Notices Inbox */}
        <button
          type="button"
          onClick={() => setAdminView('qr_payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
            adminView === 'qr_payments'
              ? 'bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 text-white shadow-lg shadow-red-950/50 border border-amber-400/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>🇧🇴 Avisos de Pago QR (Bolivia & Binance)</span>
          {pendingPaymentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
              {pendingPaymentsCount} nuevo{pendingPaymentsCount > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {/* Tab 2: Users List */}
        <button
          type="button"
          onClick={() => setAdminView('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminView === 'users'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 border border-amber-400/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Lista de Usuarios & Membresías ({users.length})</span>
        </button>

        {/* Tab 3: Upload QR Photos */}
        <button
          type="button"
          onClick={() => setAdminView('qr_settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminView === 'qr_settings'
              ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-lg shadow-amber-950/50 border border-amber-400/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-300" />
          <span>🖼️ Subir Fotos de QR (Bolivia & Binance)</span>
        </button>

        {/* Tab 4: Global Tier Config */}
        <button
          type="button"
          onClick={() => setAdminView('permissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminView === 'permissions'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 border border-amber-400/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>⚙️ Permisos Globales (Gratis vs Pago)</span>
        </button>

        {/* Tab 5: Guide */}
        <button
          type="button"
          onClick={() => setAdminView('guide')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminView === 'guide'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 border border-blue-400/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>📘 Guía de Activación Directa</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: QR PAYMENTS & INBOX (AVISOS DE PAGO) */}
      {/* ========================================================================= */}
      {adminView === 'qr_payments' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Avisos de Pago de Usuarios (Botón del QR)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold">
                      {pendingPayments.length} Registrados
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Aquí aparecen al instante los usuarios que escanearon tu QR y enviaron su correo confirmando que ya pagaron.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    paymentFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos ({pendingPayments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    paymentFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  Pendientes ({pendingPaymentsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    paymentFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  Aprobados
                </button>
              </div>
            </div>

            {/* List of Payments */}
            {filteredPayments.length === 0 ? (
              <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                <QrCode className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-300 font-medium">No hay avisos de pago en esta vista.</p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Cuando un cliente escanee tu código QR de Bolivia o Binance y coloque su correo en el botón "Avisar a Olvis que ya pagué", aparecerá aquí para que actives su membresía con un solo clic.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((notif) => {
                  const isPending = notif.status === 'pending';
                  const isApproved = notif.status === 'approved';
                  return (
                    <div 
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isPending 
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/20' 
                          : isApproved 
                          ? 'bg-emerald-950/20 border-emerald-500/30' 
                          : 'bg-zinc-950 border-zinc-800 opacity-60'
                      }`}
                    >
                      {/* Left: User details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm font-mono select-all">
                            {notif.email}
                          </span>
                          {notif.name && (
                            <span className="text-xs text-zinc-400">({notif.name})</span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            notif.method === 'qr_bolivia'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {notif.method === 'qr_bolivia' ? '🇧🇴 QR Bolivia' : '🌐 Binance Pay'}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                            Plan Solicitado: {notif.plan === '1_month' ? '1 Mes' : notif.plan === '3_months' ? '3 Meses' : '1 Año'}
                          </span>
                          <span className="text-xs font-black text-emerald-400 font-mono">
                            {notif.amount}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                          {notif.reference && (
                            <div>
                              <span>Nº Comprobante / TxID: </span>
                              <strong className="text-zinc-200 font-mono select-all">{notif.reference}</strong>
                            </div>
                          )}
                          {notif.note && (
                            <div>
                              <span>Nota: </span>
                              <span className="text-zinc-300 italic">"{notif.note}"</span>
                            </div>
                          )}
                          <div className="text-[11px] text-zinc-500">
                            {new Date(notif.createdAt).toLocaleDateString('es-ES', { 
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions with 1-click duration buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                        {isPending ? (
                          <>
                            {/* Fast duration activation buttons */}
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(notif.id, '1_month', 30)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                              title="Activar por 1 Mes (30 días)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activar 1 Mes (30d)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApprovePayment(notif.id, '3_months', 90)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-950/50 transition-all cursor-pointer"
                              title="Activar por 3 Meses (90 días)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activar 3 Meses (90d)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApprovePayment(notif.id, '1_year', 365)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                              title="Activar por 1 Año (365 días)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activar 1 Año (365d)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectPayment(notif.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 border border-zinc-700 font-semibold text-xs transition-all cursor-pointer"
                              title="Rechazar aviso"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : isApproved ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Membresía Activada</span>
                          </div>
                        ) : (
                          <span className="text-red-400 text-xs font-bold px-3 py-1 rounded-xl bg-red-950/40">
                            Rechazado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: USERS LIST & GRANULAR MEMBERSHIP CONTROL */}
      {/* ========================================================================= */}
      {adminView === 'users' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Usuarios Registrados & Control de Días de Membresía</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Visualiza quién tiene su plan activo, los días restantes y extiéndeles 30, 90 o 365 días. Si no pagaron, retírales el plan manteniendo sus temáticas guardadas intactas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por correo o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-64"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/90 text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-3">Usuario (Gmail)</th>
                  <th className="py-3 px-3">Plan Actual</th>
                  <th className="py-3 px-3">Estado & Días Restantes</th>
                  <th className="py-3 px-3">Acceso al Sistema</th>
                  <th className="py-3 px-3">Activar / Extender Días</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No se encontraron usuarios registrados con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwner = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                    const now = Date.now();
                    const expTime = u.expiresAt ? new Date(u.expiresAt).getTime() : 0;
                    const isPlanActive = isOwner || (u.status === 'active' && u.plan !== 'free' && expTime > now);
                    
                    const daysLeft = u.expiresAt 
                      ? Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)))
                      : null;

                    const formattedExpDate = u.expiresAt 
                      ? new Date(u.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                      : null;

                    return (
                      <tr key={u.email} className={`hover:bg-zinc-800/40 transition-colors ${isOwner ? 'bg-amber-950/20' : ''}`}>
                        
                        {/* 1. User */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {isOwner ? (
                              <Crown className="w-4 h-4 text-amber-400 fill-current shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                                {u.email.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-mono text-xs">{u.email}</span>
                          </div>
                          {u.name && <span className="text-[11px] text-zinc-400 ml-8">{u.name}</span>}
                        </td>

                        {/* 2. Plan Actual */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            u.plan === 'admin' ? 'bg-amber-500 text-zinc-950' :
                            isPlanActive && u.plan === '1_year' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' :
                            isPlanActive && u.plan === '3_months' ? 'bg-amber-950 text-amber-300 border border-amber-600/50' :
                            isPlanActive && u.plan === '1_month' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {isOwner ? '👑 PROPIETARIO' :
                             u.plan === '1_month' ? '1 MES (30D)' :
                             u.plan === '3_months' ? '3 MESES (90D)' :
                             u.plan === '1_year' ? '1 AÑO (365D)' :
                             'PLAN GRATIS'}
                          </span>
                        </td>

                        {/* 3. Días Restantes & Vencimiento */}
                        <td className="py-3.5 px-3">
                          {isOwner ? (
                            <span className="text-amber-400 font-bold text-xs">♾️ Acceso Permanente</span>
                          ) : isPlanActive && daysLeft !== null ? (
                            <div className="space-y-0.5">
                              <span className={`font-mono font-bold text-xs inline-flex items-center gap-1 ${
                                daysLeft <= 3 ? 'text-red-400 animate-pulse' : daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{daysLeft} días restantes</span>
                              </span>
                              <div className="text-[10px] text-zinc-500">
                                Vence: {formattedExpDate}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-red-400 font-semibold text-[11px] inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{u.expiresAt ? 'Plan Vencido (0 días)' : 'Sin plan activo'}</span>
                              </span>
                              <div className="text-[10px] text-zinc-500">
                                Temáticas guardadas protegidas
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 4. Acceso al Sistema */}
                        <td className="py-3.5 px-3">
                          {isPlanActive ? (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold block w-fit">
                                ✓ Estudio IA Activo
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-[10px] font-bold block w-fit">
                                ✓ Temáticas Guardadas
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-semibold block w-fit">
                                🔒 Estudio IA Bloqueado
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/30 text-[10px] font-bold block w-fit">
                                💾 Temáticas Guardadas en BD
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 5. Fast Activation / Extension Buttons */}
                        <td className="py-3.5 px-3">
                          {!isOwner && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleExtendUserDays(u, 30)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-950 text-cyan-300 hover:border-cyan-500 border border-zinc-700 text-[11px] font-bold transition-all cursor-pointer"
                                title="Activar o sumar 30 días (1 Mes)"
                              >
                                +30d (1 Mes)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExtendUserDays(u, 90)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-950 text-amber-300 hover:border-amber-500 border border-zinc-700 text-[11px] font-bold transition-all cursor-pointer"
                                title="Activar o sumar 90 días (3 Meses)"
                              >
                                +90d (3 Meses)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExtendUserDays(u, 365)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 text-emerald-300 hover:border-emerald-500 border border-zinc-700 text-[11px] font-bold transition-all cursor-pointer"
                                title="Activar o sumar 365 días (1 Año)"
                              >
                                +365d (1 Año)
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 6. Actions: Manual Edit, Revoke Plan, Delete */}
                        <td className="py-3.5 px-3 text-right">
                          {!isOwner && (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Modal Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Modificar manualmente días, plan o estado"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Modificar</span>
                              </button>

                              {/* Revoke Plan Button (if active) */}
                              {isPlanActive && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeUserPlan(u)}
                                  className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Quitar plan por falta de pago (mantiene sus temáticas guardadas)"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Quitar Plan</span>
                                </button>
                              )}

                              {/* Delete user */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.email)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800 cursor-pointer ml-1"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: UPLOAD QR PHOTOS (BOLIVIA BANK & BINANCE PAY) */}
      {/* ========================================================================= */}
      {adminView === 'qr_settings' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Subir Fotos de QR para Banco de Bolivia & Binance Pay
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Sube la foto de tu código QR de Banco de Bolivia y la foto de tu QR de Binance para que tus clientes las escaneen directamente desde su celular.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQrPaymentModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Abrir la ventana de pago tal como la ven tus usuarios"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>🧪 Probar Vista del Cliente</span>
              </button>

              <button
                type="button"
                onClick={handleSaveQrSettings}
                disabled={isSavingQr}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Guardar Fotos y Datos de Pago QR</span>
              </button>
            </div>
          </div>

          {/* Grid 2 Columns: Bolivia QR & Binance Pay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Bolivia QR Simple & Bank details */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇧🇴</span>
                  <h4 className="text-sm font-bold text-white">1. Foto de QR Banco de Bolivia (En Bs.)</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold">
                  QR Simple
                </span>
              </div>

              {/* QR Image Upload Box for Bolivia */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-amber-300 block">
                  Foto del Código QR de tu Banco:
                </label>

                <input
                  type="file"
                  ref={boliviaFileInputRef}
                  onChange={handleBoliviaQrImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {qrSettings.boliviaQrImageUrl ? (
                  <div className="relative p-4 rounded-2xl bg-zinc-900 border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center gap-3">
                    <img 
                      src={qrSettings.boliviaQrImageUrl} 
                      alt="QR Banco de Bolivia" 
                      className="max-h-80 max-w-full object-contain rounded-xl border border-zinc-700 bg-white p-2 shadow-xl"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => boliviaFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cambiar Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrSettings(prev => ({ ...prev, boliviaQrImageUrl: '' }))}
                        className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => boliviaFileInputRef.current?.click()}
                    className="p-6 rounded-2xl bg-zinc-900/60 border-2 border-dashed border-zinc-700 hover:border-red-500 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-red-950/50 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                      Haz clic para subir la foto de tu QR de Bolivia
                    </span>
                    <span className="text-[11px] text-zinc-500 text-center">
                      Formatos soportados: PNG, JPG, JPEG, WEBP de tu aplicación bancaria
                    </span>
                  </div>
                )}
              </div>

              {/* Bank Details Inputs */}
              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nombre del Banco:</label>
                  <input
                    type="text"
                    value={qrSettings.boliviaBankName}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, boliviaBankName: e.target.value }))}
                    placeholder="Banco Unión / BNB / BCP / Mercantil Santa Cruz"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Titular de la Cuenta:</label>
                  <input
                    type="text"
                    value={qrSettings.boliviaAccountHolder}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, boliviaAccountHolder: e.target.value }))}
                    placeholder="Olvis Chávez Mustafa"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Número de Cuenta / Tipo:</label>
                  <input
                    type="text"
                    value={qrSettings.boliviaAccountNumber}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, boliviaAccountNumber: e.target.value }))}
                    placeholder="Cuenta Corriente / Ahorros"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">CI / Ciudad:</label>
                  <input
                    type="text"
                    value={qrSettings.boliviaAccountCi}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, boliviaAccountCi: e.target.value }))}
                    placeholder="Santa Cruz, Bolivia"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:border-red-500 outline-none"
                  />
                </div>

                {/* Prices in Bs */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="text-amber-300 font-bold block">Precios de Membresía en Bolivianos (Bs.):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">1 Mes (Bs):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBs1Month}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBs1Month: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">3 Meses (Bs):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBs3Months}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBs3Months: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">1 Año (Bs):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBs1Year}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBs1Year: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Binance Pay Internacional */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">2. Foto de QR Binance Pay (En USDT)</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  Internacional
                </span>
              </div>

              {/* QR Image Upload Box for Binance */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-amber-300 block">
                  Foto del Código QR de Binance Pay:
                </label>

                <input
                  type="file"
                  ref={binanceFileInputRef}
                  onChange={handleBinanceQrImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {qrSettings.binanceQrImageUrl ? (
                  <div className="relative p-4 rounded-2xl bg-zinc-900 border-2 border-dashed border-amber-500/50 flex flex-col items-center justify-center gap-3">
                    <img 
                      src={qrSettings.binanceQrImageUrl} 
                      alt="QR Binance Pay" 
                      className="max-h-80 max-w-full object-contain rounded-xl border border-zinc-700 bg-white p-2 shadow-xl"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => binanceFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cambiar Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrSettings(prev => ({ ...prev, binanceQrImageUrl: '' }))}
                        className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => binanceFileInputRef.current?.click()}
                    className="p-6 rounded-2xl bg-zinc-900/60 border-2 border-dashed border-zinc-700 hover:border-amber-500 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-amber-950/50 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Haz clic para subir la foto de tu QR de Binance
                    </span>
                    <span className="text-[11px] text-zinc-500 text-center">
                      Formatos soportados: PNG, JPG, JPEG, WEBP exportados de la app de Binance
                    </span>
                  </div>
                )}
              </div>

              {/* Binance Details Inputs */}
              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Binance Pay ID:</label>
                  <input
                    type="text"
                    value={qrSettings.binancePayId}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, binancePayId: e.target.value }))}
                    placeholder="849201934"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Dirección de Billetera USDT:</label>
                  <input
                    type="text"
                    value={qrSettings.binanceUsdtAddress}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, binanceUsdtAddress: e.target.value }))}
                    placeholder="TYDzsYq7bVzM4xxxxxxxxxxxxxxTRC20"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium font-mono text-[11px] focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Red de Transferencia:</label>
                  <input
                    type="text"
                    value={qrSettings.binanceNetwork}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, binanceNetwork: e.target.value }))}
                    placeholder="USDT (TRC20 / BEP20 / Binance Pay)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Prices in USDT */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="text-amber-300 font-bold block">Precios de Membresía en USDT (Internacional):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">1 Mes (USDT):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBinance1Month}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBinance1Month: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">3 Meses (USDT):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBinance3Months}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBinance3Months: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">1 Año (USDT):</label>
                      <input
                        type="number"
                        value={qrSettings.priceBinance1Year}
                        onChange={(e) => setQrSettings(prev => ({ ...prev, priceBinance1Year: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: GLOBAL TIER ACCESS CONFIGURATION */}
      {/* ========================================================================= */}
      {adminView === 'permissions' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Configuración Global: Plan Gratis vs Plan de Pago</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Define qué secciones y herramientas ve un usuario gratuito frente a un usuario con membresía activa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Free Tier Config Card */}
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-400" /> Plan Gratis (Sin suscripción activa)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                  Acceso Bloqueado
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-zinc-400 font-semibold block">Pestañas permitidas en Gratis:</span>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={tierConfig.freePermissions.allowedTabs.includes('ai')}
                    onChange={(e) => {
                      const next = e.target.checked 
                        ? [...tierConfig.freePermissions.allowedTabs, 'ai' as TabId]
                        : tierConfig.freePermissions.allowedTabs.filter(t => t !== 'ai');
                      setTierConfig(prev => ({
                        ...prev,
                        freePermissions: { ...prev.freePermissions, allowedTabs: next }
                      }));
                    }}
                    className="rounded text-amber-500"
                  />
                  <span>Creación con IA (Google Flow 9 Min & Shorts POV)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={tierConfig.freePermissions.allowedTabs.includes('saved')}
                    onChange={(e) => {
                      const next = e.target.checked 
                        ? [...tierConfig.freePermissions.allowedTabs, 'saved' as TabId]
                        : tierConfig.freePermissions.allowedTabs.filter(t => t !== 'saved');
                      setTierConfig(prev => ({
                        ...prev,
                        freePermissions: { ...prev.freePermissions, allowedTabs: next }
                      }));
                    }}
                    className="rounded text-indigo-500"
                  />
                  <span>Temáticas Guardadas</span>
                </label>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
                  💡 <strong>Nota del Sistema:</strong> Aunque un usuario gratis tenga las pestañas bloqueadas, todas las temáticas guardadas previamente permanecen seguras en su base de datos.
                </div>
              </div>
            </div>

            {/* Paid Tier Config Card */}
            <div className="p-5 rounded-xl bg-zinc-950 border border-emerald-900/40 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" /> Membresía Pro Activa (Pagada)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Acceso Total
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-zinc-400 font-semibold block">Pestañas permitidas en Pro:</span>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-emerald-800/40">
                  <input
                    type="checkbox"
                    checked={tierConfig.paidPermissions.allowedTabs.includes('ai')}
                    onChange={(e) => {
                      const next = e.target.checked 
                        ? [...tierConfig.paidPermissions.allowedTabs, 'ai' as TabId]
                        : tierConfig.paidPermissions.allowedTabs.filter(t => t !== 'ai');
                      setTierConfig(prev => ({
                        ...prev,
                        paidPermissions: { ...prev.paidPermissions, allowedTabs: next }
                      }));
                    }}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-white font-medium">Creación con IA (Google Flow 9 Min & Shorts POV)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-indigo-800/40">
                  <input
                    type="checkbox"
                    checked={tierConfig.paidPermissions.allowedTabs.includes('saved')}
                    onChange={(e) => {
                      const next = e.target.checked 
                        ? [...tierConfig.paidPermissions.allowedTabs, 'saved' as TabId]
                        : tierConfig.paidPermissions.allowedTabs.filter(t => t !== 'saved');
                      setTierConfig(prev => ({
                        ...prev,
                        paidPermissions: { ...prev.paidPermissions, allowedTabs: next }
                      }));
                    }}
                    className="rounded text-indigo-500"
                  />
                  <span className="text-white font-medium">Temáticas Guardadas</span>
                </label>

                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={tierConfig.paidPermissions.canDownloadAudio}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        paidPermissions: { ...prev.paidPermissions, canDownloadAudio: e.target.checked }
                      }))}
                      className="rounded text-amber-500"
                    />
                    <span>Descarga de voz en off en formato Audio WAV (.wav)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={tierConfig.paidPermissions.canTranslateEnglish}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        paidPermissions: { ...prev.paidPermissions, canTranslateEnglish: e.target.checked }
                      }))}
                      className="rounded text-amber-500"
                    />
                    <span>Traducción cinematográfica al Inglés y Español</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveTierConfig}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración Global de Permisos</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: STEP-BY-STEP BUSINESS GUIDE FOR OLVIS */}
      {/* ========================================================================= */}
      {adminView === 'guide' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Guía Paso a Paso: Flujo de Cobro y Activación Directa
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Todo el flujo funciona sin necesidad de generar ni entregar códigos o claves de licencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-red-600/30 text-red-400 font-bold flex items-center justify-center text-xs">1</span>
              <h4 className="text-white font-bold text-sm">El usuario se registra con su Gmail</h4>
              <p className="text-zinc-400 leading-relaxed">
                El cliente entra a la plataforma y presiona <strong>"Registrarse a través de Gmail"</strong>. Al no tener plan pagado aún, su cuenta queda en el Plan Gratis con el generador bloqueado.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 font-bold flex items-center justify-center text-xs">2</span>
              <h4 className="text-white font-bold text-sm">Escanea tu QR y avisa su pago</h4>
              <p className="text-zinc-400 leading-relaxed">
                El usuario abre el modal de pago QR, escanea tu QR de Banco Unión / BCP o tu QR de Binance Pay, transfiere el monto y presiona <strong>"Avisar a Olvis que ya pagué"</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-400 font-bold flex items-center justify-center text-xs">3</span>
              <h4 className="text-white font-bold text-sm">Verificas el dinero y activas con 1 clic</h4>
              <p className="text-zinc-400 leading-relaxed">
                Abres tu banca móvil o Binance para confirmar la transferencia. En tu panel de admin presionas <strong>"Activar 1 Mes (30d)"</strong>, <strong>"Activar 3 Meses (90d)"</strong> o <strong>"Activar 1 Año (365d)"</strong>. Al instante el usuario tiene acceso completo a Creación IA y Guardados.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 font-bold flex items-center justify-center text-xs">4</span>
              <h4 className="text-white font-bold text-sm">Control total & Preservación de temáticas</h4>
              <p className="text-zinc-400 leading-relaxed">
                En la lista de usuarios ves cuántos días le quedan a cada cliente y puedes sumarle más días. Si alguien no paga o se vence su plan, se le quita el acceso al generador, pero <strong className="text-emerald-300">todas sus temáticas guardadas permanecen intactas en su cuenta de Gmail</strong> por si vuelve a pagar semanas o meses después.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL USER EDITING (In case of error or manual adjustment) */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <span>Modificación Manual de Usuario</span>
                </h3>
                <span className="text-xs text-zinc-400 font-mono">{editingUser.email}</span>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualUserEdit} className="space-y-4 text-xs">
              
              {/* Plan selection */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-bold">Tipo de Plan:</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as MembershipPlan)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                >
                  <option value="1_month">Plan 1 Mes (30 días)</option>
                  <option value="3_months">Plan 3 Meses (90 días)</option>
                  <option value="1_year">Plan 1 Año (365 días)</option>
                  <option value="free">Plan Gratis (Sin acceso a creación)</option>
                  <option value="lifetime">Permanente / Vitalicio</option>
                </select>
              </div>

              {/* Status selection */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-bold">Estado:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'expired' | 'suspended')}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                >
                  <option value="active">Activo (Habilitado)</option>
                  <option value="expired">Vencido (Bloqueado)</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>

              {/* Exact days setter */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-bold">
                  Días restantes exactos (Opcional - escribe cuántos días le quedan):
                </label>
                <input
                  type="number"
                  placeholder="Ej: 15, 30, 45, 90"
                  value={editExactDays}
                  onChange={(e) => setEditExactDays(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              {/* Date picker */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-bold">
                  O fijar fecha exacta de vencimiento:
                </label>
                <input
                  type="date"
                  value={editCustomDate}
                  onChange={(e) => setEditCustomDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Protección de Base de Datos</span>
                </div>
                <p>
                  Cualquier ajuste de días o retiro del plan mantiene intactas todas las temáticas y proyectos guardados del usuario en su cuenta de Gmail.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleRevokeUserPlan(editingUser);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Quitar Plan (Poner en Gratis)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
