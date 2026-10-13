import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  UserProfile, 
  LicenseKey, 
  GlobalTierConfig, 
  MembershipPlan,
  QRPaymentSettings,
  PendingPaymentNotification,
  ADMIN_EMAIL,
  DEFAULT_TIER_CONFIG,
  DEFAULT_QR_SETTINGS
} from '../src/types/membership.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'memberships.json');

export interface UserSavedProject {
  id: string;
  type: 'strategy' | 'flow_doc' | 'pov_short';
  title: string;
  timestamp: string;
  data: any;
}

export interface MembershipDatabase {
  users: Record<string, UserProfile>;
  keys: LicenseKey[];
  tierConfig: GlobalTierConfig;
  qrSettings: QRPaymentSettings;
  pendingPayments?: PendingPaymentNotification[];
  savedProjects?: Record<string, UserSavedProject[]>;
}

// In-memory cache
let dbCache: MembershipDatabase | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem in Vercel or restricted environment
  }
}

function getInitialDatabase(): MembershipDatabase {
  const now = new Date().toISOString();
  
  // Create default admin user (Olvis Bolt)
  const adminUser: UserProfile = {
    email: ADMIN_EMAIL,
    name: 'Olvis Bolt (Propietario)',
    plan: 'admin',
    status: 'active',
    expiresAt: null, // Never expires
    permissions: {
      allowedTabs: ['ai', 'saved', 'admin'],
      canDownloadAudio: true,
      canTranslateEnglish: true,
      canExportScripts: true,
    },
    createdAt: now,
    lastLogin: now,
  };

  return {
    users: {
      [ADMIN_EMAIL.toLowerCase()]: adminUser,
    },
    keys: [],
    tierConfig: DEFAULT_TIER_CONFIG,
    qrSettings: DEFAULT_QR_SETTINGS,
    pendingPayments: [],
    savedProjects: {},
  };
}

const TMP_DB_FILE = path.join('/tmp', 'memberships.json');

export function loadMembershipDb(): MembershipDatabase {
  if (dbCache) return dbCache;

  ensureDataDir();

  // Try DB_FILE first, then /tmp/memberships.json
  const fileToRead = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(TMP_DB_FILE) ? TMP_DB_FILE : null);

  if (fileToRead) {
    try {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      dbCache = JSON.parse(content);
      // Ensure admin exists with permanent unrestricted Propietario access
      if (dbCache) {
        dbCache.users[ADMIN_EMAIL.toLowerCase()] = {
          email: ADMIN_EMAIL,
          name: 'Olvis Bolt (Propietario)',
          plan: 'admin',
          status: 'active',
          expiresAt: null,
          permissions: {
            allowedTabs: ['ai', 'saved', 'admin'],
            canDownloadAudio: true,
            canTranslateEnglish: true,
            canExportScripts: true,
          },
          createdAt: dbCache.users[ADMIN_EMAIL.toLowerCase()]?.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          photoURL: dbCache.users[ADMIN_EMAIL.toLowerCase()]?.photoURL,
        };

        if (!dbCache.tierConfig || !dbCache.tierConfig.freePermissions) {
          dbCache.tierConfig = DEFAULT_TIER_CONFIG;
        } else {
          // Normalize to modern tab ids
          dbCache.tierConfig.freePermissions.allowedTabs = (dbCache.tierConfig.freePermissions.allowedTabs || []).filter((t: any) => t === 'ai' || t === 'saved');
          dbCache.tierConfig.paidPermissions.allowedTabs = ['ai', 'saved'];
        }

        if (!dbCache.qrSettings) {
          dbCache.qrSettings = DEFAULT_QR_SETTINGS;
        }
        if (!dbCache.pendingPayments) {
          dbCache.pendingPayments = [];
        }
        if (!dbCache.savedProjects) {
          dbCache.savedProjects = {};
        }
        dbCache.keys = [];
      }
      return dbCache!;
    } catch (e) {
      console.warn('Could not read memberships.json, creating new database:', e);
    }
  }

  dbCache = getInitialDatabase();
  saveMembershipDb(dbCache);
  return dbCache;
}

export function getQrSettings(): QRPaymentSettings {
  const db = loadMembershipDb();
  return db.qrSettings || DEFAULT_QR_SETTINGS;
}

export function updateQrSettings(settings: Partial<QRPaymentSettings>): QRPaymentSettings {
  const db = loadMembershipDb();
  db.qrSettings = {
    ...(db.qrSettings || DEFAULT_QR_SETTINGS),
    ...settings,
  };
  saveMembershipDb(db);
  return db.qrSettings;
}

// Payment notifications for Bolivia QR & Binance
export function getPendingPayments(): PendingPaymentNotification[] {
  const db = loadMembershipDb();
  return db.pendingPayments || [];
}

