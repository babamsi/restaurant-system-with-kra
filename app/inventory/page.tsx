"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Database, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useKRAClassifications } from '@/hooks/use-kra-classifications'
import { kraTestItemsService, type TestKRAItem } from '@/lib/kra-test-items-service'
import { AddTestItemDialog } from '@/components/kra-test-items/add-test-item-dialog'
import { EditTestItemDialog } from '@/components/kra-test-items/edit-test-item-dialog'
import { TestItemsTable } from '@/components/kra-test-items/test-items-table'
import { SummaryCards } from '@/components/kra-test-items/summary-cards'
import { BulkInventoryUpdate } from '@/components/inventory/bulk-inventory-update'
import { SupplierReceiptsList } from '@/components/inventory/supplier-receipts-list'

export default function InventoryPage() {
  const { toast } = useToast()
  const { classifications, loading: loadingClassifications, loadClassifications, error } = useKRAClassifications()
  const [testItems, setTestItems] = useState<TestKRAItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<TestKRAItem | null>(null)
  const [sendingStockToKRA, setSendingStockToKRA] = useState(false)

  const loadTestItems = async () => {
    try {
      setLoadingItems(true)
      const result = await kraTestItemsService.getTestItems()
      if (result.success) setTestItems(result.data || [])
      else toast({ title: 'Error Loading Items', description: result.error || 'Failed to load test items', variant: 'destructive' })
    } catch {
      toast({ title: 'Error Loading Items', description: 'Failed to load test items', variant: 'destructive' })
    } finally {
      setLoadingItems(false)
    }
  }

  const handleSendStockToKRA = async () => {
    if (testItems.length === 0) {
      toast({ title: 'No Items', description: 'No test items available to send to KRA', variant: 'destructive' })
      return
    }
    setSendingStockToKRA(true)
    try {
      let successCount = 0
      for (const item of testItems) {
        try {
          const response = await fetch('/api/kra/save-stock-master', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stockData: { itemCd: item.item_cd, rsdQty: item.current_stock, regrId: 'Admin', regrNm: 'Admin', modrNm: 'Admin', modrId: 'Admin' } })
          })
          const data = await response.json()
          if (response.ok && data.success) successCount++
        } catch {}
      }
      toast({ title: 'Stock Sent', description: `Sent ${successCount} items to KRA` })
    } finally { setSendingStockToKRA(false) }
  }

  useEffect(() => { loadTestItems() }, [])

  const handleItemAdded = () => loadTestItems()
  const handleItemUpdated = () => loadTestItems()

  if (loadingClassifications) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading KRA item classifications...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory (KRA Test Items)</h1>
            <p className="text-muted-foreground">Create and manage KRA items; bulk update and supplier receipts below</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadClassifications} disabled={loadingClassifications}>
              {loadingClassifications ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>) : (<><Database className="h-4 w-4 mr-2" />Refresh Classifications</>)}
            </Button>
            <Button variant="outline" onClick={handleSendStockToKRA} disabled={sendingStockToKRA || testItems.length === 0}>
              {sendingStockToKRA ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending to KRA...</>) : (<><Upload className="h-4 w-4 mr-2" />Send Stock to KRA</>)}
            </Button>
            <AddTestItemDialog isOpen={isAddingItem} onOpenChange={setIsAddingItem} classifications={classifications} onItemAdded={handleItemAdded} />
          </div>
        </div>

        <SummaryCards items={testItems} classificationsCount={classifications.length} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BulkInventoryUpdate onInventoryUpdated={loadTestItems} />
          <SupplierReceiptsList />
        </div>

        <Card>
          <div className="p-4">
            <TestItemsTable items={testItems} onItemUpdated={handleItemUpdated} onEditItem={setEditingItem as any} />
          </div>
        </Card>

        <EditTestItemDialog item={editingItem} onOpenChange={(open) => !open && setEditingItem(null)} onItemUpdated={handleItemUpdated} />
      </div>
    </ProtectedRoute>
  )
}
