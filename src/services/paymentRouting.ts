import { CGA_WHATSAPP_SUPPORT_NUMBER } from '../components/WhatsAppCommunitySlider';
import { COUNTRIES } from '../constants/countries';

/**
 * Payment Routing & Region-Based Method Determination Service
 * 
 * Strict Scope:
 * - Nigeria: Bank Transfer (Opay & MONIEPOINT) + Crypto (Bitcoin, USDT TRC20)
 * - All other countries: Crypto only (Bitcoin, USDT TRC20)
 * - USDT ERC20 is strictly excluded from all payment flows.
 */

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const NIGERIA_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'opay',
    bankName: 'Opay',
    accountNumber: '6550002094',
    accountName: 'TAVARI WAVE NETWORK/CGA TRADES'
  },
  {
    id: 'moniepoint',
    bankName: 'MONIEPOINT',
    accountNumber: '9132530055',
    accountName: 'TAVARI WAVE NETWORK/CGA TRADES'
  }
];

export const CRYPTO_PAYMENT_OPTIONS = {
  usdt: {
    id: 'usdt',
    name: 'USDT (TRC20)',
    network: 'TRON (TRC20)',
    symbol: 'USDT',
    address: 'TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG',
    warning: 'Please send only USDT TRC-20 to this address. Transferring to any other network will result in permanent loss of your funds.'
  },
  btc: {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    network: 'Native Bitcoin Network',
    symbol: 'BTC',
    address: 'bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t',
    warning: 'Please send only Bitcoin (BTC) to this address. Transferring to any other network will result in permanent loss of your funds.'
  }
} as const;

export type AllowedCryptoType = keyof typeof CRYPTO_PAYMENT_OPTIONS;

/**
 * Deterministically checks if a country or country code qualifies as Nigeria.
 * Strictly matches Nigeria and excludes all other countries.
 */
export function isNigeriaRegion(country?: string | null, code?: string | null): boolean {
  if (!country && !code) return false;
  const c = (country || '').trim().toLowerCase();
  const cd = (code || '').trim().toUpperCase();

  if (cd === 'NG' || cd === 'NGA') return true;
  if (c === 'nigeria' || c === 'the federal republic of nigeria' || c === 'ng' || c === 'nga') return true;

  return false;
}

/**
 * Authoritative check based strictly on the user's stored/verified account country.
 * MUST NOT be overridden by phone number dial codes or IP geolocation.
 * 
 * Rules:
 * - If user's stored account country is Nigeria: return true.
 * - For ANY other registered country (e.g. UK, USA, Singapore, Canada, Australia, Kuwait, etc.): return false.
 * - Phone numbers must NEVER override account country.
 * - IP geolocation must NEVER override stored account country.
 */
export function isAccountCountryNigeria(profile?: any | null): boolean {
  if (!profile) return false;

  const country = (
    profile.country || 
    profile.countryName || 
    profile.registered_country || 
    profile.account_country || 
    profile.country_name || 
    ''
  ).trim().toLowerCase();

  const code = (
    profile.country_code || 
    profile.countryCode || 
    profile.registered_country_code || 
    profile.isoCode || 
    ''
  ).trim().toUpperCase();

  // If user has a registered country name, strictly evaluate it
  if (country) {
    return (
      country === 'nigeria' ||
      country === 'the federal republic of nigeria' ||
      country === 'ng' ||
      country === 'nga'
    );
  }

  // If only country code is stored
  if (code) {
    return code === 'NG' || code === 'NGA';
  }

  // Any non-Nigeria or unspecified account is NOT Nigeria (Crypto only)
  return false;
}

export interface PaymentEligibilityResponse {
  country: string;
  countryCode: string;
  isNigeria: boolean;
  availableMethods: ('bank' | 'crypto')[];
  bankAccounts: BankAccount[];
  cryptoOptions: typeof CRYPTO_PAYMENT_OPTIONS;
}

/**
 * Fetches server-verified payment eligibility for the authenticated user or location.
 * Falls back to deterministic local check if network is slow or offline.
 */
export async function fetchPaymentEligibility(
  token?: string | null,
  fallbackCountry?: string | null,
  fallbackCode?: string | null
): Promise<PaymentEligibilityResponse> {
  const localIsNigeria = isNigeriaRegion(fallbackCountry, fallbackCode);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `/api/payment/eligibility?country=${encodeURIComponent(fallbackCountry || '')}&code=${encodeURIComponent(fallbackCode || '')}`;
    const res = await fetch(url, { headers });

    if (res.ok) {
      const data = await res.json();
      return {
        country: data.country || (localIsNigeria ? 'Nigeria' : fallbackCountry || 'United States'),
        countryCode: data.countryCode || (localIsNigeria ? 'NG' : fallbackCode || 'US'),
        isNigeria: !!data.isNigeria,
        availableMethods: data.isNigeria ? ['bank', 'crypto'] : ['crypto'],
        bankAccounts: data.isNigeria ? NIGERIA_BANK_ACCOUNTS : [],
        cryptoOptions: CRYPTO_PAYMENT_OPTIONS
      };
    }
  } catch (err) {
    console.warn("[PaymentRouting] Server eligibility fetch error, using deterministic local evaluation:", err);
  }

  return {
    country: localIsNigeria ? 'Nigeria' : fallbackCountry || 'Global',
    countryCode: localIsNigeria ? 'NG' : fallbackCode || 'GL',
    isNigeria: localIsNigeria,
    availableMethods: localIsNigeria ? ['bank', 'crypto'] : ['crypto'],
    bankAccounts: localIsNigeria ? NIGERIA_BANK_ACCOUNTS : [],
    cryptoOptions: CRYPTO_PAYMENT_OPTIONS
  };
}

