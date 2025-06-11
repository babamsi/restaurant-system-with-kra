import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProductionManagementStore } from "@/stores/production-management-store"
import { useBatchManagementStore } from "@/stores/batch-management-store"
import { useToast } from "@/hooks/use-toast"

interface ProductionManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  production?: ProductionBatch
}

// This would typically come from your recipe management system
const preparedItems = [
  { id: "1", name: "Tomato Sauce Base", unit: "L" },
  { id: "2", name: "Chicken Stock", unit: "L" },
  { id: "3", name: "Beef Stock", unit: "L" },
  { id: "4", name: "Vegetable Stock", unit: "L" },
]

export function ProductionManagementDialog({
  open,
  onOpenChange,
  production,
}: ProductionManagementDialogProps) {
  const { toast } = useToast()
  const { createProductionBatch, updateProductionBatch } = useProductionManagementStore()
  const { getBatchesByLocation } = useBatchManagementStore()

  const [selectedItem, setSelectedItem] = useState(production?.prepared_item_id || "")
  const [quantity, setQuantity] = useState(production?.quantity_produced.toString() || "")
  const [productionDate, setProductionDate] = useState(
    production?.production_date.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
  )
  const [expiryDate, setExpiryDate] = useState(
    production?.expiry_date.toISOString().split("T")[0] || ""
  )
  const [components, setComponents] = useState<{ ingredient_id: string; quantity: number; batch_id: string }[]>(
    production?.components || []
  )

  const handleAddComponent = () => {
    setComponents([...components, { ingredient_id: "", quantity: 0, batch_id: "" }])
  }

  const handleComponentChange = (index: number, field: string, value: string | number) => {
    const newComponents = [...components]
    newComponents[index] = { ...newComponents[index], [field]: value }
    setComponents(newComponents)
  }

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!selectedItem || !quantity || !productionDate || !expiryDate || components.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one component.",
        variant: "destructive",
      })
      return
    }

    const productionData = {
      prepared_item_id: selectedItem,
      quantity_produced: parseFloat(quantity),
      production_date: new Date(productionDate),
      expiry_date: new Date(expiryDate),
      components,
      cost_per_unit: 0, // This would be calculated based on components
    }

    if (production) {
      updateProductionBatch(production.id, productionData)
      toast({
        title: "Production Updated",
        description: "The production batch has been updated successfully.",
      })
    } else {
      createProductionBatch(productionData)
      toast({
        title: "Production Created",
        description: "A new production batch has been created successfully.",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{production ? "Edit Production" : "New Production"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Prepared Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select prepared item" />
              </SelectTrigger>
              <SelectContent>
                {preparedItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
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
              <Label>Production Date</Label>
              <Input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Components</Label>
              <Button variant="outline" size="sm" onClick={handleAddComponent}>
                Add Component
              </Button>
            </div>

            {components.map((component, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <Select
                  value={component.ingredient_id}
                  onValueChange={(value) => handleComponentChange(index, "ingredient_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBatchesByLocation("kitchen").map((batch) => (
                      <SelectItem key={batch.id} value={batch.ingredient_id}>
                        {batch.ingredient_id} {/* This should show ingredient name */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={component.quantity}
                  onChange={(e) => handleComponentChange(index, "quantity", parseFloat(e.target.value))}
                  placeholder="Quantity"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveComponent(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {production ? "Update Production" : "Create Production"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 