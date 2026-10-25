'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, CloudOff, CheckCircle2 } from 'lucide-react';
import { getPendingSyncQueue, flushPendingSyncQueue, checkSupabaseHealth } from '@/lib/supabase';

interface SyncStatusBannerProps {
  cloudStatus: 'connected' | 'syncing' | 'offline';
  onSyncComplete?: (message: string) => void;
  onRefreshCloud?: () => void;
  lastSyncTime?: Date | null;
}

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({
  cloudStatus,
  onSyncComplete,
  onRefreshCloud,
  lastSyncTime,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentlySynced, setRecentlySynced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkQueue = useCallback(() => {
    const queue = getPendingSyncQueue();
    setPendingCount(queue.length);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy) {
        onSyncComplete?.('Koneksi ke Supabase belum pulih. Data tetap tersimpan aman di perangkat.');
        return;
      }

      const res = await flushPendingSyncQueue();
      if (onRefreshCloud) {
        onRefreshCloud();
      }
      checkQueue();
      if (res.success) {
        setRecentlySynced(true);
        setTimeout(() => setRecentlySynced(false), 4000);
        onSyncComplete?.(`Sinkronisasi berhasil! ${res.count > 0 ? `${res.count} perubahan terkirim ke Cloud.` : 'Semua data telah up-to-date.'}`);
      }
    } catch {
      onSyncComplete?.('Gagal menghubungi Cloud. Silakan periksa jaringan internet.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    checkQueue();

    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(checkQueue, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkQueue]);

  // If fully connected with no pending items, show nothing or just brief sync confirmation
  if (isOnline && cloudStatus === 'connected' && pendingCount === 0 && !recentlySynced) {
    return null;
  }

  if (recentlySynced) {
    return (
      <div className="no-print p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">Semua data berhasil disinkronkan ke Supabase Cloud! ✨</span>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <aside
        aria-label="Peringatan Status Jaringan dan Sinkronisasi"
        className="no-print py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          {!isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="truncate text-[11px] font-medium text-amber-900/90 dark:text-amber-200/90">
            <strong>{!isOnline ? 'Offline' : 'Cloud Offline'}:</strong> Data tersimpan aman di browser {pendingCount > 0 ? `(${pendingCount} pending)` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="text-[11px] font-bold text-[#4d3085] dark:text-[#c4b5fd] hover:underline px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Tampilkan rincian status sinkronisasi"
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 text-[11px] px-1.5 py-0.5 rounded hover:bg-amber-500/15 cursor-pointer font-medium"
          >
            Rincian
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Peringatan Status Jaringan dan Sinkronisasi"
      className="no-print p-3 sm:px-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-2.5">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <div className="leading-snug">
          <strong>
            {!isOnline
              ? 'Anda sedang dalam Mode Offline:'
              : 'Supabase Cloud Sedang Offline:'}
          </strong>{' '}
          <span className="text-amber-900/90 dark:text-amber-200/90">
            {pendingCount > 0
              ? `Ada ${pendingCount} perubahan yang tersimpan di perangkat ini dan menunggu sinyal untuk sinkronisasi.`
              : 'Data tersimpan aman di browser Anda dan akan sinkron saat terhubung kembali.'}
            {lastSyncTime && (
              <span className="block mt-0.5 text-[11px] opacity-80 font-medium">
                Sinkron terakhir: {String(lastSyncTime.getHours()).padStart(2, '0')}:{String(lastSyncTime.getMinutes()).padStart(2, '0')}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
        <Button
          type="button"
          size="sm"
          onClick={handleManualSync}
          disabled={isSyncing}
          aria-label="Coba Hubungkan dan Sinkronkan ke Cloud Sekarang"
          className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#4d3085] hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menghubungkan...' : 'Sinkronkan Sekarang'}</span>
        </Button>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          aria-label="Kecilkan banner peringatan"
          className="text-amber-800/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 text-xs px-2 py-1 rounded-lg hover:bg-amber-500/20 cursor-pointer font-medium transition-colors"
        >
          Kecilkan
        </button>
      </div>
    </aside>
  );
};
