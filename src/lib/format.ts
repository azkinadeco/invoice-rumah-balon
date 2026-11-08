import type { InvoiceData } from '@/types/invoice';
import { getPaidAndRemaining } from '@/lib/payment';

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export function formatRupiahSimple(amount: number): string {
  if (isNaN(amount)) return '0';
  return amount.toLocaleString('id-ID');
}

export function formatThousand(value: number | string): string {
  if (value === '' || value === undefined || value === null) return '';
  const num = typeof value === 'number' ? value : parseRupiahInput(String(value));
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('id-ID');
}

export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  const clean = String(value).replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const clean = String(dateStr).split('T')[0].trim();
    const parts = clean.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function exportInvoicesToCSV(invoices: InvoiceData[], filename = 'Data_Invoice_RumahBalon.csv') {
  const headers = [
    'No Invoice',
    'Tanggal Terbit',
    'Tanggal Acara',
    'Jam Acara',
    'Nama Pelanggan',
    'Nomor WhatsApp',
    'Lokasi Venue',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Total Tagihan (Rp)',
    'DP Terbayar (Rp)',
    'Sisa Tagihan (Rp)',
    'Status Pembayaran',
    'Daftar Item Pesanan',
    'Riwayat Pembayaran',
  ];

  const rows = invoices.map((inv) => {
    const { dpPaid, remaining } = getPaidAndRemaining(inv);

    return [
      `"${inv.invoiceNumber || ''}"`,
      `"${inv.invoiceDate || ''}"`,
      `"${inv.bookingDate || ''}"`,
      `"${inv.eventTime || ''}"`,
      `"${(inv.clientName || '').replace(/"/g, '""')}"`,
      `"${inv.clientPhone || ''}"`,
      `"${(inv.venue || inv.clientAddress || '').replace(/"/g, '""')}"`,
      inv.subtotal || 0,
      inv.discount || 0,
      inv.total || 0,
      dpPaid,
      remaining,
      `"${inv.status || ''}"`,
      `"${(inv.items || [])
        .map((it) => `${it.quantity || 1}x ${it.description || ''} (Rp ${it.amount || 0})`)
        .join('; ')
        .replace(/"/g, '""')}"`,
      `"${(inv.payments || [])
        .map((p) => `${p.date || 'tanpa tanggal'} ${p.method || ''} Rp ${p.amount}`.replace(/\s+/g, ' '))
        .join('; ')
        .replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Auto-sanitizes raw phone number into standard international format (628xxx) for WhatsApp links
 */
export function formatWhatsAppPhone(rawPhone: string | undefined | null): string {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Compresses an image file (e.g. QRIS barcode) via HTML5 canvas to prevent LocalStorage Quota Exceeded error
 */
export async function compressImageFile(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Next sequential invoice number, e.g. "009767" after "009766".
 * Uses the highest numeric invoice number so new numbers never collide.
 */
export function getNextInvoiceNumber(invoices: { invoiceNumber?: string }[]): string {
  const max = invoices.reduce((m, inv) => {
    const n = parseInt(String(inv.invoiceNumber || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1).padStart(6, '0');
}

/** "HH:MM" -> minutes since midnight, or null when empty/invalid. */
export function timeToMinutes(t?: string): number | null {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Human-readable warnings for an event's setup / start / end times. */
export function getEventTimeWarnings(setup?: string, start?: string, end?: string): string[] {
  const s = timeToMinutes(setup);
  const a = timeToMinutes(start);
  const b = timeToMinutes(end);
  const out: string[] = [];
  if (a !== null && b !== null && b <= a) out.push('Jam selesai lebih awal / sama dengan jam mulai acara.');
  if (s !== null && a !== null && s > a) out.push('Jam setup balon setelah jam acara dimulai.');
  return out;
}

/** Returns an error message when setup time is unusable, else null. Times are "HH:MM". */
export function validateSetupTime(setupTime?: string, eventTime?: string): string | null {
  if (!setupTime) return null;
  if (setupTime === '00:00') return 'Jam setup 00:00 (tengah malam) kemungkinan salah. Mohon isi jam setup yang benar.';
  if (eventTime && setupTime > eventTime) return 'Jam setup harus lebih awal dari jam mulai acara.';
  return null;
}

/**
 * Today's date as "YYYY-MM-DD" in the device's local time zone.
 * `new Date().toISOString()` is UTC, which in WIB (UTC+7) still gives
 * yesterday's date until 07:00 in the morning.
 */
export function todayLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
