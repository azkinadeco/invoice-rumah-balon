'use client';

import React from 'react';
import { InvoiceData, InvoiceStatus } from '@/types/invoice';
import { STATUS_COLORS } from '@/lib/constants';
import { formatRupiah, formatDateIndo, formatWhatsAppPhone } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { StatusPill } from '@/components/common/StatusPill';
import {
  Printer,
  Edit3,
  Eye,
  MoreHorizontal,
  MessageCircle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Trash2,
  PartyPopper,
  Phone,
  Plus,
} from 'lucide-react';

const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'dp_paid', label: 'DP Masuk' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

interface InvoiceTableViewProps {
  invoices: InvoiceData[];
  onPrintInvoice: (inv: InvoiceData) => void;
  onEditInvoice: (inv: InvoiceData) => void;
  onDetailInvoice: (inv: InvoiceData) => void;
  onSendWhatsApp: (inv: InvoiceData) => void;
  onQuickMarkPaid: (inv: InvoiceData) => void;
  onOpenCrewSheet: (inv: InvoiceData) => void;
  onDuplicateInvoice: (inv: InvoiceData) => void;
  /** Admin only: omit to hide the delete action. */
  onDeleteInvoice?: (id: string, num: string) => void;
  onQuickChangeStatus: (id: string, status: InvoiceStatus) => void;
  onCreateNewInvoice: () => void;
}

