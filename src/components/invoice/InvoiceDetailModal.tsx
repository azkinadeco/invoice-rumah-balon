'use client';

import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { STATUS_COLORS } from '@/lib/constants';
import { formatRupiah, formatDateIndo, formatWhatsAppPhone } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  User,
  Phone,
  Calendar,
  CreditCard,
  Edit3,
  Printer,
  Send,
  Clock,
  MapPin,
  Copy,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onEdit: (invoice: InvoiceData) => void;
  onPrint: (invoice: InvoiceData) => void;
  onDuplicate?: (invoice: InvoiceData) => void;
  onOpenCrewSheet?: (invoice: InvoiceData) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onPrint,
  onDuplicate,
  onOpenCrewSheet,
}) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const customDp = typeof invoice.dpPaidAmount === 'number' && invoice.dpPaidAmount > 0 ? invoice.dpPaidAmount : undefined;
  const dpPaid = isPaid
    ? invoice.total
    : customDp !== undefined
    ? customDp
    : invoice.status === 'dp_paid'
    ? (invoice.dpAmount || Math.round(invoice.total * 0.3))
    : 0;
  const remainingAmount = Math.max(0, invoice.total - dpPaid);
  const hasDpPaid = dpPaid > 0;

  const handleSendWhatsApp = () => {
    const formattedPhone = formatWhatsAppPhone(invoice.clientPhone);

    const dpLine = hasDpPaid
      ? `💳 DP Diterima: *${formatRupiah(dpPaid)}*\n⏳ *Sisa Tagihan (Pelunasan H-1):* *${isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}*`
      : `💳 DP Min 30%: *${formatRupiah(Math.round(invoice.total * 0.3))}*`;

    const message = `Halo kak ${invoice.clientName || ''}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 No. Invoice: *${invoice.invoiceNumber}*\n📅 Tanggal Acara: *${formatDateIndo(invoice.bookingDate)}*\n💰 Total Tagihan: *${formatRupiah(invoice.total)}*\n${dpLine}\n\nTransfer ke Rekening:\n🏦 *${invoice.bankName} ${invoice.bankAccountNumber}* a/n *${invoice.bankAccountName}*\n\nTerima kasih kak! ✨`;

    const encoded = encodeURIComponent(message);
    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:w-[96vw] max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-3.5 sm:p-6 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </span>
            <span>Rincian Invoice #{invoice.invoiceNumber}</span>
          </DialogTitle>
          <Badge
            variant="outline"
            className={`${STATUS_COLORS[invoice.status]?.badge} text-xs font-bold py-0.5 px-2.5 rounded-full`}
          >
            {STATUS_COLORS[invoice.status]?.label}
          </Badge>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1 pb-10 text-sm">
          {/* Customer & Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
            {/* Kolom Kiri: Pelanggan & Lokasi */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/60">
                <User className="w-3.5 h-3.5 text-[#f370a8]" />
                Data Pelanggan & Lokasi
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">
                  {invoice.clientName || '(Tanpa Nama)'}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#f370a8]" />
                  {invoice.clientPhone || '—'}
                </div>
              </div>

              {(invoice.venue || invoice.clientAddress) && (
                <div className="text-xs text-foreground flex items-start gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#a78bfa] shrink-0 mt-0.5" />
                  <span className="font-medium">{invoice.venue || invoice.clientAddress}</span>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                Terbit: {invoice.invoiceDate ? formatDateIndo(invoice.invoiceDate) : '—'}
              </div>
            </div>

            {/* Kolom Kanan: Detail Acara & Tim */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/60">
                <Calendar className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#a78bfa]" />
                Jadwal & Tim Dekor
              </div>
              <div className="font-bold text-[#f370a8] text-sm">
                {invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '—'}
              </div>
              {invoice.eventTime && (
                <div className="text-xs text-foreground font-mono font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                  <span>
                    Pk {invoice.eventTime}
                    {invoice.eventEndTime ? ` - ${invoice.eventEndTime}` : ''}
                    {invoice.setupTime ? ` (Setup: ${invoice.setupTime})` : ''}
                  </span>
                </div>
              )}
              {invoice.themeNote && (
                <div className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                  <span>Tema: {invoice.themeNote}</span>
                </div>
              )}
              {invoice.assignedCrew && (
                <div className="text-xs text-[#4d3085] dark:text-[#c4b5fd] font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                  <span>Crew: {invoice.assignedCrew}</span>
                </div>
              )}
              {invoice.crewNote && (
                <div className="text-[11px] text-muted-foreground bg-muted/60 p-2 rounded-xl border border-border">
                  <strong className="text-foreground">Catatan Crew:</strong> {invoice.crewNote}
                </div>
              )}
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
              Daftar Paket & Item ({invoice.items.length})
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden bg-card">
              {invoice.items.map((it, idx) => (
                <div key={it.id || idx} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-foreground whitespace-pre-line">
                      {it.description || '(Tanpa Deskripsi)'}
                    </div>
                    {it.quantity && it.quantity > 1 ? (
                      <div className="text-[11px] text-muted-foreground">
                        {it.quantity} pcs @ {formatRupiah(it.unitPrice || Math.round(it.amount / it.quantity))}
                      </div>
                    ) : null}
                  </div>
                  <div className="font-mono font-bold text-foreground whitespace-nowrap">
                    {formatRupiah(it.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
            {(invoice.discount > 0 || invoice.tax > 0) && (
              <>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-foreground">{formatRupiah(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between items-center text-[#f370a8] font-semibold">
                    <span>Diskon:</span>
                    <span className="font-mono">- {formatRupiah(invoice.discount)}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Pajak (Tax):</span>
                    <span className="font-mono font-semibold">{formatRupiah(invoice.tax)}</span>
                  </div>
                )}
              </>
            )}

            <div className={`flex justify-between items-center text-sm font-black text-foreground ${invoice.discount > 0 || invoice.tax > 0 ? 'pt-2 border-t-2 border-border' : ''}`}>
              <span className="uppercase">Total Tagihan:</span>
              <span className="font-mono text-xl text-foreground">{formatRupiah(invoice.total)}</span>
            </div>

            {hasDpPaid ? (
              <div className="flex justify-between items-center text-[#4d3085] dark:text-[#c4b5fd] font-bold pt-1.5 border-t border-border">
                <span>DP yang Sudah Dibayar:</span>
                <span className="font-mono text-sm text-[#4d3085] dark:text-[#c4b5fd]">
                  - {formatRupiah(dpPaid)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[#4d3085] dark:text-[#c4b5fd] font-bold pt-1.5 border-t border-border">
                <span>Rekomendasi DP Minimal 30%:</span>
                <span className="font-mono">{formatRupiah(Math.round(invoice.total * 0.3))}</span>
              </div>
            )}

            {hasDpPaid && (
              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between shadow-2xs mt-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block text-foreground">
                    {isPaid || remainingAmount === 0 ? 'Status Tagihan:' : 'Sisa Tagihan Belum Dibayar:'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isPaid || remainingAmount === 0 ? 'Lunas penuh ✨' : 'Pelunasan H-1 sebelum loading'}
                  </span>
                </div>
                <span className={`text-lg font-black font-mono ${
                  isPaid || remainingAmount === 0
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-[#f370a8] dark:text-[#f472b6]'
                }`}>
                  {isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Payment transfer destination */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card text-xs text-muted-foreground">
            <CreditCard className="w-4 h-4 text-[#f370a8] shrink-0" />
            <span>
              Transfer: <strong className="text-foreground">{invoice.bankName} {invoice.bankAccountNumber}</strong> a/n <strong className="text-foreground">{invoice.bankAccountName}</strong>
            </span>
          </div>
        </div>

        {/* Sticky Mobile/Desktop Action Bar */}
        <DialogFooter className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-md pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-auto shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl cursor-pointer"
          >
            Tutup
          </Button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {onDuplicate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDuplicate(invoice);
                }}
                className="text-xs h-9 px-3 rounded-xl border-border text-foreground hover:bg-muted font-bold transition-all hover:scale-105 active:scale-95"
                title="Buat salinan invoice ini sebagai draft baru"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Duplikat
              </Button>
            )}

            {onOpenCrewSheet && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenCrewSheet(invoice);
                }}
                className="text-xs h-9 px-3.5 rounded-xl border-[#4d3085]/30 text-[#4d3085] dark:text-[#c4b5fd] hover:bg-[#4d3085]/10 font-bold transition-all hover:scale-105 active:scale-95"
                title="Buka Lembar Kerja & Checklist Alat Lapangan"
              >
                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5 text-[#f370a8]" /> Checklist Crew
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
              className="text-xs h-9 px-3.5 rounded-xl border-[#4d3085]/30 text-[#4d3085] dark:text-[#c4b5fd] hover:bg-[#4d3085]/10 font-bold transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onPrint(invoice);
              }}
              className="text-xs h-9 px-3.5 rounded-xl border-border text-foreground hover:bg-muted font-bold transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-foreground" /> Cetak (A5)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
              className="text-xs h-9 px-4 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-extrabold shadow-md shadow-[#f370a8]/20 transition-all hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Invoice
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
