/**
 * Phone Number Normalization and Lookup Utilities
 * Ensures consistent international E.164 canonical formatting across Sign Up, Sign In, and Firestore queries.
 */

export const COUNTRY_DIAL_CODES: Record<string, string> = {
  AF: '93',
  AL: '355',
  DZ: '213',
  AD: '376',
  AO: '244',
  AG: '1268',
  AR: '54',
  AM: '374',
  AW: '297',
  AU: '61',
  AT: '43',
  AZ: '994',
  BS: '1242',
  BH: '973',
  BD: '880',
  BB: '1246',
  BY: '375',
  BE: '32',
  BZ: '501',
  BJ: '229',
  BT: '975',
  BO: '591',
  BA: '387',
  BW: '267',
  BR: '55',
  IO: '246',
  BN: '673',
  BG: '359',
  BF: '226',
  BI: '257',
  KH: '855',
  CM: '237',
  CA: '1',
  CV: '238',
  BQ: '599',
  CF: '236',
  TD: '235',
  CL: '56',
  CN: '86',
  CO: '57',
  KM: '269',
  CD: '243',
  CG: '242',
  CR: '506',
  CI: '225',
  HR: '385',
  CU: '53',
  CW: '599',
  CY: '357',
  CZ: '420',
  DK: '45',
  DJ: '253',
  DM: '1767',
  DO: '1',
  EC: '593',
  EG: '20',
  SV: '503',
  GQ: '240',
  ER: '291',
  EE: '372',
  ET: '251',
  FJ: '679',
  FI: '358',
  FR: '33',
  GF: '594',
  PF: '689',
  GA: '241',
  GM: '220',
  GE: '995',
  DE: '49',
  GH: '233',
  GR: '30',
  GD: '1473',
  GP: '590',
  GU: '1671',
  GT: '502',
  GN: '224',
  GW: '245',
  GY: '592',
  HT: '509',
  HN: '504',
  HK: '852',
  HU: '36',
  IS: '354',
  IN: '91',
  ID: '62',
  IR: '98',
  IQ: '964',
  IE: '353',
  IL: '972',
  IT: '39',
  JM: '1876',
  JP: '81',
  JO: '962',
  KZ: '7',
  KE: '254',
  KI: '686',
  XK: '383',
  KW: '965',
  KG: '996',
  LA: '856',
  LV: '371',
  LB: '961',
  LS: '266',
  LR: '231',
  LY: '218',
  LI: '423',
  LT: '370',
  LU: '352',
  MO: '853',
  MK: '389',
  MG: '261',
  MW: '265',
  MY: '60',
  MV: '960',
  ML: '223',
  MT: '356',
  MH: '692',
  MQ: '596',
  MR: '222',
  MU: '230',
  MX: '52',
  FM: '691',
  MD: '373',
  MC: '377',
  MN: '976',
  ME: '382',
  MA: '212',
  MZ: '258',
  MM: '95',
  NA: '264',
  NR: '674',
  NP: '977',
  NL: '31',
  NC: '687',
  NZ: '64',
  NI: '505',
  NE: '227',
  NG: '234',
  KP: '850',
  NO: '47',
  OM: '968',
  PK: '92',
  PW: '680',
  PS: '970',
  PA: '507',
  PG: '675',
  PY: '595',
  PE: '51',
  PH: '63',
  PL: '48',
  PT: '351',
  PR: '1',
  QA: '974',
  RE: '262',
  RO: '40',
  RU: '7',
  RW: '250',
  KN: '1869',
  LC: '1758',
  VC: '1784',
  WS: '685',
  SM: '378',
  ST: '239',
  SA: '966',
  SN: '221',
  RS: '381',
  SC: '248',
  SL: '232',
  SG: '65',
  SK: '421',
  SI: '386',
  SB: '677',
  SO: '252',
  ZA: '27',
  KR: '82',
  SS: '211',
  ES: '34',
  LK: '94',
  SD: '249',
  SR: '597',
  SZ: '268',
  SE: '46',
  CH: '41',
  SY: '963',
  TW: '886',
  TJ: '992',
  TZ: '255',
  TH: '66',
  TL: '670',
  TG: '228',
  TO: '676',
  TT: '1868',
  TN: '216',
  TR: '90',
  TM: '993',
  TV: '688',
  UG: '256',
  UA: '380',
  AE: '971',
  GB: '44',
  US: '1',
  UY: '598',
  UZ: '998',
  VU: '678',
  VA: '39',
  VE: '58',
  VN: '84',
  YE: '967',
  ZM: '260',
  ZW: '263'
};

