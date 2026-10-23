'use client';

import React, { useState, useMemo } from 'react';
import { InvoiceData } from '@/types/invoice';
import {
  InventoryItem,
  DispatchedProperty,
  BalloonType,
  BalloonSize,
  BALLOON_TYPES,
  BALLOON_SIZES,
  INVENTORY_CATEGORIES,
} from '@/types/inventory';
import { formatDateIndo } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Boxes,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Share2,
  Check,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchedulePropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
  inventoryItems: InventoryItem[];
  invoices?: InvoiceData[];
  onUpdateInvoice: (updated: InvoiceData) => void;
  onOpenCrewSheet?: (invoice: InvoiceData) => void;
}

export const SchedulePropertyModal: React.FC<SchedulePropertyModalProps> = ({
  open,
  onOpenChange,
  invoice,
  inventoryItems = [],
  invoices = [],
  onUpdateInvoice,
  onOpenCrewSheet,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'balon' | 'properti' | 'alat'>('all');
  const [search, setSearch] = useState('');
  const [balloonTypeFilter, setBalloonTypeFilter] = useState<string>('all');
  const [balloonSizeFilter, setBalloonSizeFilter] = useState<string>('all');
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [propQty, setPropQty] = useState<number>(1);
  const [customName, setCustomName] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('Unit');
  const [mobileTab, setMobileTab] = useState<'picker' | 'needed'>('picker');

  // Calculate committed stock for other events occurring on the SAME date to prevent double-booking
  const committedMapOnDate = useMemo(() => {
    if (!invoice?.bookingDate || !invoices || invoices.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      if (inv.id === invoice.id || inv.bookingDate !== invoice.bookingDate) return;
      (inv.dispatchedProperties || []).forEach((p) => {
        if (p.inventoryItemId) {
          map.set(p.inventoryItemId, (map.get(p.inventoryItemId) || 0) + Number(p.quantity || 0));
        }
      });
    });
    return map;
  }, [invoices, invoice?.bookingDate, invoice?.id]);

  // Filter master stock items for quick picking (Must be declared before any early return)
  const filteredStock = useMemo(() => {
    return (inventoryItems || []).filter((it) => {
      // Tab filter
      if (activeTab === 'balon' && it.category !== 'balon') return false;
      if (activeTab === 'properti' && it.category !== 'properti') return false;
      if (activeTab === 'alat' && it.category !== 'alat' && it.category !== 'listrik' && it.category !== 'aksesoris') return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (it.name || '').toLowerCase().includes(q);
        const matchLoc = (it.location || '').toLowerCase().includes(q);
        const matchColor = (it.balloonColor || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchColor) return false;
      }

      // Balloon type filter
      if (balloonTypeFilter !== 'all') {
        const type = (it.balloonType || '').toLowerCase();
        const name = (it.name || '').toLowerCase();
        if (type !== balloonTypeFilter && !name.includes(balloonTypeFilter)) return false;
      }

      // Balloon size filter
      if (balloonSizeFilter !== 'all') {
        const size = it.balloonSize || '';
        const name = (it.name || '').toLowerCase();
        const inch = balloonSizeFilter === '5_inch' ? '5' : balloonSizeFilter === '12_inch' ? '12' : balloonSizeFilter === '18_inch' ? '18' : '36';
        if (size !== balloonSizeFilter && !name.includes(`${inch} inch`) && !name.includes(`${inch}"`)) return false;
      }

      return true;
    });
  }, [inventoryItems, activeTab, search, balloonTypeFilter, balloonSizeFilter]);

  if (!invoice) return null;

  const dispatchedProps = invoice.dispatchedProperties || [];

  // Statistics of needed properties
  const totalPropsCount = dispatchedProps.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const balloonPropsCount = dispatchedProps
    .filter((p) => p.category === 'balon' || p.balloonType || p.balloonSize)
    .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const equipmentPropsCount = dispatchedProps
    .filter((p) => p.category !== 'balon' && !p.balloonType && !p.balloonSize)
    .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const packedCount = dispatchedProps.filter((p) => p.checkedOut).length;

  // Add Item to Needed Properties
  const handleAddStockItem = (item: InventoryItem, qty: number = 1) => {
    // Check if already in dispatchedProperties
    const existingIndex = dispatchedProps.findIndex((p) => p.inventoryItemId === item.id);
    let updatedProps: DispatchedProperty[];

    if (existingIndex >= 0) {
      // Increase qty
      updatedProps = dispatchedProps.map((p, idx) => {
        if (idx === existingIndex) {
          return { ...p, quantity: p.quantity + qty };
        }
        return p;
      });
    } else {
      const newProp: DispatchedProperty = {
        id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        inventoryItemId: item.id,
        name: item.name,
        category: item.category,
        balloonType: item.balloonType,
        balloonSize: item.balloonSize,
        quantity: Math.max(1, qty),
        unit: item.unit,
        checkedOut: false,
        checkedIn: false,
        notes: item.location ? `Lokasi: ${item.location}` : undefined,
      };
      updatedProps = [...dispatchedProps, newProp];
    }

    onUpdateInvoice({
      ...invoice,
      dispatchedProperties: updatedProps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add Custom Item (non-master)
  const handleAddCustomItem = () => {
    if (!customName.trim()) return;

    const newProp: DispatchedProperty = {
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: customName.trim(),
      category: 'properti',
      quantity: Math.max(1, propQty),
      unit: customUnit.trim() || 'Unit',
      checkedOut: false,
      checkedIn: false,
    };

    onUpdateInvoice({
      ...invoice,
      dispatchedProperties: [...dispatchedProps, newProp],
      updatedAt: new Date().toISOString(),
    });

    setCustomName('');
    setPropQty(1);
  };

  // Remove Property
  const handleRemoveProperty = (id: string) => {
    const updatedProps = dispatchedProps.filter((p) => p.id !== id);
    onUpdateInvoice({
      ...invoice,
      dispatchedProperties: updatedProps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Adjust Quantity
  const handleUpdateQty = (id: string, delta: number) => {
    const updatedProps = dispatchedProps
      .map((p) => {
        if (p.id !== id) return p;
        const nextQty = p.quantity + delta;
        return { ...p, quantity: nextQty };
      })
      .filter((p) => p.quantity > 0);

    onUpdateInvoice({
      ...invoice,
      dispatchedProperties: updatedProps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Checked Out status
  const handleToggleCheck = (id: string) => {
    const updatedProps = dispatchedProps.map((p) => {
      if (p.id !== id) return p;
      return { ...p, checkedOut: !p.checkedOut };
    });

    onUpdateInvoice({
      ...invoice,
      dispatchedProperties: updatedProps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Send WA Summary to Crew
  const handleShareWA = () => {
    const propLines = dispatchedProps.map((p, idx) => {
      const typeStr = p.balloonType ? ` [${String(p.balloonType).toUpperCase()}]` : '';
      const sizeStr = p.balloonSize ? ` [${String(p.balloonSize).replace('_inch', '"')}]` : '';
      return `${idx + 1}. [${p.checkedOut ? '✓' : ' '}] ${p.quantity}x ${p.name}${typeStr}${sizeStr} (${p.unit || 'Unit'})`;
    }).join('%0A');

    const message = `Halo Tim Dekor Rumah Balon! 🎈👷‍♂️%0A%0A📦 *DAFTAR KEBUTUHAN PROPERTI & STOK BALON:*%0A• *Client:* ${invoice.clientName || 'Pelanggan'} (#${invoice.invoiceNumber})%0A• *Tanggal Acara:* ${invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '—'}%0A• *Jam Setup Balon:* ${invoice.setupTime || '11:00'} WIB%0A• *Lokasi:* ${invoice.venue || invoice.clientAddress || 'Sesuai jadwal'}%0A• *Tema Dekorasi:* ${invoice.themeNote || '—'}%0A%0A🛠️ *PROPERTI & BALON YANG HARUS DIBAWA:*%0A${propLines || 'Belum ada rincian properti.'}%0A%0A${invoice.crewNote ? '⚠️ *Catatan:* ' + invoice.crewNote + '%0A%0A' : ''}Mohon disiapkan sebelum berangkat ke venue. Terima kasih! ✨`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-card via-[#4d3085]/5 to-card flex flex-wrap items-center justify-between gap-3">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f370a8] to-[#4d3085] flex items-center justify-center text-white shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-extrabold text-foreground">
                    Kebutuhan Properti & Stok Balon Pesanan
                  </DialogTitle>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f370a8]/15 text-[#be185d] dark:text-[#f472b6]">
                    #{invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="font-bold text-foreground">{invoice.clientName || 'Client'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#f370a8]" />
                    {invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '—'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
                    Setup: {invoice.setupTime || '11:00'}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWA}
              className="h-8 px-2.5 text-xs font-bold text-[#f370a8] rounded-xl border-[#f370a8]/30 hover:bg-[#f370a8]/10"
              title="Kirim daftar kebutuhan properti ke WA Crew"
            >
              <Share2 className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Kirim ke WA Crew</span>
            </Button>

            {onOpenCrewSheet && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenCrewSheet(invoice);
                }}
                className="h-8 px-3 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white font-bold text-xs shadow-xs"
                title="Buka Lembar Kerja & Checklist Cetak Crew"
              >
                <Printer className="w-3.5 h-3.5 sm:mr-1.5" />
                <span>Checklist Cetak</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Segmented View Switcher (Screen < lg only) */}
        <div className="lg:hidden px-4 pt-3 pb-2 bg-muted/40 border-b border-border flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('picker')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              mobileTab === 'picker'
                ? 'bg-[#4d3085] text-white shadow-xs'
                : 'bg-card text-muted-foreground border border-border'
            )}
          >
            <Package className="w-3.5 h-3.5 text-[#f370a8]" />
            <span>1. Stok Gudang</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('needed')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative',
              mobileTab === 'needed'
                ? 'bg-[#f370a8] text-white shadow-xs'
                : 'bg-card text-muted-foreground border border-border'
            )}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>2. Dibawa ({dispatchedProps.length})</span>
          </button>
        </div>

        {/* Modal Main Body: 2 Columns (Left: Master Stock Picker, Right: Active Needed Properties) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* ================= LEFT COLUMN: STOK BARANG GUDANG (7 cols) ================= */}
          <div className={cn('lg:col-span-7 flex flex-col overflow-hidden bg-muted/15 p-4 sm:p-5 space-y-3.5', mobileTab !== 'picker' && 'hidden lg:flex')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#f370a8]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Ambil dari Master Stok Gudang
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {filteredStock.length} barang tersedia
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border">
              {[
                { id: 'all', label: 'Semua Stok' },
                { id: 'balon', label: '🎈 Stok Balon' },
                { id: 'properti', label: '🏛️ Properti & Arch' },
                { id: 'alat', label: '⚡ Alat & Listrik' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all text-center cursor-pointer',
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Balloon Specific Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama balon, warna, properti, rak gudang..."
                  className="pl-9 h-9 text-xs rounded-xl bg-card border-border font-medium"
                />
              </div>

              {/* Sub-Filters for Balloons if Balon Tab or Search Active */}
              {(activeTab === 'balon' || activeTab === 'all') && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground">Tipe:</span>
                  <button
                    type="button"
                    onClick={() => setBalloonTypeFilter('all')}
                    className={cn(
                      'px-2 py-0.5 text-[10px] rounded-md font-bold transition-all border cursor-pointer',
                      balloonTypeFilter === 'all'
                        ? 'bg-[#4d3085] text-white border-[#4d3085]'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    )}
                  >
                    Semua
                  </button>
                  {BALLOON_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBalloonTypeFilter(t.id)}
                      className={cn(
                        'px-2 py-0.5 text-[10px] rounded-md font-bold transition-all border cursor-pointer flex items-center gap-1',
                        balloonTypeFilter === t.id
                          ? `${t.badge} ring-1 ring-foreground/20 font-black`
                          : 'bg-card text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', t.dotColor)} />
                      <span>{t.label}</span>
                    </button>
                  ))}

                  <span className="text-[10px] font-bold text-muted-foreground ml-2">Ukuran:</span>
                  {BALLOON_SIZES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBalloonSizeFilter(s.id === balloonSizeFilter ? 'all' : s.id)}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all border cursor-pointer',
                        balloonSizeFilter === s.id
                          ? 'bg-[#f370a8] text-white border-[#f370a8]'
                          : 'bg-card text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      {s.inch}&quot;
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Stock List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[380px] sm:max-h-[420px]">
              {filteredStock.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
                  <p>Tidak ada stok barang yang cocok dengan filter.</p>
                  <p className="text-[11px] opacity-75">Coba ganti kata kunci pencarian atau filter tipe/ukuran.</p>
                </div>
              ) : (
                filteredStock.map((it) => {
                  const isBalloon = it.category === 'balon';
                  const alreadyAdded = dispatchedProps.find((p) => p.inventoryItemId === it.id);
                  const bookedOther = committedMapOnDate.get(it.id) || 0;
                  const availableForThisDate = Math.max(0, it.totalStock - bookedOther);
                  const isDepletedForDate = it.totalStock > 0 && availableForThisDate === 0;

                  return (
                    <div
                      key={it.id}
                      className={cn(
                        'p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs group',
                        isDepletedForDate
                          ? 'bg-rose-500/5 border-rose-300 dark:border-rose-900/50'
                          : 'bg-card border-border hover:border-[#f370a8]/40'
                      )}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-foreground group-hover:text-[#f370a8] transition-colors truncate">
                            {it.name}
                          </span>

                          {/* Balloon Badges */}
                          {it.balloonType && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              {String(it.balloonType)}
                            </span>
                          )}
                          {it.balloonSize && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                              {String(it.balloonSize).replace('_inch', '"')}
                            </span>
                          )}

                          {isDepletedForDate && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              ⚠️ Habis di Jadwal Lain Hari Ini!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap font-medium">
                          <span className={cn('font-mono font-bold', availableForThisDate === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400')}>
                            Sisa Tersedia: {availableForThisDate} {it.unit} (Total Gudang: {it.totalStock})
                          </span>
                          {bookedOther > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              • Terpakai {bookedOther} di event lain tgl ini
                            </span>
                          )}
                          {it.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-[#f370a8]" />
                                {it.location}
                              </span>
                            </>
                          )}
                          {alreadyAdded && (
                            <span className="text-[10px] font-black text-[#4d3085] dark:text-[#c4b5fd] bg-[#4d3085]/10 px-1.5 py-0.2 rounded">
                              Sudah masuk: {alreadyAdded.quantity} {alreadyAdded.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Action Button */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddStockItem(it, 1)}
                        className={cn(
                          'h-8 px-3 rounded-xl font-bold text-xs shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer',
                          isDepletedForDate
                            ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                            : 'bg-[#4d3085]/10 hover:bg-[#4d3085] hover:text-white text-[#4d3085] dark:text-[#c4b5fd]'
                        )}
                        title={isDepletedForDate ? 'Peringatan: Barang ini sudah dialokasikan penuh untuk acara lain hari ini' : 'Tambahkan 1 unit barang ini ke pesanan'}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Tambah</span>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Manual Custom Item Adder */}
            <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Atau Tambah Barang Non-Stok Manual:
              </span>
              <div className="flex items-center gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Misal: Banner Cetak Khusus / Tali Tambang 10m"
                  className="h-8 text-xs rounded-xl bg-background border-border flex-1"
                />
                <Input
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Satuan"
                  className="h-8 w-20 text-xs rounded-xl bg-background border-border font-mono text-center"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomItem}
                  disabled={!customName.trim()}
                  className="h-8 px-3 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold shrink-0 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Tambah</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: DAFTAR PROPERTI & BALON WAJIB DIBAWA (5 cols) ================= */}
          <div className={cn('lg:col-span-5 flex flex-col overflow-hidden bg-card p-4 sm:p-5 space-y-3.5', mobileTab !== 'needed' && 'hidden lg:flex')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#f370a8]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Properti Wajib Dibawa ({dispatchedProps.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#4d3085] dark:text-[#c4b5fd]">
                {packedCount}/{dispatchedProps.length} Siap Packing
              </span>
            </div>

            {/* Summary KPI Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50">
                <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 block">
                  Total Stok Balon:
                </span>
                <span className="text-lg font-black text-pink-600 dark:text-pink-400 font-mono">
                  {balloonPropsCount} <span className="text-xs font-medium">Pack/Pcs</span>
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                  Properti & Alat:
                </span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                  {equipmentPropsCount} <span className="text-xs font-medium">Item</span>
                </span>
              </div>
            </div>

            {/* List of active dispatched items */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {dispatchedProps.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground border-2 border-dashed border-border rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-foreground">Belum ada properti ditambahkan</div>
                  <p className="text-[11px] max-w-xs text-muted-foreground">
                    Pilih balon atau alat dari panel sebelah kiri untuk menyiapkan perlengkapan job order ini.
                  </p>
                </div>
              ) : (
                dispatchedProps.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 shadow-2xs',
                        p.checkedOut
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-background border-border hover:border-border'
                      )}
                    >
                      {/* Checkbox Packing */}
                      <button
                        type="button"
                        onClick={() => handleToggleCheck(p.id)}
                        className={cn(
                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                          p.checkedOut
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-zinc-300 hover:border-zinc-400 text-transparent'
                        )}
                        title="Centang saat barang selesai di-packing"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Info Item */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'font-bold text-xs truncate',
                              p.checkedOut ? 'line-through text-muted-foreground' : 'text-foreground'
                            )}
                          >
                            {p.name}
                          </span>
                          {p.balloonType && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              {String(p.balloonType)}
                            </span>
                          )}
                          {p.balloonSize && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                              {String(p.balloonSize).replace('_inch', '"')}
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{p.notes}</p>
                        )}
                      </div>

                      {/* Qty Steppers */}
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(p.id, -1)}
                          className="w-5 h-5 rounded-md bg-card hover:bg-background text-foreground flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-xs min-w-[28px] text-center text-foreground">
                          {p.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(p.id, 1)}
                          className="w-5 h-5 rounded-md bg-card hover:bg-background text-foreground flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(p.id)}
                        className="w-6 h-6 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Hapus dari daftar bawaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Notification */}
            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Semua perubahan tersimpan otomatis.</span>
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 px-4 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold"
              >
                Selesai
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
