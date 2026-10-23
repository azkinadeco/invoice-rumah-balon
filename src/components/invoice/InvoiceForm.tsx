'use client';

import React from 'react';
import { InvoiceData, InvoiceItem, InvoiceStatus } from '@/types/invoice';
import { PRESET_ITEMS, STATUS_COLORS } from '@/lib/constants';
import { formatRupiah, parseRupiahInput, formatThousand } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Plus,
  Trash2,
  Sparkles,
  User,
  Calendar,
  CreditCard,
  Phone,
  RefreshCw,
  Percent,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Tag,
  PartyPopper,
} from 'lucide-react';

interface InvoiceFormProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onOpenSettings: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onChange,
  onOpenSettings,
}) => {
  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    let updated = { ...invoice, [key]: value };

    // When status changes
    if (key === 'status') {
      const newStatus = value as InvoiceStatus;
      if (newStatus === 'paid') {
        updated.dpPaidAmount = updated.total;
        updated.remainingAmount = 0;
      } else if (newStatus === 'dp_paid') {
        if (!updated.dpPaidAmount || updated.dpPaidAmount === 0) {
          const defDp = Math.round(updated.total * (updated.dpMinPercent / 100));
          updated.dpPaidAmount = defDp;
          updated.remainingAmount = Math.max(0, updated.total - defDp);
        } else {
          updated.remainingAmount = Math.max(0, updated.total - updated.dpPaidAmount);
        }
      } else if (newStatus === 'draft' || newStatus === 'sent') {
        const paid = updated.dpPaidAmount || 0;
        updated.remainingAmount = Math.max(0, updated.total - paid);
      }
    }

    // Recalculate totals
    if (key === 'items' || key === 'tax' || key === 'discount' || key === 'dpPaidAmount') {
      const items = (key === 'items' ? value : invoice.items) as InvoiceItem[];
      const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      const tax = Number(key === 'tax' ? value : invoice.tax) || 0;
      const discount = Number(key === 'discount' ? value : invoice.discount) || 0;
      const total = Math.max(0, subtotal + tax - discount);
      const dpAmount = Math.round(total * (invoice.dpMinPercent / 100));

      let dpPaid = key === 'dpPaidAmount' ? Number(value) || 0 : (updated.dpPaidAmount || 0);

      // Auto-update status if DP reaches total or DP is given
      if (key === 'dpPaidAmount') {
        if (dpPaid >= total && total > 0) {
          updated.status = 'paid';
          dpPaid = total;
        } else if (dpPaid > 0 && updated.status !== 'dp_paid' && updated.status !== 'paid') {
          updated.status = 'dp_paid';
        } else if (dpPaid === 0 && updated.status === 'dp_paid') {
          updated.status = 'sent';
        }
      }

      const remaining = Math.max(0, total - dpPaid);

      updated.subtotal = subtotal;
      updated.total = total;
      updated.dpAmount = dpAmount;
      updated.dpPaidAmount = dpPaid;
      updated.remainingAmount = remaining;
    }
    onChange(updated);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    const newItems = [...invoice.items, newItem];
    updateField('items', newItems);
  };

  const addPresetItem = (presetIndex: number) => {
    const preset = PRESET_ITEMS[presetIndex];
    if (!preset) return;
    const newItem: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: preset.description,
      quantity: 1,
      unitPrice: preset.amount,
      amount: preset.amount,
    };
    const newItems = [...invoice.items, newItem];
    updateField('items', newItems);
  };

  const updateItem = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice' | 'amount',
    value: string | number
  ) => {
    const newItems = invoice.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Math.max(1, Number(value) || 1) : item.quantity ?? 1;
          const uPrice = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : item.unitPrice ?? item.amount;
          updated.quantity = qty;
          updated.unitPrice = uPrice;
          updated.amount = qty * uPrice;
        }
        return updated;
      }
      return item;
    });
    updateField('items', newItems);
  };

  const removeItem = (id: string) => {
    const newItems = invoice.items.filter((item) => item.id !== id);
    updateField('items', newItems);
  };

  const generateInvoiceNumber = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    updateField('invoiceNumber', `00${rand}`);
  };

  const itemCount = invoice.items.length;
  const isOptimalCount = itemCount <= 4;

  const STATUS_LIST: Array<{ id: InvoiceStatus; label: string; icon: string }> = [
    { id: 'draft', label: 'Draft', icon: '📝' },
    { id: 'sent', label: 'Terkirim', icon: '📤' },
    { id: 'dp_paid', label: 'DP 30%', icon: '💳' },
    { id: 'paid', label: 'Lunas', icon: '✨' },
    { id: 'cancelled', label: 'Batal', icon: '❌' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Info & Pelanggan */}
      <Card className="border-border/70 shadow-sm bg-card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-transparent flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <span className="p-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <User className="w-4 h-4" />
            </span>
            <span>Data Pelanggan & Jadwal Acara</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Status Pesanan:</span>
            <Badge
              variant="outline"
              className={`${STATUS_COLORS[invoice.status]?.badge} text-[11px] font-bold py-0.5 px-2.5 rounded-full`}
            >
              {STATUS_COLORS[invoice.status]?.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Row 1: Invoice Number & Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>No. Invoice Resmi</span>
                <span className="text-[10px] text-muted-foreground font-normal">Auto / Manual</span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={invoice.invoiceNumber}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                  placeholder="001454"
                  className="font-mono font-bold text-xs h-10 rounded-xl bg-muted/40 border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateInvoiceNumber}
                  className="h-10 w-10 shrink-0 rounded-xl border-border hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 transition-transform active:rotate-180"
                  title="Generate Nomor Acak Baru"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="sm:col-span-7">
              <Label className="text-xs font-semibold text-foreground block mb-1.5">
                Status Tagihan
              </Label>
              <div className="grid grid-cols-5 gap-1 bg-muted/50 p-1 rounded-xl border border-border">
                {STATUS_LIST.map((st) => {
                  const isActive = invoice.status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateField('status', st.id)}
                      className={`text-[11px] py-1.5 rounded-lg font-semibold transition-all duration-150 flex items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-card text-foreground shadow-xs ring-1 ring-border font-bold scale-[1.02]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                      }`}
                    >
                      <span className="text-[10px]">{st.icon}</span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Nama Client (Pelanggan)
              </Label>
              <Input
                value={invoice.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Contoh: Siti Rahma"
                className="mt-1.5 h-10 rounded-xl text-xs font-medium border-border"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Nomor WhatsApp Client
              </Label>
              <Input
                value={invoice.clientPhone}
                onChange={(e) => updateField('clientPhone', e.target.value)}
                placeholder="+62 812-3456-7890"
                className="mt-1.5 h-10 rounded-xl text-xs font-mono border-border"
              />
            </div>
          </div>

          {/* Row 3: Modern shadcn Popover DatePickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Terbit Invoice
              </Label>
              <DatePicker
                value={invoice.invoiceDate}
                onChange={(d) => updateField('invoiceDate', d)}
                placeholder="Pilih tanggal terbit..."
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5 mb-1.5">
                <PartyPopper className="w-3.5 h-3.5 text-pink-500 animate-bounce" />
                Tanggal Acara (Booking Date)
              </Label>
              <DatePicker
                value={invoice.bookingDate}
                onChange={(d) => updateField('bookingDate', d)}
                placeholder="Pilih tanggal acara..."
                highlight
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Rincian Paket & Item Pesanan */}
      <Card className="border-border/70 shadow-sm bg-card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>Rincian Paket & Layanan Dekorasi</span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2.5">
            {/* A4 Capacity Badge */}
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
                isOptimalCount
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              {isOptimalCount ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>{itemCount}/4 Item (Pas 1 Halaman A4)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span>{itemCount} Item (Periksa Lembar Preview)</span>
                </>
              )}
            </span>

            <Button
              type="button"
              onClick={addItem}
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-medium rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Preset Buttons Carousel */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-pink-500" />
              <span>Paket Terpopuler Rumah Balon (1-Klik Tambah):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_ITEMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addPresetItem(idx)}
                  className="group text-[11px] bg-muted/40 hover:bg-pink-500/10 dark:hover:bg-pink-500/20 text-foreground hover:text-pink-600 dark:hover:text-pink-300 px-3 py-1.5 rounded-xl border border-border hover:border-pink-400/60 transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02]"
                >
                  <Plus className="w-3 h-3 text-pink-500 group-hover:rotate-90 transition-transform" />
                  <span className="font-semibold">{preset.name}</span>
                  <span className="text-muted-foreground font-mono font-medium">
                    (Rp {formatThousand(preset.amount)})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Line items list */}
          <div className="space-y-3 pt-1">
            {invoice.items.map((item, index) => {
              const qty = item.quantity ?? 1;
              const unitPrice = item.unitPrice ?? item.amount;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-border bg-card/50 hover:bg-accent/20 hover:border-border transition-all duration-150 space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <span>Item #{index + 1}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 px-2 text-[11px] rounded-lg"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Hapus Baris
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Deskripsi */}
                    <div className="md:col-span-6">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Deskripsi Layanan / Paket
                      </Label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Contoh: Decor Balloon and backdrop 2,5m for birthday package..."
                        rows={2}
                        className="w-full mt-1.5 text-xs rounded-xl border border-border p-2.5 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:outline-hidden bg-background text-foreground transition-all"
                      />
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Qty (Jumlah)
                      </Label>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(item.id, 'quantity', Math.max(1, qty - 1))}
                          className="h-10 w-8 rounded-lg shrink-0 border-border text-xs"
                        >
                          -
                        </Button>
                        <Input
                          type="text"
                          value={qty}
                          onChange={(e) => {
                            const val = parseRupiahInput(e.target.value);
                            updateItem(item.id, 'quantity', Math.max(1, val));
                          }}
                          className="h-10 text-xs text-center font-bold bg-background border-border rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(item.id, 'quantity', qty + 1)}
                          className="h-10 w-8 rounded-lg shrink-0 border-border text-xs"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Harga Satuan dengan Thousand Separator */}
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Harga Satuan (Rp)
                      </Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-2.5 top-3 text-[11px] font-bold text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="text"
                          value={unitPrice ? formatThousand(unitPrice) : ''}
                          onChange={(e) =>
                            updateItem(item.id, 'unitPrice', parseRupiahInput(e.target.value))
                          }
                          placeholder="0"
                          className="h-10 pl-8 text-xs text-right font-bold bg-background border-border rounded-xl font-mono"
                        />
                      </div>
                    </div>

                    {/* Subtotal Item Otomatis */}
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Subtotal Baris
                      </Label>
                      <div className="h-10 mt-1.5 flex items-center justify-end px-3 bg-muted/40 rounded-xl border border-border text-xs font-bold text-foreground font-mono">
                        {formatRupiah(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {invoice.items.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl">
                Belum ada rincian paket. Klik tombol &quot;+ Tambah Baris&quot; atau pilih paket di atas.
              </div>
            )}
          </div>

          {/* Pricing Calculations Card */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Subtotal Seluruh Item:</span>
              <span className="font-bold text-foreground font-mono text-sm">
                {formatRupiah(invoice.subtotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-border/60">
              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Percent className="w-3 h-3 text-pink-500" /> Potongan Diskon (Opsional)
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-2.5 top-2.5 text-[11px] font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    value={invoice.discount ? formatThousand(invoice.discount) : ''}
                    onChange={(e) => updateField('discount', parseRupiahInput(e.target.value))}
                    placeholder="0"
                    className="h-9 pl-8 text-xs text-right bg-background font-mono font-medium rounded-xl border-border"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Percent className="w-3 h-3 text-purple-500" /> Pajak (Tax - Opsional)
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-2.5 top-2.5 text-[11px] font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    value={invoice.tax ? formatThousand(invoice.tax) : ''}
                    onChange={(e) => updateField('tax', parseRupiahInput(e.target.value))}
                    placeholder="0"
                    className="h-9 pl-8 text-xs text-right bg-background font-mono font-medium rounded-xl border-border"
                  />
                </div>
              </div>
            </div>

            {/* Down Payment info */}
            <div className="pt-2.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs">
              <span className="text-pink-600 dark:text-pink-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                Rekomendasi Minimal DP 30%:
              </span>
              <span className="font-bold text-pink-700 dark:text-pink-300 font-mono bg-pink-50 dark:bg-pink-950/50 px-2.5 py-1 rounded-xl border border-pink-200 dark:border-pink-800">
                {formatRupiah(Math.round(invoice.total * 0.3))}
              </span>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-border flex justify-between items-center">
              <span className="text-sm font-black text-foreground uppercase tracking-wide">
                Total Tagihan:
              </span>
              <span className="text-2xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent font-mono">
                {formatRupiah(invoice.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Compact Store Profile & Payment Summary */}
      <Card className="border-border/70 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-200 dark:border-pink-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-foreground flex items-center gap-2">
                <span>{invoice.bankName} a/n {invoice.bankAccountName}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-pink-600 dark:text-pink-400 font-bold">{invoice.bankAccountNumber}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                QRIS: {invoice.showQris ? 'Aktif' : 'Nonaktif'} • IG: @{invoice.contactIg} • WA: {invoice.contactWa}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="text-xs h-9 rounded-xl border-border hover:border-pink-400 text-foreground hover:text-pink-600 self-start sm:self-center font-medium"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Ubah Rekening / Toko
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
