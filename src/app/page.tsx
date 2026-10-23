'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { InvoiceData, BusinessSettings, InvoiceStatus } from '@/types/invoice';
import { InventoryItem } from '@/types/inventory';
import { DEFAULT_INVOICE, DEFAULT_BUSINESS_SETTINGS, DEFAULT_INVENTORY_ITEMS } from '@/lib/constants';
import { exportInvoicesToCSV, formatWhatsAppPhone, formatDateIndo, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ScheduleBoard } from '@/components/schedule/ScheduleBoard';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { SyncStatusBanner } from '@/components/common/SyncStatusBanner';
import { InvoiceStatsHeader } from '@/components/invoice/InvoiceStatsHeader';
import { InvoiceFilterToolbar } from '@/components/invoice/InvoiceFilterToolbar';
import { InvoiceTableView } from '@/components/invoice/InvoiceTableView';
import { Sparkles } from 'lucide-react';
import {
  fetchInvoicesFromCloud,
  saveInvoiceToCloud,
  deleteInvoiceFromCloud,
  batchSyncInvoicesToCloud,
  fetchInventoryFromCloud,
  batchSyncInventoryToCloud,
} from '@/lib/supabase';

// Dynamic lazy-loaded modals for maximum initial load performance
const InvoiceDialog = dynamic(
  () => import('@/components/invoice/InvoiceDialog').then((mod) => mod.InvoiceDialog),
  { ssr: false }
);
const InvoicePrintModal = dynamic(
  () => import('@/components/invoice/InvoicePrintModal').then((mod) => mod.InvoicePrintModal),
  { ssr: false }
);
const InvoiceDetailModal = dynamic(
  () => import('@/components/invoice/InvoiceDetailModal').then((mod) => mod.InvoiceDetailModal),
  { ssr: false }
);
const BusinessSettingsModal = dynamic(
  () => import('@/components/invoice/BusinessSettingsModal').then((mod) => mod.BusinessSettingsModal),
  { ssr: false }
);
const CrewDispatchSheetModal = dynamic(
  () => import('@/components/schedule/CrewDispatchSheetModal').then((mod) => mod.CrewDispatchSheetModal),
  { ssr: false }
);

