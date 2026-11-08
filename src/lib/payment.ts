import { InvoiceData, PaymentMethod, PaymentRecord } from '@/types/invoice';
import { todayLocalISO } from '@/lib/format';

export const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'transfer', label: 'Transfer' },
  { id: 'qris', label: 'QRIS' },
  { id: 'tunai', label: 'Tunai' },
];

export function paymentMethodLabel(m?: PaymentMethod): string {
  return PAYMENT_METHODS.find((x) => x.id === m)?.label ?? '—';
}

export function sumPayments(list: PaymentRecord[] | undefined): number {
  return (list || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

/**
 * Single source of truth for "how much has the client paid / still owes".
 * With a payment history the sum of payments counts; older invoices fall back
 * to the single DP number. Paid never exceeds the total.
 */
export function getPaidAndRemaining(inv: InvoiceData) {
  const total = Number(inv.total) || 0;
  if (inv.payments?.length) {
    const dpPaid = Math.min(sumPayments(inv.payments), total);
    return { dpPaid, remaining: Math.max(0, total - dpPaid) };
  }
  if (inv.status === 'paid') return { dpPaid: total, remaining: 0 };
  const rawPaid =
    typeof inv.dpPaidAmount === 'number' && inv.dpPaidAmount > 0
      ? inv.dpPaidAmount
      : inv.status === 'dp_paid'
      ? inv.dpAmount || Math.round(total * 0.3)
      : 0;
  const dpPaid = Math.min(rawPaid, total);
  return { dpPaid, remaining: Math.max(0, total - dpPaid) };
}

/** Minimum DP for an invoice, from its own DP percentage (default 30%). */
export function getMinDp(inv: Pick<InvoiceData, 'total' | 'dpAmount' | 'dpMinPercent'>) {
  const percent = inv.dpMinPercent || 30;
  return { percent, amount: inv.dpAmount || Math.round((Number(inv.total) || 0) * (percent / 100)) };
}

export function newPaymentId() {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Amount paid before payment history existed, shown as one undated row. */
function legacyRecord(inv: InvoiceData, amount: number): PaymentRecord {
  return {
    id: `legacy-${inv.id}`,
    date: '',
    amount,
    note: 'Tercatat sebelum ada riwayat pembayaran',
    createdAt: inv.updatedAt || inv.createdAt || new Date().toISOString(),
  };
}

/** Payments to show for an invoice (real history, or the old DP as one row). */
export function getPaymentHistory(inv: InvoiceData): PaymentRecord[] {
  if (inv.payments?.length) return inv.payments;
  const { dpPaid } = getPaidAndRemaining(inv);
  return dpPaid > 0 ? [legacyRecord(inv, dpPaid)] : [];
}

/** Set the payment list and derive paid / remaining / status from the money. */
export function applyPayments(inv: InvoiceData, payments: PaymentRecord[]): InvoiceData {
  const total = Number(inv.total) || 0;
  const sum = sumPayments(payments);
  let status = inv.status;
  if (status !== 'cancelled') {
    if (total > 0 && sum >= total) status = 'paid';
    else if (sum > 0) status = 'dp_paid';
    else if (status === 'paid' || status === 'dp_paid') status = 'sent';
  }
  return {
    ...inv,
    payments,
    dpPaidAmount: Math.min(sum, total),
    remainingAmount: Math.max(0, total - sum),
    status,
  };
}

export function addPayment(inv: InvoiceData, record: PaymentRecord): InvoiceData {
  return applyPayments(inv, [...getPaymentHistory(inv), record]);
}

export function removePayment(inv: InvoiceData, paymentId: string): InvoiceData {
  return applyPayments(
    inv,
    getPaymentHistory(inv).filter((p) => p.id !== paymentId)
  );
}

/**
 * Keep the history honest when a screen changes the paid amount directly
 * (status "Lunas", DP field, quick buttons): the increase becomes a payment
 * dated today. Decreases on invoices without history stay as before.
 */
export function reconcilePayments(
  prev: InvoiceData | undefined,
  next: InvoiceData,
  recordedBy?: string,
  note = 'Dicatat otomatis dari perubahan status / DP'
): InvoiceData {
  const history = next.payments?.length ? next.payments : prev ? getPaymentHistory(prev) : [];
  const recorded = sumPayments(history);
  const total = Number(next.total) || 0;
  const target =
    next.status === 'paid'
      ? total
      : next.payments?.length
      ? Math.max(recorded, Number(next.dpPaidAmount) || 0)
      : getPaidAndRemaining({ ...next, payments: undefined }).dpPaid;

  if (target > recorded) {
    const extra: PaymentRecord = {
      id: newPaymentId(),
      date: todayLocalISO(),
      amount: target - recorded,
      note,
      recordedBy,
      createdAt: new Date().toISOString(),
    };
    return applyPayments(next, [...history, extra]);
  }
  // Nothing new was paid: re-derive from the history if there is one
  return next.payments?.length ? applyPayments(next, next.payments) : next;
}
