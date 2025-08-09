"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useKRAClassifications } from "@/hooks/use-kra-classifications"
import { kraTestItemsService, TestKRAItem } from "@/lib/kra-test-items-service"
import { AddTestItemDialog } from "@/components/kra-test-items/add-test-item-dialog"
import { TestItemsTable } from "@/components/kra-test-items/test-items-table"
import { EditTestItemDialog } from "@/components/kra-test-items/edit-test-item-dialog"
import { SummaryCards } from "@/components/kra-test-items/summary-cards"

export default function KRATestItemsPage() {
  const { toast } = useToast()
  
  // State for test items
  const [testItems, setTestItems] = useState<TestKRAItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<TestKRAItem | null>(null)
  const [sendingStockToKRA, setSendingStockToKRA] = useState(false)

  // KRA classifications hook
  const { classifications, loading: loadingClassifications, loadClassifications, error } = useKRAClassifications()

  // Load test items from database
  const loadTestItems = async () => {
    try {
      setLoadingItems(true)
      
      const result = await kraTestItemsService.getTestItems()
      
      if (result.success) {
        setTestItems(result.data || [])
      } else {
        toast({
          title: "Error Loading Items",
          description: result.error || "Failed to load test items",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Items",
        description: "Failed to load test items",
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  // Send stock inventory to KRA
  const handleSendStockToKRA = async () => {
    if (testItems.length === 0) {
      toast({
        title: "No Items",
        description: "No test items available to send to KRA",
        variant: "destructive",
      })
      return
    }

    setSendingStockToKRA(true)

    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Send each item's stock information to KRA
      for (const item of testItems) {
        try {
          const response = await fetch('/api/kra/save-stock-master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stockData: {
                itemCd: item.item_cd,
                rsdQty: item.current_stock,
                regrId: 'Admin',
                regrNm: 'Admin',
                modrNm: 'Admin',
                modrId: 'Admin'
              }
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${item.name}: ${data.error || 'Unknown error'}`)
          }
        } catch (error: any) {
          errorCount++
          errors.push(`${item.name}: ${error.message || 'Network error'}`)
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully sent ${successCount} items' stock information to KRA`,
        })
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Sent ${successCount} items successfully, ${errorCount} failed. Check console for details.`,
          variant: "destructive",
        })
        console.error('Stock send errors:', errors)
      } else {
        toast({
          title: "Failed",
          description: `Failed to send stock information for ${errorCount} items. Check console for details.`,
          variant: "destructive",
        })
        console.error('Stock send errors:', errors)
      }
    } catch (error: any) {
      console.error('Error sending stock to KRA:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending stock information to KRA",
        variant: "destructive",
      })
    } finally {
      setSendingStockToKRA(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadTestItems()
  }, [])

  const handleItemAdded = () => {
    loadTestItems()
  }

  const handleItemUpdated = () => {
    loadTestItems()
  }

  const handleEditItem = (item: TestKRAItem) => {
    setEditingItem(item)
  }

  if (loadingClassifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading KRA item classifications...</p>
        </div>
      </div>
    )
  }

  // Show error state if classifications failed to load
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">KRA Test Items</h1>
            <p className="text-muted-foreground">
              Create and manage test items with KRA classifications and tax types
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadClassifications}
              disabled={loadingClassifications}
            >
              {loadingClassifications ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Retry Loading Classifications
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold">Failed to Load KRA Classifications</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={loadClassifications} disabled={loadingClassifications}>
            {loadingClassifications ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Retrying...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">KRA Test Items</h1>
          <p className="text-muted-foreground">
            Create and manage test items with KRA classifications and tax types
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadClassifications}
            disabled={loadingClassifications}
          >
            {loadingClassifications ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Refresh Classifications
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={handleSendStockToKRA}
            disabled={sendingStockToKRA || testItems.length === 0}
          >
            {sendingStockToKRA ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Sending to KRA...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Send Stock to KRA
              </>
            )}
          </Button>
          <AddTestItemDialog
            isOpen={isAddingItem}
            onOpenChange={setIsAddingItem}
            classifications={classifications}
            onItemAdded={handleItemAdded}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        items={testItems} 
        classificationsCount={classifications.length} 
      />

      {/* Test Items Table */}
      <TestItemsTable
        items={testItems}
        onItemUpdated={handleItemUpdated}
        onEditItem={handleEditItem}
      />

      {/* Edit Dialog */}
      <EditTestItemDialog
        item={editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onItemUpdated={handleItemUpdated}
      />
    </div>
  )
} 