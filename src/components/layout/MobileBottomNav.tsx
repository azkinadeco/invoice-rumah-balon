'use client';

import React from 'react';
import { Receipt, Calendar, Boxes, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: 'invoices' | 'schedule' | 'inventory';
  onTabChange: (tab: 'invoices' | 'schedule' | 'inventory') => void;
  onOpenSettings: () => void;
  onNewInvoice: () => void;
  scheduleCount?: number;
  inventoryCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onNewInvoice,
  scheduleCount = 0,
  inventoryCount = 0,
}) => {
  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-2xl border-t border-border/80 shadow-[0_-6px_25px_rgba(77,48,133,0.12)] pb-safe transition-all"
    >
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between relative">
        {/* Tab 1: Invoice */}
        <button
          type="button"
          onClick={() => onTabChange('invoices')}
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
                ? 'bg-[#f370a8]/15 text-[#f370a8] scale-110 shadow-xs'
                : 'text-muted-foreground'
            )}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Invoice</span>
          {activeTab === 'invoices' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f370a8] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Tab 2: Jadwal */}
        <button
          type="button"
          onClick={() => onTabChange('schedule')}
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
                  ? 'bg-[#4d3085]/15 text-[#4d3085] dark:text-[#c4b5fd] scale-110 shadow-xs'
                  : 'text-muted-foreground'
              )}
            >
              <Calendar className="w-5 h-5" />
            </div>
            {scheduleCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-[#f370a8] text-white shadow-2xs">
                {scheduleCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Jadwal</span>
          {activeTab === 'schedule' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4d3085] dark:bg-[#c4b5fd] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Center Prominent CTA: + Buat Invoice */}
        <div className="flex flex-col items-center justify-center px-2 relative -top-3">
          <button
            type="button"
            onClick={onNewInvoice}
            aria-label="Buat Invoice Baru"
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#f370a8] via-[#e85392] to-[#4d3085] text-white flex items-center justify-center shadow-lg shadow-[#f370a8]/40 ring-4 ring-card active:scale-90 transition-transform cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.75]" />
          </button>
          <span className="text-[10px] font-extrabold text-foreground tracking-tight mt-0.5">
            + Buat
          </span>
        </div>

        {/* Tab 3: Stok */}
        <button
          type="button"
          onClick={() => onTabChange('inventory')}
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
                  ? 'bg-[#f370a8]/15 text-[#f370a8] scale-110 shadow-xs'
                  : 'text-muted-foreground'
              )}
            >
              <Boxes className="w-5 h-5" />
            </div>
            {inventoryCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-[#4d3085] text-white shadow-2xs">
                {inventoryCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Stok</span>
          {activeTab === 'inventory' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f370a8] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Tab 4: Setting Toko */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Buka Pengaturan Toko"
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative active:scale-90 text-muted-foreground hover:text-foreground font-medium"
        >
          <div className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Setting</span>
        </button>
      </div>
    </nav>
  );
};
