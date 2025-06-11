import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import type { BaseIngredient } from "@/types/operational"
import type { InventoryLog } from "@/stores/synchronized-inventory-store"

export function SynchronizedInventoryManager() {
  const {
    ingredients,
    updateIngredient,
    updateStock,
    getIngredientLogs,
  } = useSynchronizedInventoryStore()

  const [editingIngredient, setEditingIngredient] = useState<BaseIngredient | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [showLogs, setShowLogs] = useState(false)
  const [selectedIngredientLogs, setSelectedIngredientLogs] = useState<InventoryLog[]>([])

  return (
    <div className="space-y-4">
      {/* Edit Dialog */}
      <Dialog open={!!editingIngredient} onOpenChange={() => setEditingIngredient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingIngredient?.name || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: BaseIngredient | null) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editingIngredient?.category || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: BaseIngredient | null) => (prev ? { ...prev, category: e.target.value } : null))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    placeholder={`Enter quantity in ${editingIngredient?.unit || "units"}`}
                  />
                  <Button
                    onClick={() => {
                      if (editingIngredient && editQuantity) {
                        const quantity = parseFloat(editQuantity)
                        if (!isNaN(quantity)) {
                          const difference = quantity - editingIngredient.available_quantity
                          updateStock(parseInt(editingIngredient.id), Math.abs(difference), difference > 0 ? "add" : "subtract")
                          setEditQuantity("")
                          setEditingIngredient(null)
                        }
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={editingIngredient?.unit || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: BaseIngredient | null) => (prev ? { ...prev, unit: e.target.value } : null))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost per Unit</Label>
                <Input
                  type="number"
                  value={editingIngredient?.cost_per_unit || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: BaseIngredient | null) =>
                      prev ? { ...prev, cost_per_unit: parseFloat(e.target.value) || 0 } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  value={editingIngredient?.threshold || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: BaseIngredient | null) =>
                      prev ? { ...prev, threshold: parseFloat(e.target.value) || 0 } : null
                    )
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingIngredient(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingIngredient) {
                    updateIngredient(editingIngredient.id, {
                      name: editingIngredient.name,
                      category: editingIngredient.category,
                      unit: editingIngredient.unit,
                      cost_per_unit: editingIngredient.cost_per_unit,
                      threshold: editingIngredient.threshold,
                    })
                    setEditingIngredient(null)
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory Change History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedIngredientLogs.length === 0 ? (
              <p className="text-center text-muted-foreground">No changes recorded</p>
            ) : (
              <div className="space-y-2">
                {selectedIngredientLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{log.ingredientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {log.action}
                        </Badge>
                      </div>
                      {log.changes && (
                        <div className="mt-2 space-y-1">
                          {log.changes.map((change: { field: string; from: any; to: any }, index: number) => (
                            <p key={index} className="text-sm">
                              {change.field}: {change.from} → {change.to}
                            </p>
                          ))}
                        </div>
                      )}
                      {log.quantity && (
                        <p className="text-sm mt-2">
                          Quantity: {log.quantity > 0 ? "+" : ""}{log.quantity} {log.unit}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Source: {log.source}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory List */}
      <div className="space-y-4">
        {ingredients.map((ingredient) => (
          <Card key={ingredient.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ingredient.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {ingredient.available_quantity} {ingredient.unit} available
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedIngredientLogs(getIngredientLogs(ingredient.id))
                      setShowLogs(true)
                    }}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingIngredient(ingredient)
                      setEditQuantity(ingredient.available_quantity.toString())
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 