/**
 * Non-Nigeria Bank Transfer Request WhatsApp Configuration
 * Authoritative single source of truth from Home floating WhatsApp button
 */
export const WHATSAPP_BANK_REQUEST_NUMBER_CLEAN = CGA_WHATSAPP_SUPPORT_NUMBER;
export const WHATSAPP_BANK_REQUEST_PHONE = `+${CGA_WHATSAPP_SUPPORT_NUMBER}`;

export function formatTransferAmount(amount: number | string): string {
  if (typeof amount === 'number' && !isNaN(amount)) {
    if (Number.isInteger(amount)) {
      return amount.toLocaleString('en-US');
    }
    const decStr = String(amount).split('.')[1] || '';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: Math.min(2, decStr.length),
      maximumFractionDigits: Math.max(2, decStr.length)
    });
  }
  const clean = String(amount ?? '').trim().replace(/^\$/, '').replace(/,/g, '');
  const num = Number(clean);
  if (!isNaN(num) && clean !== '' && num > 0) {
    if (Number.isInteger(num) && !clean.includes('.')) {
      return num.toLocaleString('en-US');
    }
    const decStr = clean.split('.')[1] || '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decStr.length || 2,
      maximumFractionDigits: Math.max(2, decStr.length)
    });
  }
  return String(amount ?? '').trim().replace(/^\$/, '');
}

/**
 * Resolves the user's stored/verified account country name using the same
 * authoritative profile fields used by isAccountCountryNigeria.
 * Never uses IP location, browser location, phone dial code, or temporary signup state.
 */
export function getAccountCountryName(profile?: any | null): string {
  if (!profile) return '';

  const rawCountry = String(
    profile.country ||
    profile.countryName ||
    profile.registered_country ||
    profile.account_country ||
    profile.country_name ||
    ''
  ).trim();

  if (rawCountry) {
    const upper = rawCountry.toUpperCase();
    if (rawCountry.length === 2) {
      const byCode = COUNTRIES.find(c => c.code.toUpperCase() === upper);
      if (byCode) return byCode.name;
    }
    const byName = COUNTRIES.find(c => c.name.toLowerCase() === rawCountry.toLowerCase());
    if (byName) return byName.name;
    return rawCountry;
  }

  const rawCode = String(
    profile.country_code ||
    profile.countryCode ||
    profile.registered_country_code ||
    profile.isoCode ||
    ''
  ).trim().toUpperCase();

  if (rawCode) {
    const byCode = COUNTRIES.find(c => c.code.toUpperCase() === rawCode);
    if (byCode) return byCode.name;
    return rawCode;
  }

  return '';
}

export function formatInvestmentPlanName(plan?: any | null): string {
  if (!plan) return '';
  const raw = typeof plan === 'string'
    ? plan.trim()
    : String(plan.name || plan.title || plan.id || '').trim();
  const withoutSuffix = raw.replace(/\s+plan$/i, '').trim();
  if (!withoutSuffix) return '';
  return withoutSuffix.charAt(0).toUpperCase() + withoutSuffix.slice(1);
}

export interface WhatsAppBankTransferDetails {
  profile?: any | null;
  user?: any | null;
  plan?: any | null;
  fullName?: string | null;
  username?: string | null;
  publicUserId?: string | null;
  country?: string | null;
  planName?: string | null;
}

export function getWhatsAppBankTransferUrl(
  amount: number | string,
  details?: WhatsAppBankTransferDetails
): string {
  const formattedAmount = formatTransferAmount(amount);
  const profile = details?.profile;
  const user = details?.user;

  const fullName = String(
    details?.fullName ||
    profile?.name ||
    profile?.full_name ||
    profile?.fullName ||
    user?.displayName ||
    ''
  ).trim();

  const rawUsername = String(
    details?.username ||
    profile?.username ||
    profile?.user_name ||
    ''
  ).trim().replace(/^@+/, '');

  const publicUserId = String(
    details?.publicUserId ||
    profile?.public_id ||
    profile?.publicId ||
    profile?.user_id ||
    user?.uid ||
    ''
  ).trim();

  const country = String(
    details?.country ||
    getAccountCountryName(profile) ||
    ''
  ).trim();

  const investmentPlan = String(
    details?.planName
      ? formatInvestmentPlanName(details.planName)
      : details?.plan
      ? formatInvestmentPlanName(details?.plan)
      : 'Account Funding'
  ).trim() || 'Account Funding';

  const message = [
    `Hi, my name is ${fullName}.`,
    `Username: @${rawUsername}`,
    `Country: ${country}`,
    `User ID: ${publicUserId}`,
    `Investment Plan: ${investmentPlan}`,
    `Investment Amount: $${formattedAmount}`,
    '',
    `Kindly provide me with the official and dedicated bank details to settle this payment.`,
    `Thank you.`
  ].join('\n');

  return `https://wa.me/${WHATSAPP_BANK_REQUEST_NUMBER_CLEAN}?text=${encodeURIComponent(message)}`;
}
