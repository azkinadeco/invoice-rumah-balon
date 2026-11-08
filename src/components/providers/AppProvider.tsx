'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { InvoiceData, BusinessSettings, InvoiceStatus } from '@/types/invoice';
import { InventoryItem } from '@/types/inventory';
import { DEFAULT_INVOICE, DEFAULT_BUSINESS_SETTINGS, DEFAULT_INVENTORY_ITEMS } from '@/lib/constants';
import { buildInvoiceWhatsAppUrl, buildPaymentReminderWhatsAppUrl } from '@/lib/whatsapp';
import { getNextInvoiceNumber, todayLocalISO } from '@/lib/format';
import { getMinDp } from '@/lib/payment';
import {
  applyBusinessSettings,
  pickBusinessSettings,
  readCachedSettings,
  stripHeavySettings,
  writeCachedSettings,
} from '@/lib/businessSettings';
import { useAuth } from '@/lib/auth';
import {
  fetchInvoicesFromCloud,
  saveInvoiceToCloud,
  deleteInvoiceFromCloud,
  batchSyncInvoicesToCloud,
  fetchInventoryFromCloud,
  batchSyncInventoryToCloud,
  deleteInventoryFromCloud,
  fetchSettingsFromCloud,
  saveSettingsToCloud,
  addToPendingSyncQueue,
  getPendingSyncQueue,
} from '@/lib/supabase';

type CloudStatus = 'connected' | 'syncing' | 'offline';

interface AppContextValue {
  /** Invoices with the current shop settings (bank, QRIS, contacts) applied. */
  invoices: InvoiceData[];
  businessSettings: BusinessSettings;
  inventoryItems: InventoryItem[];
  cloudStatus: CloudStatus;
  lastSyncTime: Date | null;
  setLastSyncTime: (d: Date | null) => void;
  needBackupReminder: boolean;
  setNeedBackupReminder: (v: boolean) => void;
  toastMessage: string | null;
  showToast: (text: string) => void;
  loadData: () => Promise<void>;
  /** Replace the invoice list. `changed` = only these are uploaded; omit to upload all (restore). */
  syncInvoices: (list: InvoiceData[], changed?: InvoiceData[]) => void;
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
  staffOpen: boolean;
  setStaffOpen: (v: boolean) => void;
  /** Signed-in user may delete data, change settings, backup/restore and manage staff. */
  isAdmin: boolean;
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
  sendPaymentReminder: (inv: InvoiceData, remaining: number) => void;
  updateInvoice: (updated: InvoiceData) => void;
  saveSettings: (settings: BusinessSettings) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  // Latest list, so two quick edits in a row don't overwrite each other
  const invoicesRef = useRef<InvoiceData[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
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
  const [staffOpen, setStaffOpen] = useState(false);
  const { isAdmin } = useAuth();
  const isAdminRef = useRef(isAdmin);
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

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

  const setInvoiceList = (list: InvoiceData[]) => {
    invoicesRef.current = list;
    setInvoices(list);
  };

  const persistInvoicesLocally = (list: InvoiceData[]) => {
    try {
      localStorage.setItem('rb_saved_invoices', JSON.stringify(list.map(stripHeavySettings)));
    } catch (e) {
      console.error('Save failed:', e);
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        alert('⚠️ Memori browser penuh! Segera unduh file Backup JSON.');
      }
    }
  };

