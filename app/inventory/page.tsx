import { PageHeader } from "@/components/page-header"
import { SynchronizedInventoryManager } from "@/components/inventory/synchronized-inventory-manager"
import ProtectedRoute from '@/components/ui/ProtectedRoute';

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Inventory Management"
          description="Manage ingredients, track stock levels, and monitor costs. Changes sync automatically with Kitchen and POS."
        />
        <SynchronizedInventoryManager />
      </div>
    </ProtectedRoute>
  )
}
