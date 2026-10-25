'use client';

import dynamic from 'next/dynamic';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants';
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
        />
      )}

      {app.crewSheetOpen && (
        <CrewDispatchSheetModal
          open={app.crewSheetOpen}
          onOpenChange={app.setCrewSheetOpen}
          invoice={app.crewSheetInvoice}
          inventoryItems={app.inventoryItems}
          onUpdateInvoice={(updated) => {
            app.setCrewSheetInvoice(updated);
            app.updateInvoice(updated);
          }}
        />
      )}

      {app.settingsOpen && (
        <BusinessSettingsModal
          isOpen={app.settingsOpen}
          onClose={() => app.setSettingsOpen(false)}
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
            return app.invoices[0] || DEFAULT_BUSINESS_SETTINGS;
          })()}
          onSave={app.saveSettings}
        />
      )}
    </>
  );
}
