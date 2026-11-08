import { BusinessSettings, InvoiceData } from '@/types/invoice';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants';

export const SETTINGS_CACHE_KEY = 'rb_business_profile';

/**
 * Keeps only the BusinessSettings keys of an object.
 * Settings used to be read back from an invoice, which leaked client data
 * (id, items, ...) into every invoice when saved — never spread unknown objects.
 */
export function pickBusinessSettings(source: Partial<BusinessSettings> | null | undefined): BusinessSettings {
  const s = source || {};
  const d = DEFAULT_BUSINESS_SETTINGS;
  return {
    bankName: s.bankName ?? d.bankName,
    bankAccountName: s.bankAccountName ?? d.bankAccountName,
    bankAccountNumber: s.bankAccountNumber ?? d.bankAccountNumber,
    qrisImageUrl: s.qrisImageUrl ?? d.qrisImageUrl,
    showQris: s.showQris ?? d.showQris,
    minDpNote: s.minDpNote ?? d.minDpNote,
    notes: Array.isArray(s.notes) ? s.notes : d.notes,
    contactIg: s.contactIg ?? d.contactIg,
    contactWa: s.contactWa ?? d.contactWa,
  };
}

export function readCachedSettings(): BusinessSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? pickBusinessSettings(parsed) : null;
  } catch {
    return null;
  }
}

export function writeCachedSettings(settings: BusinessSettings) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // ignore (quota / private mode)
  }
}

/** Invoice as shown to people: shop details always come from the current settings. */
export function applyBusinessSettings(inv: InvoiceData, settings: BusinessSettings): InvoiceData {
  return { ...inv, ...settings };
}

/**
 * Invoice as stored: the QRIS image lives once in the settings, not in every
 * invoice (a ~50 KB base64 copy per invoice filled up browser storage and
 * made every sync upload megabytes).
 */
export function stripHeavySettings(inv: InvoiceData): InvoiceData {
  return inv.qrisImageUrl ? { ...inv, qrisImageUrl: '' } : inv;
}
