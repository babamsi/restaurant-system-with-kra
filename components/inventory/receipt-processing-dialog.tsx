import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReceiptProcessingStore } from "@/stores/receipt-processing-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useToast } from "@/hooks/use-toast"
import { Receipt } from "@/types/operational"

interface ReceiptProcessingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt?: Receipt
}

export function ReceiptProcessingDialog({ open, onOpenChange, receipt }: ReceiptProcessingDialogProps) {
  const { toast } = useToast()
  const { addReceipt, processReceipt } = useReceiptProcessingStore()
  const { ingredients } = useSynchronizedInventoryStore()

  const [supplier, setSupplier] = useState(receipt?.supplier || "")
  const [items, setItems] = useState<Receipt["items"]>(
    receipt?.items || [
      {
        ingredient_id: "",
        quantity: 0,
        cost_per_unit: 0,
      },
    ]
  )

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        ingredient_id: "",
        quantity: 0,
        cost_per_unit: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof Receipt["items"][0], value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setItems(newItems)
  }

  const handleSubmit = () => {
    if (!supplier) {
      toast({
        title: "Missing Information",
        description: "Please enter a supplier name.",
        variant: "destructive",
      })
      return
    }

    if (items.some((item) => !item.ingredient_id || item.quantity <= 0 || item.cost_per_unit <= 0)) {
      toast({
        title: "Invalid Items",
        description: "Please fill in all item details correctly.",
        variant: "destructive",
      })
      return
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.cost_per_unit,
      0
    )

    const receiptData = {
      date: new Date(),
      supplier,
      items,
      total_amount: totalAmount,
      status: "pending" as const,
    }

    if (receipt) {
      // Update existing receipt
      // This would typically call an update function
      toast({
        title: "Receipt Updated",
        description: "The receipt has been updated successfully.",
      })
    } else {
      addReceipt(receiptData)
      toast({
        title: "Receipt Added",
        description: "The receipt has been added successfully.",
      })
    }

    onOpenChange(false)
  }

  const handleProcess = () => {
    if (!receipt) return

    processReceipt(receipt.id)
    toast({
      title: "Receipt Processed",
      description: "The receipt has been processed successfully.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{receipt ? "Edit Receipt" : "New Receipt"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2">
                <div>
                  <Select
                    value={item.ingredient_id}
                    onValueChange={(value) => handleItemChange(index, "ingredient_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)
                    }
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={item.cost_per_unit}
                    onChange={(e) =>
                      handleItemChange(index, "cost_per_unit", parseFloat(e.target.value) || 0)
                    }
                    placeholder="Cost per unit"
                  />
                </div>
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {receipt && receipt.status === "pending" && (
            <Button variant="default" onClick={handleProcess}>
              Process Receipt
            </Button>
          )}
          <Button onClick={handleSubmit}>
            {receipt ? "Update Receipt" : "Add Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 