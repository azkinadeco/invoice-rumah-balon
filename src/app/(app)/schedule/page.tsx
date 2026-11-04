'use client';

import { ScheduleBoard } from '@/components/schedule/ScheduleBoard';
import { useApp } from '@/components/providers/AppProvider';

export default function SchedulePage() {
  const app = useApp();
  return (
    <ScheduleBoard
      invoices={app.invoices}
      inventoryItems={app.inventoryItems}
      onUpdateInvoice={app.updateInvoice}
      onOpenNewInvoice={app.createNewInvoice}
      onViewInvoice={app.detailInvoiceModal}
      onPrintInvoice={app.printInvoiceModal}
    />
  );
}
