'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  X,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  ChevronDown,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { STATUS_COLORS } from '@/lib/constants';
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
  /** Admin only: omit to hide backup / restore. */
  onExportBackup?: () => void;
  onImportBackup?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  needBackupReminder: boolean;
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Terkirim',
  dp_paid: 'DP Masuk',
  paid: 'Lunas',
  cancelled: 'Batal',
};

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

  const hasActiveFilter = Boolean(search) || statusFilter !== 'all' || periodFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="p-3 sm:p-3.5 bg-card rounded-2xl border border-border shadow-2xs space-y-3">
        {/* Row 1: Search + Backup */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="main-invoice-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari client, no. invoice, venue, paket…"
              aria-label="Cari invoice"
              aria-keyshortcuts="/"
              className="pl-9 pr-16 h-10 text-sm rounded-xl border-border bg-background/70 font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#f370a8]/40"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Bersihkan pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 h-5 px-1.5 items-center rounded-md border border-border bg-muted text-[10px] font-mono text-muted-foreground pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {onImportBackup && (
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          )}

          <Popover>
            <PopoverTrigger
              type="button"
              aria-label="Menu Backup dan Ekspor Data"
              className={cn(
                'relative inline-flex items-center justify-center h-10 px-3 text-xs rounded-xl border font-semibold transition-colors gap-1.5 shrink-0 cursor-pointer',
                needBackupReminder && onExportBackup
                  ? 'bg-[#4d3085] text-white border-transparent hover:bg-[#4d3085]/90'
                  : 'border-border text-foreground bg-card hover:bg-muted'
              )}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{onExportBackup ? 'Backup & Ekspor' : 'Ekspor'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:block" />
              {needBackupReminder && onExportBackup && (
                <>
                  <span className="hidden sm:inline ml-0.5 px-1.5 py-px text-[9px] font-black rounded-full bg-white text-[#4d3085]">
                    Penting
                  </span>
                  <span className="sm:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#f370a8] ring-2 ring-card" />
                </>
              )}
            </PopoverTrigger>
            <PopoverContent closeOnClick align="end" className="w-64 p-1.5 space-y-0.5 rounded-xl shadow-xl border-border bg-card">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {onExportBackup ? 'Opsi Ekspor & Cadangan' : 'Opsi Ekspor'}
              </div>

              <button
                type="button"
                onClick={onExportCSV}
                className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd] shrink-0" />
                <div>
                  <div className="font-bold">Ekspor ke Excel / CSV</div>
                  <div className="text-[10px] text-muted-foreground">Unduh laporan tabel invoice</div>
                </div>
              </button>

              {onExportBackup && onImportBackup && (
                <>
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#f370a8] shrink-0" />
                <div>
                  <div className="font-bold">Cadangkan File JSON</div>
                  <div className="text-[10px] text-muted-foreground">Database lengkap invoice & stok</div>
                </div>
              </button>

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold">Pulihkan Cadangan JSON</div>
                  <div className="text-[10px] text-muted-foreground">Upload file backup yang tersimpan</div>
                </div>
              </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Row 2: Period + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div
            role="group"
            aria-label="Filter periode"
            className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/70 shrink-0 self-start"
          >
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={periodFilter === p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={cn(
                  'h-7 px-2.5 text-xs rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap',
                  periodFilter === p.id
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-5 bg-border" />

          <div
            role="group"
            aria-label="Filter status"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 touch-pan-x"
          >
            {[
              { id: 'all', label: 'Semua' },
              { id: 'draft', label: 'Draft' },
              { id: 'sent', label: 'Terkirim' },
              { id: 'dp_paid', label: 'DP Masuk' },
              { id: 'paid', label: 'Lunas' },
              { id: 'cancelled', label: 'Batal' },
            ].map((st) => {
              const active = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(st.id)}
                  className={cn(
                    'h-7 px-3 text-xs rounded-full font-semibold transition-colors whitespace-nowrap border cursor-pointer',
                    active
                      ? 'bg-[#4d3085] text-white border-transparent dark:bg-[#f370a8]'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                  )}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#f370a8]/8 border border-[#f370a8]/25 text-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2 text-foreground font-medium">
            <span className="font-bold">Filter Aktif:</span>
            {search && (
              <span className="bg-card px-2.5 py-0.5 rounded-lg border border-border font-mono text-[11px]">
                &ldquo;{search}&rdquo;
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-card px-2.5 py-0.5 rounded-lg border border-border text-[11px] font-bold">
                Status: {STATUS_FILTER_LABELS[statusFilter] || STATUS_COLORS[statusFilter]?.label || statusFilter}
              </span>
            )}
            {periodFilter !== 'all' && (
              <span className="bg-card px-2.5 py-0.5 rounded-lg border border-border text-[11px] font-bold">
                Periode: {periodFilter === 'this_month' ? 'Bulan Ini' : 'Bulan Lalu'}
              </span>
            )}
            <span className="text-muted-foreground text-[11px] font-mono">
              ({filteredCount} invoice ditemukan)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setPeriodFilter('all');
            }}
            className="text-xs font-bold text-[#f370a8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Reset Filter</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
