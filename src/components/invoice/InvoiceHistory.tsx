'use client';

import React, { useState, useRef } from 'react';
import { InvoiceData } from '@/types/invoice';
import { STATUS_COLORS } from '@/lib/constants';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calendar,
  User,
  Trash2,
  Copy,
  ExternalLink,
  Receipt,
  Clock,
  Download,
  Upload,
  Check,
} from 'lucide-react';

interface InvoiceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
  onDuplicateInvoice: (invoice: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onImportInvoices?: (invoices: InvoiceData[]) => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onImportInvoices,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [importSuccessNotice, setImportSuccessNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientPhone && inv.clientPhone.includes(search));

    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Export all saved invoices to JSON
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_invoice_rumah_balon_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && onImportInvoices) {
          onImportInvoices(parsed);
          setImportSuccessNotice(true);
          setTimeout(() => setImportSuccessNotice(false), 3000);
        } else {
          alert('Format file backup tidak valid.');
        }
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-card border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                <Receipt className="w-5 h-5" />
              </span>
              <span>Riwayat Database Invoice ({invoices.length})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cari, buka kembali, salin, atau amankan data invoice ke file backup.
            </DialogDescription>
          </div>

          {/* Backup / Restore Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs text-foreground border-border hover:bg-muted rounded-xl"
              title="Pulihkan data dari file JSON"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              Impor Backup
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              className="h-8 text-xs text-foreground border-border hover:bg-muted rounded-xl"
              title="Unduh seluruh database invoice"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-pink-500" />
              Ekspor Backup
            </Button>
          </div>
        </DialogHeader>

        {importSuccessNotice && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            Data invoice berhasil diimpor & dipulihkan ke sistem!
          </div>
        )}

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-2 py-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nomor invoice, nama client, nomor WhatsApp..."
              className="pl-9 h-10 text-xs rounded-xl border-border bg-background"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'draft', 'sent', 'dp_paid', 'paid'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-all whitespace-nowrap font-medium ${
                  filterStatus === st
                    ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {st === 'all' ? 'Semua' : STATUS_COLORS[st]?.label || st}
              </button>
            ))}
          </div>
        </div>

        {/* List of Invoices */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">Tidak ada invoice yang sesuai.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Semua invoice yang kamu edit tersimpan otomatis ke riwayat ini.
              </p>
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl border border-border hover:border-pink-500/40 bg-card hover:bg-accent/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                      #{inv.invoiceNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${STATUS_COLORS[inv.status]?.badge} text-[10px] py-0 px-2 rounded-full`}
                    >
                      {STATUS_COLORS[inv.status]?.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString('id-ID') : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {inv.clientName || 'Tanpa Nama'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-pink-500" />
                      Acara: {inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground font-mono">
                    Total: <span className="text-pink-600 dark:text-pink-400 font-black">{formatRupiah(inv.total)}</span>
                    <span className="text-muted-foreground font-normal font-sans ml-2 text-[11px]">
                      ({inv.items.length} item)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDuplicateInvoice(inv);
                      onClose();
                    }}
                    title="Duplikat ke Invoice Baru"
                    className="h-8 px-2.5 text-xs border-border text-foreground hover:bg-muted rounded-xl"
                  >
                    <Copy className="w-3 h-3 mr-1 text-muted-foreground" /> Salin
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Hapus invoice #${inv.invoiceNumber}?`)) {
                        onDeleteInvoice(inv.id);
                      }
                    }}
                    title="Hapus Invoice"
                    className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-border rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onSelectInvoice(inv);
                      onClose();
                    }}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Buka
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
