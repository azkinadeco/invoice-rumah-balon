'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Sun, Moon, Receipt, Calendar, Boxes, Users, LogOut, BarChart3 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  activeTab: 'invoices' | 'schedule' | 'inventory' | 'reports';
  onTabChange: (tab: 'invoices' | 'schedule' | 'inventory' | 'reports') => void;
  /** Admin only: show the monthly report tab. */
  showReports?: boolean;
  onOpenSettings?: () => void;
  onOpenStaffManager?: () => void;
  onSignOut: () => void;
  user: { email: string | null; name: string | null; avatarUrl: string | null; role: 'admin' | 'staff' | null };
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
  onOpenStaffManager,
  onSignOut,
  user,
  onNewInvoice,
  theme,
  onToggleTheme,
  scheduleCount = 0,
  inventoryCount = 0,
  showReports = false,
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
    <header className="no-print sticky top-0 sm:top-3 z-30 max-w-7xl mx-auto px-3 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-0 w-full">
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm shadow-[#4d3085]/5 pl-3 pr-2 sm:pl-4 sm:pr-2.5 py-2 flex items-center justify-between gap-3">
        {/* Brand identity & Top Nav Tabs */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onTabChange('invoices')}
            aria-label="Rumah Balon — ke halaman Invoice"
            className="relative w-28 sm:w-32 h-9 active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Image
              src="/images/logo.png"
              alt="Rumah Balon Decoration"
              fill
              sizes="150px"
              className="object-contain dark:brightness-0 dark:invert"
              priority
            />
          </button>

          {/* Navigation Switcher: Invoice Studio, Schedule, Stok Barang (Desktop/Tablet) */}
          <nav aria-label="Navigasi utama" className="hidden sm:flex items-center bg-muted/70 p-1 rounded-xl border border-border/70">
            <button
              type="button"
              onClick={() => onTabChange('invoices')}
              aria-current={activeTab === 'invoices' ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 lg:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                activeTab === 'invoices'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Receipt className="w-3.5 h-3.5 text-[#f370a8]" />
              <span className="hidden lg:inline">Invoice Studio</span>
              <span className="lg:hidden">Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('schedule')}
              aria-current={activeTab === 'schedule' ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 lg:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative',
                activeTab === 'schedule'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              <span className="hidden lg:inline">Jadwal Acara</span>
              <span className="lg:hidden">Jadwal</span>
              {scheduleCount > 0 && (
                <span className="ml-0.5 min-w-4 px-1 py-px text-[10px] leading-none font-bold rounded-full text-center bg-[#f370a8] text-white">
                  {scheduleCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('inventory')}
              aria-current={activeTab === 'inventory' ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 lg:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative',
                activeTab === 'inventory'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
              <span className="hidden lg:inline">Stok Barang</span>
              <span className="lg:hidden">Stok</span>
              {inventoryCount > 0 && (
                <span className="ml-0.5 min-w-4 px-1 py-px text-[10px] leading-none font-bold rounded-full text-center bg-[#4d3085] text-white">
                  {inventoryCount}
                </span>
              )}
            </button>

            {showReports && (
              <button
                type="button"
                onClick={() => onTabChange('reports')}
                aria-current={activeTab === 'reports' ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-2.5 lg:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === 'reports'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
                Laporan
              </button>
            )}
          </nav>
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
              <span className="hidden lg:inline">Cloud Realtime</span>
              <span className="lg:hidden">Cloud</span>
              {formattedSyncTime && (
                <span className="hidden lg:inline text-[9px] opacity-75 font-mono font-normal">
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
            className="h-9 w-9 rounded-lg hover:bg-muted text-foreground active:scale-95"
            title={theme === 'dark' ? 'Ganti ke Light Mode ☀️' : 'Ganti ke Dark Mode 🌙'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#f370a8]" />
            ) : (
              <Moon className="w-4 h-4 text-[#4d3085]" />
            )}
          </Button>

          {/* Settings Button (Desktop/Tablet, admin only) */}
          {onOpenSettings && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            aria-label="Buka Pengaturan Toko dan Usaha"
            className="hidden sm:inline-flex h-9 px-2.5 lg:px-3 text-xs border-border bg-card hover:bg-muted rounded-lg text-foreground font-semibold active:scale-95"
          >
            <Settings className="w-4 h-4 lg:mr-1.5 text-muted-foreground" />
            <span className="hidden lg:inline">Settings Toko</span>
          </Button>
          )}

          {/* Primary CTA: + Buat Invoice Baru (Desktop/Tablet) */}
          <Button
            type="button"
            size="sm"
            onClick={onNewInvoice}
            aria-label="Buat Faktur atau Invoice Baru"
            className="hidden sm:inline-flex h-9 px-3 lg:px-4 text-xs rounded-lg bg-[#f370a8] hover:bg-[#e85d98] text-white font-bold shadow-sm shadow-[#f370a8]/30 active:scale-95 items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice</span>
          </Button>

          {/* Account menu */}
          <Popover>
            <PopoverTrigger
              type="button"
              aria-label="Menu akun"
              className="h-9 w-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-[#f370a8]/40 transition"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-foreground">
                  {(user.name || user.email || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent closeOnClick align="end" className="w-64 p-1.5 rounded-xl border-border bg-card shadow-xl">
              <div className="px-2.5 py-2">
                <div className="text-xs font-bold text-foreground truncate">{user.name || 'Akun'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                <span
                  className={cn(
                    'inline-block mt-1.5 px-1.5 py-px rounded-md text-[10px] font-bold',
                    user.role === 'admin'
                      ? 'bg-[#4d3085] text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {user.role === 'admin' ? 'Admin' : 'Karyawan'}
                </span>
              </div>
              <div className="h-px bg-border my-1" />
              {onOpenStaffManager && (
                <button
                  type="button"
                  onClick={onOpenStaffManager}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                  Kelola Karyawan
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="sm:hidden w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings Toko
                </button>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};
