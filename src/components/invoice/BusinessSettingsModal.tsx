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
import {
  Building2,
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

const SectionCard: React.FC<{ title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  hint,
  action,
  children,
}) => (
  <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

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

  const fieldInput = 'mt-1.5 h-11 sm:h-10 text-sm sm:text-xs rounded-xl border-border bg-background';
  const fieldLabel = 'text-xs text-muted-foreground font-semibold';
  const fieldTextarea =
    'w-full mt-1.5 text-sm sm:text-xs rounded-xl border border-border p-3 focus:ring-2 focus:ring-pink-500/30 focus:outline-hidden bg-background text-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:w-[96vw] max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 pr-12 border-b border-border shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
            <span className="p-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </span>
            <span>Pengaturan Toko</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Dipakai otomatis untuk setiap invoice baru.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-sm">
          <SectionCard title="Rekening Bank" hint="Tujuan transfer yang tampil di invoice.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className={fieldLabel}>Bank</Label>
                <Input
                  value={settings.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="BCA"
                  className={fieldInput}
                />
              </div>
              <div>
                <Label className={fieldLabel}>Atas Nama</Label>
                <Input
                  value={settings.bankAccountName}
                  onChange={(e) => updateField('bankAccountName', e.target.value)}
                  placeholder="DYAS KURNIAWAN"
                  className={`${fieldInput} uppercase font-semibold`}
                />
              </div>
              <div>
                <Label className={fieldLabel}>Nomor Rekening</Label>
                <Input
                  value={settings.bankAccountNumber}
                  onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                  placeholder="011-857-8612"
                  inputMode="numeric"
                  className={`${fieldInput} font-mono font-bold`}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="QRIS"
            hint="Barcode untuk pembayaran non-tunai."
            action={
              <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                <span className="text-xs text-muted-foreground">Tampilkan</span>
                <Switch
                  checked={settings.showQris}
                  onCheckedChange={(checked) => updateField('showQris', checked)}
                  aria-label="Tampilkan QRIS di invoice"
                />
              </label>
            }
          >
            {settings.showQris && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-24 h-24 shrink-0 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden">
                  {settings.qrisImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.qrisImageUrl} alt="QRIS Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xs font-bold text-zinc-400">QRIS</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    {settings.qrisImageUrl
                      ? 'Gambar QRIS tersimpan.'
                      : 'Belum ada gambar, invoice memakai placeholder. Unggah foto barcode QRIS toko agar pelanggan bisa scan.'}
                  </p>
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
                    onClick={() => qrisInputRef.current?.click()}
                    className="text-xs h-11 sm:h-9 w-full sm:w-auto rounded-xl border-border hover:bg-card"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    {settings.qrisImageUrl ? 'Ganti Gambar' : 'Unggah Gambar'}
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Syarat & Catatan" hint="Tampil di bagian bawah invoice.">
            <div>
              <Label className={fieldLabel}>Catatan DP Minimal (teks merah)</Label>
              <textarea
                value={settings.minDpNote}
                onChange={(e) => updateField('minDpNote', e.target.value)}
                rows={2}
                className={`${fieldTextarea} text-rose-500 font-medium`}
              />
            </div>
            <div>
              <Label className={fieldLabel}>Syarat Properti 1</Label>
              <textarea
                value={settings.notes[0] || ''}
                onChange={(e) => {
                  const nextNotes = [...settings.notes];
                  nextNotes[0] = e.target.value;
                  updateField('notes', nextNotes);
                }}
                rows={3}
                className={fieldTextarea}
              />
            </div>
            <div>
              <Label className={fieldLabel}>Syarat Properti 2 (ganti rugi)</Label>
              <textarea
                value={settings.notes[1] || ''}
                onChange={(e) => {
                  const nextNotes = [...settings.notes];
                  nextNotes[1] = e.target.value;
                  updateField('notes', nextNotes);
                }}
                rows={3}
                className={fieldTextarea}
              />
            </div>
          </SectionCard>

          <SectionCard title="Kontak Toko">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className={`${fieldLabel} flex items-center gap-1.5`}>
                  <AtSign className="w-3.5 h-3.5 text-[#f370a8]" /> Instagram
                </Label>
                <Input
                  value={settings.contactIg}
                  onChange={(e) => updateField('contactIg', e.target.value)}
                  placeholder="Rumahbalon_mlg"
                  className={fieldInput}
                />
              </div>
              <div>
                <Label className={`${fieldLabel} flex items-center gap-1.5`}>
                  <Phone className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#a78bfa]" /> WhatsApp
                </Label>
                <Input
                  value={settings.contactWa}
                  onChange={(e) => updateField('contactWa', e.target.value)}
                  placeholder="+62 857-8612-1897"
                  inputMode="tel"
                  className={fieldInput}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <DialogFooter className="px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] border-t border-border bg-card flex flex-row items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground h-11 sm:h-10 px-4 rounded-xl cursor-pointer"
          >
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false)}
              className="hidden sm:inline-flex text-xs h-10 rounded-xl border-border text-foreground hover:bg-muted"
            >
              Hanya Invoice Ini
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              className="text-xs h-11 sm:h-10 px-5 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 transition-all active:scale-95 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" /> Tersimpan!
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4 mr-1.5" /> Simpan
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
