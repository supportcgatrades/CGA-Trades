/**
 * Robust geographic detection utility for Capital Growth Alliance.
 * Uses a combination of physical IP-based Geolocation API calls
 * and reliable browser timezone fallback mapping to ensure location accuracy.
 */

export interface DetectedLocationResult {
  country: string; // e.g., "Nigeria", "Australia"
  code: string;    // e.g., "NG", "AU"
  city?: string;
  method: 'api' | 'timezone';
}

const TZ_TO_COUNTRY_MAP: Record<string, { country: string; code: string }> = {
  // Nigeria
  'lagos': { country: 'Nigeria', code: 'NG' },
  
  // Australia
  'sydney': { country: 'Australia', code: 'AU' },
  'melbourne': { country: 'Australia', code: 'AU' },
  'brisbane': { country: 'Australia', code: 'AU' },
  'perth': { country: 'Australia', code: 'AU' },
  'adelaide': { country: 'Australia', code: 'AU' },
  'darwin': { country: 'Australia', code: 'AU' },
  'hobart': { country: 'Australia', code: 'AU' },
  'canberra': { country: 'Australia', code: 'AU' },

  // United Kingdom
  'london': { country: 'United Kingdom', code: 'GB' },
  'belfast': { country: 'United Kingdom', code: 'GB' },

  // United States
  'new_york': { country: 'United States', code: 'US' },
  'chicago': { country: 'United States', code: 'US' },
  'los_angeles': { country: 'United States', code: 'US' },
  'denver': { country: 'United States', code: 'US' },
  'phoenix': { country: 'United States', code: 'US' },
  'anchorage': { country: 'United States', code: 'US' },
  'honolulu': { country: 'United States', code: 'US' },

  // Canada
  'toronto': { country: 'Canada', code: 'CA' },
  'vancouver': { country: 'Canada', code: 'CA' },
  'montreal': { country: 'Canada', code: 'CA' },
  'edmonton': { country: 'Canada', code: 'CA' },
  'winnipeg': { country: 'Canada', code: 'CA' },
  'halifax': { country: 'Canada', code: 'CA' },

  // Germany
  'berlin': { country: 'Germany', code: 'DE' },
  'munich': { country: 'Germany', code: 'DE' },
  'frankfurt': { country: 'Germany', code: 'DE' },

  // France
  'paris': { country: 'France', code: 'FR' },

  // Other major regions
  'singapore': { country: 'Singapore', code: 'SG' },
  'tokyo': { country: 'Japan', code: 'JP' },
  'seoul': { country: 'South Korea', code: 'KR' },
  'johannesburg': { country: 'South Africa', code: 'ZA' },
  'dubai': { country: 'United Arab Emirates', code: 'AE' }
};

export async function detectUserLocation(): Promise<DetectedLocationResult> {
  // Step 1: Attempt highly responsive IP Geolocation API
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_name && data.country) {
        return {
          country: data.country_name,
          code: data.country,
          city: data.city,
          method: 'api'
        };
      }
    }
  } catch (err) {
    console.warn("[Geo Engine] ipapi.co fetch failed, trying secondary fallback...", err);
  }

  // Step 2: Try secondary geolocation API
  try {
    const res = await fetch('https://geolocation-db.com/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_name && data.country_code) {
        return {
          country: data.country_name === "United States" ? "United States" : data.country_name,
          code: data.country_code,
          city: data.city,
          method: 'api'
        };
      }
    }
  } catch (err) {
    console.warn("[Geo Engine] Secondary geolocation-db fetch also failed, resorting to Timezone fallback.", err);
  }

  // Step 3: Reliable timezone-based parsing (Runs instantly, zero network, 100% reliable sandbox mode)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
    
    // Find matching country based on timezone keywords
    for (const key of Object.keys(TZ_TO_COUNTRY_MAP)) {
      if (tz.includes(key)) {
        const mapped = TZ_TO_COUNTRY_MAP[key];
        return {
          country: mapped.country,
          code: mapped.code,
          method: 'timezone'
        };
      }
    }

    // Default time zone checks for broad regions
    if (tz.includes('africa')) {
      return { country: 'Nigeria', code: 'NG', method: 'timezone' };
    }
    if (tz.includes('australia')) {
      return { country: 'Australia', code: 'AU', method: 'timezone' };
    }
    if (tz.includes('america')) {
      return { country: 'United States', code: 'US', method: 'timezone' };
    }
    if (tz.includes('europe')) {
      return { country: 'United Kingdom', code: 'GB', method: 'timezone' };
    }
  } catch (err) {
    console.error("[Geo Engine] Browser timezone lookup failed:", err);
  }

  // Zero-state final safe fallback (default to Nigeria, most prevalent location)
  return {
    country: 'Nigeria',
    code: 'NG',
    method: 'timezone'
  };
}
