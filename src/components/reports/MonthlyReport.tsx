'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Wallet,
  CheckCircle2,
  Clock,
  PartyPopper,
  MessageCircle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { InvoiceData } from '@/types/invoice';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { exportInvoicesToCSV, formatDateIndo, formatRupiah, todayLocalISO } from '@/lib/format';
import {
  monthKeyOf,
  monthLabel,
  outstandingInvoices,
  shiftMonth,
  summarizeMonth,
  topPackages,
} from '@/lib/reports';
import { MonthlyTrendChart } from '@/components/reports/MonthlyTrendChart';

interface MonthlyReportProps {
  invoices: InvoiceData[];
  onOpenInvoice: (inv: InvoiceData) => void;
  onSendReminder: (inv: InvoiceData, remaining: number) => void;
  onNotify?: (message: string) => void;
}

const TREND_MONTHS = 6;

export function MonthlyReport({ invoices, onOpenInvoice, onSendReminder, onNotify }: MonthlyReportProps) {
  const thisMonth = monthKeyOf(todayLocalISO());
  const [monthKey, setMonthKey] = useState(thisMonth);

  const summary = useMemo(() => summarizeMonth(invoices, monthKey), [invoices, monthKey]);
  const previous = useMemo(() => summarizeMonth(invoices, shiftMonth(monthKey, -1)), [invoices, monthKey]);
  const trend = useMemo(
    () =>
      Array.from({ length: TREND_MONTHS }, (_, i) =>
        summarizeMonth(invoices, shiftMonth(monthKey, i - (TREND_MONTHS - 1)))
      ),
    [invoices, monthKey]
  );
  const packages = useMemo(() => topPackages(summary.invoices), [summary.invoices]);
  const unpaid = useMemo(() => outstandingInvoices(invoices), [invoices]);
  const unpaidTotal = unpaid.reduce((s, r) => s + r.remaining, 0);

  const revenueChange =
    previous.revenue > 0 ? Math.round(((summary.revenue - previous.revenue) / previous.revenue) * 100) : null;
  const receivedPct = summary.revenue > 0 ? Math.round((summary.received / summary.revenue) * 100) : 0;

  const handleExport = () => {
    if (summary.invoices.length === 0) {
      onNotify?.(`Belum ada acara di ${monthLabel(monthKey)} untuk diekspor.`);
      return;
    }
    exportInvoicesToCSV(summary.invoices, `Laporan_RumahBalon_${monthKey}.csv`);
    onNotify?.(`Laporan ${monthLabel(monthKey)} diunduh 📊`);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header: title + month switcher + export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">Laporan Bulanan</h1>
          <p className="text-xs text-muted-foreground">Dihitung dari tanggal acara. Invoice batal tidak ikut dihitung.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setMonthKey((k) => shiftMonth(k, -1))}
              aria-label="Bulan sebelumnya"
              className="w-10 h-10 flex items-center justify-center rounded-l-xl hover:bg-muted cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-36 px-2 text-center text-sm font-bold text-foreground tabular-nums">
              {monthLabel(monthKey)}
            </span>
            <button
              type="button"
              onClick={() => setMonthKey((k) => shiftMonth(k, 1))}
              aria-label="Bulan berikutnya"
              className="w-10 h-10 flex items-center justify-center rounded-r-xl hover:bg-muted cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {monthKey !== thisMonth && (
            <Button variant="ghost" onClick={() => setMonthKey(thisMonth)} className="h-10 px-3 text-xs rounded-xl">
              Bulan ini
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-10 px-3 text-xs rounded-xl border-border ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Unduh CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          label="Omzet"
          value={formatRupiah(summary.revenue)}
          compactValue
          icon={Wallet}
          tone="purple"
          sub={
            revenueChange === null
              ? 'Belum ada data bulan lalu'
              : `${revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(revenueChange)}% dari bulan lalu`
          }
        />
        <StatCard
          label="Sudah Diterima"
          value={formatRupiah(summary.received)}
          compactValue
          icon={CheckCircle2}
          tone="emerald"
          sub={`${receivedPct}% dari omzet`}
        />
        <StatCard
          label="Belum Dibayar"
          value={formatRupiah(summary.outstanding)}
          compactValue
          icon={Clock}
          tone="rose"
          sub={`${summary.dpCount + summary.unpaidCount} invoice belum lunas`}
        />
        <StatCard
          label="Jumlah Acara"
          value={summary.eventCount}
          icon={PartyPopper}
          tone="pink"
          sub={summary.eventCount ? `Rata-rata ${formatRupiah(summary.averageValue)}` : 'Belum ada acara'}
        />
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
          ✓ Lunas {summary.paidCount}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold">
          ◐ DP {summary.dpCount}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold">
          ○ Belum bayar {summary.unpaidCount}
        </span>
        {summary.cancelledCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
            ✕ Batal {summary.cancelledCount} ({formatRupiah(summary.cancelledValue)})
          </span>
        )}
      </div>

      {/* Trend chart */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-[#6b46c1] dark:text-[#a78bfa]" />
          <h2 className="text-sm font-bold text-foreground">Omzet 6 bulan terakhir</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">Ketuk batang untuk melihat bulan itu.</p>
        <MonthlyTrendChart months={trend} selectedKey={monthKey} onSelect={setMonthKey} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Top packages */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#f370a8]" />
            <h2 className="text-sm font-bold text-foreground">Paket terlaris {monthLabel(monthKey)}</h2>
          </div>
          {packages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Belum ada pesanan di bulan ini.</p>
          ) : (
            <ol className="space-y-2.5">
              {packages.map((p, i) => {
                const pct = packages[0].revenue > 0 ? (p.revenue / packages[0].revenue) * 100 : 0;
                return (
                  <li key={p.name} className="text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 flex gap-1.5 text-foreground">
                        <span className="text-muted-foreground tabular-nums shrink-0">{i + 1}.</span>
                        <span className="line-clamp-2">{p.name}</span>
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        <span className="block font-bold text-foreground">{formatRupiah(p.revenue)}</span>
                        <span className="block text-[10px] text-muted-foreground">{p.count}× dipesan</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[#6b46c1] dark:bg-[#8b6be0]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Outstanding balances (all months) */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-foreground">Tagihan belum lunas</h2>
            </div>
            <span className="text-right">
              <span className="block text-sm font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatRupiah(unpaidTotal)}
              </span>
              <span className="block text-[10px] text-muted-foreground">semua bulan • {unpaid.length} invoice</span>
            </span>
          </div>
          {unpaid.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Semua tagihan sudah lunas 🎉</p>
          ) : (
            <ul className="divide-y divide-border max-h-80 overflow-y-auto -mx-1">
              {unpaid.map(({ inv, remaining }) => {
                const past = String(inv.bookingDate) < todayLocalISO();
                return (
                  <li key={inv.id} className="flex items-center gap-2 px-1 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenInvoice(inv)}
                      className="min-w-0 flex-1 text-left cursor-pointer rounded-lg hover:bg-muted/60 px-1 -mx-1 py-0.5"
                    >
                      <span className="block text-xs font-semibold text-foreground truncate">
                        {inv.clientName || 'Tanpa nama'}{' '}
                        <span className="font-normal text-muted-foreground">#{inv.invoiceNumber}</span>
                      </span>
                      <span className={past ? 'block text-[10px] text-rose-600 dark:text-rose-400 font-medium' : 'block text-[10px] text-muted-foreground'}>
                        {inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}
                        {past && ' • acara sudah lewat'}
                      </span>
                    </button>
                    <span className="shrink-0 text-xs font-bold text-foreground tabular-nums">{formatRupiah(remaining)}</span>
                    <button
                      type="button"
                      onClick={() => onSendReminder(inv, remaining)}
                      aria-label={`Kirim pengingat WhatsApp ke ${inv.clientName || 'pelanggan'}`}
                      title="Kirim pengingat pelunasan via WhatsApp"
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
