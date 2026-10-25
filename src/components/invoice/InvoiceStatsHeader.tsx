'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { InvoiceData } from '@/types/invoice';

interface InvoiceStatsHeaderProps {
  invoices: InvoiceData[];
  filteredInvoices: InvoiceData[];
  statusFilter: string;
  setStatusFilter: (status: string | ((prev: string) => string)) => void;
  periodFilter: 'all' | 'this_month' | 'last_month';
  setPeriodFilter: (period: 'all' | 'this_month' | 'last_month' | ((prev: any) => any)) => void;
}

export const InvoiceStatsHeader: React.FC<InvoiceStatsHeaderProps> = ({
  invoices,
  filteredInvoices,
  statusFilter,
  setStatusFilter,
  periodFilter,
  setPeriodFilter,
}) => {
  const activeInvoices = filteredInvoices.filter((i) => i.status !== 'cancelled');
  const cancelledCount = filteredInvoices.filter((i) => i.status === 'cancelled').length;

  const totalOmset = activeInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalDpCollected = activeInvoices.reduce((sum, i) => {
    if (i.status === 'paid') return sum + (Number(i.total) || 0);
    const dp =
      typeof i.dpPaidAmount === 'number' && i.dpPaidAmount > 0
        ? i.dpPaidAmount
        : i.status === 'dp_paid'
        ? i.dpAmount || Math.round((i.total || 0) * 0.3)
        : 0;
    return sum + dp;
  }, 0);

  const totalRemainingUnpaid = activeInvoices.reduce((sum, i) => {
    if (i.status === 'paid') return sum;
    const dp =
      typeof i.dpPaidAmount === 'number' && i.dpPaidAmount > 0
        ? i.dpPaidAmount
        : i.status === 'dp_paid'
        ? i.dpAmount || Math.round((i.total || 0) * 0.3)
        : 0;
    return sum + Math.max(0, (i.total || 0) - dp);
  }, 0);

  const paidCount = activeInvoices.filter((i) => i.status === 'paid').length;
  const dpCount = activeInvoices.filter(
    (i) => i.status === 'dp_paid' || (Boolean(i.dpPaidAmount && i.dpPaidAmount > 0) && i.status !== 'paid')
  ).length;
  const unpaidInvoicesCount = activeInvoices.filter((i) => {
    if (i.status === 'paid') return false;
    const dp =
      typeof i.dpPaidAmount === 'number' && i.dpPaidAmount > 0
        ? i.dpPaidAmount
        : i.status === 'dp_paid'
        ? i.dpAmount || Math.round((i.total || 0) * 0.3)
        : 0;
    return (Number(i.total) || 0) - dp > 0;
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Card 1: Total Invoice */}
      <Card
        onClick={() => {
          setStatusFilter('all');
          setPeriodFilter('all');
        }}
        className={cn(
          'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-[#4d3085]/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group',
          statusFilter === 'all' && periodFilter === 'all'
            ? 'ring-2 ring-[#4d3085] dark:ring-[#c4b5fd]/60 border-[#4d3085]/60'
            : 'hover:border-[#4d3085]/40'
        )}
        title="Klik untuk menampilkan seluruh invoice"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4d3085] to-[#f370a8] opacity-80" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Total Invoice</span>
              {periodFilter !== 'all' && (
                <span className="text-[9px] sm:text-[10px] bg-muted/80 text-foreground font-semibold px-2 py-0.5 rounded-full border border-border/80">
                  {periodFilter === 'this_month' ? 'Bulan Ini' : 'Bulan Lalu'}
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
              {filteredInvoices.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              <span className="text-foreground font-bold">{activeInvoices.length}</span> aktif
              {cancelledCount > 0 ? (
                <span className="text-muted-foreground"> • {cancelledCount} batal</span>
              ) : null}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/25 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Nilai Tagihan */}
      <Card
        onClick={() => setPeriodFilter((prev: any) => (prev === 'this_month' ? 'all' : 'this_month'))}
        className={cn(
          'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-[#f370a8]/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group',
          periodFilter === 'this_month'
            ? 'ring-2 ring-[#f370a8] border-[#f370a8]/60'
            : 'hover:border-[#f370a8]/40'
        )}
        title="Klik untuk filter invoice bulan ini"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#f370a8] opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Total Nilai</span>
              {periodFilter !== 'all' && (
                <span className="text-[9px] sm:text-[10px] bg-[#f370a8]/15 text-[#f370a8] dark:text-[#f472b6] font-bold px-2 py-0.5 rounded-full border border-[#f370a8]/30">
                  {periodFilter === 'this_month' ? 'Bulan Ini' : 'Bulan Lalu'}
                </span>
              )}
            </div>
            <div className="text-base sm:text-2xl font-black text-[#f370a8] dark:text-[#f472b6] font-mono tracking-tight truncate">
              {formatRupiah(totalOmset)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              Total tagihan aktif
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f370a8] text-white flex items-center justify-center shadow-md shadow-[#f370a8]/25 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Kas Diterima (DP + Lunas) */}
      <Card
        onClick={() => setStatusFilter((prev: any) => (prev === 'paid' ? 'all' : 'paid'))}
        className={cn(
          'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group',
          statusFilter === 'paid'
            ? 'ring-2 ring-emerald-500 border-emerald-500/60'
            : 'hover:border-emerald-500/40'
        )}
        title="Klik untuk filter invoice yang sudah Lunas"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4d3085] to-emerald-500 opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Kas Masuk</span>
              <span className="text-[9px] sm:text-[10px] bg-[#4d3085]/15 text-[#4d3085] dark:text-[#c4b5fd] font-bold px-2 py-0.5 rounded-full border border-[#4d3085]/30">
                DP+Lunas
              </span>
            </div>
            <div className="text-base sm:text-2xl font-black text-[#4d3085] dark:text-[#c4b5fd] font-mono tracking-tight truncate">
              {formatRupiah(totalDpCollected)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              <span className="text-emerald-500 font-bold">{paidCount}</span> lunas • <span className="text-[#4d3085] dark:text-[#c4b5fd] font-bold">{dpCount}</span> DP
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/25 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Sisa Pelunasan */}
      <Card
        onClick={() => setStatusFilter((prev: any) => (prev === 'dp_paid' ? 'all' : 'dp_paid'))}
        className={cn(
          'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-rose-500/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group',
          statusFilter === 'dp_paid'
            ? 'ring-2 ring-rose-500 border-rose-500/60'
            : 'hover:border-rose-500/40'
        )}
        title="Klik untuk filter invoice yang masih ada sisa tagihan"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-[#f370a8] opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Sisa Piutang</span>
              {unpaidInvoicesCount > 0 && (
                <span className="text-[9px] sm:text-[10px] bg-rose-500/15 text-rose-500 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  {unpaidInvoicesCount} Tertunda
                </span>
              )}
            </div>
            <div className="text-base sm:text-2xl font-black text-rose-500 dark:text-rose-400 font-mono tracking-tight truncate">
              {formatRupiah(totalRemainingUnpaid)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              <span className="text-rose-500 font-bold">{unpaidInvoicesCount}</span> belum lunas
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#f370a8] to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
