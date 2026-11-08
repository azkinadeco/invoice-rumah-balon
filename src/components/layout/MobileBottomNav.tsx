'use client';

import React from 'react';
import { Receipt, Calendar, Boxes, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: 'invoices' | 'schedule' | 'inventory' | 'reports';
  onTabChange: (tab: 'invoices' | 'schedule' | 'inventory' | 'reports') => void;
  /** Admin only: monthly report tab (Settings lives in the account menu on phones). */
  showReports?: boolean;
  onNewInvoice: () => void;
  scheduleCount?: number;
  inventoryCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  showReports = false,
  onNewInvoice,
  scheduleCount = 0,
  inventoryCount = 0,
}) => {
  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-2xl border-t border-border/80 shadow-[0_-6px_25px_rgba(77,48,133,0.12)] pb-safe transition-all"
    >
      <div className="max-w-md mx-auto px-2 pt-1.5 pb-1 flex items-center justify-between relative">
        {/* Tab 1: Invoice */}
        <button
          type="button"
          onClick={() => onTabChange('invoices')}
          aria-current={activeTab === 'invoices' ? 'page' : undefined}
          aria-label="Lihat Daftar Invoice"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative active:scale-90',
            activeTab === 'invoices'
              ? 'text-[#f370a8] font-bold'
              : 'text-muted-foreground hover:text-foreground font-medium'
          )}
        >
          <div
            className={cn(
              'p-1.5 rounded-xl transition-all',
              activeTab === 'invoices'
                ? 'bg-[#f370a8]/15 text-[#f370a8] '
                : 'text-muted-foreground'
            )}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Invoice</span>
        </button>

        {/* Tab 2: Jadwal */}
        <button
          type="button"
          onClick={() => onTabChange('schedule')}
          aria-current={activeTab === 'schedule' ? 'page' : undefined}
          aria-label="Lihat Jadwal Dekorasi"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative active:scale-90',
            activeTab === 'schedule'
              ? 'text-[#4d3085] dark:text-[#c4b5fd] font-bold'
              : 'text-muted-foreground hover:text-foreground font-medium'
          )}
        >
          <div className="relative">
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all',
                activeTab === 'schedule'
                  ? 'bg-[#4d3085]/15 text-[#4d3085] dark:text-[#c4b5fd] '
                  : 'text-muted-foreground'
              )}
            >
              <Calendar className="w-5 h-5" />
            </div>
            {scheduleCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 px-1 py-px text-[9px] leading-none text-center font-bold rounded-full bg-[#f370a8] text-white shadow-2xs">
                {scheduleCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Jadwal</span>
        </button>

        {/* Center Prominent CTA: + Buat Invoice */}
        <div className="flex flex-col items-center justify-center px-2 relative -top-3">
          <button
            type="button"
            onClick={onNewInvoice}
            aria-label="Buat Invoice Baru"
            className="w-12 h-12 rounded-2xl bg-[#f370a8] text-white flex items-center justify-center shadow-md shadow-[#f370a8]/40 ring-4 ring-card active:scale-90 transition-transform cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.75]" />
          </button>
          <span className="text-[10px] font-extrabold text-foreground tracking-tight mt-0.5">
            Buat
          </span>
        </div>

        {/* Tab 3: Stok */}
        <button
          type="button"
          onClick={() => onTabChange('inventory')}
          aria-current={activeTab === 'inventory' ? 'page' : undefined}
          aria-label="Lihat Stok Barang"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative active:scale-90',
            activeTab === 'inventory'
              ? 'text-[#f370a8] font-bold'
              : 'text-muted-foreground hover:text-foreground font-medium'
          )}
        >
          <div className="relative">
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all',
                activeTab === 'inventory'
                  ? 'bg-[#f370a8]/15 text-[#f370a8] '
                  : 'text-muted-foreground'
              )}
            >
              <Boxes className="w-5 h-5" />
            </div>
            {inventoryCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 px-1 py-px text-[9px] leading-none text-center font-bold rounded-full bg-[#4d3085] text-white shadow-2xs">
                {inventoryCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Stok</span>
        </button>

        {/* Tab 4: Laporan (admin only) */}
        {showReports && (
          <button
            type="button"
            onClick={() => onTabChange('reports')}
            aria-current={activeTab === 'reports' ? 'page' : undefined}
            aria-label="Lihat Laporan Bulanan"
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative active:scale-90',
              activeTab === 'reports'
                ? 'text-[#f370a8] font-bold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all',
                activeTab === 'reports' ? 'bg-[#f370a8]/15 text-[#f370a8] ' : 'text-muted-foreground'
              )}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Laporan</span>
          </button>
        )}
      </div>
    </nav>
  );
};
