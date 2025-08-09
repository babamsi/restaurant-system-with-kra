"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { TestKRAItem, kraTestItemsService, UpdateTestItemData } from "@/lib/kra-test-items-service"
import { Loader2 } from "lucide-react"

interface EditTestItemDialogProps {
  item: TestKRAItem | null
  onOpenChange: (open: boolean) => void
  onItemUpdated: () => void
}

export function EditTestItemDialog({ item, onOpenChange, onItemUpdated }: EditTestItemDialogProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingToKRA, setIsSendingToKRA] = useState(false)
  const [editData, setEditData] = useState<UpdateTestItemData>({
    name: "",
    description: "",
    cost_per_unit: 0,
    current_stock: 0
  })
  const [originalStock, setOriginalStock] = useState(0)

  // Update edit data when item changes
  useEffect(() => {
    if (item) {
      setEditData({
        name: item.name,
        description: item.description || "",
        cost_per_unit: item.cost_per_unit,
        current_stock: item.current_stock
      })
      setOriginalStock(item.current_stock)
    }
  }, [item])

  // Calculate tax amount based on tax type
  const calculateTaxAmount = (amount: number, taxType: string): number => {
    switch (taxType) {
      case 'A': return 0 // Exempt
      case 'B': return amount * 0.16 // 16% VAT
      case 'C': return 0 // Zero-rated
      case 'D': return 0 // Non-VAT
      case 'E': return amount * 0.08 // 8% Reduced rate
      default: return amount * 0.16 // Default to 16%
    }
  }

  // Send stock-in to KRA
  const sendStockInToKRA = async (updatedItem: TestKRAItem, stockChange: number) => {
    if (!updatedItem.item_cd) {
      toast({
        title: "KRA Registration Required",
        description: "Item must be registered with KRA before sending stock updates",
        variant: "destructive",
      })
      return false
    }

    try {
      setIsSendingToKRA(true)

      // Calculate tax amounts
      const supplyAmount = updatedItem.cost_per_unit * stockChange
      const taxAmount = calculateTaxAmount(supplyAmount, updatedItem.tax_ty_cd || 'B')

      // Format date as YYYYMMDD (8 characters)
      const today = new Date()
      const ocrnDt = today.getFullYear().toString() + 
                     String(today.getMonth() + 1).padStart(2, '0') + 
                     String(today.getDate()).padStart(2, '0')

      // Prepare stock-in payload
      const stockInPayload = {
        sarNo: Math.floor(Math.random() * 900000) + 100000, // Generate random SAR number
        orgSarNo: Math.floor(Math.random() * 900000) + 100000,
        regTyCd: "M", // Manual
        custTin: null,
        custNm: null,
        custBhfId: null,
        sarTyCd: "11", // Stock-in - will be overridden by API
        ocrnDt: ocrnDt, // Format: "20250803"
        totItemCnt: 1,
        totTaxblAmt: supplyAmount,
        totTaxAmt: taxAmount,
        totAmt: supplyAmount,
        remark: `Stock update for ${updatedItem.name}`,
        regrId: "KRA Test POS",
        regrNm: "KRA Test POS",
        modrNm: "KRA Test POS",
        modrId: "KRA Test POS",
        itemList: [
          {
            itemSeq: 1,
            itemCd: updatedItem.item_cd,
            itemClsCd: updatedItem.item_cls_cd || 'TEST',
            itemNm: updatedItem.name,
            bcd: null,
            pkgUnitCd: 'NT', // Standard packaging unit
            pkg: 1,
            qtyUnitCd: updatedItem.unit,
            qty: stockChange,
            itemExprDt: null,
            prc: updatedItem.cost_per_unit,
            splyAmt: supplyAmount,
            totDcAmt: 0,
            taxblAmt: supplyAmount,
            taxTyCd: updatedItem.tax_ty_cd || 'B',
            taxAmt: taxAmount,
            totAmt: supplyAmount
          }
        ],
        stockChange: stockChange, // Add stock change for dynamic sarTyCd
        context: 'adjustment' // Context for determining sarTyCd
      }

      console.log('Stock-in Payload:', JSON.stringify(stockInPayload, null, 2))

      // Send to KRA stock-in API
      const response = await fetch('/api/kra/stock-in-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockInPayload)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Stock Update Sent to KRA",
          description: `Stock change of ${stockChange} units sent to KRA successfully`,
        })
        return true
      } else {
        toast({
          title: "KRA Stock Update Failed",
          description: data.error || "Failed to send stock update to KRA",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error sending stock-in to KRA:', error)
      toast({
        title: "KRA Stock Update Failed",
        description: "Failed to send stock update to KRA",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSendingToKRA(false)
    }
  }

  const handleSave = async () => {
    if (!item) return

    try {
      setIsUpdating(true)
      
      const result = await kraTestItemsService.updateTestItem(item.id, editData)
      
      if (result.success) {
        // Check if stock was updated
        const stockChange = (editData.current_stock || 0) - originalStock
        
        if (stockChange !== 0) {
          // Send stock-in to KRA
          const kraSuccess = await sendStockInToKRA(result.data!, stockChange)
          
          if (!kraSuccess) {
            // If KRA failed, we might want to revert the stock change
            // For now, we'll just show a warning
            toast({
              title: "Stock Updated (KRA Failed)",
              description: "Stock was updated locally but KRA submission failed",
              variant: "destructive",
            })
          }
        }

        toast({
          title: "Test Item Updated",
          description: `${item.name} has been updated successfully.`,
        })
        onOpenChange(false)
        onItemUpdated()
      } else {
        toast({
          title: "Error Updating Test Item",
          description: result.error || "Failed to update test item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Updating Test Item",
        description: "Failed to update test item",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Test Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editData.name || ""}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={item?.category || ""}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unit</Label>
              <Input
                value={item?.unit || ""}
                disabled
              />
            </div>
            <div>
              <Label>Cost per Unit</Label>
              <Input
                type="number"
                value={editData.cost_per_unit || ""}
                onChange={(e) => setEditData({ ...editData, cost_per_unit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={editData.description || ""}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>

          <div>
            <Label>Current Stock</Label>
            <Input
              type="number"
              value={editData.current_stock || ""}
              onChange={(e) => setEditData({ ...editData, current_stock: parseFloat(e.target.value) || 0 })}
            />
            {(editData.current_stock || 0) !== originalStock && (
              <p className="text-sm text-muted-foreground mt-1">
                Stock change: {(editData.current_stock || 0) - originalStock} units
                {item?.item_cd ? " (Will be sent to KRA)" : " (KRA registration required)"}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || isSendingToKRA}>
              {isUpdating || isSendingToKRA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSendingToKRA ? "Sending to KRA..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 