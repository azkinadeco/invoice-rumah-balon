'use client';

import { InventoryManager } from '@/components/inventory/InventoryManager';
import { useApp } from '@/components/providers/AppProvider';

export default function InventoryPage() {
  const app = useApp();
  return (
    <InventoryManager
      items={app.inventoryItems}
      onUpdateItems={app.syncInventoryItems}
      onOpenNewInvoice={app.createNewInvoice}
    />
  );
}
