import { InvoiceData } from '@/types/invoice';
import { formatWhatsAppPhone, formatDateIndo, formatRupiah } from '@/lib/format';
import { getPaidAndRemaining } from '@/lib/payment';

/** Invoice message for the client (shared by list, detail and print screens). */
export function buildInvoiceWhatsAppMessage(inv: InvoiceData): string {
  const isPaid = inv.status === 'paid';
  const { dpPaid, remaining: remainingAmount } = getPaidAndRemaining(inv);
  const hasDpPaid = dpPaid > 0;

  const dpLine = hasDpPaid
    ? `💳 *DP Diterima:* ${formatRupiah(dpPaid)}\n⏳ *Sisa Tagihan (Pelunasan H-1):* *${isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}*`
    : `💳 *Min DP ${inv.dpMinPercent || 30}%:* ${formatRupiah(inv.dpAmount || Math.round(inv.total * ((inv.dpMinPercent || 30) / 100)))}`;

  const itemsSummary = (inv.items || [])
    .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity || 1} pcs)`)
    .join('\n');

  const message = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 *No. Invoice:* #${inv.invoiceNumber}\n📅 *Tanggal Acara:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}\n⏰ *Jam Acara:* ${inv.eventTime || '14:00'} WIB (Setup: ${inv.setupTime || '11:00'} WIB)\n📍 *Lokasi:* ${inv.venue || inv.clientAddress || '—'}\n\n📦 *Paket Pesanan:*\n${itemsSummary || '  (Sesuai invoice)'}\n\n💰 *Total Tagihan:* *${formatRupiah(inv.total)}*\n${dpLine}\n\nTransfer ke Rekening Resmi:\n🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*\n\nTerima kasih banyak Kak! ✨`;
  return message;
}

export function buildWhatsAppUrl(rawPhone: string | undefined, message: string): string {
  const phone = formatWhatsAppPhone(rawPhone);
  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function buildInvoiceWhatsAppUrl(inv: InvoiceData): string {
  return buildWhatsAppUrl(inv.clientPhone, buildInvoiceWhatsAppMessage(inv));
}

/** WhatsApp reminder for the remaining balance (pelunasan H-1). */
export function buildPaymentReminderWhatsAppUrl(inv: InvoiceData, remaining: number): string {
  const message = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈\n\nKami dari *Rumah Balon Decoration* ingin mengingatkan pelunasan untuk acara Kakak:\n📄 *No. Invoice:* #${inv.invoiceNumber}\n📅 *Tanggal Acara:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}\n📍 *Lokasi:* ${inv.venue || inv.clientAddress || '—'}\n\n⏳ *Sisa Tagihan:* *${formatRupiah(remaining)}*\n(Pelunasan maksimal H-1 acara)\n\nTransfer ke Rekening Resmi:\n🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*\n\nMohon kirim bukti transfer setelah pembayaran ya Kak. Terima kasih! ✨`;
  return buildWhatsAppUrl(inv.clientPhone, message);
}
