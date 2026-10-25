'use client';

import { FilterBar } from '@/components/common/FilterBar';
import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  InventoryCategory,
  ItemCondition,
  BalloonType,
  BalloonSize,
  INVENTORY_CATEGORIES,
  CONDITION_CONFIG,
  BALLOON_TYPES,
  BALLOON_SIZES,
} from '@/types/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Boxes,
  Package,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Minus,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItemModal } from './InventoryItemModal';

interface InventoryManagerProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  onOpenNewInvoice?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  items,
  onUpdateItems,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [balloonTypeFilter, setBalloonTypeFilter] = useState<string>('all');
  const [balloonSizeFilter, setBalloonSizeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  // Helper to resolve balloon type & size reliably
  const resolveItemBalloonType = (it: InventoryItem): BalloonType | '' => {
    if (it.balloonType) return it.balloonType.toLowerCase() as BalloonType;
    const name = (it.name || '').toLowerCase();
    if (name.includes('retro')) return 'retro';
    if (name.includes('chrome')) return 'chrome';
    if (name.includes('pastel')) return 'pastel';
    if (name.includes('metalik') || name.includes('metallic')) return 'metalik';
    if (name.includes('doff') || name.includes('matte')) return 'doff';
    return '';
  };

  const resolveItemBalloonSize = (it: InventoryItem): BalloonSize | '' => {
    if (it.balloonSize) return it.balloonSize as BalloonSize;
    const name = (it.name || '').toLowerCase();
    if (name.includes('5 inch') || name.includes('5"')) return '5_inch';
    if (name.includes('12 inch') || name.includes('12"')) return '12_inch';
    if (name.includes('18 inch') || name.includes('18"')) return '18_inch';
    if (name.includes('36 inch') || name.includes('36"')) return '36_inch';
    return '';
  };

  const hasActiveFilter = Boolean(search) || selectedCategory !== 'all' || conditionFilter !== 'all' || balloonTypeFilter !== 'all' || balloonSizeFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setConditionFilter('all');
    setBalloonTypeFilter('all');
    setBalloonSizeFilter('all');
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (it.name || '').toLowerCase().includes(q);
        const matchLoc = (it.location || '').toLowerCase().includes(q);
        const matchNotes = (it.notes || '').toLowerCase().includes(q);
        const matchCat = (it.category || '').toLowerCase().includes(q);
        const matchColor = (it.balloonColor || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchNotes && !matchCat && !matchColor) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && it.category !== selectedCategory) {
        return false;
      }

      // 3. Condition Filter
      if (conditionFilter === 'low_stock') {
        const minAlert = typeof it.minimumAlertStock === 'number' ? it.minimumAlertStock : 1;
        return it.totalStock <= minAlert || it.condition === 'habis';
      } else if (conditionFilter !== 'all' && it.condition !== conditionFilter) {
        return false;
      }

      // 4. Spesifik Tipe Balon (Retro, Doff, Chrome, Metalik, Pastel)
      if (balloonTypeFilter !== 'all') {
        const itemType = resolveItemBalloonType(it);
        if (itemType !== balloonTypeFilter) return false;
      }

      // 5. Spesifik Ukuran Balon (5, 12, 18, 36 inch)
      if (balloonSizeFilter !== 'all') {
        const itemSize = resolveItemBalloonSize(it);
        if (itemSize !== balloonSizeFilter) return false;
      }

      return true;
    });
  }, [items, search, selectedCategory, conditionFilter, balloonTypeFilter, balloonSizeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalTypes = items.length;
    const totalStockCount = items.reduce((sum, it) => sum + (Number(it.totalStock) || 0), 0);
    const goodConditionCount = items.filter((it) => it.condition === 'baik').length;
    const lowStockCount = items.filter((it) => {
      const minAlert = typeof it.minimumAlertStock === 'number' ? it.minimumAlertStock : 1;
      return it.totalStock <= minAlert || it.condition === 'habis';
    }).length;

    return {
      totalTypes,
      totalStockCount,
      goodConditionCount,
      lowStockCount,
    };
  }, [items]);

  // Quick Stock Increment / Decrement
  const handleAdjustStock = (id: string, delta: number) => {
    const updated = items.map((it) => {
      if (it.id !== id) return it;
      const nextStock = Math.max(0, it.totalStock + delta);
      let nextCondition = it.condition;
      if (nextStock === 0) {
        nextCondition = 'habis';
      } else if (it.condition === 'habis' && nextStock > 0) {
        nextCondition = 'baik';
      }
      return {
        ...it,
        totalStock: nextStock,
        availableStock: nextStock,
        condition: nextCondition,
        updatedAt: new Date().toISOString(),
      };
    });
    onUpdateItems(updated);
  };

  // Open Create Modal
  const handleAddNewItem = () => {
    setActiveItem(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleEditItem = (item: InventoryItem) => {
    setActiveItem(item);
    setModalOpen(true);
  };

  // Delete Item
  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Hapus barang "${name}" dari inventaris?`)) {
      onUpdateItems(items.filter((it) => it.id !== id));
    }
  };

  // Save from Modal
  const handleSaveModal = (savedItem: InventoryItem) => {
    const exists = items.findIndex((it) => it.id === savedItem.id);
    let updated: InventoryItem[];
    if (exists >= 0) {
      updated = [...items];
      updated[exists] = savedItem;
    } else {
      updated = [savedItem, ...items];
    }
    onUpdateItems(updated);
  };

  // Export Inventory to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nama Barang',
      'Kategori',
      'Tipe Balon',
      'Ukuran Balon',
      'Warna Balon',
      'Stok Total',
      'Satuan',
      'Kondisi',
      'Lokasi',
      'Catatan',
    ];
    const rows = filteredItems.map((it) => [
      `"${it.id}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.category}"`,
      `"${resolveItemBalloonType(it)}"`,
      `"${resolveItemBalloonSize(it)}"`,
      `"${(it.balloonColor || '').replace(/"/g, '""')}"`,
      it.totalStock,
      `"${it.unit}"`,
      `"${it.condition}"`,
      `"${(it.location || '').replace(/"/g, '""')}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Stok_Barang_RumahBalon_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & KPI Statistics (Compact 2x2 on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Macam Barang */}
        <Card
          onClick={() => {
            setSelectedCategory('all');
            setConditionFilter('all');
          }}
          className={cn(
            'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group active:scale-[0.98]',
            conditionFilter === 'all' && selectedCategory === 'all'
              ? 'ring-2 ring-[#4d3085] border-[#4d3085]/60'
              : 'hover:border-[#4d3085]/40'
          )}
          title="Klik untuk melihat semua barang"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#4d3085] opacity-80" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Total Macam
              </span>
              <div className="text-xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
                {stats.totalTypes}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">Item terdaftar</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Unit Stok Fisik */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#f370a8] opacity-90" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Total Stok Fisik
              </span>
              <div className="text-xl sm:text-3xl font-black text-[#f370a8] dark:text-[#f472b6] tracking-tight font-mono">
                {stats.totalStockCount}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">Unit gudang</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f370a8] text-white flex items-center justify-center shadow-md shadow-[#f370a8]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Kondisi Baik / Siap Pakai */}
        <Card
          onClick={() => setConditionFilter((prev) => (prev === 'baik' ? 'all' : 'baik'))}
          className={cn(
            'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group active:scale-[0.98]',
            conditionFilter === 'baik'
              ? 'ring-2 ring-emerald-500 border-emerald-500/60'
              : 'hover:border-emerald-500/40'
          )}
          title="Klik untuk filter barang Siap Pakai"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-90" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Siap Dipakai
              </span>
              <div className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {stats.goodConditionCount}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">Status baik</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Peringatan Stok Kritis / Perlu Cek */}
        <Card
          onClick={() => setConditionFilter((prev) => (prev === 'low_stock' ? 'all' : 'low_stock'))}
          className={cn(
            'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group active:scale-[0.98]',
            conditionFilter === 'low_stock'
              ? 'ring-2 ring-rose-500 border-rose-500/60'
              : 'hover:border-rose-500/40'
          )}
          title="Klik untuk melihat barang yang butuh restock"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-[#f370a8] opacity-90" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-500 font-extrabold flex items-center gap-1">
                <span className="truncate">Restock</span>
                {stats.lowStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                )}
              </span>
              <div className="text-xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight font-mono">
                {stats.lowStockCount}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">Stok menipis</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#f370a8] to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner if any items are low stock */}
      {stats.lowStockCount > 0 && conditionFilter !== 'low_stock' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>
              Perhatian: Ada <strong>{stats.lowStockCount} barang</strong> dengan stok kritis atau berstatus habis/rusak.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setConditionFilter('low_stock')}
            className="h-8 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Lihat Barang Restock
          </Button>
        </div>
      )}

      {/* 2. Search & Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Cari nama barang, rak, lokasi, atau catatan..."
        searchLabel="Cari barang inventaris dan stok balon"
        filters={[
          {
            key: 'category',
            label: 'Kategori',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { value: 'all', label: `Semua Kategori (${items.length})` },
              ...INVENTORY_CATEGORIES.map((cat) => ({
                value: cat.id,
                label: `${cat.label} (${items.filter((it) => it.category === cat.id).length})`,
              })),
            ],
          },
          {
            key: 'condition',
            label: 'Kondisi',
            value: conditionFilter,
            onChange: setConditionFilter,
            options: [
              { value: 'all', label: 'Semua Kondisi' },
              { value: 'low_stock', label: 'Perlu Restock' },
              { value: 'baik', label: 'Siap Pakai' },
            ],
          },
          {
            key: 'balloonType',
            label: 'Tipe Balon',
            value: balloonTypeFilter,
            onChange: setBalloonTypeFilter,
            hidden: selectedCategory !== 'balon' && balloonTypeFilter === 'all',
            options: [
              { value: 'all', label: 'Semua Tipe' },
              ...BALLOON_TYPES.map((t) => ({
                value: t.id,
                label: `${t.label} (${items.filter((it) => it.category === 'balon' && resolveItemBalloonType(it) === t.id).length})`,
              })),
            ],
          },
          {
            key: 'balloonSize',
            label: 'Ukuran Balon',
            value: balloonSizeFilter,
            onChange: setBalloonSizeFilter,
            hidden: selectedCategory !== 'balon' && balloonSizeFilter === 'all',
            options: [
              { value: 'all', label: 'Semua Ukuran' },
              ...BALLOON_SIZES.map((s) => ({
                value: s.id,
                label: `${s.inch}" (${items.filter((it) => it.category === 'balon' && resolveItemBalloonSize(it) === s.id).length})`,
              })),
            ],
          },
        ]}
        onReset={handleResetFilters}
        resultLabel={`${filteredItems.length} barang`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              aria-label="Ekspor daftar stok ke Excel / CSV"
              className="h-11 lg:h-10 text-xs px-3.5 rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
              <span className="hidden sm:inline ml-1.5">Ekspor CSV</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNewItem}
              className="h-11 lg:h-10 px-4 text-xs rounded-2xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-extrabold shadow-md shadow-[#f370a8]/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
              <span className="hidden sm:inline">Barang</span>
            </Button>
          </>
        }
      />

      {/* 4a. Mobile Stock Card List (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-3xl border border-border bg-card text-center space-y-2.5 text-muted-foreground">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f370a8]/10 text-[#f370a8] flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-foreground">Tidak ada barang ditemukan</div>
            <p className="text-xs max-w-sm mx-auto text-muted-foreground">
              {search
                ? 'Tidak ada barang yang cocok dengan kata kunci pencarian.'
                : 'Mulai catat barang, properti sewa, dan stok balon dengan tombol Tambah Barang.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {hasActiveFilter && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs h-9 px-3.5 rounded-xl border-border hover:bg-muted font-bold text-foreground"
                >
                  Reset Semua Filter ✕
                </Button>
              )}
              <Button
                type="button"
                onClick={handleAddNewItem}
                className="text-xs h-9 px-4 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Barang
              </Button>
            </div>
          </div>
        ) : (
          filteredItems.map((it) => {
            const catConfig =
              INVENTORY_CATEGORIES.find((c) => c.id === it.category) || INVENTORY_CATEGORIES[0];
            const condConfig =
              CONDITION_CONFIG[it.condition] || CONDITION_CONFIG.baik;
            const isLow =
              typeof it.minimumAlertStock === 'number' &&
              (it.totalStock <= it.minimumAlertStock || it.condition === 'habis');
            const itemTypeKey = resolveItemBalloonType(it);
            const itemSizeKey = resolveItemBalloonSize(it);
            const resolvedTypeConfig = BALLOON_TYPES.find((t) => t.id === itemTypeKey);
            const resolvedSizeConfig = BALLOON_SIZES.find((s) => s.id === itemSizeKey);

            return (
              <div key={it.id} className="p-4 rounded-3xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                      <span>{it.name}</span>
                      {isLow && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          Menipis!
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#f370a8]" />
                        <span>{it.location || 'Gudang'}</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className={cn('w-2 h-2 rounded-full', condConfig.dot)} />
                        <span>{condConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditItem(it)}
                      aria-label={`Edit data barang ${it.name}`}
                      className="h-8 w-8 rounded-xl hover:bg-muted text-foreground"
                      title="Edit Barang"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(it.id, it.name)}
                      aria-label={`Hapus barang ${it.name}`}
                      className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500"
                      title="Hapus Barang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Balloon specifics tags if balloon */}
                {it.category === 'balon' && (resolvedTypeConfig || resolvedSizeConfig || it.balloonColor) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {resolvedTypeConfig && (
                      <span className={cn('text-[10px] font-extrabold py-0.5 px-2 rounded-lg border flex items-center gap-1', resolvedTypeConfig.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', resolvedTypeConfig.dotColor)} />
                        <span>{resolvedTypeConfig.label}</span>
                      </span>
                    )}
                    {resolvedSizeConfig && (
                      <span className={cn('text-[10px] font-black py-0.5 px-1.5 rounded-lg border', resolvedSizeConfig.badge)}>
                        {resolvedSizeConfig.inch}&quot;
                      </span>
                    )}
                    {it.balloonColor && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f370a8]" />
                        <span>{it.balloonColor}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Stock Stepper Footer */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Stok Fisik:</span>
                  <div className="inline-flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(it.id, -1)}
                      disabled={it.totalStock <= 0}
                      aria-label={`Kurangi 1 unit stok ${it.name}`}
                      className="w-7 h-7 rounded-lg bg-card hover:bg-background text-foreground flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      title="Kurangi 1 unit stok"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-xs min-w-[50px] text-center text-foreground">
                      {it.totalStock} <span className="text-[10px] font-medium text-muted-foreground">{it.unit}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(it.id, 1)}
                      aria-label={`Tambah 1 unit stok ${it.name}`}
                      className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f370a8] to-[#4d3085] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      title="Tambah 1 unit stok"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4b. Desktop Table of Stock Items (hidden sm:block) */}
      <div className="hidden sm:block rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl overflow-hidden shadow-sm transition-all">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider py-4 pl-6">
                Nama Barang & Properti
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Kategori & Spesifikasi
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-center w-40">
                Stok Fisik
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Status Kondisi
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider">
                Lokasi Rak / Gudang
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase tracking-wider text-center w-28 pr-6">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/70">
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2.5 text-muted-foreground">
                    <div className="w-12 h-12 rounded-2xl bg-[#f370a8]/10 text-[#f370a8] flex items-center justify-center">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-foreground">Tidak ada barang ditemukan</div>
                    <p className="text-xs max-w-sm text-muted-foreground font-medium">
                      {search
                        ? 'Tidak ada barang yang cocok dengan kata kunci pencarian.'
                        : 'Mulai catat barang, properti sewa, dan stok balon dengan tombol Tambah Barang.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      {hasActiveFilter && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="text-xs h-9 px-3.5 rounded-xl border-border hover:bg-muted font-bold text-foreground"
                        >
                          Reset Semua Filter ✕
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={handleAddNewItem}
                        className="text-xs h-9 px-4 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Barang Sekarang
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((it, idx) => {
                const catConfig =
                  INVENTORY_CATEGORIES.find((c) => c.id === it.category) || INVENTORY_CATEGORIES[0];
                const condConfig =
                  CONDITION_CONFIG[it.condition] || CONDITION_CONFIG.baik;
                const isLow =
                  typeof it.minimumAlertStock === 'number' &&
                  (it.totalStock <= it.minimumAlertStock || it.condition === 'habis');

                // Resolved balloon specific configs
                const itemTypeKey = resolveItemBalloonType(it);
                const itemSizeKey = resolveItemBalloonSize(it);
                const resolvedTypeConfig = BALLOON_TYPES.find((t) => t.id === itemTypeKey);
                const resolvedSizeConfig = BALLOON_SIZES.find((s) => s.id === itemSizeKey);

                return (
                  <TableRow
                    key={it.id}
                    style={{ animationDelay: `${idx * 20}ms` }}
                    className="border-border/70 hover:bg-[#f370a8]/5 dark:hover:bg-[#f370a8]/8 transition-all duration-200 group animate-in fade-in-50"
                  >
                    {/* Nama Barang & Catatan */}
                    <TableCell className="py-4 pl-6">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-foreground group-hover:text-[#f370a8] transition-colors flex items-center gap-2">
                          <span>{it.name}</span>
                          {isLow && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30">
                              Stok Menipis!
                            </span>
                          )}
                        </div>
                        {it.notes && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
                            {it.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Kategori & Spesifikasi Balon */}
                    <TableCell>
                      {it.category === 'balon' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Tipe Balon (Retro, Doff, Chrome, Metalik, Pastel) */}
                            {resolvedTypeConfig && (
                              <button
                                type="button"
                                onClick={() => setBalloonTypeFilter(resolvedTypeConfig.id)}
                                className={cn(
                                  'text-[10px] font-extrabold py-0.5 px-2 rounded-lg border flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs',
                                  resolvedTypeConfig.badge
                                )}
                                title={`Filter semua balon tipe ${resolvedTypeConfig.label}`}
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full', resolvedTypeConfig.dotColor)} />
                                <span>{resolvedTypeConfig.label}</span>
                              </button>
                            )}

                            {/* Ukuran Balon (5", 12", 18", 36") */}
                            {resolvedSizeConfig && (
                              <button
                                type="button"
                                onClick={() => setBalloonSizeFilter(resolvedSizeConfig.id)}
                                className={cn(
                                  'text-[10px] font-black py-0.5 px-1.5 rounded-lg border cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs',
                                  resolvedSizeConfig.badge
                                )}
                                title={`Filter semua balon ukuran ${resolvedSizeConfig.inch} Inch`}
                              >
                                {resolvedSizeConfig.inch}&quot;
                              </button>
                            )}
                          </div>

                          {it.balloonColor ? (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f370a8]" />
                              <span>{it.balloonColor}</span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] font-medium py-0 px-1.5 rounded-md border opacity-75', catConfig.badge)}
                            >
                              {catConfig.label}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-bold py-0.5 px-2 rounded-lg border', catConfig.badge)}
                        >
                          {catConfig.label}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Stok Counter with Instant +/- Buttons */}
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 bg-muted/70 p-1 rounded-2xl border border-border/80">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(it.id, -1)}
                          disabled={it.totalStock <= 0}
                          aria-label={`Kurangi 1 unit stok ${it.name}`}
                          className="w-7 h-7 rounded-xl bg-card hover:bg-background text-foreground flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95 shadow-2xs cursor-pointer border border-border/50"
                          title="Kurangi 1 unit stok"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-black text-xs min-w-[48px] text-foreground">
                          {it.totalStock} <span className="text-[10px] font-medium text-muted-foreground">{it.unit}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(it.id, 1)}
                          aria-label={`Tambah 1 unit stok ${it.name}`}
                          className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#f370a8] to-[#4d3085] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xs cursor-pointer"
                          title="Tambah 1 unit stok"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Status Kondisi */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-border/80 bg-background/80">
                        <span className={cn('w-2 h-2 rounded-full', condConfig.dot)} />
                        <span>{condConfig.label}</span>
                      </div>
                    </TableCell>

                    {/* Lokasi */}
                    <TableCell>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                        <span>{it.location || '—'}</span>
                      </div>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-center pr-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(it)}
                          aria-label={`Edit data barang ${it.name}`}
                          className="h-8 w-8 rounded-xl hover:bg-muted text-foreground hover:scale-110 active:scale-95 transition-all"
                          title="Edit Barang"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(it.id, it.name)}
                          aria-label={`Hapus barang ${it.name}`}
                          className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <InventoryItemModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          item={activeItem}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};
