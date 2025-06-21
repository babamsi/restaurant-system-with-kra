import { SupplierManager } from "@/components/suppliers/supplier-manager"

export default function SuppliersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Supplier Management</h1>
        <p className="text-muted-foreground">
          Manage your suppliers, add new ones, and track their information.
        </p>
      </div>

      <SupplierManager />
    </div>
  )
}
