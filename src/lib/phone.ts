import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export function normalizePhone(raw: string | undefined | null, defaultCountry: CountryCode = 'SN'):
  string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  try {
    const phone = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (phone && phone.isValid()) {
      return phone.number; // E.164 format
    }
  } catch (_err) {
    void _err;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (/^7\d{8}$/.test(digits)) {
    return `+221${digits}`;
  }
  if (/^0[7]\d{8}$/.test(digits)) {
    return `+221${digits.substring(1)}`;
  }
  if (/^2217\d{8}$/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}

export function isValidPhone(raw: string | undefined | null, defaultCountry: CountryCode = 'SN'):
  boolean {
  return !!normalizePhone(raw, defaultCountry);
}
