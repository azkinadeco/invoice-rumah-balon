'use client';

import React, { useState } from 'react';
import { exportInvoicesToCSV } from '@/lib/format';
import { useApp } from '@/components/providers/AppProvider';
import { InvoiceStatsHeader } from '@/components/invoice/InvoiceStatsHeader';
import { InvoiceFilterToolbar } from '@/components/invoice/InvoiceFilterToolbar';
import { InvoiceTableView } from '@/components/invoice/InvoiceTableView';

export default function InvoicesPage() {
  const app = useApp();
  const { invoices, inventoryItems, showToast, syncInvoices, syncInventoryItems } = app;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month'>('all');

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

  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    exportInvoicesToCSV(filteredInvoices, `Data_Invoice_RumahBalon_${today}.csv`);
    showToast('Data invoice berhasil diekspor ke Excel / CSV 📊');
  };

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
    app.setNeedBackupReminder(false);
    showToast('Backup database JSON berhasil diunduh 💾');
  };

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
        onDeleteInvoice={app.deleteInvoice}
        onQuickChangeStatus={app.quickChangeStatus}
        onCreateNewInvoice={app.createNewInvoice}
      />
    </>
  );
}
