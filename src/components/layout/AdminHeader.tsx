'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Sun, Moon, Sparkles, Receipt, Calendar, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  activeTab: 'invoices' | 'schedule' | 'inventory';
  onTabChange: (tab: 'invoices' | 'schedule' | 'inventory') => void;
  onOpenSettings: () => void;
  onNewInvoice: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  scheduleCount?: number;
  inventoryCount?: number;
  cloudStatus?: 'connected' | 'syncing' | 'offline';
  lastSyncTime?: Date | null;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onNewInvoice,
  theme,
  onToggleTheme,
  scheduleCount = 0,
  inventoryCount = 0,
  cloudStatus = 'offline',
  lastSyncTime,
}) => {
  const formattedSyncTime = React.useMemo(() => {
    if (!lastSyncTime) return null;
    try {
      const h = String(lastSyncTime.getHours()).padStart(2, '0');
      const m = String(lastSyncTime.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return null;
    }
  }, [lastSyncTime]);
  return (
    <header className="no-print sticky top-3 z-30 max-w-7xl mx-auto px-3 sm:px-6 w-full transition-all duration-300">
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-lg shadow-[#4d3085]/10 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-3 transition-all">
        {/* Brand identity & Top Nav Tabs */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div
            onClick={() => onTabChange('invoices')}
            className="relative w-28 sm:w-36 h-9 transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Image
              src="/images/logo.png"
              alt="Rumah Balon Decoration"
              fill
              sizes="150px"
              className="object-contain"
              priority
            />
          </div>

          {/* Navigation Switcher: Invoice Studio, Schedule, Stok Barang (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center bg-muted/70 p-1 rounded-2xl border border-border/80 shadow-2xs">
            <button
              type="button"
              onClick={() => onTabChange('invoices')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'invoices'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Receipt className="w-3.5 h-3.5 text-[#f370a8]" />
              <span className="hidden sm:inline">Invoice Studio</span>
              <span className="sm:hidden">Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('schedule')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative',
                activeTab === 'schedule'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              <span className="hidden sm:inline">Jadwal Acara</span>
              <span className="sm:hidden">Jadwal</span>
              {scheduleCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-[#f370a8] text-white">
                  {scheduleCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('inventory')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative',
                activeTab === 'inventory'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
              <span className="hidden sm:inline">Stok Barang</span>
              <span className="sm:hidden">Stok</span>
              {inventoryCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-[#4d3085] text-white">
                  {inventoryCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Cloud Status Pill */}
          <div className="flex sm:hidden items-center">
            {cloudStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud</span>
              </span>
            ) : cloudStatus === 'syncing' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f370a8]/10 text-[#f370a8] border border-[#f370a8]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f370a8] animate-ping" />
                <span>Sync</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                <span className="w-1 h-1 rounded-full bg-zinc-400" />
                <span>Lokal</span>
              </span>
            )}
          </div>

          {/* Desktop Supabase Cloud Sync Indicator with Last Sync Timestamp */}
          {cloudStatus === 'connected' ? (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs"
              title={`Cloud Terhubung: Data otomatis tersinkronisasi ke iPhone, Android, dan laptop${formattedSyncTime ? ` (Terakhir sinkron ${formattedSyncTime})` : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Realtime</span>
              {formattedSyncTime && (
                <span className="text-[9px] opacity-75 font-mono font-normal">
                  • {formattedSyncTime}
                </span>
              )}
            </span>
          ) : cloudStatus === 'syncing' ? (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#f370a8]/10 text-[#f370a8] border border-[#f370a8]/25"
              title="Sedang menyinkronkan data dengan Cloud..."
            >
              <span className="w-2 h-2 rounded-full bg-[#f370a8] animate-ping" />
              <span>Menyinkronkan...</span>
            </span>
          ) : (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border"
              title={formattedSyncTime ? `Mode Lokal Browser (Terakhir sinkron: ${formattedSyncTime})` : 'Mode Lokal Browser'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Lokal</span>
              {formattedSyncTime && (
                <span className="text-[9px] opacity-75 font-mono">
                  • {formattedSyncTime}
                </span>
              )}
            </span>
          )}

          {/* Theme Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-muted text-foreground transition-all duration-300 hover:scale-105 active:scale-95"
            title={theme === 'dark' ? 'Ganti ke Light Mode ☀️' : 'Ganti ke Dark Mode 🌙'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#f370a8] hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[#4d3085] hover:-rotate-12 transition-transform" />
            )}
          </Button>

          {/* Settings Button (Desktop/Tablet) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            aria-label="Buka Pengaturan Toko dan Usaha"
            className="hidden sm:inline-flex h-9 text-xs border-border bg-card hover:bg-muted rounded-xl text-foreground font-medium shadow-2xs hover:scale-105 active:scale-95 transition-all"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <span>Settings Toko</span>
          </Button>

          {/* Primary CTA: + Buat Invoice Baru (Desktop/Tablet) */}
          <Button
            type="button"
            size="sm"
            onClick={onNewInvoice}
            aria-label="Buat Faktur atau Invoice Baru"
            className="hidden sm:inline-flex h-9 px-3 sm:px-4 text-xs rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 transition-all hover:scale-105 active:scale-95 items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Invoice</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
