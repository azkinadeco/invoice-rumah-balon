'use client';

import React, { useState } from 'react';
import { Plus, Trash2, MessageCircle, Wallet, X, Check } from 'lucide-react';
import { InvoiceData, PaymentMethod, PaymentRecord } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDateIndo, formatRupiah, formatThousand, parseRupiahInput, todayLocalISO } from '@/lib/format';
import { PAYMENT_METHODS, getPaidAndRemaining, getPaymentHistory, paymentMethodLabel } from '@/lib/payment';

interface PaymentHistoryProps {
  invoice: InvoiceData;
  onRecord: (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'recordedBy'>) => void;
  /** Admin only; omit to hide delete buttons. */
  onDelete?: (paymentId: string) => void;
  onSendReceipt?: (payment: PaymentRecord) => void;
}

export function PaymentHistory({ invoice, onRecord, onDelete, onSendReceipt }: PaymentHistoryProps) {
  const history = getPaymentHistory(invoice);
  const { dpPaid, remaining } = getPaidAndRemaining(invoice);
  const cancelled = invoice.status === 'cancelled';

  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayLocalISO());
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState('');

  const openForm = () => {
    setAmount(remaining);
    setDate(todayLocalISO());
    setMethod('transfer');
    setNote('');
    setFormOpen(true);
  };

  const overpay = amount > remaining && remaining > 0;
  const canSave = amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const handleSave = () => {
    if (!canSave) return;
    if (overpay && !confirm(`Nominal ${formatRupiah(amount)} melebihi sisa tagihan ${formatRupiah(remaining)}. Tetap catat?`)) {
      return;
    }
    onRecord({ amount, date, method, note: note.trim() || undefined });
    setFormOpen(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#f370a8]" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Riwayat Pembayaran</h3>
        </div>
        <div className="text-right">
          <div className="font-bold text-foreground tabular-nums">
            {formatRupiah(dpPaid)} <span className="font-normal text-muted-foreground">/ {formatRupiah(invoice.total)}</span>
          </div>
          <div className={cn('text-[11px] font-semibold', remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {remaining === 0 ? 'Lunas ✨' : `Sisa ${formatRupiah(remaining)}`}
          </div>
        </div>
      </div>

      {/* Progress bar: paid share of total */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${invoice.total > 0 ? Math.min(100, (dpPaid / invoice.total) * 100) : 0}%` }}
        />
      </div>

      {history.length === 0 ? (
        <p className="text-muted-foreground italic">Belum ada pembayaran yang dicatat.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {history.map((p) => {
            const legacy = p.id.startsWith('legacy-');
            return (
              <li key={p.id} className="flex items-center gap-2 px-3 py-2.5 bg-background/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-foreground tabular-nums">{formatRupiah(p.amount)}</span>
                    {p.method && (
                      <span className="px-1.5 py-px rounded-md bg-muted text-[10px] font-semibold text-foreground/80">
                        {paymentMethodLabel(p.method)}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.date ? formatDateIndo(p.date) : 'Tanggal tidak tercatat'}
                    {p.recordedBy && ` • dicatat ${p.recordedBy}`}
                  </div>
                  {p.note && <div className="text-[11px] text-muted-foreground italic truncate">{p.note}</div>}
                </div>
                {onSendReceipt && !legacy && (
                  <button
                    type="button"
                    onClick={() => onSendReceipt(p)}
                    title="Kirim bukti terima ke pelanggan via WhatsApp"
                    aria-label="Kirim bukti terima via WhatsApp"
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                {onDelete && !legacy && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus catatan pembayaran ${formatRupiah(p.amount)}?`)) onDelete(p.id);
                    }}
                    title="Hapus catatan pembayaran"
                    aria-label="Hapus catatan pembayaran"
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!cancelled && !formOpen && remaining > 0 && (
        <Button
          type="button"
          onClick={openForm}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-1" /> Catat Pembayaran
        </Button>
      )}

      {formOpen && (
        <div className="rounded-xl border border-[#f370a8]/40 bg-[#f370a8]/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Catat pembayaran baru</span>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Batal"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-muted-foreground">Nominal diterima</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                <Input
                  inputMode="numeric"
                  value={amount ? formatThousand(amount) : ''}
                  onChange={(e) => setAmount(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="h-10 pl-8 text-sm font-mono font-bold rounded-xl bg-background"
                  autoFocus
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-muted-foreground">Tanggal diterima</span>
              <Input
                type="date"
                value={date}
                max={todayLocalISO()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-10 text-sm rounded-xl bg-background"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setAmount(remaining)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 cursor-pointer"
              >
                Pelunasan ({formatThousand(remaining)})
              </button>
            )}
            {dpPaid === 0 && (
              <button
                type="button"
                onClick={() => setAmount(Math.round(invoice.total * ((invoice.dpMinPercent || 30) / 100)))}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-900 cursor-pointer"
              >
                DP {invoice.dpMinPercent || 30}%
              </button>
            )}
          </div>

          <div>
            <span className="text-[11px] font-semibold text-muted-foreground">Metode</span>
            <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label="Metode pembayaran">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex-1 h-9 rounded-lg border text-xs font-bold cursor-pointer transition-colors',
                    method === m.id
                      ? 'bg-[#4d3085] border-[#4d3085] text-white'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">Catatan (opsional)</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: transfer dari rekening suami"
              className="mt-1 h-10 text-sm rounded-xl bg-background"
            />
          </label>

          {overpay && (
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              ⚠️ Melebihi sisa tagihan ({formatRupiah(remaining)}).
            </p>
          )}

          <Button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40"
          >
            <Check className="w-4 h-4 mr-1" /> Simpan Pembayaran
          </Button>
        </div>
      )}
    </section>
  );
}
