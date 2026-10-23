'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Package,
  Layers,
  MapPin,
  Tag,
  AlertTriangle,
  FileText,
  Save,
  Boxes,
  Sparkles,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
}

const UNIT_SUGGESTIONS = ['Pack', 'Pcs', 'Unit', 'Set', 'Roll', 'Meter', 'Box'];

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  open,
  onOpenChange,
  item,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('balon');
  const [balloonType, setBalloonType] = useState<BalloonType | ''>('retro');
  const [balloonSize, setBalloonSize] = useState<BalloonSize | ''>('12_inch');
  const [balloonColor, setBalloonColor] = useState('');
  const [totalStock, setTotalStock] = useState<number>(1);
  const [unit, setUnit] = useState('Pack');
  const [condition, setCondition] = useState<ItemCondition>('baik');
  const [location, setLocation] = useState('');
  const [minimumAlertStock, setMinimumAlertStock] = useState<number>(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item && open) {
      setName(item.name || '');
      setCategory(item.category || 'balon');
      setBalloonType((item.balloonType as BalloonType) || '');
      setBalloonSize((item.balloonSize as BalloonSize) || '');
      setBalloonColor(item.balloonColor || '');
      setTotalStock(typeof item.totalStock === 'number' ? item.totalStock : 1);
      setUnit(item.unit || (item.category === 'balon' ? 'Pack' : 'Pcs'));
      setCondition(item.condition || 'baik');
      setLocation(item.location || '');
      setMinimumAlertStock(typeof item.minimumAlertStock === 'number' ? item.minimumAlertStock : 1);
      setNotes(item.notes || '');
    } else if (open) {
      setName('');
      setCategory('balon');
      setBalloonType('retro');
      setBalloonSize('12_inch');
      setBalloonColor('');
      setTotalStock(10);
      setUnit('Pack');
      setCondition('baik');
      setLocation('Rak Balon');
      setMinimumAlertStock(3);
      setNotes('');
    }
  }, [item, open]);

  // Quick auto name generator for balloons
  const handleAutoGenerateName = () => {
    const typeLabel = BALLOON_TYPES.find((t) => t.id === balloonType)?.label || '';
    const sizeObj = BALLOON_SIZES.find((s) => s.id === balloonSize);
    const sizeLabel = sizeObj ? `${sizeObj.inch} Inch` : '';
    const colorLabel = balloonColor.trim() ? `${balloonColor.trim()}` : '';
    const generated = `Balon ${typeLabel} ${colorLabel ? colorLabel + ' ' : ''}${sizeLabel} (${unit})`.trim();
    setName(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: InventoryItem = {
      id: item?.id || `inv-${Date.now()}`,
      name: name.trim(),
      category,
      balloonType: category === 'balon' && balloonType ? balloonType : undefined,
      balloonSize: category === 'balon' && balloonSize ? balloonSize : undefined,
      balloonColor: category === 'balon' && balloonColor ? balloonColor.trim() : undefined,
      totalStock: Math.max(0, Number(totalStock) || 0),
      availableStock: Math.max(0, Number(totalStock) || 0),
      unit: unit.trim() || (category === 'balon' ? 'Pack' : 'Pcs'),
      condition,
      location: location.trim(),
      minimumAlertStock: Math.max(0, Number(minimumAlertStock) || 0),
      notes: notes.trim(),
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(saved);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-[96vw] max-w-xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border bg-gradient-to-r from-card via-[#f370a8]/5 to-card shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f370a8] to-[#4d3085] flex items-center justify-center text-white shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  {item ? 'Edit Barang / Properti' : 'Tambah Barang & Properti Baru'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kelola master data stok alat dekorasi, properti sewa, dan balon gudang.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {/* Nama Barang */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Nama Barang / Properti / Produk *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pompa Balon Listrik Double Nozzle 600W / Arch Besi 2M"
              className="h-10 text-xs rounded-xl bg-background border-border font-medium"
              required
            />
          </div>

          {/* Kategori Selector Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Kategori Barang</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {INVENTORY_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer',
                      isSelected
                        ? 'bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white border-transparent shadow-xs'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    )}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KHUSUS KATEGORI BALON: SPESIFIK TIPE (Retro, Doff, Chrome, Metalik, Pastel) & UKURAN (5, 12, 18, 36 inch) */}
          {category === 'balon' && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#f370a8]/10 via-[#4d3085]/5 to-background border border-[#f370a8]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f370a8]" />
                  <span className="font-extrabold text-xs text-foreground">
                    Spesifikasi Khusus Balon
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateName}
                  className="text-[10px] font-bold text-[#4d3085] dark:text-[#c4b5fd] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Buat format nama balon otomatis berdasarkan tipe, warna, dan ukuran"
                >
                  <Palette className="w-3 h-3 text-[#f370a8]" />
                  <span>Format Nama Otomatis</span>
                </button>
              </div>

              {/* 1. Tipe / Tekstur Balon */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Tipe / Tekstur Balon:</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                    {balloonType || '—'}
                  </span>
                </Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BALLOON_TYPES.map((t) => {
                    const isSel = balloonType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBalloonType(t.id)}
                        className={cn(
                          'py-1.5 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer',
                          isSel
                            ? `${t.badge} shadow-xs ring-2 ring-foreground/20`
                            : 'bg-card/70 hover:bg-card text-muted-foreground border-border'
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full', t.dotColor)} />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ukuran Balon */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Ukuran Balon (Inch):</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {BALLOON_SIZES.find((s) => s.id === balloonSize)?.label || '—'}
                  </span>
                </Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BALLOON_SIZES.map((s) => {
                    const isSel = balloonSize === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBalloonSize(s.id)}
                        className={cn(
                          'py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer',
                          isSel
                            ? 'bg-gradient-to-r from-[#4d3085] to-[#f370a8] text-white border-transparent shadow-xs font-black'
                            : 'bg-card/70 hover:bg-card text-muted-foreground border-border'
                        )}
                      >
                        <div className="text-sm font-black">{s.inch}&quot;</div>
                        <div className="text-[9px] opacity-80 truncate">{s.label.split(' ')[1] || ''}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Warna / Varian */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  Warna / Varian Balon
                </Label>
                <Input
                  value={balloonColor}
                  onChange={(e) => setBalloonColor(e.target.value)}
                  placeholder="Contoh: Olive Green, Sand White, Mirror Gold, Lilac, Dusty Rose"
                  className="h-9 text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>
          )}

          {/* Stok & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Jumlah Stok Total</span>
                <span className="text-[10px] text-muted-foreground">Unit di gudang</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={totalStock}
                onChange={(e) => setTotalStock(Number(e.target.value))}
                className="h-10 font-mono font-bold text-xs rounded-xl bg-background border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Satuan (Unit / Pcs)</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Pcs / Unit / Set"
                className="h-10 text-xs rounded-xl bg-background border-border"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {UNIT_SUGGESTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kondisi & Peringatan Stok Minimum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Status / Kondisi Fisik</Label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground font-semibold text-xs outline-none cursor-pointer"
              >
                <option value="baik">Kondisi Baik (Siap Pakai)</option>
                <option value="perlu_cek">Perlu Pengecekan / Servis Ringan</option>
                <option value="rusak">Rusak / Sedang Perbaikan</option>
                <option value="habis">Stok Habis / Perlu Restock</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Batas Peringatan Stok Min</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={minimumAlertStock}
                onChange={(e) => setMinimumAlertStock(Number(e.target.value))}
                placeholder="1"
                className="h-10 font-mono text-xs rounded-xl bg-background border-border"
              />
            </div>
          </div>

          {/* Lokasi Gudang / Rak Penyimpanan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#f370a8]" />
              <span>Lokasi Rak / Kotak Penyimpanan</span>
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Rak Properti B / Box Alat 1 / Gudang Belakang"
              className="h-10 text-xs rounded-xl bg-background border-border"
            />
          </div>

          {/* Catatan / Spesifikasi Barang */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Catatan / Spesifikasi Khusus</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Wajib bawa kabel roll 15m; bahan plywood putih dove; colokan tipe 2 pin."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none resize-none focus:ring-2 focus:ring-[#f370a8]/30"
            />
          </div>

          {/* Sticky Mobile/Desktop Footer */}
          <DialogFooter className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-md pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] border-t border-border flex flex-row items-center justify-between gap-2 mt-auto shrink-0 px-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="text-xs h-9 px-5 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{item ? 'Simpan Perubahan' : 'Tambahkan ke Stok'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
