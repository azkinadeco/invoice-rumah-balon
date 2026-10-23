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

interface InvoiceTableViewProps {
  invoices: InvoiceData[];
  onPrintInvoice: (inv: InvoiceData) => void;
  onEditInvoice: (inv: InvoiceData) => void;
  onDetailInvoice: (inv: InvoiceData) => void;
  onSendWhatsApp: (inv: InvoiceData) => void;
  onQuickMarkPaid: (inv: InvoiceData) => void;
  onOpenCrewSheet: (inv: InvoiceData) => void;
  onDuplicateInvoice: (inv: InvoiceData) => void;
  onDeleteInvoice: (id: string, num: string) => void;
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
      <div className="p-8 sm:p-12 rounded-3xl border border-border bg-card text-center space-y-3.5 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[#f370a8]/10 text-[#f370a8] flex items-center justify-center text-xl font-black shadow-inner">
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
          className="h-10 px-5 rounded-2xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold shadow-md shadow-[#f370a8]/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Buat Invoice Baru</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===================== MOBILE CARDS VIEW (< 768px) ===================== */}
      {/* Ergonomic 44px+ touch targets designed for field admin on phones */}
      <div className="sm:hidden space-y-3.5">
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
              className="p-4 rounded-3xl bg-card border border-border shadow-xs space-y-3 transition-all hover:border-[#f370a8]/40"
            >
              {/* Header: Number, Event Date & Status Dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-muted/80 text-foreground px-2.5 py-1 rounded-xl border border-border">
                    #{inv.invoiceNumber}
                  </span>
                  {inv.bookingDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4d3085] dark:text-[#c4b5fd] bg-[#4d3085]/10 px-2 py-0.5 rounded-lg border border-[#4d3085]/20 font-mono">
                      <PartyPopper className="w-3 h-3 text-[#f370a8]" />
                      {formatDateIndo(inv.bookingDate)}
                    </span>
                  )}
                </div>

                <select
                  value={inv.status}
                  onChange={(e) => onQuickChangeStatus(inv.id, e.target.value as InvoiceStatus)}
                  aria-label={`Ubah status invoice #${inv.invoiceNumber}`}
                  className={`${STATUS_COLORS[inv.status]?.badge} text-[11px] font-bold py-1.5 px-3 rounded-full outline-none cursor-pointer shadow-xs transition-all`}
                >
                  <option value="draft" className="bg-card text-foreground">Draft</option>
                  <option value="sent" className="bg-card text-foreground">Terkirim</option>
                  <option value="dp_paid" className="bg-card text-foreground">DP Masuk</option>
                  <option value="paid" className="bg-card text-foreground">Lunas ✨</option>
                  <option value="cancelled" className="bg-card text-foreground">Dibatalkan</option>
                </select>
              </div>

              {/* Client & Price Details */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
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
                      className="text-xs text-muted-foreground hover:text-emerald-500 flex items-center gap-1.5 font-mono pl-10"
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

                  <div className="text-[11px] text-muted-foreground truncate pl-10 pt-0.5">
                    {inv.items[0]?.description || '(Tanpa Item)'}
                    {inv.items.length > 1 && ` (+${inv.items.length - 1} item lainnya)`}
                  </div>
                </div>

                {/* Price block */}
                <div className="text-right shrink-0 font-mono">
                  <div className="text-base font-black text-[#f370a8] dark:text-[#f472b6]">
                    {formatRupiah(inv.total)}
                  </div>
                  {isPaid ? (
                    <span className="text-[11px] text-emerald-500 font-bold block mt-0.5">
                      Lunas Penuh ✨
                    </span>
                  ) : remainingAmount > 0 ? (
                    <div className="text-[10px] space-y-0.5 mt-0.5">
                      <span className="text-[#4d3085] dark:text-[#c4b5fd] block">
                        DP: {formatRupiah(dpPaid)}
                      </span>
                      <span className="text-rose-500 font-bold block">
                        Sisa: {formatRupiah(remainingAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Thumb-friendly mobile action buttons (44px height standard) */}
              <div className="pt-2.5 border-t border-border flex items-center gap-2">
                {/* 1-Tap WhatsApp */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSendWhatsApp(inv)}
                  aria-label={`Kirim WhatsApp ke ${inv.clientName || 'Pelanggan'}`}
                  className="h-11 px-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
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
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
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
                  className="h-11 px-3.5 rounded-2xl border-border text-foreground hover:bg-muted text-xs font-bold active:scale-95 transition-all"
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
                  className="h-11 px-3.5 rounded-2xl border-border text-foreground hover:bg-muted text-xs font-bold active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span className="sr-only">Detail</span>
                </Button>

                {/* Popover More Options */}
                <Popover>
                  <PopoverTrigger
                    type="button"
                    aria-label={`Opsi Lainnya Invoice #${inv.invoiceNumber}`}
                    className="h-11 w-11 rounded-2xl border border-border text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-1.5 space-y-1 rounded-2xl border-border bg-card shadow-xl">
                    {inv.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => onQuickMarkPaid(inv)}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tandai Lunas Penuh ✨</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenCrewSheet(inv)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ClipboardCheck className="w-4 h-4 text-[#f370a8]" />
                      <span>Surat Tugas Kru & Packing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateInvoice(inv)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                      <span>Duplikat Pesanan</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(inv.id, inv.invoiceNumber)}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Invoice</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== DESKTOP TABLE VIEW (>= 768px) ===================== */}
      <div className="hidden sm:block rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider py-4 pl-6 w-32">
                Invoice #
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Pelanggan
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Jadwal Acara
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Layanan / Paket
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-right pr-6">
                Total Tagihan
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-center w-48">
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
                  <TableCell className="py-4 pl-6">
                    <span className="font-mono font-bold text-xs text-foreground bg-muted/70 px-2.5 py-1 rounded-xl border border-border group-hover:border-[#f370a8]/40 transition-colors">
                      #{inv.invoiceNumber}
                    </span>
                  </TableCell>

                  {/* Pelanggan */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {getInitials(inv.clientName)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground group-hover:text-[#f370a8] transition-colors">
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#4d3085]/10 dark:bg-[#4d3085]/20 text-[#4d3085] dark:text-[#c4b5fd] border border-[#4d3085]/25 text-xs font-bold">
                      <PartyPopper className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>{inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}</span>
                    </div>
                  </TableCell>

                  {/* Rincian Paket */}
                  <TableCell>
                    <div className="text-xs text-foreground font-semibold max-w-[200px] truncate">
                      {inv.items[0]?.description || '(Tanpa Item)'}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f370a8]" />
                      <span>{inv.items.length} item pesanan</span>
                    </div>
                  </TableCell>

                  {/* Status Payment Selector */}
                  <TableCell>
                    <select
                      value={inv.status}
                      onChange={(e) => onQuickChangeStatus(inv.id, e.target.value as InvoiceStatus)}
                      aria-label={`Ubah status invoice #${inv.invoiceNumber}`}
                      className={`${STATUS_COLORS[inv.status]?.badge} text-[11px] font-bold py-1 px-2.5 rounded-full outline-none cursor-pointer shadow-xs transition-all`}
                    >
                      <option value="draft" className="bg-card text-foreground">Draft</option>
                      <option value="sent" className="bg-card text-foreground">Terkirim</option>
                      <option value="dp_paid" className="bg-card text-foreground">DP Terbayar</option>
                      <option value="paid" className="bg-card text-foreground">Lunas ✨</option>
                      <option value="cancelled" className="bg-card text-foreground">Dibatalkan</option>
                    </select>
                  </TableCell>

                  {/* Total Tagihan */}
                  <TableCell className="text-right pr-6 font-mono">
                    <div className="font-black text-sm text-[#f370a8] dark:text-[#f472b6]">
                      {formatRupiah(inv.total)}
                    </div>
                    {isPaid ? (
                      <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">
                        Lunas Penuh ✨
                      </span>
                    ) : remainingAmount > 0 ? (
                      <div className="text-[10px] space-y-0.5 mt-0.5">
                        <span className="text-[#4d3085] dark:text-[#c4b5fd] font-semibold block">
                          DP: {formatRupiah(dpPaid)}
                        </span>
                        <span className="text-rose-500 font-bold block">
                          Sisa: {formatRupiah(remainingAmount)}
                        </span>
                      </div>
                    ) : null}
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Quick 1-click WhatsApp */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onSendWhatsApp(inv)}
                        aria-label={`Kirim rincian invoice #${inv.invoiceNumber} ke WhatsApp`}
                        className="h-8 w-8 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15 transition-all hover:scale-105 active:scale-95"
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
                        className="h-8 px-2.5 rounded-xl bg-[#f370a8]/15 hover:bg-[#f370a8]/25 text-[#be185d] dark:text-[#f472b6] hover:scale-105 active:scale-95 transition-all font-bold text-xs flex items-center gap-1 border border-[#f370a8]/30 shadow-2xs"
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
                        className="h-8 w-8 rounded-xl hover:bg-muted text-foreground hover:scale-105 active:scale-95 transition-all"
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
                        className="h-8 w-8 rounded-xl hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] hover:scale-105 active:scale-95 transition-all"
                        title="Lihat Detail Pesanan"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Secondary Menu Popover */}
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          aria-label={`Menu Aksi Lainnya Invoice #${inv.invoiceNumber}`}
                          className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-1.5 space-y-1 rounded-2xl border-border bg-card shadow-xl">
                          {inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => onQuickMarkPaid(inv)}
                              className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tandai Lunas Penuh ✨</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenCrewSheet(inv)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4 text-[#f370a8]" />
                            <span>Surat Tugas Kru & Packing</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateInvoice(inv)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                            <span>Duplikat Invoice</span>
                          </button>
                          <div className="h-px bg-border my-1" />
                          <button
                            type="button"
                            onClick={() => onDeleteInvoice(inv.id, inv.invoiceNumber)}
                            className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus Invoice</span>
                          </button>
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
