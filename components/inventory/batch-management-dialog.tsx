import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBatchManagementStore } from "@/stores/batch-management-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useToast } from "@/hooks/use-toast"

interface BatchManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch?: Batch
}

export function BatchManagementDialog({ open, onOpenChange, batch }: BatchManagementDialogProps) {
  const { toast } = useToast()
  const { addBatch, updateBatch } = useBatchManagementStore()
  const { ingredients } = useSynchronizedInventoryStore()

  const [selectedIngredient, setSelectedIngredient] = useState(batch?.ingredient_id || "")
  const [quantity, setQuantity] = useState(batch?.quantity.toString() || "")
  const [purchaseDate, setPurchaseDate] = useState(
    batch?.purchase_date.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
  )
  const [expiryDate, setExpiryDate] = useState(
    batch?.expiry_date.toISOString().split("T")[0] || ""
  )
  const [costPerUnit, setCostPerUnit] = useState(batch?.cost_per_unit.toString() || "")
  const [location, setLocation] = useState<"storage" | "kitchen">(batch?.location || "storage")

  const handleSubmit = () => {
    if (!selectedIngredient || !quantity || !purchaseDate || !expiryDate || !costPerUnit) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const batchData = {
      ingredient_id: selectedIngredient,
      quantity: parseFloat(quantity),
      purchase_date: new Date(purchaseDate),
      expiry_date: new Date(expiryDate),
      cost_per_unit: parseFloat(costPerUnit),
      location,
      status: "active" as const,
    }

    if (batch) {
      updateBatch(batch.id, batchData)
      toast({
        title: "Batch Updated",
        description: "The batch has been updated successfully.",
      })
    } else {
      addBatch(batchData)
      toast({
        title: "Batch Added",
        description: "A new batch has been added successfully.",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Batch" : "Add New Batch"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ingredient</Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label>Cost per Unit</Label>
              <Input
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="Enter cost per unit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={(value: "storage" | "kitchen") => setLocation(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {batch ? "Update Batch" : "Add Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 