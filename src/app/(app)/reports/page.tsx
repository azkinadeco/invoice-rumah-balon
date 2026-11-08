'use client';

import { MonthlyReport } from '@/components/reports/MonthlyReport';
import { useApp } from '@/components/providers/AppProvider';

export default function ReportsPage() {
  const app = useApp();

  // Revenue figures are for the owner/admin only
  if (!app.isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Laporan keuangan hanya bisa dilihat oleh admin.
      </div>
    );
  }

  return (
    <MonthlyReport
      invoices={app.invoices}
      onOpenInvoice={app.detailInvoiceModal}
      onSendReminder={app.sendPaymentReminder}
      onNotify={app.showToast}
    />
  );
}
