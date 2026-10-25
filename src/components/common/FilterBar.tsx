'use client';

import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Hide the filter entirely (e.g. balloon-only filters). Its value still counts as active if set. */
  hidden?: boolean;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  searchId?: string;
  showShortcutHint?: boolean;
  filters: FilterDef[];
  onReset: () => void;
  resultLabel?: string;
  actions?: React.ReactNode;
}

const NativeSelect: React.FC<{ def: FilterDef; className?: string }> = ({ def, className }) => (
  <div className={cn('relative', className)}>
    <select
      value={def.value}
      onChange={(e) => def.onChange(e.target.value)}
      aria-label={def.label}
      className={cn(
        'w-full appearance-none h-11 lg:h-10 pl-3 pr-8 rounded-2xl border text-xs font-semibold outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#f370a8]/50 focus:border-[#f370a8]',
        def.value !== 'all'
          ? 'bg-[#f370a8]/10 border-[#f370a8]/40 text-foreground'
          : 'bg-background/60 border-border/80 text-foreground'
      )}
    >
      {def.options.map((o) => (
        <option key={o.value} value={o.value} className="bg-card text-foreground">
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
  </div>
);

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  placeholder,
  searchLabel,
  searchId,
  showShortcutHint,
  filters,
  onReset,
  resultLabel,
  actions,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const visible = filters.filter((f) => !f.hidden);
  const active = filters.filter((f) => f.value !== 'all');
  const hasSomething = active.length > 0 || Boolean(search);

  return (
    <div className="space-y-2.5">
      <div className="p-3 sm:p-4 bg-card/90 backdrop-blur-xl rounded-3xl border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full lg:w-auto lg:flex-1 lg:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id={searchId}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              aria-label={searchLabel}
              className="pl-10 pr-10 h-11 lg:h-10 text-xs rounded-2xl border-border/80 bg-background/60 font-medium transition-all focus:ring-2 focus:ring-[#f370a8]/50 focus:border-[#f370a8]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Bersihkan pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              showShortcutHint && (
                <kbd className="hidden lg:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-muted/80 rounded-md border border-border">
                  /
                </kbd>
              )
            )}
          </div>

          {/* Desktop: inline selects */}
          <div className="hidden lg:flex items-center gap-2">
            {visible.map((f) => (
              <NativeSelect key={f.key} def={f} className="min-w-36" />
            ))}
          </div>

          {/* Mobile/tablet: filter toggle */}
          {visible.length > 0 && (
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              aria-expanded={panelOpen}
              aria-label="Tampilkan atau sembunyikan filter"
              className={cn(
                'lg:hidden flex-1 sm:flex-none h-11 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer',
                active.length > 0
                  ? 'bg-[#f370a8]/10 border-[#f370a8]/40 text-foreground'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#f370a8]" />
              <span>Filter</span>
              {active.length > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#f370a8] text-white text-[10px] font-black flex items-center justify-center">
                  {active.length}
                </span>
              )}
            </button>
          )}

          {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
        </div>

        {/* Mobile/tablet: filter panel */}
        {panelOpen && (
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-border/70 animate-in fade-in-50">
            {visible.map((f) => (
              <label key={f.key} className="space-y-1 block">
                <span className="text-[11px] font-semibold text-muted-foreground">{f.label}</span>
                <NativeSelect def={f} />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Active filter chips + result count */}
      {hasSomething && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs animate-in fade-in-50">
          {active.map((f) => {
            const opt = f.options.find((o) => o.value === f.value);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => f.onChange('all')}
                aria-label={`Hapus filter ${f.label}`}
                className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-[#f370a8]/10 border border-[#f370a8]/30 text-foreground font-semibold cursor-pointer hover:bg-[#f370a8]/20 transition-colors"
              >
                <span>
                  {f.label}: {opt?.label || f.value}
                </span>
                <X className="w-3.5 h-3.5 text-[#f370a8]" />
              </button>
            );
          })}
          {resultLabel && <span className="text-muted-foreground font-mono text-[11px]">{resultLabel}</span>}
          <button
            type="button"
            onClick={onReset}
            className="ml-auto h-8 px-2 font-bold text-[#f370a8] hover:underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
