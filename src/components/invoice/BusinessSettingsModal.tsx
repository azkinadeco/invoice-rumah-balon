'use client';

import React, { useState, useRef } from 'react';
import { BusinessSettings } from '@/types/invoice';
import { compressImageFile } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  QrCode,
  Upload,
  AtSign,
  Phone,
  FileCheck2,
  Check,
} from 'lucide-react';

interface BusinessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BusinessSettings;
  onSave: (settings: BusinessSettings, setAsDefault: boolean) => void;
}

export const BusinessSettingsModal: React.FC<BusinessSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<BusinessSettings>(currentSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const updateField = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file, 380, 0.85);
        updateField('qrisImageUrl', compressedBase64);
      } catch (err) {
        console.error('Failed to compress QRIS image:', err);
      }
    }
  };

  const handleSubmit = (setAsDefault: boolean) => {
    onSave(settings, setAsDefault);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:w-[96vw] max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-3.5 sm:p-6 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <span className="p-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <Building2 className="w-5 h-5" />
            </span>
            <span>Pengaturan Master Profil & Rekening Toko</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Atur data rekening BCA, barcode QRIS, syarat sewa dekorasi, dan kontak resmi Rumah Balon.
            Pengaturan ini otomatis dipakai setiap kali membuat invoice baru.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 text-sm">
          {/* Section 1: Bank & Rekening */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
              <span>1. Rekening Bank Penerima</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Bank</Label>
                <Input
                  value={settings.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="BCA"
                  className="mt-1 h-9 text-xs rounded-xl border-border bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Atas Nama (A/N)</Label>
                <Input
                  value={settings.bankAccountName}
                  onChange={(e) => updateField('bankAccountName', e.target.value)}
                  placeholder="DYAS KURNIAWAN"
                  className="mt-1 h-9 text-xs uppercase font-semibold rounded-xl border-border bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Nomor Rekening</Label>
                <Input
                  value={settings.bankAccountNumber}
                  onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                  placeholder="011-857-8612"
                  className="mt-1 h-9 text-xs font-mono font-bold rounded-xl border-border bg-background"
                />
              </div>
            </div>
          </div>

          <Separator className="border-border" />

          {/* Section 2: QRIS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-pink-500" />
                <span>2. Tampilan Barcode QRIS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tampilkan QRIS di Invoice</span>
                <Switch
                  checked={settings.showQris}
                  onCheckedChange={(checked) => updateField('showQris', checked)}
                />
              </div>
            </div>

            {settings.showQris && (
              <div className="p-3.5 rounded-2xl border border-border bg-muted/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden">
                    {settings.qrisImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.qrisImageUrl}
                        alt="QRIS Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-400">QRIS</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {settings.qrisImageUrl ? 'Gambar QRIS Tersimpan' : 'Menggunakan Placeholder QRIS'}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Unggah file foto barcode QRIS toko agar pelanggan bisa langsung scan.
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    ref={qrisInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrisUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => qrisInputRef.current?.click()}
                    className="text-xs h-8 rounded-xl border-border hover:bg-card"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1 text-muted-foreground" /> Ganti Gambar QRIS
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator className="border-border" />

          {/* Section 3: Catatan & Kontak */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
              <span>3. Catatan Syarat Sewa & Kontak Toko</span>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Catatan DP Minimal (Teks Merah)</Label>
              <Input
                value={settings.minDpNote}
                onChange={(e) => updateField('minDpNote', e.target.value)}
                className="mt-1 h-9 text-xs text-rose-500 font-medium rounded-xl border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Syarat Properti #1</Label>
                <textarea
                  value={settings.notes[0] || ''}
                  onChange={(e) => {
                    const nextNotes = [...settings.notes];
                    nextNotes[0] = e.target.value;
                    updateField('notes', nextNotes);
                  }}
                  rows={2}
                  className="w-full mt-1 text-xs rounded-xl border border-border p-2.5 focus:ring-2 focus:ring-pink-500/30 focus:outline-hidden bg-background text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Syarat Properti #2 (Ganti Rugi)</Label>
                <textarea
                  value={settings.notes[1] || ''}
                  onChange={(e) => {
                    const nextNotes = [...settings.notes];
                    nextNotes[1] = e.target.value;
                    updateField('notes', nextNotes);
                  }}
                  rows={2}
                  className="w-full mt-1 text-xs rounded-xl border border-border p-2.5 focus:ring-2 focus:ring-pink-500/30 focus:outline-hidden bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-[#f370a8]" /> Akun Instagram Toko
                </Label>
                <Input
                  value={settings.contactIg}
                  onChange={(e) => updateField('contactIg', e.target.value)}
                  placeholder="Rumahbalon_mlg"
                  className="mt-1 h-9 text-xs rounded-xl border-border bg-background"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#a78bfa]" /> WhatsApp Toko
                </Label>
                <Input
                  value={settings.contactWa}
                  onChange={(e) => updateField('contactWa', e.target.value)}
                  placeholder="+62 857-8612-1897"
                  className="mt-1 h-9 text-xs rounded-xl border-border bg-background"
                />
              </div>
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
            className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl cursor-pointer"
          >
            Batal
          </Button>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              className="hidden sm:inline-flex text-xs h-9 rounded-xl border-border text-foreground hover:bg-muted"
            >
              Hanya Invoice Ini
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit(true)}
              className="text-xs h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Tersimpan!
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Simpan Profil
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
