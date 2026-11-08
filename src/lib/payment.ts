import { InvoiceData } from '@/types/invoice';

/**
 * Single source of truth for "how much has the client paid / still owes".
 * Paid never exceeds the total, so a lowered total can't show negative balances.
 */
export function getPaidAndRemaining(inv: InvoiceData) {
  const total = Number(inv.total) || 0;
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
