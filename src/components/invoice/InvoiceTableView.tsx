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
  ChevronDown,
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

interface RowMenuProps {
  inv: InvoiceData;
  size: 'sm' | 'lg';
  onDetail: (inv: InvoiceData) => void;
  onPrint: (inv: InvoiceData) => void;
  onMarkPaid: (inv: InvoiceData) => void;
  onCrewSheet: (inv: InvoiceData) => void;
  onDuplicate: (inv: InvoiceData) => void;
  onDelete: (id: string, num: string) => void;
}

const RowMenu: React.FC<RowMenuProps> = ({ inv, size, onDetail, onPrint, onMarkPaid, onCrewSheet, onDuplicate, onDelete }) => {
  const item = `w-full text-left px-3 ${size === 'lg' ? 'py-3' : 'py-2'} text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors`;
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`Menu Aksi Lainnya Invoice #${inv.invoiceNumber}`}
        className={`${size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'} rounded-xl border border-border text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5 space-y-0.5 rounded-2xl border-border bg-card shadow-xl">
        <button type="button" onClick={() => onDetail(inv)} className={`${item} hover:bg-muted text-foreground`}>
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>Lihat Detail</span>
        </button>
        <button type="button" onClick={() => onPrint(inv)} className={`${item} hover:bg-[#f370a8]/10 text-[#be185d] dark:text-[#f472b6]`}>
          <Printer className="w-4 h-4" />
          <span>Preview & Cetak A5</span>
        </button>
        {inv.status !== 'paid' && (
          <button type="button" onClick={() => onMarkPaid(inv)} className={`${item} hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>Tandai Lunas Penuh ✨</span>
          </button>
        )}
        <button type="button" onClick={() => onCrewSheet(inv)} className={`${item} hover:bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd]`}>
          <ClipboardCheck className="w-4 h-4 text-[#f370a8]" />
          <span>Surat Tugas Kru & Packing</span>
        </button>
        <button type="button" onClick={() => onDuplicate(inv)} className={`${item} hover:bg-muted text-foreground`}>
          <Copy className="w-4 h-4 text-muted-foreground" />
          <span>Duplikat Invoice</span>
        </button>
        <div className="h-px bg-border my-1" />
        <button type="button" onClick={() => onDelete(inv.id, inv.invoiceNumber)} className={`${item} hover:bg-rose-500/10 text-rose-500`}>
          <Trash2 className="w-4 h-4" />
          <span>Hapus Invoice</span>
        </button>
      </PopoverContent>
    </Popover>
  );
};

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

  const menuProps = {
    onDetail: onDetailInvoice,
    onPrint: onPrintInvoice,
    onMarkPaid: onQuickMarkPaid,
    onCrewSheet: onOpenCrewSheet,
    onDuplicate: onDuplicateInvoice,
    onDelete: onDeleteInvoice,
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
        {invoices.map((inv, idx) => {
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
              style={{ animationDelay: `${idx * 40}ms` }}
              className="p-4 rounded-3xl bg-card/90 backdrop-blur-xl border border-border/80 shadow-xs space-y-3 transition-all duration-300 hover:border-[#f370a8]/50 hover:shadow-md animate-in fade-in-50 slide-in-from-bottom-2"
            >
              {/* Header: Number, Event Date & Status Dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-muted/80 text-foreground px-2.5 py-1 rounded-xl border border-border">
                    #{inv.invoiceNumber}
                  </span>
                  {inv.bookingDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4d3085] dark:text-[#c4b5fd] bg-[#4d3085]/15 px-2 py-0.5 rounded-lg border border-[#4d3085]/30 font-mono">
                      <PartyPopper className="w-3 h-3 text-[#f370a8]" />
                      {formatDateIndo(inv.bookingDate)}
                    </span>
                  )}
                </div>

                <div className="relative inline-block">
                  <select
                    value={inv.status}
                    onChange={(e) => onQuickChangeStatus(inv.id, e.target.value as InvoiceStatus)}
                    aria-label={`Ubah status invoice #${inv.invoiceNumber}`}
                    className={`${STATUS_COLORS[inv.status]?.badge} appearance-none text-xs font-bold py-2 pl-3 pr-8 rounded-full outline-none cursor-pointer shadow-xs transition-all hover:scale-105`}
                  >
                    <option value="draft" className="bg-card text-foreground">Draft</option>
                    <option value="sent" className="bg-card text-foreground">Terkirim</option>
                    <option value="dp_paid" className="bg-card text-foreground">DP Masuk</option>
                    <option value="paid" className="bg-card text-foreground">Lunas ✨</option>
                    <option value="cancelled" className="bg-card text-foreground">Dibatalkan</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>

              {/* Client & Price Details */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Lihat detail invoice #${inv.invoiceNumber}`}
                onClick={() => onDetailInvoice(inv)}
                onKeyDown={(e) => e.key === 'Enter' && onDetailInvoice(inv)}
                className="flex items-start justify-between gap-3 pt-1 cursor-pointer"
              >
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
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Hubungi ${inv.clientName} via WhatsApp`}
                      className="text-xs text-muted-foreground hover:text-emerald-500 flex items-center gap-1.5 font-mono pl-10 transition-colors"
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
                  ) : dpPaid > 0 && remainingAmount > 0 ? (
                    <div className="text-[10px] space-y-0.5 mt-0.5">
                      <span className="text-[#4d3085] dark:text-[#c4b5fd] font-semibold block">
                        DP: {formatRupiah(dpPaid)}
                      </span>
                      <span className="text-rose-500 font-bold block">
                        Sisa: {formatRupiah(remainingAmount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
                      Belum ada DP
                    </span>
                  )}
                </div>
              </div>

              {/* Thumb-friendly mobile actions: 1 primary + edit + menu */}
              <div className="pt-2.5 border-t border-border flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSendWhatsApp(inv)}
                  aria-label={`Kirim WhatsApp ke ${inv.clientName || 'Pelanggan'}`}
                  className="flex-1 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim WA</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditInvoice(inv)}
                  aria-label={`Edit Invoice #${inv.invoiceNumber}`}
                  className="h-11 px-4 rounded-2xl border-border text-foreground hover:bg-muted text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </Button>

                <RowMenu {...menuProps} inv={inv} size="lg" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== DESKTOP TABLE VIEW (>= 768px) ===================== */}
      <div className="hidden sm:block rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl overflow-hidden shadow-sm transition-all">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
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
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-right pr-6">
                Total Tagihan
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-center w-40">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/70">
            {invoices.map((inv, idx) => {
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
                  style={{ animationDelay: `${idx * 25}ms` }}
                  onClick={() => onDetailInvoice(inv)}
                  className="border-border/70 hover:bg-[#f370a8]/5 dark:hover:bg-[#f370a8]/8 transition-all duration-200 group animate-in fade-in-50 cursor-pointer"
                >
                  {/* No. Invoice */}
                  <TableCell className="py-4 pl-6">
                    <span className="font-mono font-bold text-xs text-foreground bg-muted/80 px-2.5 py-1 rounded-xl border border-border group-hover:border-[#f370a8]/50 group-hover:bg-card transition-all">
                      #{inv.invoiceNumber}
                    </span>
                  </TableCell>

                  {/* Pelanggan */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                        {getInitials(inv.clientName)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground group-hover:text-[#f370a8] transition-colors">
                          {inv.clientName || '(Tanpa Nama)'}
                        </div>
                        <div className="text-[11px] text-muted-foreground max-w-[220px] truncate">
                          {inv.items[0]?.description || '(Tanpa Item)'}
                          {inv.items.length > 1 && ` (+${inv.items.length - 1})`}
                        </div>
                        {inv.clientPhone ? (
                          <a
                            href={formattedPhone ? `https://wa.me/${formattedPhone}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#4d3085]/15 dark:bg-[#4d3085]/25 text-[#4d3085] dark:text-[#c4b5fd] border border-[#4d3085]/30 text-xs font-bold font-mono">
                      <PartyPopper className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>{inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}</span>
                    </div>
                  </TableCell>

                  {/* Status Payment Selector */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block w-32">
                      <select
                        value={inv.status}
                        onChange={(e) => onQuickChangeStatus(inv.id, e.target.value as InvoiceStatus)}
                        aria-label={`Ubah status invoice #${inv.invoiceNumber}`}
                        className={`${STATUS_COLORS[inv.status]?.badge} appearance-none w-full text-center pl-3 pr-7 py-1.5 rounded-full text-xs font-bold outline-none cursor-pointer shadow-2xs transition-all hover:brightness-105 border`}
                      >
                        <option value="draft" className="bg-card text-foreground">Draft</option>
                        <option value="sent" className="bg-card text-foreground">Terkirim</option>
                        <option value="dp_paid" className="bg-card text-foreground">DP Terbayar</option>
                        <option value="paid" className="bg-card text-foreground">Lunas ✨</option>
                        <option value="cancelled" className="bg-card text-foreground">Dibatalkan</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </TableCell>

                  {/* Total Tagihan */}
                  <TableCell className="text-right pr-6 font-mono whitespace-nowrap">
                    <div className="font-black text-sm tracking-tight text-[#f370a8] dark:text-[#f472b6]">
                      {formatRupiah(inv.total)}
                    </div>
                    <div className="mt-1 flex items-center justify-end">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Lunas Penuh ✨
                        </span>
                      ) : dpPaid > 0 && remainingAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#4d3085] dark:text-[#c4b5fd] font-semibold bg-[#4d3085]/10 px-2 py-0.5 rounded-md">
                          DP {formatRupiah(dpPaid)} • Sisa {formatRupiah(remainingAmount)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Belum ada DP
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Aksi: 1 primary + edit + menu */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onSendWhatsApp(inv)}
                        aria-label={`Kirim rincian invoice #${inv.invoiceNumber} ke WhatsApp`}
                        className="h-9 w-9 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95"
                        title="Kirim rincian invoice ke WhatsApp pelanggan"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditInvoice(inv)}
                        aria-label={`Edit Invoice #${inv.invoiceNumber}`}
                        className="h-9 w-9 rounded-xl hover:bg-muted border border-border text-foreground active:scale-95 transition-all"
                        title="Edit Invoice"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <RowMenu {...menuProps} inv={inv} size="sm" />
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
