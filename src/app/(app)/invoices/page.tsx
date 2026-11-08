'use client';

import React, { useMemo, useState } from 'react';
import { exportInvoicesToCSV, todayLocalISO } from '@/lib/format';
import { stripHeavySettings } from '@/lib/businessSettings';
import { useApp } from '@/components/providers/AppProvider';
import { InvoiceStatsHeader } from '@/components/invoice/InvoiceStatsHeader';
import { InvoiceFilterToolbar } from '@/components/invoice/InvoiceFilterToolbar';
import { InvoiceTableView } from '@/components/invoice/InvoiceTableView';
import { PaymentReminderPanel } from '@/components/invoice/PaymentReminderPanel';

export default function InvoicesPage() {
  const app = useApp();
  const { invoices, inventoryItems, showToast, syncInvoices, syncInventoryItems } = app;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month'>('all');

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth();
    const thisMonthPrefix = `${curY}-${String(curM + 1).padStart(2, '0')}`;
    const lastMonthYear = curM === 0 ? curY - 1 : curY;
    const lastMonthMonth = curM === 0 ? 12 : curM;
    const lastMonthPrefix = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}`;

    return invoices.filter((inv) => {
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
  }, [invoices, search, statusFilter, periodFilter]);

  const handleExportCSV = () => {
    const today = todayLocalISO();
    exportInvoicesToCSV(filteredInvoices, `Data_Invoice_RumahBalon_${today}.csv`);
    showToast('Data invoice berhasil diekspor ke Excel / CSV 📊');
  };

  const handleExportBackup = () => {
    const backupData = {
      // QRIS image is stored once under `settings`, not repeated per invoice
      invoices: invoices.map(stripHeavySettings),
      inventoryItems,
      settings: app.businessSettings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const today = todayLocalISO();
    downloadAnchor.href = url;
    downloadAnchor.download = `backup_rumah_balon_${today}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    try {
      localStorage.setItem('rb_last_backup_date', today);
      localStorage.setItem('rb_last_backup_count', String(invoices.length));
    } catch {
      // ignore
    }
    app.setNeedBackupReminder(false);
    showToast('Backup database JSON berhasil diunduh 💾');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!app.isAdmin) return;
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still triggers onChange
    e.target.value = '';
    if (!file) return;
    if (
      !confirm(
        `Pulihkan data dari "${file.name}"?\n\nSemua invoice & stok saat ini akan DIGANTI dengan isi file backup (juga di Cloud). Disarankan unduh backup terbaru dulu.`
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const rawInvoices = Array.isArray(parsed) ? parsed : parsed?.invoices;
        const rawInventory = Array.isArray(parsed) ? undefined : parsed?.inventoryItems;
        const rawSettings = Array.isArray(parsed) ? undefined : parsed?.settings;

        if (!Array.isArray(rawInvoices) && !Array.isArray(rawInventory) && !rawSettings) {
          alert('Format file backup JSON tidak valid.');
          return;
        }

        if (Array.isArray(rawInvoices)) {
          // Drop rows that would crash the app (missing id / number / items)
          const valid = rawInvoices.filter(
            (inv) => inv && typeof inv === 'object' && inv.id && inv.invoiceNumber && Array.isArray(inv.items)
          );
          const skipped = rawInvoices.length - valid.length;
          if (valid.length === 0) {
            alert('File backup tidak berisi invoice yang valid. Data invoice saat ini tidak diubah.');
          } else {
            syncInvoices(valid);
            if (skipped > 0) alert(`${skipped} baris invoice rusak dilewati.`);
          }
        }
        if (Array.isArray(rawInventory) && rawInventory.length > 0) {
          syncInventoryItems(rawInventory.filter((it) => it && typeof it === 'object' && it.id));
        }
        if (rawSettings && typeof rawSettings === 'object') {
          app.saveSettings(rawSettings);
        }
        showToast('Berhasil memulihkan data dari backup! 🎉');
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <InvoiceStatsHeader
        invoices={invoices}
        filteredInvoices={filteredInvoices}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
      />

      {/* Unpaid events coming up soon */}
      <PaymentReminderPanel
        invoices={invoices}
        onSendReminder={app.sendPaymentReminder}
        onMarkPaid={app.quickMarkPaid}
        onOpenDetail={app.detailInvoiceModal}
      />

      <InvoiceFilterToolbar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        filteredCount={filteredInvoices.length}
        onExportCSV={handleExportCSV}
        onExportBackup={app.isAdmin ? handleExportBackup : undefined}
        onImportBackup={app.isAdmin ? handleImportBackup : undefined}
        needBackupReminder={app.needBackupReminder}
      />

      <InvoiceTableView
        invoices={filteredInvoices}
        onPrintInvoice={app.printInvoiceModal}
        onEditInvoice={app.editInvoice}
        onDetailInvoice={app.detailInvoiceModal}
        onSendWhatsApp={app.sendWhatsApp}
        onQuickMarkPaid={app.quickMarkPaid}
        onOpenCrewSheet={app.openCrewSheet}
        onDuplicateInvoice={app.duplicateInvoice}
        onDeleteInvoice={app.isAdmin ? app.deleteInvoice : undefined}
        onQuickChangeStatus={app.quickChangeStatus}
        onCreateNewInvoice={app.createNewInvoice}
      />
    </>
  );
}