  // Load from localStorage & Supabase Cloud
  const loadData = useCallback(async () => {
    try {
      // 1. Invoices from LocalStorage
      let localInvoices: InvoiceData[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem('rb_saved_invoices') || '[]');
        if (Array.isArray(parsed)) localInvoices = parsed;
      } catch {
        // corrupt cache: fall through to the sample invoice
      }
      if (localInvoices.length === 0) localInvoices = [DEFAULT_INVOICE];
      // Older versions stamped the QRIS image into every invoice — remember one
      // so it can become the shared setting (see step 4) before it is dropped.
      let legacyQrisSource = localInvoices.find((inv) => inv.qrisImageUrl);
      localInvoices = localInvoices.map(stripHeavySettings);
      setInvoiceList(localInvoices);
      persistInvoicesLocally(localInvoices);
      const lastBackupDate = localStorage.getItem('rb_last_backup_date');
      const lastBackupCount = Number(localStorage.getItem('rb_last_backup_count') || 0);
      if (localInvoices.length >= 3 && (!lastBackupDate || localInvoices.length - lastBackupCount >= 5)) {
        setNeedBackupReminder(true);
      }

      // 2. Inventory Items from LocalStorage
      const storedInv = localStorage.getItem('rb_inventory_items');
      const parsedInv = storedInv ? JSON.parse(storedInv) : null;
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

      // 3. Shop settings: cached copy first so invoices render right away offline
      const cachedSettings = readCachedSettings();
      if (cachedSettings) setBusinessSettings(cachedSettings);

      // 4. Supabase Cloud Sync (all three requests in parallel)
      setCloudStatus('syncing');
      const [cloudInvoices, cloudInventory, cloudSettings] = await Promise.all([
        fetchInvoicesFromCloud(),
        fetchInventoryFromCloud(),
        fetchSettingsFromCloud(),
      ]);

      let connected = false;

      if (cloudInvoices !== null) {
        connected = true;
        legacyQrisSource ??= cloudInvoices.find((inv) => inv.qrisImageUrl);
        if (cloudInvoices.length > 0) {
          // Changes made offline are still waiting in the queue — keep them on top
          // of the cloud copy instead of making them vanish until the next sync.
          const byId = new Map(cloudInvoices.map((inv) => [inv.id, inv]));
          for (const q of getPendingSyncQueue()) {
            if (q.type === 'invoice' && q.payload?.id) byId.set(q.id, q.payload);
            else if (q.type === 'delete_invoice') byId.delete(q.id);
          }
          const merged = [...byId.values()].map(stripHeavySettings).sort((a, b) =>
            String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
          );
          setInvoiceList(merged);
          persistInvoicesLocally(merged);
        } else if (localInvoices.length > 0) {
          await batchSyncInvoicesToCloud(localInvoices);
        }
      }

      if (cloudInventory !== null) {
        connected = true;
        if (cloudInventory.length > 0) {
          // Keep stock edits made offline that are still waiting to be uploaded
          const byId = new Map(cloudInventory.map((it) => [it.id, it]));
          for (const q of getPendingSyncQueue()) {
            if (q.type === 'inventory' && q.payload?.id) byId.set(q.id, q.payload);
            else if (q.type === 'delete_inventory') byId.delete(q.id);
          }
          const mergedInv = [...byId.values()];
          setInventoryItems(mergedInv);
          localStorage.setItem('rb_inventory_items', JSON.stringify(mergedInv));
        } else {
          const localInv = JSON.parse(localStorage.getItem('rb_inventory_items') || '[]');
          if (localInv.length > 0) {
            await batchSyncInventoryToCloud(localInv);
          }
        }
      }

      if (cloudSettings.ok) {
        connected = true;
        if (cloudSettings.data) {
          const next = pickBusinessSettings(cloudSettings.data);
          setBusinessSettings(next);
          writeCachedSettings(next);
        } else if (isAdminRef.current) {
          // No shared settings yet. Settings used to live only in the admin's
          // browser (and a copy inside each invoice) — move them to the cloud
          // once so every employee's device gets the same bank details & QRIS.
          const seed =
            cachedSettings?.qrisImageUrl || !legacyQrisSource
              ? cachedSettings
              : { ...pickBusinessSettings(cachedSettings ?? legacyQrisSource), qrisImageUrl: legacyQrisSource.qrisImageUrl };
          if (seed) {
            setBusinessSettings(seed);
            writeCachedSettings(seed);
            saveSettingsToCloud(seed);
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

  // Sync to localStorage + Supabase Cloud.
  // Only the invoices that actually changed are uploaded; re-sending the
  // whole list on every click was slow and wasted mobile data.
  const syncInvoices = (list: InvoiceData[], changed?: InvoiceData[]) => {
    const slim = list.map(stripHeavySettings);
    setInvoiceList(slim);
    persistInvoicesLocally(slim);

    const toUpload = (changed ?? list).map(stripHeavySettings);
    if (toUpload.length === 0) return;
    const request =
      toUpload.length === 1 ? saveInvoiceToCloud(toUpload[0]) : batchSyncInvoicesToCloud(toUpload);
    setCloudStatus('syncing');
    request.then((ok) => {
      setCloudStatus(ok ? 'connected' : 'offline');
      if (ok) setLastSyncTime(new Date());
    });
  };

  const syncInventoryItems = (list: InventoryItem[]) => {
    // Items removed locally must also be removed from the cloud,
    // otherwise they come back on the next reload.
    const nextIds = new Set(list.map((it) => it.id));
    inventoryItems
      .filter((it) => !nextIds.has(it.id))
      .forEach((it) => deleteInventoryFromCloud(it.id));

    setInventoryItems(list);
    try {
      localStorage.setItem('rb_inventory_items', JSON.stringify(list));
    } catch (e) {
      console.error('Inventory save failed:', e);
    }

    // Upload only items that changed (edited items are new objects; untouched ones keep their reference)
    const prevById = new Map(inventoryItems.map((it) => [it.id, it]));
    const changed = list.filter((it) => prevById.get(it.id) !== it);
    if (changed.length === 0) return;
    batchSyncInventoryToCloud(changed).then((ok) => {
      // Offline: queue each item so the change survives a reload and is sent later
      if (!ok) changed.forEach((it) => addToPendingSyncQueue({ id: it.id, type: 'inventory', payload: it }));
      setCloudStatus(ok ? 'connected' : 'offline');
      if (ok) setLastSyncTime(new Date());
    });
  };

  const createNewInvoice = () => {
    const newNumber = getNextInvoiceNumber(invoicesRef.current);
    const today = todayLocalISO();

    const newInv: InvoiceData = {
      ...DEFAULT_INVOICE,
      ...businessSettings,
      id: `rb-${Date.now()}`,
      invoiceNumber: newNumber,
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

  const withSettings = (inv: InvoiceData) => applyBusinessSettings(inv, businessSettings);

  const editInvoice = (inv: InvoiceData) => {
    setActiveInvoice(withSettings(inv));
    setDialogOpen(true);
  };

  const printInvoiceModal = (inv: InvoiceData) => {
    setPrintInvoice(withSettings(inv));
    setPrintModalOpen(true);
  };

  const detailInvoiceModal = (inv: InvoiceData) => {
    setDetailInvoice(withSettings(inv));
    setDetailModalOpen(true);
  };

  const openCrewSheet = (inv: InvoiceData) => {
    setCrewSheetInvoice(withSettings(inv));
    setCrewSheetOpen(true);
  };

  const duplicateInvoice = (inv: InvoiceData) => {
    const newNumber = getNextInvoiceNumber(invoicesRef.current);
    const today = todayLocalISO();
    const duplicated: InvoiceData = {
      ...withSettings(inv),
      id: `rb-${Date.now()}`,
      invoiceNumber: newNumber,
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
    const invoices = invoicesRef.current;
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

    syncInvoices(nextList, [toSave]);
  };

  const deleteInvoice = (id: string, num: string) => {
    if (!isAdmin) return;
    if (confirm(`Yakin ingin menghapus invoice #${num}?`)) {
      syncInvoices(invoicesRef.current.filter((i) => i.id !== id), []);
      deleteInvoiceFromCloud(id);
      showToast(`Invoice #${num} berhasil dihapus.`);
    }
  };

  const quickChangeStatus = (id: string, newStatus: InvoiceStatus) => {
    const updated = invoicesRef.current.map((inv) => {
      if (inv.id !== id) return inv;
      let dpPaid = inv.dpPaidAmount;
      let remaining = inv.remainingAmount;
      if (newStatus === 'paid') {
        dpPaid = inv.total;
        remaining = 0;
      } else if (newStatus === 'dp_paid') {
        if (!dpPaid || dpPaid === 0) {
          dpPaid = getMinDp(inv).amount;
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
    const target = updated.find((i) => i.id === id);
    syncInvoices(updated, target ? [target] : []);
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

    const updated = invoicesRef.current.map((i) => {
      if (i.id !== inv.id) return i;
      return {
        ...i,
        status: 'paid' as InvoiceStatus,
        dpPaidAmount: i.total,
        remainingAmount: 0,
        updatedAt: new Date().toISOString(),
      };
    });
    const target = updated.find((i) => i.id === inv.id);
    syncInvoices(updated, target ? [target] : []);
    showToast(`Invoice #${inv.invoiceNumber} ditandai Lunas Penuh ✨`);
  };

  const sendWhatsApp = (inv: InvoiceData) => {
    window.open(buildInvoiceWhatsAppUrl(withSettings(inv)), '_blank');
    showToast(`Membuka WhatsApp untuk invoice #${inv.invoiceNumber} 💬`);
  };

  const sendPaymentReminder = (inv: InvoiceData, remaining: number) => {
    window.open(buildPaymentReminderWhatsAppUrl(withSettings(inv), remaining), '_blank');
    showToast(`Membuka WhatsApp pengingat untuk #${inv.invoiceNumber} 💬`);
  };

  // Replace one invoice in list (schedule board / crew sheet edits)
  const updateInvoice = (updated: InvoiceData) => {
    const updatedAt = { ...updated, updatedAt: new Date().toISOString() };
    syncInvoices(
      invoicesRef.current.map((inv) => (inv.id === updated.id ? updatedAt : inv)),
      [updatedAt]
    );
  };

  // Shop settings are shared by every device through the cloud (rb_settings),
  // and applied to invoices when they are shown — not copied into each one.
  const saveSettings = (settings: BusinessSettings) => {
    if (!isAdmin) return;
    const next = pickBusinessSettings(settings);
    setBusinessSettings(next);
    writeCachedSettings(next);
    saveSettingsToCloud(next).then((ok) => {
      if (!ok) addToPendingSyncQueue({ id: 'default_settings', type: 'settings', payload: next });
      setCloudStatus(ok ? 'connected' : 'offline');
      if (ok) setLastSyncTime(new Date());
    });
    showToast('Pengaturan toko berhasil diperbarui! ⚙️');
  };

  const invoicesWithSettings = useMemo(
    () => invoices.map((inv) => applyBusinessSettings(inv, businessSettings)),
    [invoices, businessSettings]
  );

  return (
    <AppContext.Provider
      value={{
        invoices: invoicesWithSettings,
        businessSettings,
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
        staffOpen,
        setStaffOpen,
        isAdmin,
        anyModalOpen: dialogOpen || printModalOpen || detailModalOpen || settingsOpen || crewSheetOpen || staffOpen,
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
        sendPaymentReminder,
        updateInvoice,
        saveSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
