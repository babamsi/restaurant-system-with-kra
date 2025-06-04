import { PageHeader } from "@/components/page-header"
import { SynchronizedInventoryManager } from "@/components/inventory/synchronized-inventory-manager"

export default function InventoryPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory Management"
        description="Manage ingredients, track stock levels, and monitor costs. Changes sync automatically with Kitchen and POS."
      />
      <SynchronizedInventoryManager />
    </div>
  )
}
