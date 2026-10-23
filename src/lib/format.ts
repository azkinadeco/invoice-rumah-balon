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

export function exportInvoicesToCSV(invoices: any[], filename = 'Data_Invoice_RumahBalon.csv') {
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
  ];

  const rows = invoices.map((inv) => {
    const isPaid = inv.status === 'paid';
    const dpPaid = isPaid
      ? (inv.total || 0)
      : (inv.dpPaidAmount || (inv.status === 'dp_paid' ? Math.round((inv.total || 0) * 0.3) : 0));
    const remaining = isPaid ? 0 : Math.max(0, (inv.total || 0) - dpPaid);

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
        .map((it: any) => `${it.quantity || 1}x ${it.description || ''} (Rp ${it.amount || 0})`)
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
