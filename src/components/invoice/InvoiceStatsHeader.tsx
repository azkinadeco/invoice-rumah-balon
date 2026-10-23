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
          'rounded-2xl sm:rounded-3xl border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          statusFilter === 'all' && periodFilter === 'all' && 'ring-2 ring-[#4d3085]/40'
        )}
        title="Klik untuk menampilkan seluruh invoice"
      >
        <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>Total Invoice</span>
              <span className="text-[9px] sm:text-[10px] bg-muted text-foreground font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-border">
                {periodFilter === 'this_month' ? 'Bulan Ini' : periodFilter === 'last_month' ? 'Bulan Lalu' : 'Semua'}
              </span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
              {filteredInvoices.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">
              {activeInvoices.length} aktif {cancelledCount > 0 ? `• ${cancelledCount} batal` : ''}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/20 shrink-0">
            <Receipt className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Nilai Tagihan */}
      <Card
        onClick={() => setPeriodFilter((prev: any) => (prev === 'this_month' ? 'all' : 'this_month'))}
        className={cn(
          'rounded-2xl sm:rounded-3xl border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          periodFilter === 'this_month' && 'ring-2 ring-[#f370a8]/40'
        )}
        title="Klik untuk filter invoice bulan ini"
      >
        <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>Total Nilai</span>
              <span className="text-[9px] sm:text-[10px] bg-[#f370a8]/15 text-[#f370a8] font-bold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#f370a8]/30">
                {periodFilter === 'this_month' ? 'Bulan Ini' : 'Semua'}
              </span>
            </div>
            <div className="text-sm sm:text-2xl font-black text-[#f370a8] dark:text-[#f472b6] font-mono tracking-tight truncate">
              {formatRupiah(totalOmset)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">
              Total tagihan aktif
            </span>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f370a8] text-white flex items-center justify-center shadow-md shadow-[#f370a8]/20 shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Kas Diterima (DP + Lunas) */}
      <Card
        onClick={() => setStatusFilter((prev: any) => (prev === 'paid' ? 'all' : 'paid'))}
        className={cn(
          'rounded-2xl sm:rounded-3xl border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          statusFilter === 'paid' && 'ring-2 ring-emerald-500/40'
        )}
        title="Klik untuk filter invoice yang sudah Lunas"
      >
        <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>Kas Masuk</span>
              <span className="text-[9px] sm:text-[10px] bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] font-bold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#4d3085]/25">
                DP+Lunas
              </span>
            </div>
            <div className="text-sm sm:text-2xl font-black text-[#4d3085] dark:text-[#c4b5fd] font-mono tracking-tight truncate">
              {formatRupiah(totalDpCollected)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">
              {paidCount} lunas • {dpCount} DP
            </span>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/20 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Sisa Pelunasan */}
      <Card
        onClick={() => setStatusFilter((prev: any) => (prev === 'dp_paid' ? 'all' : 'dp_paid'))}
        className={cn(
          'rounded-2xl sm:rounded-3xl border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          statusFilter === 'dp_paid' && 'ring-2 ring-rose-500/40'
        )}
        title="Klik untuk filter invoice yang masih ada sisa tagihan"
      >
        <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>Sisa Piutang</span>
              <span className="text-[9px] sm:text-[10px] bg-rose-500/15 text-rose-500 font-bold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-rose-500/30">
                H-1
              </span>
            </div>
            <div className="text-sm sm:text-2xl font-black text-rose-500 dark:text-rose-400 font-mono tracking-tight truncate">
              {formatRupiah(totalRemainingUnpaid)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">
              {unpaidInvoicesCount} belum lunas
            </span>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#f370a8] to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