export const COUNTRY_MAX_NATIONAL_LENGTHS: Record<string, number> = {
  AC: 5, AD: 6, AE: 9, AF: 9, AG: 10, AI: 10, AL: 9, AM: 8, AO: 9, AR: 11,
  AS: 10, AT: 11, AU: 9, AW: 7, AX: 9, AZ: 9, BA: 8, BB: 10, BD: 10, BE: 9,
  BF: 8, BG: 8, BH: 8, BI: 8, BJ: 10, BL: 9, BM: 10, BN: 7, BO: 8, BQ: 7,
  BR: 11, BS: 10, BT: 8, BW: 8, BY: 9, BZ: 7, CA: 10, CC: 9, CD: 9, CF: 8,
  CG: 9, CH: 9, CI: 10, CK: 5, CL: 9, CM: 9, CN: 11, CO: 10, CR: 8, CU: 8,
  CV: 7, CW: 8, CX: 9, CY: 8, CZ: 9, DE: 11, DJ: 8, DK: 8, DM: 10, DO: 10,
  DZ: 9, EC: 9, EE: 8, EG: 10, EH: 9, ER: 7, ES: 9, ET: 9, FI: 9, FJ: 7,
  FK: 5, FM: 7, FO: 6, FR: 9, GA: 8, GB: 10, GD: 10, GE: 9, GF: 9, GG: 10,
  GH: 9, GI: 8, GL: 6, GM: 7, GN: 9, GP: 9, GQ: 9, GR: 10, GT: 8, GU: 10,
  GW: 9, GY: 7, HK: 8, HN: 8, HR: 9, HT: 8, HU: 9, ID: 12, IE: 9, IL: 9,
  IM: 10, IN: 10, IO: 7, IQ: 10, IR: 10, IS: 7, IT: 10, JE: 10, JM: 10, JO: 9,
  JP: 10, KE: 9, KG: 9, KH: 8, KI: 8, KM: 7, KN: 10, KP: 10, KR: 10, KW: 8,
  KY: 10, KZ: 10, LA: 10, LB: 8, LC: 10, LI: 9, LK: 9, LR: 9, LS: 8, LT: 8,
  LU: 9, LV: 8, LY: 9, MA: 9, MC: 9, MD: 8, ME: 8, MF: 9, MG: 9, MH: 7,
  MK: 8, ML: 8, MM: 8, MN: 8, MO: 8, MP: 10, MQ: 9, MR: 8, MS: 10, MT: 8,
  MU: 8, MV: 7, MW: 9, MX: 10, MY: 10, MZ: 9, NA: 9, NC: 6, NE: 8, NF: 6,
  NG: 10, NI: 8, NL: 9, NO: 8, NP: 10, NR: 7, NU: 7, NZ: 10, OM: 8, PA: 8,
  PE: 9, PF: 8, PG: 8, PH: 10, PK: 10, PL: 9, PM: 6, PR: 10, PS: 9, PT: 9,
  PW: 7, PY: 9, QA: 8, RE: 9, RO: 9, RS: 9, RU: 10, RW: 9, SA: 9, SB: 7,
  SC: 7, SD: 9, SE: 9, SG: 8, SH: 5, SI: 8, SJ: 8, SK: 9, SL: 8, SM: 8,
  SN: 9, SO: 8, SR: 7, SS: 9, ST: 7, SV: 8, SX: 10, SY: 9, SZ: 8, TA: 4,
  TC: 10, TD: 8, TG: 8, TH: 9, TJ: 9, TK: 4, TL: 8, TM: 8, TN: 8, TO: 7,
  TR: 10, TT: 10, TV: 6, TW: 9, TZ: 9, UA: 9, UG: 9, US: 10, UY: 8, UZ: 9,
  VA: 10, VC: 10, VE: 10, VG: 10, VI: 10, VN: 10, VU: 7, WF: 6, WS: 7, XK: 8,
  YE: 9, YT: 9, ZA: 9, ZM: 9, ZW: 9
};

/**
 * Returns the maximum valid national phone number length (excluding country calling code)
 * for a given country code or country name.
 * Defaults to 10 if unknown.
 */
export function getCountryMaxNationalLength(countryCodeOrName?: string | null): number {
  if (!countryCodeOrName) return 10;
  const clean = countryCodeOrName.trim().toUpperCase();
  if (COUNTRY_MAX_NATIONAL_LENGTHS[clean]) {
    return COUNTRY_MAX_NATIONAL_LENGTHS[clean];
  }
  if (clean === 'NIGERIA') return 10;
  if (clean === 'UNITED STATES' || clean === 'USA') return 10;
  if (clean === 'UNITED KINGDOM' || clean === 'UK') return 10;
  if (clean === 'CANADA') return 10;
  if (clean === 'AUSTRALIA') return 9;
  if (clean === 'GHANA') return 9;
  if (clean === 'SOUTH AFRICA') return 9;
  if (clean === 'KENYA') return 9;
  if (clean === 'INDIA') return 10;
  if (clean === 'GERMANY') return 11;
  return 10;
}

