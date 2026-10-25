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

  const hasActiveFilter = Boolean(search) || statusFilter !== 'all' || periodFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3.5 sm:p-4 bg-card/90 backdrop-blur-xl rounded-3xl border border-border/80 shadow-sm transition-all">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="main-invoice-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari client, no invoice, venue..."
            aria-label="Cari invoice"
            className="pl-10 pr-16 h-11 text-xs rounded-2xl border-border/80 bg-background/60 font-medium transition-all focus:ring-2 focus:ring-[#f370a8]/50 focus:border-[#f370a8]"
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Bersihkan pencarian"
                className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-muted/80 rounded-md border border-border">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter Groups & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end w-full lg:w-auto">
          {/* Period selector */}
          <div className="flex items-center bg-muted/70 p-1 rounded-2xl border border-border/80 shrink-0">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id as any)}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 text-xs rounded-xl font-bold transition-all duration-200 cursor-pointer',
                  periodFilter === p.id
                    ? 'bg-card text-foreground shadow-xs scale-102'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Status Chips with Smooth Touch Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full touch-pan-x scroll-smooth">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'draft', label: 'Draft' },
              { id: 'sent', label: 'Terkirim' },
              { id: 'dp_paid', label: 'DP Masuk' },
              { id: 'paid', label: 'Lunas ✨' },
              { id: 'cancelled', label: 'Batal' },
            ].map((st) => {
              const active = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-xl font-bold transition-all duration-200 whitespace-nowrap border cursor-pointer active:scale-95',
                    active
                      ? 'bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white border-transparent shadow-md shadow-[#f370a8]/25 scale-105'
                      : 'bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border hover:border-[#f370a8]/30'
                  )}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Unified "Backup & Ekspor" Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />

            <Popover>
              <PopoverTrigger
                type="button"
                aria-label="Menu Backup dan Ekspor Data"
                className={cn(
                  'inline-flex items-center justify-center h-10 px-3.5 text-xs rounded-2xl border font-semibold transition-all duration-200 hover:scale-105 active:scale-95 gap-1.5 shadow-2xs cursor-pointer',
                  needBackupReminder
                    ? 'bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white border-transparent shadow-md shadow-[#f370a8]/25'
                    : 'border-border text-foreground bg-card hover:bg-muted'
                )}
              >
                <Database className="w-3.5 h-3.5 text-[#f370a8]" />
                <span>Backup & Ekspor</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                {needBackupReminder && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-white text-[#4d3085] animate-badge-pulse">
                    Penting
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2 space-y-1 rounded-2xl shadow-xl border-border bg-card">
                <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Opsi Ekspor & Cadangan
                </div>

                <button
                  type="button"
                  onClick={onExportCSV}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                  <div>
                    <div className="font-bold">Ekspor ke Excel / CSV</div>
                    <div className="text-[10px] text-muted-foreground">Unduh laporan tabel invoice</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onExportBackup}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
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
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-bold">Pulihkan Cadangan JSON</div>
                    <div className="text-[10px] text-muted-foreground">Upload file backup yang tersimpan</div>
                  </div>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-[#f370a8]/10 border border-[#f370a8]/30 text-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2 text-foreground font-medium">
            <span className="font-bold">Filter Aktif:</span>
            {search && (
              <span className="bg-card px-2.5 py-0.5 rounded-lg border border-border font-mono text-[11px]">
                &ldquo;{search}&rdquo;
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-card px-2.5 py-0.5 rounded-lg border border-border text-[11px] font-bold">
                Status: {STATUS_COLORS[statusFilter]?.label || statusFilter}
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
            <span>Reset Filter ✕</span>
          </button>
        </div>
      )}
    </div>
  );
};
