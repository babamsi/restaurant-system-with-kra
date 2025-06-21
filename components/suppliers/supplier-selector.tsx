"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { SupplierManager } from "./supplier-manager"

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  status: string
}

interface SupplierSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  showAddButton?: boolean
  className?: string
  disabled?: boolean
}

// Supplier service functions
const supplierService = {
  async getAll() {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      return { data: data.data || [], success: true }
    } catch (error) {
      return { data: [], success: false, error: 'Failed to fetch suppliers' }
    }
  }
}

export function SupplierSelector({
  value,
  onValueChange,
  placeholder = "Select supplier",
  showAddButton = true,
  className,
  disabled = false
}: SupplierSelectorProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showSupplierManager, setShowSupplierManager] = useState(false)

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const result = await supplierService.getAll()
      if (result.success) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Reload suppliers when supplier manager is closed
  const handleSupplierManagerClose = () => {
    setShowSupplierManager(false)
    loadSuppliers()
  }

  // Get active suppliers only
  const activeSuppliers = suppliers.filter(supplier => supplier.status === 'active')

  return (
    <div className="flex gap-2">
      <Select
        value={value || ""}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {activeSuppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showAddButton && (
        <Dialog open={showSupplierManager} onOpenChange={setShowSupplierManager}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Manage Suppliers</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <SupplierManager />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={handleSupplierManagerClose}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 