export default function Home() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'schedule' | 'inventory'>('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Modals state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<InvoiceData | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<InvoiceData | null>(null);

  const [crewSheetOpen, setCrewSheetOpen] = useState(false);
  const [crewSheetInvoice, setCrewSheetInvoice] = useState<InvoiceData | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [needBackupReminder, setNeedBackupReminder] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load from localStorage & Supabase Cloud
  const loadData = async () => {
    try {
      // 0. Theme
      const storedTheme = localStorage.getItem('rb_theme') as 'light' | 'dark' | null;
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (systemDark ? 'dark' : 'light');
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 1. Invoices from LocalStorage
      const stored = localStorage.getItem('rb_saved_invoices');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInvoices(parsed);
          const lastBackupDate = localStorage.getItem('rb_last_backup_date');
          const lastBackupCount = Number(localStorage.getItem('rb_last_backup_count') || 0);
          if (parsed.length >= 3 && (!lastBackupDate || parsed.length - lastBackupCount >= 5)) {
            setNeedBackupReminder(true);
          }
        } else {
          setInvoices([DEFAULT_INVOICE]);
          localStorage.setItem('rb_saved_invoices', JSON.stringify([DEFAULT_INVOICE]));
        }
      } else {
        setInvoices([DEFAULT_INVOICE]);
        localStorage.setItem('rb_saved_invoices', JSON.stringify([DEFAULT_INVOICE]));
      }

      // 2. Inventory Items from LocalStorage
      const storedInv = localStorage.getItem('rb_inventory_items');
      if (storedInv) {
        const parsedInv = JSON.parse(storedInv);
        if (Array.isArray(parsedInv) && parsedInv.length > 0) {
          const existingIds = new Set(parsedInv.map((it: InventoryItem) => it.id));
          const missingDefaults = DEFAULT_INVENTORY_ITEMS.filter((d) => !existingIds.has(d.id));
          const merged = missingDefaults.length > 0 ? [...parsedInv, ...missingDefaults] : parsedInv;
          setInventoryItems(merged);
          if (missingDefaults.length > 0) {
            localStorage.setItem('rb_inventory_items', JSON.stringify(merged));
          }
        } else {
          setInventoryItems(DEFAULT_INVENTORY_ITEMS);
          localStorage.setItem('rb_inventory_items', JSON.stringify(DEFAULT_INVENTORY_ITEMS));
        }
      } else {
        setInventoryItems(DEFAULT_INVENTORY_ITEMS);
        localStorage.setItem('rb_inventory_items', JSON.stringify(DEFAULT_INVENTORY_ITEMS));
      }

      // 3. Supabase Cloud Sync
      setCloudStatus('syncing');
      const cloudInvoices = await fetchInvoicesFromCloud();
      const cloudInventory = await fetchInventoryFromCloud();

      let connected = false;

      if (cloudInvoices !== null) {
        connected = true;
        if (cloudInvoices.length > 0) {
          setInvoices(cloudInvoices);
          localStorage.setItem('rb_saved_invoices', JSON.stringify(cloudInvoices));
        } else {
          const localInvoices = JSON.parse(localStorage.getItem('rb_saved_invoices') || '[]');
          if (localInvoices.length > 0) {
            await batchSyncInvoicesToCloud(localInvoices);
          }
        }
      }

      if (cloudInventory !== null) {
        connected = true;
        if (cloudInventory.length > 0) {
          setInventoryItems(cloudInventory);
          localStorage.setItem('rb_inventory_items', JSON.stringify(cloudInventory));
        } else {
          const localInv = JSON.parse(localStorage.getItem('rb_inventory_items') || '[]');
          if (localInv.length > 0) {
            await batchSyncInventoryToCloud(localInv);
          }
        }
      }

      if (connected) {
        setCloudStatus('connected');
        setLastSyncTime(new Date());
      } else {
        setCloudStatus('offline');
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      setCloudStatus('offline');
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Global Keyboard Shortcuts for Fast POS/Studio Operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // 1. Pressing '/' to immediately focus invoice search input
      if (e.key === '/' && !isTyping && !dialogOpen && !printModalOpen && !detailModalOpen && !settingsOpen && !crewSheetOpen) {
        e.preventDefault();
        const searchInput = document.getElementById('main-invoice-search') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // 2. Pressing 'Ctrl + B' or 'Cmd + B' to create new invoice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !dialogOpen && !printModalOpen && !detailModalOpen && !settingsOpen && !crewSheetOpen) {
        e.preventDefault();
        handleCreateNewInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, printModalOpen, detailModalOpen, settingsOpen, crewSheetOpen]);

  // Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('rb_theme', nextTheme);
    } catch {
      // ignore
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync to localStorage + Supabase Cloud
  const syncInvoices = (list: InvoiceData[]) => {
    setInvoices(list);
    try {
      localStorage.setItem('rb_saved_invoices', JSON.stringify(list));
    } catch (e: any) {
      console.error('Save failed:', e);
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        alert('⚠️ Memori browser penuh! Segera unduh file Backup JSON.');
      }
    }
    batchSyncInvoicesToCloud(list).then((ok) => {
      setCloudStatus(ok ? 'connected' : 'offline');
      if (ok) setLastSyncTime(new Date());
    });
  };

  const syncInventoryItems = (list: InventoryItem[]) => {
    setInventoryItems(list);
    try {
      localStorage.setItem('rb_inventory_items', JSON.stringify(list));
    } catch (e: any) {
      console.error('Inventory save failed:', e);
    }
    batchSyncInventoryToCloud(list).then((ok) => {
      setCloudStatus(ok ? 'connected' : 'offline');
      if (ok) setLastSyncTime(new Date());
    });
  };

  // Create Invoice
  const handleCreateNewInvoice = () => {
    const newNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const today = new Date().toISOString().split('T')[0];

    let currentSettings = DEFAULT_BUSINESS_SETTINGS;
    try {
      const stored = localStorage.getItem('rb_business_profile');
      if (stored) currentSettings = JSON.parse(stored);
    } catch {
      // ignore
    }

    const newInv: InvoiceData = {
      ...DEFAULT_INVOICE,
      ...currentSettings,
      id: `rb-${Date.now()}`,
      invoiceNumber: `00${newNumber}`,
      invoiceDate: today,
      bookingDate: today,
      clientName: '',
      clientPhone: '',
      items: [
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      dpAmount: 0,
      dpPaidAmount: 0,
      remainingAmount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveInvoice(newInv);
    setDialogOpen(true);
  };

  // Edit Invoice
  const handleEditInvoice = (inv: InvoiceData) => {
    setActiveInvoice(inv);
    setDialogOpen(true);
  };

  // Print Invoice
  const handlePrintInvoice = (inv: InvoiceData) => {
    setPrintInvoice(inv);
    setPrintModalOpen(true);
  };

  // Detail Modal
  const handleDetailInvoice = (inv: InvoiceData) => {
    setDetailInvoice(inv);
    setDetailModalOpen(true);
  };

  // Crew Dispatch Sheet
  const handleOpenCrewSheet = (inv: InvoiceData) => {
    setCrewSheetInvoice(inv);
    setCrewSheetOpen(true);
  };

  // Duplicate Invoice
  const handleDuplicateInvoice = (inv: InvoiceData) => {
    const newNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const today = new Date().toISOString().split('T')[0];
    const duplicated: InvoiceData = {
      ...inv,
      id: `rb-${Date.now()}`,
      invoiceNumber: `00${newNumber}`,
      invoiceDate: today,
      status: 'draft',
      dpPaidAmount: 0,
      remainingAmount: inv.total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveInvoice(duplicated);
    setDialogOpen(true);
  };

  // Save from Dialog
  const handleSaveInvoiceFromDialog = (saved: InvoiceData) => {
    const existingIndex = invoices.findIndex((i) => i.id === saved.id);
    let nextList: InvoiceData[];
    const toSave: InvoiceData = {
      ...saved,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      nextList = [...invoices];
      nextList[existingIndex] = toSave;
      showToast(`Invoice #${toSave.invoiceNumber} berhasil diperbarui! 💾`);
    } else {
      nextList = [toSave, ...invoices];
      showToast(`Invoice baru #${toSave.invoiceNumber} berhasil dibuat! 🎉`);
    }

    syncInvoices(nextList);
    saveInvoiceToCloud(toSave);
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string, num: string) => {
    if (confirm(`Yakin ingin menghapus invoice #${num}?`)) {
      const nextList = invoices.filter((i) => i.id !== id);
      syncInvoices(nextList);
      deleteInvoiceFromCloud(id);
      showToast(`Invoice #${num} berhasil dihapus.`);
    }
  };

  // Quick Change Status
  const handleQuickChangeInvoiceStatus = (id: string, newStatus: InvoiceStatus) => {
    const updated = invoices.map((inv) => {
      if (inv.id !== id) return inv;
      let dpPaid = inv.dpPaidAmount;
      let remaining = inv.remainingAmount;
      if (newStatus === 'paid') {
        dpPaid = inv.total;
        remaining = 0;
      } else if (newStatus === 'dp_paid') {
        if (!dpPaid || dpPaid === 0) {
          dpPaid = Math.round(inv.total * 0.3);
        }
        remaining = Math.max(0, inv.total - dpPaid);
      } else if (newStatus === 'draft' || newStatus === 'sent') {
        remaining = Math.max(0, inv.total - (dpPaid || 0));
      }
      return {
        ...inv,
        status: newStatus,
        dpPaidAmount: dpPaid,
        remainingAmount: remaining,
        updatedAt: new Date().toISOString(),
      };
    });
    syncInvoices(updated);
    const target = updated.find((i) => i.id === id);
    if (target) saveInvoiceToCloud(target);
    showToast(`Status invoice diperbarui!`);
  };

  // Quick 1-click Mark as Paid with confetti celebration
  const handleQuickMarkPaid = async (inv: InvoiceData) => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#f370a8', '#4d3085', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }

    const updated = invoices.map((i) => {
      if (i.id !== inv.id) return i;
      return {
        ...i,
        status: 'paid' as InvoiceStatus,
        dpPaidAmount: i.total,
        remainingAmount: 0,
        updatedAt: new Date().toISOString(),
      };
    });
    syncInvoices(updated);
    const target = updated.find((i) => i.id === inv.id);
    if (target) saveInvoiceToCloud(target);
    showToast(`Invoice #${inv.invoiceNumber} ditandai Lunas Penuh ✨`);
  };

  // Send WhatsApp Direct Share
  const handleSendInvoiceWhatsApp = (inv: InvoiceData) => {
    const phone = formatWhatsAppPhone(inv.clientPhone);
    const isPaid = inv.status === 'paid';
    const dpPaid =
      typeof inv.dpPaidAmount === 'number' && inv.dpPaidAmount > 0
        ? inv.dpPaidAmount
        : inv.status === 'dp_paid'
        ? inv.dpAmount || Math.round(inv.total * 0.3)
        : 0;
    const hasDpPaid = dpPaid > 0 || isPaid;
    const remainingAmount =
      typeof inv.remainingAmount === 'number'
        ? inv.remainingAmount
        : Math.max(0, inv.total - dpPaid);

    const dpLine = hasDpPaid
      ? `💳 *DP Diterima:* ${formatRupiah(dpPaid)}\n⏳ *Sisa Tagihan (Pelunasan H-1):* *${isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}*`
      : `💳 *Min DP 30%:* ${formatRupiah(Math.round(inv.total * 0.3))}`;

    const itemsSummary = (inv.items || [])
      .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity || 1} pcs)`)
      .join('\n');

    const message = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 *No. Invoice:* #${inv.invoiceNumber}\n📅 *Tanggal Acara:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}\n⏰ *Jam Acara:* ${inv.eventTime || '14:00'} WIB (Setup: ${inv.setupTime || '11:00'} WIB)\n📍 *Lokasi:* ${inv.venue || inv.clientAddress || '—'}\n\n📦 *Paket Pesanan:*\n${itemsSummary || '  (Sesuai invoice)'}\n\n💰 *Total Tagihan:* *${formatRupiah(inv.total)}*\n${dpLine}\n\nTransfer ke Rekening Resmi:\n🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*\n\nTerima kasih banyak Kak! ✨`;

    const encoded = encodeURIComponent(message);
    const waUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
    showToast(`Membuka WhatsApp untuk invoice #${inv.invoiceNumber} 💬`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    exportInvoicesToCSV(filteredInvoices, `Data_Invoice_RumahBalon_${today}.csv`);
    showToast('Data invoice berhasil diekspor ke Excel / CSV 📊');
  };

  // Export Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      invoices,
      inventoryItems,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_rumah_balon_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    try {
      localStorage.setItem('rb_last_backup_date', today);
      localStorage.setItem('rb_last_backup_count', String(invoices.length));
    } catch {
      // ignore
    }
    setNeedBackupReminder(false);
    showToast('Backup database JSON berhasil diunduh 💾');
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          syncInvoices(parsed);
          showToast('Berhasil memulihkan data invoice! 🎉');
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.invoices)) {
            syncInvoices(parsed.invoices);
          }
          if (Array.isArray(parsed.inventoryItems)) {
            syncInventoryItems(parsed.inventoryItems);
          }
          showToast('Berhasil memulihkan invoice & stok barang! 🎉');
        } else {
          alert('Format file backup JSON tidak valid.');
        }
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Save Store Settings
  const handleSaveSettings = (settings: BusinessSettings, setAsDefault: boolean) => {
    if (setAsDefault) {
      try {
        localStorage.setItem('rb_business_profile', JSON.stringify(settings));
      } catch {
        // ignore
      }
    }
    const updated = invoices.map((inv) => ({
      ...inv,
      ...settings,
      updatedAt: new Date().toISOString(),
    }));
    syncInvoices(updated);
    showToast('Pengaturan toko berhasil diperbarui! ⚙️');
  };

  // Filter Logic
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.clientName || '').toLowerCase().includes(q) ||
      (inv.clientPhone && inv.clientPhone.includes(q)) ||
      (inv.venue && inv.venue.toLowerCase().includes(q)) ||
      (inv.clientAddress && inv.clientAddress.toLowerCase().includes(q)) ||
      (inv.items && inv.items.some((it) => (it.description || '').toLowerCase().includes(q)));

    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    let matchPeriod = true;
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth();
    const thisMonthPrefix = `${curY}-${String(curM + 1).padStart(2, '0')}`;
    const lastMonthYear = curM === 0 ? curY - 1 : curY;
    const lastMonthMonth = curM === 0 ? 12 : curM;
    const lastMonthPrefix = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}`;

    if (periodFilter === 'this_month') {
      matchPeriod =
        Boolean(inv.bookingDate && inv.bookingDate.startsWith(thisMonthPrefix)) ||
        Boolean(inv.invoiceDate && inv.invoiceDate.startsWith(thisMonthPrefix));
    } else if (periodFilter === 'last_month') {
      matchPeriod =
        Boolean(inv.bookingDate && inv.bookingDate.startsWith(lastMonthPrefix)) ||
        Boolean(inv.invoiceDate && inv.invoiceDate.startsWith(lastMonthPrefix));
    }

    return matchSearch && matchStatus && matchPeriod;
  });

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

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative overflow-hidden',
        theme === 'dark' ? 'dark' : ''
      )}
    >
      {/* Brand Color Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f370a8]/6 dark:bg-[#f370a8]/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-1/4 w-96 h-96 bg-[#4d3085]/6 dark:bg-[#4d3085]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Header */}
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewInvoice={handleCreateNewInvoice}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        scheduleCount={invoices.filter((i) => i.bookingDate && i.status !== 'cancelled').length}
        inventoryCount={inventoryItems.length}
        cloudStatus={cloudStatus}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 mt-1 sm:mt-2 pb-28 sm:pb-8">
        {/* Offline & Sync Resilience Banner (P1 Fix) */}
        <SyncStatusBanner
          cloudStatus={cloudStatus}
          onSyncComplete={(msg) => {
            showToast(msg);
            setLastSyncTime(new Date());
          }}
          onRefreshCloud={loadData}
          lastSyncTime={lastSyncTime}
        />

        {activeTab === 'invoices' ? (
          <>
            {/* KPI Stats Header Cards */}
            <InvoiceStatsHeader
              invoices={invoices}
              filteredInvoices={filteredInvoices}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
            />

            {/* Filter & Control Toolbar */}
            <InvoiceFilterToolbar
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
              filteredCount={filteredInvoices.length}
              onExportCSV={handleExportCSV}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              needBackupReminder={needBackupReminder}
            />

            {/* Responsive Table & Thumb-Friendly Mobile Cards View (P1 & P2 Fix) */}
            <InvoiceTableView
              invoices={filteredInvoices}
              onPrintInvoice={handlePrintInvoice}
              onEditInvoice={handleEditInvoice}
              onDetailInvoice={handleDetailInvoice}
              onSendWhatsApp={handleSendInvoiceWhatsApp}
              onQuickMarkPaid={handleQuickMarkPaid}
              onOpenCrewSheet={handleOpenCrewSheet}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onQuickChangeStatus={handleQuickChangeInvoiceStatus}
              onCreateNewInvoice={handleCreateNewInvoice}
            />
          </>
        ) : activeTab === 'schedule' ? (
          <ScheduleBoard
            invoices={invoices}
            inventoryItems={inventoryItems}
            onUpdateInvoice={(updated) => {
              const updatedList = invoices.map((inv) => (inv.id === updated.id ? updated : inv));
              syncInvoices(updatedList);
            }}
            onOpenNewInvoice={handleCreateNewInvoice}
            onViewInvoice={(inv) => {
              setDetailInvoice(inv);
              setDetailModalOpen(true);
            }}
            onPrintInvoice={(inv) => {
              setPrintInvoice(inv);
              setPrintModalOpen(true);
            }}
          />
        ) : (
          <InventoryManager
            items={inventoryItems}
            onUpdateItems={syncInventoryItems}
            onOpenNewInvoice={handleCreateNewInvoice}
          />
        )}
      </main>

      {/* Dynamic Modals */}
      {dialogOpen && (
        <InvoiceDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          invoice={activeInvoice}
          existingInvoices={invoices}
          onSave={handleSaveInvoiceFromDialog}
        />
      )}

      {printModalOpen && (
        <InvoicePrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          invoice={printInvoice}
        />
      )}

      {detailModalOpen && (
        <InvoiceDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          invoice={detailInvoice}
          onEdit={handleEditInvoice}
          onPrint={handlePrintInvoice}
          onDuplicate={handleDuplicateInvoice}
          onOpenCrewSheet={handleOpenCrewSheet}
        />
      )}

      {crewSheetOpen && (
        <CrewDispatchSheetModal
          open={crewSheetOpen}
          onOpenChange={setCrewSheetOpen}
          invoice={crewSheetInvoice}
          inventoryItems={inventoryItems}
          onUpdateInvoice={(updated) => {
            setCrewSheetInvoice(updated);
            const updatedList = invoices.map((inv) => (inv.id === updated.id ? updated : inv));
            syncInvoices(updatedList);
          }}
        />
      )}

      {settingsOpen && (
        <BusinessSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentSettings={(() => {
            try {
              const stored = localStorage.getItem('rb_business_profile');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') return parsed;
              }
            } catch {
              // ignore
            }
            return invoices[0] || DEFAULT_BUSINESS_SETTINGS;
          })()}
          onSave={handleSaveSettings}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Thumb ergonomics for iPhone/Android) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewInvoice={handleCreateNewInvoice}
        scheduleCount={invoices.filter((i) => i.bookingDate && i.status !== 'cancelled').length}
        inventoryCount={inventoryItems.length}
      />

      {/* Toast Notification with WCAG 2.2 Live Region */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-22 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto"
        >
          <div className="px-4 py-2.5 rounded-2xl bg-foreground text-background shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-border/80 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#f370a8] shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Tutup notifikasi"
              className="ml-2 text-background/60 hover:text-background text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
