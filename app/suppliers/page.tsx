import { PageHeader } from "@/components/page-header"
import { SuppliersList } from "@/components/suppliers/suppliers-list"
import { InvoiceProcessor } from "@/components/suppliers/invoice-processor"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function SuppliersPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 container mx-auto py-8 space-y-6">
        <PageHeader
          title="Supplier Management"
          description="Manage suppliers and process invoices for inventory updates"
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceProcessor />
          <SuppliersList />
        </div>
      </div>
    </div>
  )
}
