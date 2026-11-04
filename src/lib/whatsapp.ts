import { InvoiceData } from '@/types/invoice';
import { formatWhatsAppPhone, formatDateIndo, formatRupiah } from '@/lib/format';

export function buildInvoiceWhatsAppUrl(inv: InvoiceData): string {
  const phone = formatWhatsAppPhone(inv.clientPhone);
  const isPaid = inv.status === 'paid';
  const dpPaid =
    typeof inv.dpPaidAmount === 'number' && inv.dpPaidAmount > 0
      ? inv.dpPaidAmount
      : inv.status === 'dp_paid'
      ? inv.dpAmount || Math.round(inv.total * 0.3)
      : 0;
  const hasDpPaid = dpPaid > 0 || isPaid;
  const remainingAmount =
    typeof inv.remainingAmount === 'number'
      ? inv.remainingAmount
      : Math.max(0, inv.total - dpPaid);

  const dpLine = hasDpPaid
    ? `💳 *DP Diterima:* ${formatRupiah(dpPaid)}\n⏳ *Sisa Tagihan (Pelunasan H-1):* *${isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}*`
    : `💳 *Min DP 30%:* ${formatRupiah(Math.round(inv.total * 0.3))}`;

  const itemsSummary = (inv.items || [])
    .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity || 1} pcs)`)
    .join('\n');

  const message = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 *No. Invoice:* #${inv.invoiceNumber}\n📅 *Tanggal Acara:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}\n⏰ *Jam Acara:* ${inv.eventTime || '14:00'} WIB (Setup: ${inv.setupTime || '11:00'} WIB)\n📍 *Lokasi:* ${inv.venue || inv.clientAddress || '—'}\n\n📦 *Paket Pesanan:*\n${itemsSummary || '  (Sesuai invoice)'}\n\n💰 *Total Tagihan:* *${formatRupiah(inv.total)}*\n${dpLine}\n\nTransfer ke Rekening Resmi:\n🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*\n\nTerima kasih banyak Kak! ✨`;

  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/** WhatsApp reminder for the remaining balance (pelunasan H-1). */
export function buildPaymentReminderWhatsAppUrl(inv: InvoiceData, remaining: number): string {
  const phone = formatWhatsAppPhone(inv.clientPhone);
  const message = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈\n\nKami dari *Rumah Balon Decoration* ingin mengingatkan pelunasan untuk acara Kakak:\n📄 *No. Invoice:* #${inv.invoiceNumber}\n📅 *Tanggal Acara:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}\n📍 *Lokasi:* ${inv.venue || inv.clientAddress || '—'}\n\n⏳ *Sisa Tagihan:* *${formatRupiah(remaining)}*\n(Pelunasan maksimal H-1 acara)\n\nTransfer ke Rekening Resmi:\n🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*\n\nMohon kirim bukti transfer setelah pembayaran ya Kak. Terima kasih! ✨`;
  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
