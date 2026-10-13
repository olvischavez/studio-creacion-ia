import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, TabId, ADMIN_EMAIL, DEFAULT_TIER_CONFIG } from '../types/membership';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from '../lib/firebase';

interface MembershipContextType {
  currentUser: UserProfile | null;
  isMasterAdmin: boolean;
  isLoading: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginModalMode: 'login' | 'register';
  setLoginModalMode: (mode: 'login' | 'register') => void;
  openLoginModal: (mode?: 'login' | 'register') => void;
  qrPaymentModalOpen: boolean;
  setQrPaymentModalOpen: (open: boolean) => void;
  login: (email: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasAccessToTab: (tabId: TabId) => boolean;
  hasFeature: (feature: 'canDownloadAudio' | 'canTranslateEnglish' | 'canExportScripts') => boolean;
  daysRemaining: number | null;
  refreshUser: () => Promise<void>;
  firebaseConnected: boolean;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

const LOCAL_STORAGE_EMAIL_KEY = 'olvis_bolt_current_user_email';

export const MembershipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [qrPaymentModalOpen, setQrPaymentModalOpen] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  const openLoginModal = (mode: 'login' | 'register' = 'login') => {
    setLoginModalMode(mode);
    setLoginModalOpen(true);
  };

  // Sync user profile directly from Firestore and local database
  const fetchUserData = async (email: string, name?: string, photoURL?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    // Base profile template for this user
    let userProfile: UserProfile = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      photoURL: photoURL || undefined,
      plan: isAdmin ? 'admin' : 'free',
      status: 'active',
      expiresAt: null,
      permissions: isAdmin ? {
        allowedTabs: ['ai', 'saved', 'admin'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      } : {
        allowedTabs: [],
        canDownloadAudio: false,
        canTranslateEnglish: false,
        canExportScripts: false,
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // 1. Fetch from / Sync with Firebase Firestore directly
    try {
      const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const userDocRef = doc(db, 'users', docId);

      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const firestoreData = userSnap.data() as UserProfile;
        userProfile = {
          ...userProfile,
          ...firestoreData,
          email: cleanEmail,
          photoURL: photoURL || firestoreData.photoURL || userProfile.photoURL,
        };
        // Guarantee master admin privileges for Olvis
        if (isAdmin) {
          userProfile.plan = 'admin';
          userProfile.status = 'active';
          userProfile.permissions = {
            allowedTabs: ['ai', 'saved', 'admin'],
            canDownloadAudio: true,
            canTranslateEnglish: true,
            canExportScripts: true,
          };
        }
      } else {
        // Register new user document into Firestore
        await setDoc(userDocRef, userProfile, { merge: true });
      }
    } catch (firestoreErr) {
      console.warn('Firestore direct user sync notice:', firestoreErr);
    }

    // 2. Set current user state & local storage immediately
    setCurrentUser(userProfile);
    localStorage.setItem(LOCAL_STORAGE_EMAIL_KEY, cleanEmail);

    // 3. Background sync with backend API if running
    try {
      fetch('/api/memberships/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name, photoURL }),
      }).catch(() => {});
    } catch {}

    return { success: true };
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        fetchUserData(firebaseUser.email, firebaseUser.displayName || undefined, firebaseUser.photoURL || undefined);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Initial load
  useEffect(() => {
    const savedEmail = localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY);
    if (savedEmail) {
      fetchUserData(savedEmail).finally(() => setIsLoading(false));
    } else {
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, []);

  // Real-time Firestore listener for active user profile changes
  useEffect(() => {
    if (!currentUser?.email) return;

    const docId = currentUser.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDocRef = doc(db, 'users', docId);

    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const liveData = snap.data() as Partial<UserProfile>;
        setCurrentUser(prev => prev ? { ...prev, ...liveData } : null);
      }
    }, (err) => {
      console.warn('Real-time Firestore user listener notice:', err);
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  // Standard Login (strictly Gmail allowed)
  const login = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isGmail = /@gmail\.com$|@googlemail\.com$/i.test(cleanEmail) || cleanEmail === ADMIN_EMAIL.toLowerCase();
    if (!isGmail) {
      return { success: false, message: 'Solo está permitido el acceso y registro con cuentas de Gmail (@gmail.com).' };
    }
    setIsLoading(true);
    const result = await fetchUserData(cleanEmail, name);
    setIsLoading(false);
    return result;
  };

  // Google Login via Firebase Auth (strictly Gmail allowed)
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const isGmail = /@gmail\.com$|@googlemail\.com$/i.test(cleanEmail) || cleanEmail === ADMIN_EMAIL.toLowerCase();
        if (!isGmail) {
          await signOut(auth);
          setIsLoading(false);
          return { success: false, message: 'Solo está permitido registrarse e iniciar sesión con cuentas de Gmail (@gmail.com).' };
        }
        const res = await fetchUserData(cleanEmail, user.displayName || undefined, user.photoURL || undefined);
        setIsLoading(false);
        return res;
      }
      setIsLoading(false);
      return { success: false, message: 'No se recibió correo de Google' };
    } catch (error: any) {
      setIsLoading(false);
      console.warn('Firebase Google Auth popup error, falling back:', error);
      let errorMsg = error.message || 'Error al iniciar sesión con Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Ventana de Google cerrada antes de seleccionar tu cuenta.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'Debes habilitar el proveedor "Google" en la pestaña Authentication de tu Firebase Console.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'El dominio localhost no está en los dominios autorizados de Firebase Authentication.';
      }
      return { 
        success: false, 
        message: errorMsg 
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut notice:', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_EMAIL_KEY);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (currentUser?.email) {
      await fetchUserData(currentUser.email, currentUser.name, currentUser.photoURL);
    }
  };

  const isMasterAdmin = Boolean(
    currentUser && currentUser.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const hasAccessToTab = (tabId: TabId): boolean => {
    if (isMasterAdmin) return true;
    if (tabId === 'admin') return false;
    // Without user, no access to protected tabs
    if (!currentUser) return false;
    // User must have an active plan or status
    if (currentUser.status !== 'active') return false;
    if (currentUser.plan === 'free') return false;
    // If user's plan is expired by date, block access
    if (currentUser.expiresAt && currentUser.plan !== 'lifetime') {
      const expTime = new Date(currentUser.expiresAt).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        return false;
      }
    }
    return (currentUser.permissions?.allowedTabs || []).includes(tabId);
  };

  const hasFeature = (feature: 'canDownloadAudio' | 'canTranslateEnglish' | 'canExportScripts'): boolean => {
    if (isMasterAdmin) return true;
    if (!currentUser || currentUser.status !== 'active' || currentUser.plan === 'free') return false;
    if (currentUser.expiresAt && currentUser.plan !== 'lifetime') {
      const expTime = new Date(currentUser.expiresAt).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        return false;
      }
    }
    return Boolean(currentUser.permissions?.[feature]);
  };

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (currentUser?.expiresAt) {
    const diff = new Date(currentUser.expiresAt).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <MembershipContext.Provider
      value={{
        currentUser,
        isMasterAdmin,
        isLoading,
        loginModalOpen,
        setLoginModalOpen,
        loginModalMode,
        setLoginModalMode,
        openLoginModal,
        qrPaymentModalOpen,
        setQrPaymentModalOpen,
        login,
        loginWithGoogle,
        logout,
        hasAccessToTab,
        hasFeature,
        daysRemaining,
        refreshUser,
        firebaseConnected,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};
