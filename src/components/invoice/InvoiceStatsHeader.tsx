'use client';

import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Receipt, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
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

  // Only show a period badge when a period filter is active
  const periodLabel =
    periodFilter === 'this_month' ? 'Bulan Ini' : periodFilter === 'last_month' ? 'Bulan Lalu' : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <StatCard
        label="Total Invoice"
        value={filteredInvoices.length}
        badge={periodLabel}
        sub={`${activeInvoices.length} aktif${cancelledCount > 0 ? ` • ${cancelledCount} batal` : ''}`}
        icon={Receipt}
        tone="purple"
        active={statusFilter === 'all' && periodFilter === 'all'}
        onClick={() => {
          setStatusFilter('all');
          setPeriodFilter('all');
        }}
        title="Klik untuk menampilkan seluruh invoice"
      />
      <StatCard
        label="Total Nilai"
        value={formatRupiah(totalOmset)}
        compactValue
        badge={periodLabel}
        sub="Total tagihan aktif"
        icon={TrendingUp}
        tone="pink"
        active={periodFilter === 'this_month'}
        onClick={() => setPeriodFilter((prev: any) => (prev === 'this_month' ? 'all' : 'this_month'))}
        title="Klik untuk filter invoice bulan ini"
      />
      <StatCard
        label="Kas Masuk"
        value={formatRupiah(totalDpCollected)}
        compactValue
        badge="DP+Lunas"
        sub={`${paidCount} lunas • ${dpCount} DP`}
        icon={CheckCircle2}
        tone="emerald"
        active={statusFilter === 'paid'}
        onClick={() => setStatusFilter((prev: any) => (prev === 'paid' ? 'all' : 'paid'))}
        title="Klik untuk filter invoice yang sudah Lunas"
      />
      <StatCard
        label="Sisa Piutang"
        value={formatRupiah(totalRemainingUnpaid)}
        compactValue
        badge="H-1"
        sub={`${unpaidInvoicesCount} belum lunas`}
        icon={Clock}
        tone="rose"
        active={statusFilter === 'dp_paid'}
        onClick={() => setStatusFilter((prev: any) => (prev === 'dp_paid' ? 'all' : 'dp_paid'))}
        title="Klik untuk filter invoice yang masih ada sisa tagihan"
      />
    </div>
  );
};
