'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InvoiceData, InvoiceItem, InvoiceStatus } from '@/types/invoice';
import { PRESET_ITEMS, STATUS_COLORS } from '@/lib/constants';
import { formatRupiah, parseRupiahInput, formatThousand } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FilePlus,
  Edit3,
  Plus,
  Trash2,
  Calendar,
  User,
  Phone,
  RefreshCw,
  Percent,
  CheckCircle2,
  AlertCircle,
  Tag,
  PartyPopper,
  Save,
  CreditCard,
  Sparkles,
  Clock,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react';

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onSave: (invoice: InvoiceData) => void;
  existingInvoices?: InvoiceData[];
}

interface ClientSuggestion {
  name: string;
  phone: string;
  address: string;
  venue: string;
}

export const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  onSave,
  existingInvoices = [],
}) => {
  const [formData, setFormData] = useState<InvoiceData | null>(invoice);
  const [lastDeletedItem, setLastDeletedItem] = useState<{ item: InvoiceItem; index: number } | null>(null);
  const [autocompleteFeedback, setAutocompleteFeedback] = useState<string | null>(null);

  // Density & conflict check on booking date
  const conflictingBookings = useMemo(() => {
    if (!formData?.bookingDate || !existingInvoices.length) return [];
    return existingInvoices.filter(
      (inv: InvoiceData) =>
        inv.id !== formData.id &&
        inv.bookingDate === formData.bookingDate &&
        inv.status !== 'cancelled'
    );
  }, [formData?.bookingDate, formData?.id, existingInvoices]);

  // Smart autocomplete: Unique past clients from existing invoices
  const clientSuggestions = useMemo<ClientSuggestion[]>(() => {
    const map = new Map<string, ClientSuggestion>();
    (existingInvoices || []).forEach((inv: InvoiceData) => {
      const name = (inv.clientName || '').trim();
      if (name && name.length >= 2 && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          name,
          phone: inv.clientPhone || '',
          address: inv.clientAddress || '',
          venue: inv.venue || inv.clientAddress || '',
        });
      }
    });
    return Array.from(map.values());
  }, [existingInvoices]);

  const handleClientNameChange = (val: string) => {
    const matched = clientSuggestions.find(
      (c: ClientSuggestion) => c.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      setAutocompleteFeedback(`Kontak & alamat otomatis terisi dari riwayat pelanggan! ✨`);
      setTimeout(() => setAutocompleteFeedback(null), 3500);
      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          clientName: val,
          clientPhone: prev.clientPhone ? prev.clientPhone : matched.phone,
          clientAddress: prev.clientAddress ? prev.clientAddress : matched.address,
          venue: prev.venue ? prev.venue : matched.venue,
        };
      });
    } else {
      updateField('clientName', val);
    }
  };

  useEffect(() => {
    if (invoice) {
      const today = new Date().toISOString().split('T')[0];
      const invTotal = invoice.total || 0;
      const initialDp = invoice.dpPaidAmount !== undefined
        ? invoice.dpPaidAmount
        : invoice.status === 'paid'
        ? invTotal
        : invoice.status === 'dp_paid'
        ? (invoice.dpAmount || Math.round(invTotal * 0.3))
        : 0;
      const initialRemaining = Math.max(0, invTotal - initialDp);
      const initialVenue = invoice.venue !== undefined ? invoice.venue : (invoice.clientAddress || '');

      setFormData({
        ...invoice,
        invoiceDate: invoice.invoiceDate || today,
        bookingDate: invoice.bookingDate || today,
        eventTime: invoice.eventTime || '14:00',
        setupTime: invoice.setupTime || '11:00',
        venue: initialVenue,
        clientAddress: initialVenue,
        dpPaidAmount: initialDp,
        remainingAmount: initialRemaining,
      });
    } else {
      setFormData(null);
    }
    setLastDeletedItem(null);
  }, [invoice, isOpen]);

  // Auto-dismiss undo notification after 7 seconds
  useEffect(() => {
    if (!lastDeletedItem) return;
    const timer = setTimeout(() => {
      setLastDeletedItem(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [lastDeletedItem]);

  if (!formData) return null;

  const isEditing = Boolean(invoice?.id && !invoice.id.startsWith('rb-new-temp'));

  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    let updated = { ...formData, [key]: value };

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
      const items = (key === 'items' ? value : formData.items) as InvoiceItem[];
      const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      const tax = Number(key === 'tax' ? value : formData.tax) || 0;
      const discount = Number(key === 'discount' ? value : formData.discount) || 0;
      const total = Math.max(0, subtotal + tax - discount);
      const dpAmount = Math.round(total * (formData.dpMinPercent / 100));

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
    setFormData(updated);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    const newItems = [...formData.items, newItem];
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
    const newItems = [...formData.items, newItem];
    updateField('items', newItems);
  };

  const updateItem = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice' | 'amount',
    value: string | number
  ) => {
    const newItems = formData.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Math.max(1, Number(value) || 1) : item.quantity ?? 1;
          const uPrice = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : item.unitPrice ?? item.amount;
          updated.quantity = qty;
          updated.unitPrice = uPrice;
          updated.amount = qty * uPrice;
        } else if (field === 'amount') {
          const amt = Math.max(0, Number(value) || 0);
          const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
          updated.amount = amt;
          updated.unitPrice = Math.round(amt / qty);
        }
        return updated;
      }
      return item;
    });
    updateField('items', newItems);
  };

  const removeItem = (id: string) => {
    if (formData.items.length <= 1) return;
    const itemIndex = formData.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;
    const deletedItem = formData.items[itemIndex];
    setLastDeletedItem({ item: deletedItem, index: itemIndex });
    const newItems = formData.items.filter((item) => item.id !== id);
    updateField('items', newItems);
  };

  const handleUndoDeleteItem = () => {
    if (!lastDeletedItem) return;
    const newItems = [...formData.items];
    const targetIdx = Math.min(Math.max(0, lastDeletedItem.index), newItems.length);
    newItems.splice(targetIdx, 0, lastDeletedItem.item);
    updateField('items', newItems);
    setLastDeletedItem(null);
  };

  const generateInvoiceNumber = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    updateField('invoiceNumber', `00${rand}`);
  };

  const handleVenueChange = (val: string) => {
    setFormData((prev) => (prev ? { ...prev, venue: val, clientAddress: val } : null));
  };

  const handleFormatPhoneOnBlur = () => {
    if (!formData.clientPhone) return;
    const digits = formData.clientPhone.replace(/\D/g, '');
    if (digits.startsWith('62') && digits.length >= 9) {
      const formatted = `+62 ${digits.slice(2, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`.replace(/-+$/, '');
      updateField('clientPhone', formatted);
    } else if (digits.startsWith('08') && digits.length >= 10) {
      const formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`.replace(/-+$/, '');
      updateField('clientPhone', formatted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Mohon isi nama pelanggan terlebih dahulu.');
      return;
    }
    onSave(formData);
    onClose();
  };

  const itemCount = formData.items.length;
  const isOptimalCount = itemCount <= 4;
  const isAutoScaled = itemCount === 5 || itemCount === 6;

  const STATUS_LIST: Array<{ id: InvoiceStatus; label: string; icon: string }> = [
    { id: 'draft', label: 'Draft', icon: '📝' },
    { id: 'sent', label: 'Terkirim', icon: '📤' },
    { id: 'dp_paid', label: 'DP 30%', icon: '💳' },
    { id: 'paid', label: 'Lunas', icon: '✨' },
    { id: 'cancelled', label: 'Batal', icon: '❌' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:w-[96vw] max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col p-3.5 sm:p-6 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        {/* Dialog Header */}
        <DialogHeader className="pb-3 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-foreground">
            <span className="p-2 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <FilePlus className="w-5 h-5" />}
            </span>
            <span>{isEditing ? `Edit Invoice #${formData.invoiceNumber}` : 'Buat Invoice Baru'}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${STATUS_COLORS[formData.status]?.badge} text-xs font-bold py-1 px-3 rounded-full`}
            >
              {STATUS_COLORS[formData.status]?.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body with 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= LEFT COLUMN (lg:col-span-5) ================= */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: Data Pelanggan & Jadwal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2 pb-1 border-b border-border/60">
                  <User className="w-3.5 h-3.5 text-pink-500" />
                  <span>1. Data Pelanggan & Jadwal</span>
                </div>

                {/* No Invoice & Status */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Nomor Invoice</span>
                      <span className="text-[10px] text-muted-foreground">Auto / Manual</span>
                    </Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        value={formData.invoiceNumber}
                        onChange={(e) => updateField('invoiceNumber', e.target.value)}
                        placeholder="001454"
                        className="font-mono font-bold text-xs h-10 rounded-xl bg-background border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateInvoiceNumber}
                        className="h-10 w-10 shrink-0 rounded-xl border-border hover:bg-pink-50 dark:hover:bg-pink-950/40 text-foreground"
                        title="Generate Nomor Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground block mb-1.5">
                      Status Tagihan
                    </Label>
                    <div className="grid grid-cols-5 gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                      {STATUS_LIST.map((st) => {
                        const isActive = formData.status === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => updateField('status', st.id)}
                            className={`text-[11px] py-1.5 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                              isActive
                                ? 'bg-card text-foreground shadow-xs ring-1 ring-border font-bold'
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

                {/* Nama Pelanggan & WhatsApp */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client-name-input" className="text-xs font-semibold text-foreground">
                        Nama Pelanggan (Client Name) *
                      </Label>
                      {clientSuggestions.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Auto-suggest pelanggan aktif ✨
                        </span>
                      )}
                    </div>
                    <Input
                      id="client-name-input"
                      list="client-suggestions-list"
                      value={formData.clientName}
                      onChange={(e) => handleClientNameChange(e.target.value)}
                      placeholder="Contoh: Siti Rahma"
                      className="mt-1.5 h-10 rounded-xl text-xs font-medium border-border bg-background focus-visible:ring-2 focus-visible:ring-[#f370a8] focus-visible:ring-offset-1"
                      required
                    />
                    {clientSuggestions.length > 0 && (
                      <datalist id="client-suggestions-list">
                        {clientSuggestions.map((c: ClientSuggestion, i: number) => (
                          <option key={i} value={c.name}>
                            {c.phone ? `${c.name} • ${c.phone}` : c.name}
                          </option>
                        ))}
                      </datalist>
                    )}
                    {autocompleteFeedback && (
                      <div className="mt-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span>{autocompleteFeedback}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="client-phone-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
                      Nomor WhatsApp Pelanggan
                    </Label>
                    <Input
                      id="client-phone-input"
                      value={formData.clientPhone}
                      onChange={(e) => updateField('clientPhone', e.target.value)}
                      onBlur={handleFormatPhoneOnBlur}
                      placeholder="+62 812-3456-7890"
                      className="mt-1.5 h-10 rounded-xl text-xs font-mono border-border bg-background focus-visible:ring-2 focus-visible:ring-[#f370a8] focus-visible:ring-offset-1"
                    />
                  </div>
                </div>

                {/* Tanggal Terbit & Tanggal Acara */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Tanggal Terbit
                    </Label>
                    <DatePicker
                      value={formData.invoiceDate}
                      onChange={(d) => updateField('invoiceDate', d)}
                      placeholder="Pilih tanggal..."
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-[#f370a8] flex items-center gap-1.5 mb-1.5">
                      <PartyPopper className="w-3.5 h-3.5 text-[#f370a8]" />
                      Tanggal Acara
                    </Label>
                    <DatePicker
                      value={formData.bookingDate}
                      onChange={(d) => updateField('bookingDate', d)}
                      placeholder="Pilih acara..."
                      highlight
                    />
                    {formData.bookingDate && (
                      <div className="mt-1.5">
                        {conflictingBookings.length >= 3 ? (
                          <div className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                            <span>Jadwal Padat! Sudah ada {conflictingBookings.length} acara di tanggal ini</span>
                          </div>
                        ) : conflictingBookings.length > 0 ? (
                          <div className="px-2.5 py-1 rounded-lg bg-[#4d3085]/10 border border-[#4d3085]/25 text-[#4d3085] dark:text-[#c4b5fd] text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                            <Clock className="w-3 h-3 shrink-0 text-[#f370a8]" />
                            <span>Ada {conflictingBookings.length} acara lain di tanggal ini ({conflictingBookings.map((c: InvoiceData) => c.clientName).filter(Boolean).slice(0, 2).join(', ')})</span>
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>Jadwal masih kosong di tanggal ini ✨</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Jam Acara & Jam Setup Balon */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#f370a8]" /> Jam Mulai Acara
                    </Label>
                    <Input
                      type="time"
                      value={formData.eventTime || '14:00'}
                      onChange={(e) => updateField('eventTime', e.target.value)}
                      className="mt-1 h-9 bg-background text-xs font-mono rounded-xl border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#4d3085] dark:text-[#c4b5fd]" /> Jam Setup Balon
                    </Label>
                    <Input
                      type="time"
                      value={formData.setupTime || '11:00'}
                      onChange={(e) => updateField('setupTime', e.target.value)}
                      className="mt-1 h-9 bg-background text-xs font-mono rounded-xl border-border"
                    />
                  </div>
                </div>

                {/* Lokasi / Venue Acara */}
                <div className="pt-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#f370a8]" /> Lokasi / Venue Acara
                  </Label>
                  <Input
                    value={formData.venue ?? ''}
                    onChange={(e) => handleVenueChange(e.target.value)}
                    placeholder="Contoh: Hotel Aria Gajayana Malang / Rumah Client"
                    className="mt-1 h-9 rounded-xl text-xs border-border bg-background"
                  />
                </div>

                {/* Tema / Konsep Balon */}
                <div className="pt-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#f370a8]" /> Tema / Konsep Dekorasi Balon
                  </Label>
                  <Input
                    value={formData.themeNote || ''}
                    onChange={(e) => updateField('themeNote', e.target.value)}
                    placeholder="Contoh: Pastel Pink & White / 1st Birthday Cocomelon"
                    className="mt-1 h-9 rounded-xl text-xs border-border bg-background"
                  />
                </div>

                {/* Crew & Catatan Khusus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-[#4d3085] dark:text-[#c4b5fd]" /> Crew Bertugas
                    </Label>
                    <Input
                      value={formData.assignedCrew || ''}
                      onChange={(e) => updateField('assignedCrew', e.target.value)}
                      placeholder="Contoh: Tim A (Andi & Rian)"
                      className="mt-1 h-9 rounded-xl text-xs border-border bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" /> Catatan Khusus Crew
                    </Label>
                    <Input
                      value={formData.crewNote || ''}
                      onChange={(e) => updateField('crewNote', e.target.value)}
                      placeholder="Contoh: Pintu loading barat"
                      className="mt-1 h-9 rounded-xl text-xs border-border bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Kalkulasi & Pembayaran */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5">
                <div className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2 pb-1 border-b border-border/60">
                  <CreditCard className="w-3.5 h-3.5 text-[#f370a8]" />
                  <span>2. Rincian & Total Tagihan</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">Subtotal Item:</span>
                  <span className="font-bold text-foreground font-mono text-sm">
                    {formatRupiah(formData.subtotal)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Percent className="w-3 h-3 text-[#f370a8]" /> Diskon (Opsional)
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        type="text"
                        value={formData.discount ? formatThousand(formData.discount) : ''}
                        onChange={(e) => updateField('discount', parseRupiahInput(e.target.value))}
                        placeholder="0"
                        className="h-9 pl-7 text-xs text-right bg-background font-mono rounded-xl border-border"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Percent className="w-3 h-3 text-[#4d3085] dark:text-[#c4b5fd]" /> Pajak (Tax)
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        type="text"
                        value={formData.tax ? formatThousand(formData.tax) : ''}
                        onChange={(e) => updateField('tax', parseRupiahInput(e.target.value))}
                        placeholder="0"
                        className="h-9 pl-7 text-xs text-right bg-background font-mono rounded-xl border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* DP Custom Input & Quick Buttons */}
                <div className="pt-3 border-t border-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>Uang Muka / DP Diterima (Rp)</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Bisa ketik bebas / custom
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="text"
                      value={formData.dpPaidAmount ? formatThousand(formData.dpPaidAmount) : ''}
                      onChange={(e) => updateField('dpPaidAmount', parseRupiahInput(e.target.value))}
                      placeholder="0 (Belum ada DP)"
                      className="h-10 pl-8 text-sm font-mono font-bold text-foreground bg-background rounded-xl border-border focus:ring-2 focus:ring-[#f370a8]/40"
                    />
                  </div>

                  {/* Warning if DP > Total (P3 Sanity Check) */}
                  {Boolean(formData.dpPaidAmount && formData.dpPaidAmount > formData.total) && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>⚠️ Nominal DP melebihi total tagihan pesanan!</span>
                    </div>
                  )}

                  {/* Quick DP Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updateField('dpPaidAmount', Math.round(formData.total * 0.3))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 hover:opacity-90 border border-pink-200 dark:border-pink-900 transition-all cursor-pointer"
                    >
                      DP 30% ({formatThousand(Math.round(formData.total * 0.3))})
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('dpPaidAmount', Math.round(formData.total * 0.5))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 hover:opacity-90 border border-purple-200 dark:border-purple-900 transition-all cursor-pointer"
                    >
                      DP 50% ({formatThousand(Math.round(formData.total * 0.5))})
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('dpPaidAmount', formData.total)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 hover:opacity-90 border border-emerald-200 dark:border-emerald-900 transition-all cursor-pointer"
                    >
                      Lunas 100%
                    </button>
                    {Boolean(formData.dpPaidAmount && formData.dpPaidAmount > 0) && (
                      <button
                        type="button"
                        onClick={() => updateField('dpPaidAmount', 0)}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer ml-auto"
                      >
                        Reset DP
                      </button>
                    )}
                  </div>
                </div>

                {/* Total Tagihan & Sisa Pelunasan Card */}
                <div className="pt-3 border-t-2 border-border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Total Nilai Pesanan:</span>
                    <span className="font-bold text-foreground font-mono text-sm">
                      {formatRupiah(formData.total)}
                    </span>
                  </div>

                  {Boolean(formData.dpPaidAmount && formData.dpPaidAmount > 0) && (
                    <div className="flex justify-between items-center text-xs font-semibold text-[#4d3085] dark:text-[#c4b5fd]">
                      <span>DP Sudah Diterima:</span>
                      <span className="font-mono font-bold">
                        - {formatRupiah(formData.dpPaidAmount || 0)}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider block">
                        {formData.status === 'paid' || (formData.remainingAmount ?? 0) === 0 ? 'Status Tagihan:' : 'Sisa Tagihan Belum Dibayar:'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formData.status === 'paid' || (formData.remainingAmount ?? 0) === 0
                          ? 'Pesanan sudah lunas penuh ✨'
                          : 'Wajib dilunasi H-1 sebelum loading dekorasi'}
                      </span>
                    </div>
                    <span className={`text-xl font-black font-mono ${
                      formData.status === 'paid' || (formData.remainingAmount ?? 0) === 0
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-[#f370a8] dark:text-[#f472b6]'
                    }`}>
                      {formData.status === 'paid' || (formData.remainingAmount ?? 0) === 0
                        ? 'LUNAS ✨'
                        : formatRupiah(formData.remainingAmount ?? Math.max(0, formData.total - (formData.dpPaidAmount || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN (lg:col-span-7) ================= */}
            <div className="lg:col-span-7 space-y-4">
              {/* Header Box: Actions & Preset Chips */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                      3. Layanan & Paket Dekorasi
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                        isOptimalCount
                          ? 'bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] border-[#4d3085]/30'
                          : isAutoScaled
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {isOptimalCount ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#4d3085] dark:text-[#c4b5fd]" />
                          <span>{itemCount}/4 Item (Pas 1 Lembar A5)</span>
                        </>
                      ) : isAutoScaled ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{itemCount} Item (Auto-Scaled A5)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{itemCount} Item (Disarankan maks 6 di A5)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={addItem}
                    size="sm"
                    className="h-8 text-xs bg-[#4d3085] hover:opacity-90 text-white font-medium rounded-xl shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
                  </Button>
                </div>

                {/* Preset Chips */}
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[#f370a8]" />
                    <span>Pilih Cepat Paket Populer Rumah Balon:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ITEMS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addPresetItem(idx)}
                        className="text-[11px] bg-card hover:bg-[#f370a8]/10 text-foreground hover:text-[#f370a8] px-2.5 py-1.5 rounded-xl border border-border hover:border-[#f370a8]/40 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#f370a8]" />
                        <span className="font-semibold">{preset.name}</span>
                        <span className="text-muted-foreground font-mono">
                          ({formatThousand(preset.amount)})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items List (Responsive Horizontal Table in Desktop, Vertical Card on Mobile) */}
              <div className="space-y-3">
                {/* Instant Undo Recovery Banner for Accidental Deletion */}
                {lastDeletedItem && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="p-3 sm:px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Item &ldquo;<strong className="font-semibold">{lastDeletedItem.item.description || `Item #${lastDeletedItem.index + 1}`}</strong>&rdquo; telah dihapus.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUndoDeleteItem}
                        className="h-7 px-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Batalkan (Undo)</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => setLastDeletedItem(null)}
                        aria-label="Tutup notifikasi hapus item"
                        className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {formData.items.map((item, index) => {
                  const qty = item.quantity ?? 1;
                  const unitPrice = item.unitPrice ?? item.amount;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card/70 hover:border-pink-500/30 transition-all space-y-3"
                    >
                      {/* Top Bar per Item */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg">
                          Item #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length <= 1}
                          aria-label={formData.items.length <= 1 ? 'Minimal 1 item pesanan harus ada' : `Hapus Item #${index + 1}`}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-7 px-2 text-[11px] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={formData.items.length <= 1 ? 'Minimal 1 item pesanan harus ada di invoice' : 'Hapus item'}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                        </Button>
                      </div>

                      {/* Desktop Table Row / Mobile Stacking */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        {/* Deskripsi */}
                        <div className="md:col-span-5">
                          <Label className="text-[11px] text-muted-foreground font-semibold">
                            Deskripsi Layanan / Paket
                          </Label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Contoh: Decor Balloon and backdrop 2,5m for birthday..."
                            rows={2}
                            className="w-full mt-1.5 text-xs rounded-xl border border-border p-2.5 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:outline-hidden bg-background text-foreground transition-all"
                          />
                        </div>

                        {/* Qty */}
                        <div className="md:col-span-2">
                          <Label className="text-[11px] text-muted-foreground font-semibold">
                            Qty
                          </Label>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateItem(item.id, 'quantity', Math.max(1, qty - 1))}
                              className="h-10 w-7 rounded-lg shrink-0 border-border text-xs"
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
                              className="h-10 w-7 rounded-lg shrink-0 border-border text-xs"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* Harga Satuan */}
                        <div className="md:col-span-2">
                          <Label className="text-[11px] text-muted-foreground font-semibold">
                            Harga Satuan (Rp)
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              type="text"
                              value={unitPrice ? formatThousand(unitPrice) : ''}
                              onChange={(e) =>
                                updateItem(item.id, 'unitPrice', parseRupiahInput(e.target.value))
                              }
                              placeholder="0"
                              className="h-10 text-xs text-right font-bold bg-background border-border rounded-xl font-mono"
                            />
                          </div>
                        </div>

                        {/* Subtotal Item */}
                        <div className="md:col-span-3">
                          <Label className="text-[11px] text-muted-foreground font-semibold">
                            Subtotal Baris
                          </Label>
                          <div className="h-10 mt-1.5 flex items-center justify-end px-3 bg-muted/50 rounded-xl border border-border text-xs font-bold text-foreground font-mono">
                            {formatRupiah(item.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {formData.items.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl bg-card">
                    Belum ada item pesanan. Klik tombol &quot;+ Tambah Baris&quot; atau pilih paket di atas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Mobile/Desktop Footer Actions */}
          <DialogFooter className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-md pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] border-t border-border flex flex-row items-center justify-between gap-2 mt-auto shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground h-10 px-3 rounded-xl cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              className="text-xs h-10 sm:h-10 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Invoice'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
