// Supabase REST client (Zero-dependency, offline-first with resilience queue)
import { InvoiceData, BusinessSettings } from '@/types/invoice';
import { InventoryItem } from '@/types/inventory';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://clyczvltkiervbtfzlmd.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_CJI9V74lBLk6WIBIGrCVzQ_oRoT4GOW';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation,resolution=merge-duplicates',
};

const QUEUE_KEY = 'rb_pending_sync_queue';

export interface PendingSyncItem {
  id: string;
  type: 'invoice' | 'inventory' | 'settings' | 'delete_invoice';
  payload: any;
  timestamp: number;
}

// Helper: Get offline sync queue
export function getPendingSyncQueue(): PendingSyncItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: Add item to offline sync queue
export function addToPendingSyncQueue(item: Omit<PendingSyncItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getPendingSyncQueue();
    // Deduplicate existing pending actions for the same id/type
    const filtered = current.filter((q) => !(q.id === item.id && q.type === item.type));
    filtered.push({ ...item, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

// Helper: Clear pending sync queue
export function clearPendingSyncQueue() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

// Helper: Ping Supabase health
export async function checkSupabaseHealth(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_invoices?select=id&limit=1`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// 1. Fetch Invoices from Supabase
export async function fetchInvoicesFromCloud(): Promise<InvoiceData[] | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_invoices?select=*&order=updated_at.desc`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return null;
    }
    const rows: Array<{ id: string; data: InvoiceData }> = await res.json();
    return rows.map((r) => r.data).filter(Boolean);
  } catch (err) {
    console.warn('Supabase fetch invoices error (using local storage fallback):', err);
    return null;
  }
}

// 2. Upsert a single Invoice to Supabase
export async function saveInvoiceToCloud(invoice: InvoiceData): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        booking_date: invoice.bookingDate,
        status: invoice.status,
        data: invoice,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      addToPendingSyncQueue({ id: invoice.id, type: 'invoice', payload: invoice });
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save invoice error (added to offline queue):', err);
    addToPendingSyncQueue({ id: invoice.id, type: 'invoice', payload: invoice });
    return false;
  }
}

// 3. Delete Invoice from Supabase
export async function deleteInvoiceFromCloud(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_invoices?id=eq.${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      addToPendingSyncQueue({ id, type: 'delete_invoice', payload: { id } });
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete invoice error (queued):', err);
    addToPendingSyncQueue({ id, type: 'delete_invoice', payload: { id } });
    return false;
  }
}

// 4. Batch sync all invoices to Cloud
export async function batchSyncInvoicesToCloud(invoices: InvoiceData[]): Promise<boolean> {
  if (!invoices.length) return true;
  try {
    const rows = invoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      booking_date: inv.bookingDate,
      status: inv.status,
      data: inv,
      updated_at: inv.updatedAt || new Date().toISOString(),
    }));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      invoices.forEach((inv) => addToPendingSyncQueue({ id: inv.id, type: 'invoice', payload: inv }));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase batch sync invoices error (queued for retry):', err);
    invoices.forEach((inv) => addToPendingSyncQueue({ id: inv.id, type: 'invoice', payload: inv }));
    return false;
  }
}

// 5. Fetch Inventory from Supabase
export async function fetchInventoryFromCloud(): Promise<InventoryItem[] | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_inventory?select=*&order=updated_at.desc`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const rows: Array<{ id: string; data: InventoryItem }> = await res.json();
    return rows.map((r) => r.data).filter(Boolean);
  } catch (err) {
    console.warn('Supabase fetch inventory error:', err);
    return null;
  }
}

// 6. Batch sync Inventory to Supabase
export async function batchSyncInventoryToCloud(items: InventoryItem[]): Promise<boolean> {
  if (!items.length) return true;
  try {
    const rows = items.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      data: it,
      updated_at: it.updatedAt || new Date().toISOString(),
    }));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_inventory`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (err) {
    console.warn('Supabase batch sync inventory error:', err);
    return false;
  }
}

// 7. Fetch Settings from Supabase
export async function fetchSettingsFromCloud(): Promise<BusinessSettings | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_settings?id=eq.default_settings&select=*`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const rows: Array<{ id: string; data: BusinessSettings }> = await res.json();
    return rows[0]?.data || null;
  } catch (err) {
    console.warn('Supabase fetch settings error:', err);
    return null;
  }
}

// 8. Save Settings to Supabase
export async function saveSettingsToCloud(settings: BusinessSettings): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rb_settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'default_settings',
        data: settings,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Supabase save settings error:', err);
    return false;
  }
}

// 9. Process and flush pending offline queue
export async function flushPendingSyncQueue(): Promise<{ success: boolean; count: number }> {
  const queue = getPendingSyncQueue();
  if (!queue.length) return { success: true, count: 0 };

  const isHealthy = await checkSupabaseHealth();
  if (!isHealthy) return { success: false, count: queue.length };

  let processedCount = 0;
  const remaining: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      let ok = false;
      if (item.type === 'invoice') {
        ok = await saveInvoiceToCloud(item.payload);
      } else if (item.type === 'delete_invoice') {
        ok = await deleteInvoiceFromCloud(item.id);
      } else if (item.type === 'inventory') {
        ok = await batchSyncInventoryToCloud([item.payload]);
      } else if (item.type === 'settings') {
        ok = await saveSettingsToCloud(item.payload);
      }
      if (ok) {
        processedCount++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  if (typeof window !== 'undefined') {
    if (remaining.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(QUEUE_KEY);
    }
  }

  return { success: remaining.length === 0, count: processedCount };
}

// SQL Script generator for the user's Supabase project setup
export const SUPABASE_SETUP_SQL = `-- Salin dan tempel di Supabase -> SQL Editor -> Klik RUN:

-- 1. Tabel Invoice & Pesanan
CREATE TABLE IF NOT EXISTS rb_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  booking_date TEXT,
  status TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Master Stok Gudang & Balon
CREATE TABLE IF NOT EXISTS rb_inventory (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Profil Usaha & Pengaturan Rekening
CREATE TABLE IF NOT EXISTS rb_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aktifkan Izin Baca & Tulis Publik (Untuk Web & HP Toko)
ALTER TABLE rb_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rb_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE rb_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public for rb_invoices" ON rb_invoices;
CREATE POLICY "Allow public for rb_invoices" ON rb_invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public for rb_inventory" ON rb_inventory;
CREATE POLICY "Allow public for rb_inventory" ON rb_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public for rb_settings" ON rb_settings;
CREATE POLICY "Allow public for rb_settings" ON rb_settings FOR ALL USING (true) WITH CHECK (true);
`;