export function createPaymentNotification(data: {
  email: string;
  name?: string;
  plan: MembershipPlan;
  amount: string;
  currency: string;
  method: 'qr_bolivia' | 'binance';
  reference?: string;
  note?: string;
}): PendingPaymentNotification {
  const db = loadMembershipDb();
  if (!db.pendingPayments) db.pendingPayments = [];

  const cleanEmail = (data.email || '').trim().toLowerCase();
  const newNotification: PendingPaymentNotification = {
    id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    email: cleanEmail,
    name: data.name || cleanEmail.split('@')[0],
    plan: data.plan,
    amount: data.amount,
    currency: data.currency,
    method: data.method,
    reference: data.reference?.trim() || '',
    note: data.note?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.pendingPayments.unshift(newNotification);
  saveMembershipDb(db);
  return newNotification;
}

export function approvePaymentNotification(
  id: string,
  overridePlan?: MembershipPlan,
  overrideDays?: number
): { success: boolean; message: string; user?: UserProfile } {
  const db = loadMembershipDb();
  if (!db.pendingPayments) db.pendingPayments = [];

  const notif = db.pendingPayments.find(p => p.id === id);
  if (!notif) {
    return { success: false, message: 'Aviso de pago no encontrado.' };
  }

  notif.status = 'approved';
  notif.reviewedAt = new Date().toISOString();

  // Activate the user's plan automatically
  const cleanEmail = notif.email.trim().toLowerCase();
  let user = db.users[cleanEmail];

  const targetPlan: MembershipPlan = overridePlan || notif.plan || '1_month';
  const durationDays = overrideDays && overrideDays > 0 
    ? overrideDays 
    : (targetPlan === '1_month' ? 30 : targetPlan === '3_months' ? 90 : targetPlan === '1_year' ? 365 : 30);

  const now = new Date();
  let baseDate = now;
  // If user already had an active plan that hasn't expired yet, accumulate days
  if (user && user.expiresAt && new Date(user.expiresAt) > now) {
    baseDate = new Date(user.expiresAt);
  }
  const expDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  if (!user) {
    user = {
      email: cleanEmail,
      name: notif.name || cleanEmail.split('@')[0],
      plan: targetPlan,
      status: 'active',
      expiresAt: expDate.toISOString(),
      permissions: {
        allowedTabs: ['ai', 'saved'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      },
      createdAt: now.toISOString(),
      lastLogin: now.toISOString(),
    };
    db.users[cleanEmail] = user;
  } else {
    user.plan = targetPlan;
    user.status = 'active';
    user.expiresAt = expDate.toISOString();
    user.permissions = {
      allowedTabs: ['ai', 'saved'],
      canDownloadAudio: true,
      canTranslateEnglish: true,
      canExportScripts: true,
    };
    db.users[cleanEmail] = user;
  }

  saveMembershipDb(db);
  return { success: true, message: `Pago aprobado. Plan ${targetPlan} activado para ${cleanEmail} por ${durationDays} días. Acceso habilitado a Creación con IA y Temáticas Guardadas.`, user };
}

export function rejectPaymentNotification(id: string): { success: boolean } {
  const db = loadMembershipDb();
  if (!db.pendingPayments) db.pendingPayments = [];

  const notif = db.pendingPayments.find(p => p.id === id);
  if (notif) {
    notif.status = 'rejected';
    notif.reviewedAt = new Date().toISOString();
    saveMembershipDb(db);
  }
  return { success: true };
}

export function saveMembershipDb(db: MembershipDatabase) {
  dbCache = db;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    // If running on Vercel or read-only filesystem, write to /tmp
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch {
      // Ignored in purely ephemeral serverless runtime
    }
  }
}

// User lookup or creation (Free tier by default, unless admin)
export function getOrCreateUser(email: string, name?: string, photoURL?: string): UserProfile {
  const db = loadMembershipDb();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    const adminUser = db.users[cleanEmail] || {
      email: ADMIN_EMAIL,
      name: 'Olvis Bolt (Propietario)',
      plan: 'admin',
      status: 'active',
      expiresAt: null,
      permissions: {
        allowedTabs: ['ai', 'saved', 'admin'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    if (photoURL) adminUser.photoURL = photoURL;
    adminUser.permissions.allowedTabs = ['ai', 'saved', 'admin'];
    adminUser.lastLogin = new Date().toISOString();
    db.users[cleanEmail] = adminUser;
    saveMembershipDb(db);
    return adminUser;
  }

  let user = db.users[cleanEmail];
  const now = new Date();

  if (!user) {
    // New user starts on Free tier
    user = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      photoURL: photoURL || undefined,
      plan: 'free',
      status: 'active',
      expiresAt: null,
      permissions: { ...db.tierConfig.freePermissions },
      createdAt: now.toISOString(),
      lastLogin: now.toISOString(),
    };
    db.users[cleanEmail] = user;
    saveMembershipDb(db);
  } else {
    if (photoURL) user.photoURL = photoURL;
    if (name && !user.name) user.name = name;
    // Check if membership expired
    if (user.expiresAt && user.plan !== 'free' && user.plan !== 'lifetime' && user.plan !== 'admin') {
      const expDate = new Date(user.expiresAt);
      if (expDate < now) {
        user.status = 'expired';
        user.permissions = { ...db.tierConfig.freePermissions };
      }
    }
    user.lastLogin = now.toISOString();
    db.users[cleanEmail] = user;
    saveMembershipDb(db);
  }

  return user;
}

// Activate a license key for a user
export function activateKeyForUser(email: string, rawKey: string): { success: boolean; message: string; user?: UserProfile } {
  const db = loadMembershipDb();
  const cleanEmail = email.trim().toLowerCase();
  const cleanKey = rawKey.trim().toUpperCase();

  const foundKey = db.keys.find(k => k.key.toUpperCase() === cleanKey);

  if (!foundKey) {
    return { success: false, message: 'Código de licencia no válido o inexistente.' };
  }

  if (foundKey.isUsed) {
    return { success: false, message: `Este código ya fue canjeado por ${foundKey.usedByEmail || 'otro usuario'}.` };
  }

  // Mark key as used
  const now = new Date();
  foundKey.isUsed = true;
  foundKey.usedByEmail = cleanEmail;
  foundKey.usedAt = now.toISOString();

  // Update user membership
  let user = db.users[cleanEmail];
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + foundKey.durationDays);

  if (!user) {
    user = {
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      plan: foundKey.plan,
      status: 'active',
      expiresAt: foundKey.plan === 'lifetime' ? null : expDate.toISOString(),
      permissions: {
        allowedTabs: ['ai', 'saved'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      },
      activatedKey: foundKey.key,
      createdAt: now.toISOString(),
      lastLogin: now.toISOString(),
    };
    db.users[cleanEmail] = user;
  } else {
    user.plan = foundKey.plan;
    user.status = 'active';
    user.expiresAt = foundKey.plan === 'lifetime' ? null : expDate.toISOString();
    user.permissions = {
      allowedTabs: ['ai', 'saved'],
      canDownloadAudio: true,
      canTranslateEnglish: true,
      canExportScripts: true,
    };
    user.activatedKey = foundKey.key;
    db.users[cleanEmail] = user;
  }

  saveMembershipDb(db);

  const planName = foundKey.plan === '1_month' ? '1 Mes' : foundKey.plan === '3_months' ? '3 Meses' : foundKey.plan === '1_year' ? '1 Año' : 'Vitalicio';
  return { 
    success: true, 
    message: `¡Membresía (${planName}) activada con éxito para ${cleanEmail}! Tienes acceso completo a la creación con IA y descarga de audios.`,
    user 
  };
}

// Generate new license keys
export function generateKeys(plan: MembershipPlan, count: number, notes?: string): LicenseKey[] {
  const db = loadMembershipDb();
  const newKeys: LicenseKey[] = [];
  const now = new Date().toISOString();

  const planPrefix = plan === '1_month' ? '1M' : plan === '3_months' ? '3M' : plan === '1_year' ? '1Y' : 'VIP';
  const duration = plan === '1_month' ? 30 : plan === '3_months' ? 90 : plan === '1_year' ? 365 : 36500;

  for (let i = 0; i < count; i++) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const keyStr = `BOLT-${planPrefix}-${randomHex}`;
    const keyObj: LicenseKey = {
      key: keyStr,
      plan,
      durationDays: duration,
      isUsed: false,
      createdAt: now,
      notes: notes || `Generado para ${planPrefix}`,
    };
    newKeys.push(keyObj);
    db.keys.unshift(keyObj);
  }

  saveMembershipDb(db);
  return newKeys;
}

// Admin: Edit a user's plan or status (Manual extension, exact days, or revoke)
export function adminUpdateUser(email: string, updates: any): UserProfile | null {
  const db = loadMembershipDb();
  const cleanEmail = email.trim().toLowerCase();
  const user = db.users[cleanEmail];

  if (!user) return null;

  const now = new Date();

  // 1. If explicitly revoking or setting plan to free
  if (updates.revokePlan || updates.plan === 'free') {
    user.plan = 'free';
    user.status = 'expired';
    user.expiresAt = null;
    user.permissions = { ...db.tierConfig.freePermissions };
    db.users[cleanEmail] = user;
    saveMembershipDb(db);
    return user;
  }

  // 2. If extending by N days (+30, +90, +365, etc.)
  if (typeof updates.extendDays === 'number' && updates.extendDays > 0) {
    let baseDate = now;
    if (user.expiresAt && new Date(user.expiresAt) > now) {
      baseDate = new Date(user.expiresAt);
    }
    const newExp = new Date(baseDate.getTime() + updates.extendDays * 24 * 60 * 60 * 1000);
    user.expiresAt = newExp.toISOString();
    user.status = 'active';
    if (!user.plan || user.plan === 'free') {
      user.plan = updates.extendDays >= 365 ? '1_year' : updates.extendDays >= 90 ? '3_months' : '1_month';
    }
    user.permissions = {
      allowedTabs: ['ai', 'saved'],
      canDownloadAudio: true,
      canTranslateEnglish: true,
      canExportScripts: true,
    };
  }

  // 3. If setting exact days remaining (manual modification in case of error)
  if (typeof updates.setExactDays === 'number') {
    if (updates.setExactDays <= 0) {
      user.plan = 'free';
      user.status = 'expired';
      user.expiresAt = null;
      user.permissions = { ...db.tierConfig.freePermissions };
    } else {
      const newExp = new Date(now.getTime() + updates.setExactDays * 24 * 60 * 60 * 1000);
      user.expiresAt = newExp.toISOString();
      user.status = 'active';
      if (!user.plan || user.plan === 'free') {
        user.plan = updates.setExactDays >= 365 ? '1_year' : updates.setExactDays >= 90 ? '3_months' : '1_month';
      }
      user.permissions = {
        allowedTabs: ['ai', 'saved'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      };
    }
  }

  // 4. Changing specific plan
  if (updates.plan && updates.plan !== 'free') {
    user.plan = updates.plan;
    if (updates.plan === 'admin' || updates.plan === 'lifetime') {
      user.permissions = {
        allowedTabs: ['ai', 'saved', 'admin'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      };
      user.expiresAt = null;
      user.status = 'active';
    } else {
      user.permissions = {
        allowedTabs: ['ai', 'saved'],
        canDownloadAudio: true,
        canTranslateEnglish: true,
        canExportScripts: true,
      };
      if (!user.expiresAt || new Date(user.expiresAt) <= now) {
        const days = updates.plan === '1_month' ? 30 : updates.plan === '3_months' ? 90 : 365;
        user.expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
        user.status = 'active';
      }
    }
  }

  // 5. Explicit ISO expiration date
  if (updates.expiresAt !== undefined) {
    user.expiresAt = updates.expiresAt;
    if (updates.expiresAt) {
      const expDate = new Date(updates.expiresAt);
      if (expDate > now) {
        user.status = 'active';
        user.permissions = {
          allowedTabs: ['ai', 'saved'],
          canDownloadAudio: true,
          canTranslateEnglish: true,
          canExportScripts: true,
        };
      } else {
        user.status = 'expired';
        user.permissions = { ...db.tierConfig.freePermissions };
      }
    }
  }

  if (updates.status) user.status = updates.status;
  if (updates.name) user.name = updates.name;
  if (updates.permissions) user.permissions = { ...user.permissions, ...updates.permissions };

  db.users[cleanEmail] = user;
  saveMembershipDb(db);
  return user;
}

// Admin: Delete a user
export function adminDeleteUser(email: string): boolean {
  const db = loadMembershipDb();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return false; // cannot delete owner

  if (db.users[cleanEmail]) {
    delete db.users[cleanEmail];
    saveMembershipDb(db);
    return true;
  }
  return false;
}

// Admin: Delete a key
export function adminDeleteKey(key: string): boolean {
  const db = loadMembershipDb();
  const index = db.keys.findIndex(k => k.key === key);
  if (index !== -1) {
    db.keys.splice(index, 1);
    saveMembershipDb(db);
    return true;
  }
  return false;
}

// User persistent database for saved themes/projects
export function getUserSavedProjects(email: string): UserSavedProject[] {
  const db = loadMembershipDb();
  if (!db.savedProjects) db.savedProjects = {};
  const cleanEmail = (email || '').trim().toLowerCase();
  return db.savedProjects[cleanEmail] || [];
}

export function saveUserProject(email: string, item: UserSavedProject): UserSavedProject[] {
  const db = loadMembershipDb();
  if (!db.savedProjects) db.savedProjects = {};
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return [];
  
  const list = db.savedProjects[cleanEmail] || [];
  const existingIdx = list.findIndex(i => i.title === item.title && i.type === item.type);
  if (existingIdx >= 0) {
    list[existingIdx] = item;
  } else {
    list.unshift(item);
  }
  
  db.savedProjects[cleanEmail] = list;
  saveMembershipDb(db);
  return list;
}

export function deleteUserProject(email: string, id: string): UserSavedProject[] {
  const db = loadMembershipDb();
  if (!db.savedProjects) db.savedProjects = {};
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return [];

  const list = (db.savedProjects[cleanEmail] || []).filter(i => i.id !== id);
  db.savedProjects[cleanEmail] = list;
  saveMembershipDb(db);
  return list;
}
