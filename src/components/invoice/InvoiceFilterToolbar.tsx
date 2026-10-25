'use client';

import React, { useRef } from 'react';
import { Download, Upload, FileSpreadsheet, Database, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { FilterBar } from '@/components/common/FilterBar';
import { cn } from '@/lib/utils';

interface InvoiceFilterToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  periodFilter: 'all' | 'this_month' | 'last_month';
  setPeriodFilter: (val: 'all' | 'this_month' | 'last_month') => void;
  filteredCount: number;
  onExportCSV: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  needBackupReminder: boolean;
}

export const InvoiceFilterToolbar: React.FC<InvoiceFilterToolbarProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  periodFilter,
  setPeriodFilter,
  filteredCount,
  onExportCSV,
  onExportBackup,
  onImportBackup,
  needBackupReminder,
}) => {
  const importFileRef = useRef<HTMLInputElement>(null);

  return (
    <FilterBar
      search={search}
      onSearchChange={setSearch}
      placeholder="Cari client, no invoice, venue..."
      searchLabel="Cari invoice"
      searchId="main-invoice-search"
      showShortcutHint
      filters={[
        {
          key: 'period',
          label: 'Periode',
          value: periodFilter,
          onChange: (v) => setPeriodFilter(v as 'all' | 'this_month' | 'last_month'),
          options: [
            { value: 'all', label: 'Semua Waktu' },
            { value: 'this_month', label: 'Bulan Ini' },
            { value: 'last_month', label: 'Bulan Lalu' },
          ],
        },
        {
          key: 'status',
          label: 'Status',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'Semua Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Terkirim' },
            { value: 'dp_paid', label: 'DP Masuk' },
            { value: 'paid', label: 'Lunas' },
            { value: 'cancelled', label: 'Batal' },
          ],
        },
      ]}
      onReset={() => {
        setSearch('');
        setStatusFilter('all');
        setPeriodFilter('all');
      }}
      resultLabel={`${filteredCount} invoice`}
      actions={
        <>
          <input ref={importFileRef} type="file" accept=".json" onChange={onImportBackup} className="hidden" />
          <Popover>
            <PopoverTrigger
              type="button"
              aria-label="Menu Backup dan Ekspor Data"
              className={cn(
                'relative inline-flex items-center justify-center h-11 lg:h-10 px-3.5 text-xs rounded-2xl border font-semibold transition-all active:scale-95 gap-1.5 cursor-pointer',
                needBackupReminder
                  ? 'bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white border-transparent shadow-md shadow-[#f370a8]/25'
                  : 'border-border text-foreground bg-card hover:bg-muted'
              )}
            >
              <Database className="w-4 h-4 text-[#f370a8]" />
              <span className="hidden sm:inline">Backup & Ekspor</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              {needBackupReminder && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-card animate-badge-pulse" />
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-2 space-y-1 rounded-2xl shadow-xl border-border bg-card">
              {needBackupReminder && (
                <div className="px-3 py-2 rounded-xl bg-amber-500/10 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Sudah lama tidak backup. Unduh file JSON untuk keamanan data.
                </div>
              )}
              <button
                type="button"
                onClick={onExportCSV}
                className="w-full text-left px-3 py-3 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                <div>
                  <div className="font-bold">Ekspor ke Excel / CSV</div>
                  <div className="text-[10px] text-muted-foreground">Laporan tabel invoice sesuai filter</div>
                </div>
              </button>
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full text-left px-3 py-3 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#f370a8]" />
                <div>
                  <div className="font-bold">Cadangkan File JSON</div>
                  <div className="text-[10px] text-muted-foreground">Database lengkap invoice & stok</div>
                </div>
              </button>
              <div className="h-px bg-border my-1" />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="w-full text-left px-3 py-3 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-bold">Pulihkan Cadangan JSON</div>
                  <div className="text-[10px] text-muted-foreground">Upload file backup yang tersimpan</div>
                </div>
              </button>
            </PopoverContent>
          </Popover>
        </>
      }
    />
  );
};
