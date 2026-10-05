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
 * - If profile data is not yet resolved, returns false to prevent false rejection during load.
 * - If profile_completed is true, returns false (verified).
 * - If profile_completed is false, returns true (unverified).
 * - If profile_completed is undefined, checks if phone and country are present.
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

  // If profile is not yet loaded / resolved, do not treat as incomplete to prevent false rejection during initialization
  if (!profile) return false;

  // Authoritative check: If explicitly completed, user is verified
  if (profile.profile_completed === true) return false;

  // If user already has transfer/transaction PIN set, they have completed verification
  if (profile.transfer_pin || profile.transaction_pin) return false;

  // Authoritative check on required profile fields (phone and country)
  const rawPhone = String(profile.phone || '').trim();
  const hasPhone = rawPhone.length >= 5;

  const rawCountry = String(
    profile.country ||
    profile.countryName ||
    profile.country_code ||
    profile.countryCode ||
    ''
  ).trim();
  const hasCountry = rawCountry.length > 0;

  // If user has both phone and country, consider complete
  if (hasPhone && hasCountry) {
    return false;
  }

  // Active investor check: if user already has an active investment balance or investment credited
  if (typeof profile.total_invested === 'number' && profile.total_invested > 0) {
    return false;
  }

  // If explicitly flagged as incomplete and lacks phone or country
  if (profile.profile_completed === false) return true;

  return true;
}
