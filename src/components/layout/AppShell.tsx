'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { AppModals } from '@/components/layout/AppModals';
import { SyncStatusBanner } from '@/components/common/SyncStatusBanner';
import { useApp } from '@/components/providers/AppProvider';
import { useAuth } from '@/lib/auth';
import { getPendingSyncQueue } from '@/lib/supabase';

type Tab = 'invoices' | 'schedule' | 'inventory' | 'reports';

export function AppShell({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const auth = useAuth();

  // Sign out (warn if there are offline changes that would be lost)
  const handleSignOut = async () => {
    const pending = getPendingSyncQueue().length;
    const msg =
      pending > 0
        ? `Masih ada ${pending} perubahan yang BELUM tersinkron ke Cloud dan akan hilang jika keluar sekarang.\n\nTetap keluar?`
        : 'Keluar dari akun ini? Data di perangkat ini akan dibersihkan.';
    if (!confirm(msg)) return;
    await auth.signOut();
  };
  const router = useRouter();
  const pathname = usePathname();
  const activeTab: Tab = pathname.startsWith('/schedule')
    ? 'schedule'
    : pathname.startsWith('/inventory')
    ? 'inventory'
    : pathname.startsWith('/reports')
    ? 'reports'
    : 'invoices';
  const onTabChange = (tab: Tab) => router.push(`/${tab}`);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem('rb_theme') as 'light' | 'dark' | null;
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (systemDark ? 'dark' : 'light');
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    } catch {
      // ignore
    }
  }, []);

  // Global Keyboard Shortcuts for Fast POS/Studio Operation
  const { anyModalOpen, createNewInvoice } = app;
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      if (anyModalOpen) return;

      // '/' focuses invoice search input (exists on invoices route only)
      if (e.key === '/' && !isTyping) {
        const searchInput = document.getElementById('main-invoice-search') as HTMLInputElement | null;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }

      // Ctrl/Cmd + B creates new invoice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        createNewInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, createNewInvoice]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('rb_theme', nextTheme);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#f370a8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground tracking-wide">Rumah Balon Studio...</p>
        </div>
      </div>
    );
  }

  const scheduleCount = app.invoices.filter((i) => i.bookingDate && i.status !== 'cancelled').length;
  const inventoryCount = app.inventoryItems.length;

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative overflow-hidden',
        theme === 'dark' ? 'dark' : ''
      )}
    >
      {/* Brand Color Ambient Glow with smooth subtle animation */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f370a8]/8 dark:bg-[#f370a8]/12 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow animate-glow-pulse" />
      <div
        className="absolute top-48 right-1/4 w-96 h-96 bg-[#4d3085]/8 dark:bg-[#4d3085]/12 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow animate-glow-pulse"
        style={{ animationDelay: '4s' }}
      />

      <AdminHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenSettings={app.isAdmin ? () => app.setSettingsOpen(true) : undefined}
        onOpenStaffManager={app.isAdmin ? () => app.setStaffOpen(true) : undefined}
        user={{ email: auth.email, name: auth.name, avatarUrl: auth.avatarUrl, role: auth.role }}
        onSignOut={handleSignOut}
        onNewInvoice={app.createNewInvoice}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        scheduleCount={scheduleCount}
        inventoryCount={inventoryCount}
        cloudStatus={app.cloudStatus}
        lastSyncTime={app.lastSyncTime}
        showReports={app.isAdmin}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-28 sm:pb-10 space-y-3 sm:space-y-4">
        <SyncStatusBanner
          cloudStatus={app.cloudStatus}
          onSyncComplete={(msg) => {
            app.showToast(msg);
            app.setLastSyncTime(new Date());
          }}
          onRefreshCloud={app.loadData}
          lastSyncTime={app.lastSyncTime}
        />

        <div
          key={activeTab}
          className="space-y-3 sm:space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
        >
          {children}
        </div>
      </main>

      <AppModals />

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNewInvoice={app.createNewInvoice}
        scheduleCount={scheduleCount}
        inventoryCount={inventoryCount}
        showReports={app.isAdmin}
      />

      {/* Toast Notification with WCAG 2.2 Live Region */}
      {app.toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-22 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto"
        >
          <div className="max-w-[calc(100vw-2rem)] pl-3.5 pr-2 py-2 rounded-xl bg-foreground text-background shadow-xl flex items-center gap-2.5 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-[#f370a8] shrink-0" />
            <span>{app.toastMessage}</span>
            <button
              type="button"
              onClick={() => app.showToast('')}
              aria-label="Tutup notifikasi"
              className="ml-1 w-6 h-6 rounded-md flex items-center justify-center text-background/60 hover:text-background hover:bg-background/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
