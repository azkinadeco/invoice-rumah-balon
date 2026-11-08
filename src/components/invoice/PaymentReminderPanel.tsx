'use client';

import React, { useMemo, useState } from 'react';
import { InvoiceData } from '@/types/invoice';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getPaidAndRemaining } from '@/lib/payment';
import { BellRing, MessageCircle, CheckCircle2, ChevronDown } from 'lucide-react';

/** How many days ahead an unpaid event counts as "due soon" (pelunasan H-1). */
const DUE_WINDOW_DAYS = 3;

export { getPaidAndRemaining };

function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function dueLabel(days: number) {
  if (days < 0) return { text: `Lewat ${-days} hari`, tone: 'bg-rose-600 text-white' };
  if (days === 0) return { text: 'Hari ini', tone: 'bg-rose-500 text-white' };
  if (days === 1) return { text: 'Besok', tone: 'bg-amber-500 text-white' };
  return { text: `H-${days}`, tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
}

interface PaymentReminderPanelProps {
  invoices: InvoiceData[];
  onSendReminder: (inv: InvoiceData, remaining: number) => void;
  onMarkPaid: (inv: InvoiceData) => void;
  onOpenDetail: (inv: InvoiceData) => void;
}

export const PaymentReminderPanel: React.FC<PaymentReminderPanelProps> = ({
  invoices,
  onSendReminder,
  onMarkPaid,
  onOpenDetail,
}) => {
  const [expanded, setExpanded] = useState(false);

  const due = useMemo(
    () =>
      invoices
        .filter((inv) => inv.status !== 'cancelled' && inv.status !== 'paid' && inv.bookingDate)
        .map((inv) => ({ inv, days: daysUntil(inv.bookingDate), ...getPaidAndRemaining(inv) }))
        // Due soon, or already past and still unpaid (up to 30 days back)
        .filter((x) => x.remaining > 0 && x.days <= DUE_WINDOW_DAYS && x.days >= -30)
        .sort((a, b) => a.days - b.days),
    [invoices]
  );

  if (due.length === 0) return null;

  const totalDue = due.reduce((s, x) => s + x.remaining, 0);
  const visible = expanded ? due : due.slice(0, 3);

  return (
    <section
      aria-label="Pengingat tagihan yang perlu dilunasi"
      className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3 sm:p-3.5 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
              Perlu Ditagih ({due.length})
            </h2>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Acara ≤ {DUE_WINDOW_DAYS} hari lagi / sudah lewat, belum lunas • total{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(totalDue)}</span>
            </p>
          </div>
        </div>
      </div>

      <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ inv, days, remaining }) => {
          const label = dueLabel(days);
          return (
            <li
              key={inv.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border"
            >
              <button
                type="button"
                onClick={() => onOpenDetail(inv)}
                className="flex-1 min-w-0 text-left cursor-pointer"
                aria-label={`Lihat detail invoice ${inv.clientName}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn('px-1.5 py-px rounded-md text-[10px] font-bold shrink-0', label.tone)}>
                    {label.text}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {inv.clientName || '(Tanpa Nama)'}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                  {formatDateIndo(inv.bookingDate)} • Sisa{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatRupiah(remaining)}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onSendReminder(inv, remaining)}
                title="Kirim pengingat pelunasan via WhatsApp"
                aria-label={`Kirim pengingat pelunasan ke ${inv.clientName}`}
                className="h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onMarkPaid(inv)}
                title="Tandai lunas"
                aria-label={`Tandai invoice ${inv.clientName} lunas`}
                className="h-9 w-9 rounded-lg border border-border bg-card hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {due.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
        >
          {expanded ? 'Tampilkan lebih sedikit' : `Lihat semua (${due.length})`}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}
    </section>
  );
};