/**
 * Resolves the numeric country dial code given a 2-letter ISO code or country name.
 * Defaults to '234' (Nigeria) if undefined.
 */
export function getCountryDialCode(countryCodeOrName?: string | null): string {
  if (!countryCodeOrName) return '234';
  const clean = countryCodeOrName.trim().toUpperCase();
  if (COUNTRY_DIAL_CODES[clean]) {
    return COUNTRY_DIAL_CODES[clean];
  }
  // If a country name was provided, search by common names
  if (clean === 'NIGERIA') return '234';
  if (clean === 'UNITED STATES' || clean === 'USA') return '1';
  if (clean === 'UNITED KINGDOM' || clean === 'UK') return '44';
  if (clean === 'CANADA') return '1';
  if (clean === 'AUSTRALIA') return '61';
  if (clean === 'GHANA') return '233';
  if (clean === 'SOUTH AFRICA') return '27';
  if (clean === 'KENYA') return '254';
  if (clean === 'INDIA') return '91';

  return '234';
}

/**
 * Normalizes any phone number into canonical international E.164 format (+[dialCode][nationalNumber]).
 * Handles:
 * - International formats (+2348012345678, 002348012345678)
 * - Raw digits with country dial code (2348012345678)
 * - National formats with leading zero (08012345678)
 * - Local numbers without zero (8012345678)
 * - Formatted numbers with spaces, parentheses, or dashes (+234 801 234 5678, (080) 123-4567)
 */
export function normalizePhoneNumber(rawPhone: string, countryCodeOrName?: string | null): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';

  // Explicit international format starting with +
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  // Explicit international format starting with 00 (international prefix)
  if (trimmed.startsWith('00')) {
    const digits = trimmed.slice(2).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  const dialCode = getCountryDialCode(countryCodeOrName);

  // If already starts with dialCode and is longer than dialCode alone
  if (digits.startsWith(dialCode) && digits.length > dialCode.length + 4) {
    return `+${digits}`;
  }

  // If starts with trunk zero (e.g. 08012345678)
  if (digits.startsWith('0')) {
    const nationalDigits = digits.replace(/^0+/, '');
    return `+${dialCode}${nationalDigits}`;
  }

  // Local digits without trunk zero (e.g. 8012345678)
  return `+${dialCode}${digits}`;
}

/**
 * Generates an array of phone candidates to check against Firestore.
 * This guarantees that whether the user's phone was stored as:
 * - canonical '+2348012345678'
 * - raw digits '2348012345678'
 * - local '08012345678'
 * - unpadded '8012345678'
 * - exact input '08012345678' or formatted '+234 801 234 5678'
 * the query will locate the authentic document.
 */
export function getPhoneLookupCandidates(rawPhone: string, countryCodeOrName?: string | null): string[] {
  if (!rawPhone) return [];
  const trimmed = rawPhone.trim();
  if (!trimmed) return [];

  const canonical = normalizePhoneNumber(trimmed, countryCodeOrName);
  const dialCode = getCountryDialCode(countryCodeOrName);
  const rawDigits = trimmed.replace(/\D/g, '');

  const candidatesSet = new Set<string>();

  // 1. Canonical international (+2348012345678)
  if (canonical) {
    candidatesSet.add(canonical);
    // 2. Canonical digits without '+' (2348012345678)
    const canonicalDigits = canonical.slice(1);
    candidatesSet.add(canonicalDigits);

    // 3. National representation with leading zero (08012345678)
    if (canonicalDigits.startsWith(dialCode)) {
      const national = canonicalDigits.slice(dialCode.length);
      if (national) {
        candidatesSet.add(`0${national}`);
        candidatesSet.add(national);
      }
    }
  }

  // 4. Exact raw input
  candidatesSet.add(trimmed);

  // 5. Clean digits of raw input
  if (rawDigits) {
    candidatesSet.add(rawDigits);
    candidatesSet.add(`+${rawDigits}`);
    if (rawDigits.startsWith('0')) {
      const stripped = rawDigits.replace(/^0+/, '');
      candidatesSet.add(stripped);
      candidatesSet.add(`+${dialCode}${stripped}`);
      candidatesSet.add(`${dialCode}${stripped}`);
    }
  }

  return Array.from(candidatesSet).filter(Boolean);
}
