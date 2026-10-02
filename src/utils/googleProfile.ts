import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfileLike {
  phone?: string | null;
  country?: string | null;
  countryName?: string | null;
  country_code?: string | null;
  countryCode?: string | null;
  profile_completed?: boolean;
  is_google_user?: boolean;
  auth_provider?: string;
  has_password?: boolean;
  password_set?: boolean;
  role?: string;
  [key: string]: any;
}

/**
 * Checks if the authenticated user is a Google account that has NOT yet
 * completed their profile (phone, country, password setup).
 * 
 * Rules:
 * - Only applies to Google-authenticated / Google-created accounts.
 * - Cipher admin role bypasses profile completion.
 * - If profile_completed is true, returns false.
 * - If phone or country is missing, returns true.
 * - Does NOT affect email/password or existing complete users.
 */
export function isGoogleProfileIncomplete(
  user: FirebaseUser | null,
  profile: UserProfileLike | null
): boolean {
  if (!user) return false;

  // Cipher administrators bypass profile completion
  if (profile?.role === 'cipher') return false;

  // Check if authenticated with Google provider or marked as Google signup
  const isGoogle = 
    user.providerData?.some(p => p.providerId === 'google.com') ||
    profile?.is_google_user === true ||
    profile?.auth_provider === 'google';

  if (!isGoogle) return false;

  // If already explicitly marked as completed
  if (profile?.profile_completed === true) return false;

  // Check required profile fields
  const rawPhone = String(profile?.phone || '').trim();
  const hasPhone = rawPhone.length >= 5;

  const rawCountry = String(
    profile?.country ||
    profile?.countryName ||
    profile?.country_code ||
    profile?.countryCode ||
    ''
  ).trim();
  const hasCountry = rawCountry.length > 0;

  const rawPin = String(profile?.transfer_pin || '').trim();
  const hasPin = /^\d{4}$/.test(rawPin);

  // If missing phone, country, transaction PIN, or explicitly flagged as incomplete
  if (!hasPhone || !hasCountry || !hasPin || profile?.profile_completed === false) {
    return true;
  }

  return false;
}
