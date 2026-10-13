export type MembershipPlan = 'free' | '1_month' | '3_months' | '1_year' | 'lifetime' | 'admin';

export type TabId = 'ai' | 'saved' | 'admin';

export interface UserPermissions {
  allowedTabs: TabId[];
  canDownloadAudio: boolean;
  canTranslateEnglish: boolean;
  canExportScripts: boolean;
}

export interface UserProfile {
  email: string;
  name?: string;
  photoURL?: string;
  plan: MembershipPlan;
  status: 'active' | 'expired' | 'suspended';
  expiresAt: string | null; // ISO string, null for lifetime or admin
  permissions: UserPermissions;
  activatedKey?: string;
  createdAt: string;
  lastLogin: string;
}

export interface LicenseKey {
  key: string;
  plan: MembershipPlan;
  durationDays: number;
  isUsed: boolean;
  usedByEmail?: string;
  usedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface GlobalTierConfig {
  freePermissions: UserPermissions;
  paidPermissions: UserPermissions;
}

export interface QRPaymentSettings {
  enabled: boolean;
  // Bolivia QR config
  boliviaQrEnabled: boolean;
  boliviaBankName: string;
  boliviaAccountHolder: string;
  boliviaAccountNumber: string;
  boliviaAccountCi: string;
  boliviaQrImageUrl?: string;
  priceBs1Month: number;
  priceBs3Months: number;
  priceBs1Year: number;
  priceUsd1Month: number;
  priceUsd3Months: number;
  priceUsd1Year: number;

  // Binance Internacional QR config
  binanceEnabled: boolean;
  binancePayId: string;
  binanceUsdtAddress: string;
  binanceNetwork: string;
  binanceQrImageUrl?: string;
  priceBinance1Month: number;
  priceBinance3Months: number;
  priceBinance1Year: number;
}

export interface PendingPaymentNotification {
  id: string;
  email: string;
  name?: string;
  plan: MembershipPlan;
  amount: string;
  currency: string;
  method: 'qr_bolivia' | 'binance';
  reference?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}

export const ADMIN_EMAIL = 'olvischavezmustafa@gmail.com';

export const DEFAULT_QR_SETTINGS: QRPaymentSettings = {
  enabled: true,
  boliviaQrEnabled: true,
  boliviaBankName: 'Banco Unión / BNB / BCP (Cualquier Banco con QR Simple)',
  boliviaAccountHolder: 'Olvis Chávez Mustafa',
  boliviaAccountNumber: 'Cuenta Corriente / Ahorros',
  boliviaAccountCi: 'Santa Cruz, Bolivia',
  boliviaQrImageUrl: '',
  priceBs1Month: 70,
  priceBs3Months: 175,
  priceBs1Year: 550,
  priceUsd1Month: 10,
  priceUsd3Months: 25,
  priceUsd1Year: 80,

  binanceEnabled: true,
  binancePayId: '849201934',
  binanceUsdtAddress: 'TYDzsYq7bVzM4xxxxxxxxxxxxxxTRC20',
  binanceNetwork: 'USDT (TRC20 / BEP20 / Binance Pay)',
  binanceQrImageUrl: '',
  priceBinance1Month: 10,
  priceBinance3Months: 25,
  priceBinance1Year: 80,
};

export const DEFAULT_TIER_CONFIG: GlobalTierConfig = {
  freePermissions: {
    allowedTabs: [], // Free/unpaid users have NO access to 'ai' or 'saved' until activated manually by admin
    canDownloadAudio: false,
    canTranslateEnglish: false,
    canExportScripts: false,
  },
  paidPermissions: {
    allowedTabs: ['ai', 'saved'], // Activated users have full access to both tabs
    canDownloadAudio: true,
    canTranslateEnglish: true,
    canExportScripts: true,
  }
};
