import { InvoiceData } from '@/types/invoice';
import { getPaidAndRemaining } from '@/lib/payment';

/** "YYYY-MM" of a "YYYY-MM-DD" date, or '' when missing. */
export function monthKeyOf(date?: string): string {
  return date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function monthLabel(key: string, short = false): string {
  const [y, m] = key.split('-').map(Number);
  return short ? `${MONTHS_SHORT_ID[m - 1]} ${String(y).slice(2)}` : `${MONTHS_ID[m - 1]} ${y}`;
}

export interface MonthSummary {
  key: string;
  /** Non-cancelled invoices whose event (booking date) falls in this month. */
  invoices: InvoiceData[];
  eventCount: number;
  revenue: number;
  received: number;
  outstanding: number;
  averageValue: number;
  paidCount: number;
  dpCount: number;
  unpaidCount: number;
  cancelledCount: number;
  cancelledValue: number;
}

/** Revenue is counted in the month of the EVENT (booking date), like the schedule. */
export function summarizeMonth(all: InvoiceData[], key: string): MonthSummary {
  const inMonth = all.filter((inv) => monthKeyOf(inv.bookingDate) === key);
  const active = inMonth.filter((inv) => inv.status !== 'cancelled');
  const cancelled = inMonth.filter((inv) => inv.status === 'cancelled');

  let revenue = 0;
  let received = 0;
  let outstanding = 0;
  let paidCount = 0;
  let dpCount = 0;
  let unpaidCount = 0;
  for (const inv of active) {
    const { dpPaid, remaining } = getPaidAndRemaining(inv);
    revenue += Number(inv.total) || 0;
    received += dpPaid;
    outstanding += remaining;
    if (remaining === 0) paidCount++;
    else if (dpPaid > 0) dpCount++;
    else unpaidCount++;
  }

  return {
    key,
    invoices: active,
    eventCount: active.length,
    revenue,
    received,
    outstanding,
    averageValue: active.length ? Math.round(revenue / active.length) : 0,
    paidCount,
    dpCount,
    unpaidCount,
    cancelledCount: cancelled.length,
    cancelledValue: cancelled.reduce((s, inv) => s + (Number(inv.total) || 0), 0),
  };
}

export interface PackageStat {
  name: string;
  count: number;
  revenue: number;
}

/** Most ordered line items in a set of invoices (grouped by description, case-insensitive). */
export function topPackages(invoices: InvoiceData[], limit = 5): PackageStat[] {
  const map = new Map<string, PackageStat>();
  for (const inv of invoices) {
    for (const it of inv.items || []) {
      const name = (it.description || '').trim();
      const amount = Number(it.amount) || 0;
      if (!name || amount <= 0) continue; // skip empty rows and free items (e.g. Rp 0 transport)
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      const cur = map.get(key) || { name, count: 0, revenue: 0 };
      cur.count += Number(it.quantity) || 1;
      cur.revenue += amount;
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.count - a.count).slice(0, limit);
}

/** Unpaid balances across ALL months, oldest event first. */
export function outstandingInvoices(all: InvoiceData[]) {
  return all
    .filter((inv) => inv.status !== 'cancelled')
    .map((inv) => ({ inv, ...getPaidAndRemaining(inv) }))
    .filter((r) => r.remaining > 0)
    .sort((a, b) => String(a.inv.bookingDate).localeCompare(String(b.inv.bookingDate)));
}