export const InvoiceTableView: React.FC<InvoiceTableViewProps> = ({
  invoices,
  onPrintInvoice,
  onEditInvoice,
  onDetailInvoice,
  onSendWhatsApp,
  onQuickMarkPaid,
  onOpenCrewSheet,
  onDuplicateInvoice,
  onDeleteInvoice,
  onQuickChangeStatus,
  onCreateNewInvoice,
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'RB';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (invoices.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f370a8]/10 text-[#f370a8] flex items-center justify-center text-base font-black">
          RB
        </div>
        <div className="text-base font-bold text-foreground">Tidak Ada Invoice Ditemukan</div>
        <p className="text-xs max-w-sm mx-auto text-muted-foreground">
          Tidak ada data pesanan yang cocok dengan kriteria pencarian atau filter yang dipilih.
        </p>
        <Button
          type="button"
          onClick={onCreateNewInvoice}
          aria-label="Buat Invoice Baru Sekarang"
          className="h-10 px-5 rounded-xl bg-[#f370a8] hover:bg-[#e85d98] text-white text-xs font-bold shadow-sm transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Buat Invoice Baru</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===================== CARD VIEW: mobile & tablet (< 1024px) ===================== */}
      {/* Ergonomic 44px+ touch targets designed for field admin on phones */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {invoices.map((inv) => {
          const formattedPhone = formatWhatsAppPhone(inv.clientPhone);
          const isPaid = inv.status === 'paid';
          const dpPaid =
            typeof inv.dpPaidAmount === 'number' && inv.dpPaidAmount > 0
              ? inv.dpPaidAmount
              : inv.status === 'dp_paid'
              ? inv.dpAmount || Math.round(inv.total * 0.3)
              : 0;
          const remainingAmount =
            typeof inv.remainingAmount === 'number'
              ? inv.remainingAmount
              : Math.max(0, inv.total - dpPaid);

          return (
            <div
              key={inv.id}
              className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs space-y-3"
            >
              {/* Header: Number, Event Date & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-[11px] font-semibold text-muted-foreground">
                  <span className="font-mono text-foreground">#{inv.invoiceNumber}</span>
                  {inv.bookingDate && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                      <span className="inline-flex items-center gap-1 truncate text-[#4d3085] dark:text-[#c4b5fd]">
                        <PartyPopper className="w-3 h-3 text-[#f370a8] shrink-0" />
                        {formatDateIndo(inv.bookingDate)}
                      </span>
                    </>
                  )}
                </div>

                <StatusPill
                  value={inv.status}
                  options={INVOICE_STATUS_OPTIONS}
                  onChange={(v) => onQuickChangeStatus(inv.id, v as InvoiceStatus)}
                  badgeClassName={STATUS_COLORS[inv.status]?.badge}
                  ariaLabel={`Ubah status invoice #${inv.invoiceNumber}`}
                />
              </div>

              {/* Client & Price Details */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {getInitials(inv.clientName)}
                    </div>
                    <div className="font-bold text-sm text-foreground truncate">
                      {inv.clientName || '(Tanpa Nama)'}
                    </div>
                  </div>

                  {inv.clientPhone ? (
                    <a
                      href={formattedPhone ? `https://wa.me/${formattedPhone}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Hubungi ${inv.clientName} via WhatsApp`}
                      className="text-xs text-muted-foreground hover:text-emerald-600 flex items-center gap-1.5 font-mono pl-10 w-fit"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>{inv.clientPhone}</span>
                    </a>
                  ) : null}

                  {(inv.venue || inv.clientAddress) && (
                    <div className="text-[11px] text-muted-foreground truncate pl-10">
                      📍 {inv.venue || inv.clientAddress}
                    </div>
                  )}

                  <div className="text-[11px] text-foreground/80 truncate pl-10">
                    {inv.items[0]?.description || '(Tanpa Item)'}
                    {inv.items.length > 1 && ` (+${inv.items.length - 1} item lainnya)`}
                  </div>
                </div>

                {/* Price block */}
                <div className="text-right shrink-0 font-mono">
                  <div className="text-[15px] font-extrabold text-foreground tabular-nums">
                    {formatRupiah(inv.total)}
                  </div>
                  {isPaid ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      Lunas Penuh
                    </span>
                  ) : remainingAmount > 0 ? (
                    <div className="text-[10px] space-y-0.5 mt-0.5">
                      {dpPaid > 0 && (
                        <span className="text-[#4d3085] dark:text-[#c4b5fd] block">
                          DP: {formatRupiah(dpPaid)}
                        </span>
                      )}
                      <span className="text-rose-500 font-bold block">
                        Sisa: {formatRupiah(remainingAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Thumb-friendly mobile action buttons (44px height standard) */}
              <div className="pt-3 border-t border-border flex items-center gap-1.5">
                {/* 1-Tap WhatsApp */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSendWhatsApp(inv)}
                  aria-label={`Kirim WhatsApp ke ${inv.clientName || 'Pelanggan'}`}
                  className="h-11 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WA</span>
                </Button>

                {/* Print A5 */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onPrintInvoice(inv)}
                  aria-label={`Cetak A5 Invoice #${inv.invoiceNumber}`}
                  className="flex-1 h-11 rounded-xl bg-[#f370a8] hover:bg-[#e85d98] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak A5</span>
                </Button>

                {/* Edit */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditInvoice(inv)}
                  aria-label={`Edit Invoice #${inv.invoiceNumber}`}
                  className="h-11 w-11 px-0 rounded-xl border-border text-foreground hover:bg-muted text-xs font-bold active:scale-95 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="sr-only">Edit</span>
                </Button>

                {/* Detail */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDetailInvoice(inv)}
                  aria-label={`Detail Pesanan Invoice #${inv.invoiceNumber}`}
                  className="h-11 w-11 px-0 rounded-xl border-border text-foreground hover:bg-muted text-xs font-bold active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span className="sr-only">Detail</span>
                </Button>

                {/* Popover More Options */}
                <Popover>
                  <PopoverTrigger
                    type="button"
                    aria-label={`Opsi Lainnya Invoice #${inv.invoiceNumber}`}
                    className="h-11 w-11 shrink-0 rounded-xl border border-border text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </PopoverTrigger>
                  <PopoverContent closeOnClick align="end" className="w-56 p-1.5 space-y-0.5 rounded-xl border-border bg-card shadow-xl">
                    {inv.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => onQuickMarkPaid(inv)}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tandai Lunas Penuh</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenCrewSheet(inv)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ClipboardCheck className="w-4 h-4 text-[#f370a8]" />
                      <span>Surat Tugas Kru & Packing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateInvoice(inv)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                      <span>Duplikat Pesanan</span>
                    </button>
                    {onDeleteInvoice && (
                      <>
                    <div className="h-px bg-border my-1" />
                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(inv.id, inv.invoiceNumber)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Invoice</span>
                    </button>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== DESKTOP TABLE VIEW (>= 1024px) ===================== */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-5 w-28">
                Invoice #
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pelanggan
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Jadwal Acara
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Layanan / Paket
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-5">
                Total Tagihan
              </TableHead>
              <TableHead className="h-11 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-5 w-52">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border">
            {invoices.map((inv) => {
              const formattedPhone = formatWhatsAppPhone(inv.clientPhone);
              const isPaid = inv.status === 'paid';
              const dpPaid =
                typeof inv.dpPaidAmount === 'number' && inv.dpPaidAmount > 0
                  ? inv.dpPaidAmount
                  : inv.status === 'dp_paid'
                  ? inv.dpAmount || Math.round(inv.total * 0.3)
                  : 0;
              const remainingAmount =
                typeof inv.remainingAmount === 'number'
                  ? inv.remainingAmount
                  : Math.max(0, inv.total - dpPaid);

              return (
                <TableRow
                  key={inv.id}
                  className="border-border hover:bg-muted/40 transition-colors group"
                >
                  {/* No. Invoice */}
                  <TableCell className="py-3 pl-5">
                    <span className="font-mono font-semibold text-xs text-foreground">
                      #{inv.invoiceNumber}
                    </span>
                  </TableCell>

                  {/* Pelanggan */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                        {getInitials(inv.clientName)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-[13px] text-foreground">
                          {inv.clientName || '(Tanpa Nama)'}
                        </div>
                        {inv.clientPhone ? (
                          <a
                            href={formattedPhone ? `https://wa.me/${formattedPhone}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1 font-mono"
                            aria-label={`Hubungi ${inv.clientName} via WhatsApp`}
                          >
                            <Phone className="w-3 h-3 text-[#f370a8]" />
                            <span>{inv.clientPhone}</span>
                          </a>
                        ) : (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>—</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Tanggal Acara */}
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground whitespace-nowrap">
                      <PartyPopper className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>{inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}</span>
                    </div>
                  </TableCell>

                  {/* Rincian Paket */}
                  <TableCell>
                    <div className="text-xs text-foreground font-medium max-w-[220px] truncate" title={inv.items[0]?.description}>
                      {inv.items[0]?.description || '(Tanpa Item)'}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f370a8]" />
                      <span>{inv.items.length} item pesanan</span>
                    </div>
                  </TableCell>

                  {/* Status Payment Selector */}
                  <TableCell>
                    <StatusPill
                      value={inv.status}
                      options={INVOICE_STATUS_OPTIONS}
                      onChange={(v) => onQuickChangeStatus(inv.id, v as InvoiceStatus)}
                      badgeClassName={STATUS_COLORS[inv.status]?.badge}
                      ariaLabel={`Ubah status invoice #${inv.invoiceNumber}`}
                    />
                  </TableCell>

                  {/* Total Tagihan */}
                  <TableCell className="text-right pr-5 tabular-nums">
                    <div className="font-extrabold text-sm text-foreground">
                      {formatRupiah(inv.total)}
                    </div>
                    {isPaid ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                        Lunas Penuh
                      </span>
                    ) : remainingAmount > 0 ? (
                      <div className="text-[11px] space-y-0.5 mt-0.5">
                        {dpPaid > 0 && (
                          <span className="text-[#4d3085] dark:text-[#c4b5fd] font-semibold block">
                            DP: {formatRupiah(dpPaid)}
                          </span>
                        )}
                        <span className="text-rose-500 font-bold block">
                          Sisa: {formatRupiah(remainingAmount)}
                        </span>
                      </div>
                    ) : null}
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick 1-click WhatsApp */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onSendWhatsApp(inv)}
                        aria-label={`Kirim rincian invoice #${inv.invoiceNumber} ke WhatsApp`}
                        className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15 transition-all active:scale-95"
                        title="Kirim rincian invoice ke WhatsApp pelanggan"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>

                      {/* Print A5 */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onPrintInvoice(inv)}
                        aria-label={`Preview dan Cetak A5 Invoice #${inv.invoiceNumber}`}
                        className="h-8 px-2.5 rounded-lg bg-[#f370a8]/12 hover:bg-[#f370a8]/22 text-[#be185d] dark:text-[#f472b6] active:scale-95 transition-colors font-bold text-xs flex items-center gap-1 border border-[#f370a8]/25"
                        title="Preview & Cetak Format Standar A5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>A5</span>
                      </Button>

                      {/* Edit */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditInvoice(inv)}
                        aria-label={`Edit Invoice #${inv.invoiceNumber}`}
                        className="h-8 w-8 rounded-lg hover:bg-muted text-foreground active:scale-95 transition-all"
                        title="Edit Invoice"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      {/* Detail */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDetailInvoice(inv)}
                        aria-label={`Lihat Detail Invoice #${inv.invoiceNumber}`}
                        className="h-8 w-8 rounded-lg hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] active:scale-95 transition-all"
                        title="Lihat Detail Pesanan"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Secondary Menu Popover */}
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          aria-label={`Menu Aksi Lainnya Invoice #${inv.invoiceNumber}`}
                          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </PopoverTrigger>
                        <PopoverContent closeOnClick align="end" className="w-56 p-1.5 space-y-0.5 rounded-xl border-border bg-card shadow-xl">
                          {inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => onQuickMarkPaid(inv)}
                              className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tandai Lunas Penuh</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenCrewSheet(inv)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4 text-[#f370a8]" />
                            <span>Surat Tugas Kru & Packing</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateInvoice(inv)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                            <span>Duplikat Invoice</span>
                          </button>
                          {onDeleteInvoice && (
                            <>
                          <div className="h-px bg-border my-1" />
                          <button
                            type="button"
                            onClick={() => onDeleteInvoice(inv.id, inv.invoiceNumber)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus Invoice</span>
                          </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
