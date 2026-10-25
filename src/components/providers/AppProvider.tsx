'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { InvoiceData, BusinessSettings, InvoiceStatus } from '@/types/invoice';
import { InventoryItem } from '@/types/inventory';
import { DEFAULT_INVOICE, DEFAULT_BUSINESS_SETTINGS, DEFAULT_INVENTORY_ITEMS } from '@/lib/constants';
import { buildInvoiceWhatsAppUrl } from '@/lib/whatsapp';
import {
  fetchInvoicesFromCloud,
  saveInvoiceToCloud,
  deleteInvoiceFromCloud,
  batchSyncInvoicesToCloud,
  fetchInventoryFromCloud,
  batchSyncInventoryToCloud,
} from '@/lib/supabase';

type CloudStatus = 'connected' | 'syncing' | 'offline';

interface AppContextValue {
  invoices: InvoiceData[];
  inventoryItems: InventoryItem[];
  cloudStatus: CloudStatus;
  lastSyncTime: Date | null;
  setLastSyncTime: (d: Date | null) => void;
  needBackupReminder: boolean;
  setNeedBackupReminder: (v: boolean) => void;
  toastMessage: string | null;
  showToast: (text: string) => void;
  loadData: () => Promise<void>;
  syncInvoices: (list: InvoiceData[]) => void;
  syncInventoryItems: (list: InventoryItem[]) => void;

  // Modal state
  dialogOpen: boolean;
  activeInvoice: InvoiceData | null;
  closeDialog: () => void;
  printModalOpen: boolean;
  printInvoice: InvoiceData | null;
  closePrint: () => void;
  detailModalOpen: boolean;
  detailInvoice: InvoiceData | null;
  closeDetail: () => void;
  crewSheetOpen: boolean;
  crewSheetInvoice: InvoiceData | null;
  setCrewSheetOpen: (v: boolean) => void;
  setCrewSheetInvoice: (inv: InvoiceData | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  anyModalOpen: boolean;

  // Actions
  createNewInvoice: () => void;
  editInvoice: (inv: InvoiceData) => void;
  printInvoiceModal: (inv: InvoiceData) => void;
  detailInvoiceModal: (inv: InvoiceData) => void;
  openCrewSheet: (inv: InvoiceData) => void;
  duplicateInvoice: (inv: InvoiceData) => void;
  saveInvoiceFromDialog: (saved: InvoiceData) => void;
  deleteInvoice: (id: string, num: string) => void;
  quickChangeStatus: (id: string, status: InvoiceStatus) => void;
  quickMarkPaid: (inv: InvoiceData) => Promise<void>;
  sendWhatsApp: (inv: InvoiceData) => void;
  updateInvoice: (updated: InvoiceData) => void;
  saveSettings: (settings: BusinessSettings, setAsDefault: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

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
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const showToast = useCallback((text: string) => setToastMessage(text), []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load from localStorage & Supabase Cloud
  const loadData = useCallback(async () => {
    try {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const createNewInvoice = () => {
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

  const editInvoice = (inv: InvoiceData) => {
    setActiveInvoice(inv);
    setDialogOpen(true);
  };

  const printInvoiceModal = (inv: InvoiceData) => {
    setPrintInvoice(inv);
    setPrintModalOpen(true);
  };

  const detailInvoiceModal = (inv: InvoiceData) => {
    setDetailInvoice(inv);
    setDetailModalOpen(true);
  };

  const openCrewSheet = (inv: InvoiceData) => {
    setCrewSheetInvoice(inv);
    setCrewSheetOpen(true);
  };

  const duplicateInvoice = (inv: InvoiceData) => {
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

  const saveInvoiceFromDialog = (saved: InvoiceData) => {
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

  const deleteInvoice = (id: string, num: string) => {
    if (confirm(`Yakin ingin menghapus invoice #${num}?`)) {
      syncInvoices(invoices.filter((i) => i.id !== id));
      deleteInvoiceFromCloud(id);
      showToast(`Invoice #${num} berhasil dihapus.`);
    }
  };

  const quickChangeStatus = (id: string, newStatus: InvoiceStatus) => {
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
  const quickMarkPaid = async (inv: InvoiceData) => {
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

  const sendWhatsApp = (inv: InvoiceData) => {
    window.open(buildInvoiceWhatsAppUrl(inv), '_blank');
    showToast(`Membuka WhatsApp untuk invoice #${inv.invoiceNumber} 💬`);
  };

  // Replace one invoice in list (schedule board / crew sheet edits)
  const updateInvoice = (updated: InvoiceData) => {
    syncInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));
  };

  const saveSettings = (settings: BusinessSettings, setAsDefault: boolean) => {
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

  return (
    <AppContext.Provider
      value={{
        invoices,
        inventoryItems,
        cloudStatus,
        lastSyncTime,
        setLastSyncTime,
        needBackupReminder,
        setNeedBackupReminder,
        toastMessage,
        showToast,
        loadData,
        syncInvoices,
        syncInventoryItems,
        dialogOpen,
        activeInvoice,
        closeDialog: () => setDialogOpen(false),
        printModalOpen,
        printInvoice,
        closePrint: () => setPrintModalOpen(false),
        detailModalOpen,
        detailInvoice,
        closeDetail: () => setDetailModalOpen(false),
        crewSheetOpen,
        crewSheetInvoice,
        setCrewSheetOpen,
        setCrewSheetInvoice,
        settingsOpen,
        setSettingsOpen,
        anyModalOpen: dialogOpen || printModalOpen || detailModalOpen || settingsOpen || crewSheetOpen,
        createNewInvoice,
        editInvoice,
        printInvoiceModal,
        detailInvoiceModal,
        openCrewSheet,
        duplicateInvoice,
        saveInvoiceFromDialog,
        deleteInvoice,
        quickChangeStatus,
        quickMarkPaid,
        sendWhatsApp,
        updateInvoice,
        saveSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
