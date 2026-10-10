import { CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

// Convert 2-letter ISO country code into emoji flag
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Standard English country names map for common ISO codes
const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  AE: 'United Arab Emirates',
  SG: 'Singapore',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  OM: 'Oman',
  BH: 'Bahrain',
  NP: 'Nepal',
  BD: 'Bangladesh',
  LK: 'Sri Lanka',
  PK: 'Pakistan',
  MY: 'Malaysia',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TH: 'Thailand',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  HK: 'Hong Kong',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
  EG: 'Egypt',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  IE: 'Ireland',
  PT: 'Portugal',
  PL: 'Poland',
  CZ: 'Czech Republic',
  RO: 'Romania',
  GR: 'Greece',
  TR: 'Turkey',
  IL: 'Israel',
  RU: 'Russia',
  UA: 'Ukraine',
};

// Memoized countries list
let cachedCountryList: CountryInfo[] | null = null;

export function getAllCountries(): CountryInfo[] {
  if (cachedCountryList) return cachedCountryList;

  try {
    const list = getCountries().map((code) => {
      let dial = '';
      try {
        dial = `+${getCountryCallingCode(code)}`;
      } catch {
        dial = '';
      }
      return {
        code,
        name: COUNTRY_NAMES[code] || code,
        dialCode: dial,
        flag: getCountryFlag(code),
      };
    }).filter((c) => Boolean(c.dialCode));

    // Sort India and United States to top, followed by alphabetical
    const priority = ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG'];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.code);
      const idxB = priority.indexOf(b.code);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    cachedCountryList = list;
    return list;
  } catch {
    return [
      { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
      { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
      { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    ];
  }
}
