import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStocktakeStore } from "@/stores/stocktake-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useToast } from "@/hooks/use-toast"
import { Stocktake, StocktakeItem } from "@/types/operational"

interface StocktakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stocktake?: Stocktake
}

export function StocktakeDialog({ open, onOpenChange, stocktake }: StocktakeDialogProps) {
  const { toast } = useToast()
  const { createStocktake, updateStocktake, completeStocktake } = useStocktakeStore()
  const { ingredients } = useSynchronizedInventoryStore()

  const [location, setLocation] = useState<"storage" | "kitchen">(stocktake?.location || "storage")
  const [items, setItems] = useState<StocktakeItem[]>(
    stocktake?.items || ingredients.map((ingredient) => ({
      ingredient_id: ingredient.id,
      expected_quantity: ingredient.available_quantity,
      actual_quantity: ingredient.available_quantity,
      variance: 0,
    }))
  )

  useEffect(() => {
    if (!stocktake) {
      setItems(
        ingredients.map((ingredient) => ({
          ingredient_id: ingredient.id,
          expected_quantity: ingredient.available_quantity,
          actual_quantity: ingredient.available_quantity,
          variance: 0,
        }))
      )
    }
  }, [ingredients, stocktake])

  const handleQuantityChange = (ingredientId: string, value: string) => {
    const newItems = items.map((item) => {
      if (item.ingredient_id === ingredientId) {
        const actualQuantity = parseFloat(value) || 0
        return {
          ...item,
          actual_quantity: actualQuantity,
          variance: actualQuantity - item.expected_quantity,
        }
      }
      return item
    })
    setItems(newItems)
  }

  const handleSubmit = () => {
    if (items.some((item) => item.actual_quantity < 0)) {
      toast({
        title: "Invalid Quantities",
        description: "All quantities must be greater than or equal to 0.",
        variant: "destructive",
      })
      return
    }

    const stocktakeData = {
      date: new Date(),
      location,
      status: "in_progress" as const,
      items,
    }

    if (stocktake) {
      updateStocktake(stocktake.id, stocktakeData)
      toast({
        title: "Stocktake Updated",
        description: "The stocktake has been updated successfully.",
      })
    } else {
      createStocktake(stocktakeData)
      toast({
        title: "Stocktake Created",
        description: "A new stocktake has been created successfully.",
      })
    }

    onOpenChange(false)
  }

  const handleComplete = () => {
    if (!stocktake) return

    completeStocktake(stocktake.id)
    toast({
      title: "Stocktake Completed",
      description: "The stocktake has been completed successfully.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{stocktake ? "Edit Stocktake" : "New Stocktake"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Items</Label>
            <div className="grid grid-cols-4 gap-2 font-medium text-sm">
              <div>Ingredient</div>
              <div>Expected</div>
              <div>Actual</div>
              <div>Variance</div>
            </div>
            {items.map((item) => {
              const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
              return (
                <div key={item.ingredient_id} className="grid grid-cols-4 gap-2">
                  <div className="flex items-center">
                    {ingredient?.name}
                  </div>
                  <div className="flex items-center">
                    {item.expected_quantity} {ingredient?.unit}
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={item.actual_quantity}
                      onChange={(e) => handleQuantityChange(item.ingredient_id, e.target.value)}
                      placeholder="Enter actual quantity"
                    />
                  </div>
                  <div className={`flex items-center ${item.variance !== 0 ? "text-red-500" : ""}`}>
                    {item.variance} {ingredient?.unit}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {stocktake && stocktake.status === "in_progress" && (
            <Button variant="destructive" onClick={handleComplete}>
              Complete Stocktake
            </Button>
          )}
          <Button onClick={handleSubmit}>
            {stocktake ? "Update Stocktake" : "Create Stocktake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 