'use client';

import dynamic from 'next/dynamic';
import { useApp } from '@/components/providers/AppProvider';

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
const StaffManagerModal = dynamic(
  () => import('@/components/auth/StaffManagerModal').then((mod) => mod.StaffManagerModal),
  { ssr: false }
);
const CrewDispatchSheetModal = dynamic(
  () => import('@/components/schedule/CrewDispatchSheetModal').then((mod) => mod.CrewDispatchSheetModal),
  { ssr: false }
);

export function AppModals() {
  const app = useApp();

  return (
    <>
      {app.dialogOpen && (
        <InvoiceDialog
          isOpen={app.dialogOpen}
          onClose={app.closeDialog}
          invoice={app.activeInvoice}
          existingInvoices={app.invoices}
          onSave={app.saveInvoiceFromDialog}
        />
      )}

      {app.printModalOpen && (
        <InvoicePrintModal isOpen={app.printModalOpen} onClose={app.closePrint} invoice={app.printInvoice} />
      )}

      {app.detailModalOpen && (
        <InvoiceDetailModal
          isOpen={app.detailModalOpen}
          onClose={app.closeDetail}
          invoice={app.detailInvoice}
          onEdit={app.editInvoice}
          onPrint={app.printInvoiceModal}
          onDuplicate={app.duplicateInvoice}
          onOpenCrewSheet={app.openCrewSheet}
          onRecordPayment={app.recordPayment}
          onDeletePayment={app.isAdmin ? app.deletePayment : undefined}
        />
      )}

      {app.crewSheetOpen && (
        <CrewDispatchSheetModal
          open={app.crewSheetOpen}
          onOpenChange={app.setCrewSheetOpen}
          invoice={app.crewSheetInvoice}
          inventoryItems={app.inventoryItems}
          allInvoices={app.invoices}
          onUpdateInvoice={(updated) => {
            app.setCrewSheetInvoice(updated);
            app.updateInvoice(updated);
          }}
        />
      )}

      {app.staffOpen && app.isAdmin && (
        <StaffManagerModal isOpen={app.staffOpen} onClose={() => app.setStaffOpen(false)} onNotify={app.showToast} />
      )}

      {app.settingsOpen && app.isAdmin && (
        <BusinessSettingsModal
          isOpen={app.settingsOpen}
          onClose={() => app.setSettingsOpen(false)}
          currentSettings={app.businessSettings}
          onSave={app.saveSettings}
        />
      )}
    </>
  );
}
