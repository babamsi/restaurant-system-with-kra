"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, AlertTriangle, TrendingUp, Package, Plus, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockIngredients, supplierNames } from "@/data/mock-data"
import type { Ingredient } from "@/types/operational"

export function EnhancedInventoryTable() {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [newCost, setNewCost] = useState("")
  const [isAddingIngredient, setIsAddingIngredient] = useState(false)

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    category: "",
    unit: "",
    cost_per_unit: 0,
    current_stock: 0,
    threshold: 0,
    supplier_id: 1,
  })

  const handleCostUpdate = (ingredient: Ingredient) => {
    const updatedCost = Number.parseFloat(newCost)
    if (isNaN(updatedCost) || updatedCost <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost per unit",
        variant: "destructive",
      })
      return
    }

    setIngredients((prev) =>
      prev.map((item) =>
        item.id === ingredient.id
          ? { ...item, cost_per_unit: updatedCost, last_updated: new Date().toISOString().split("T")[0] }
          : item,
      ),
    )

    toast({
      title: "Cost Updated",
      description: `Updated cost for ${ingredient.name} to $${updatedCost.toFixed(2)}/${ingredient.unit}`,
    })

    setEditingIngredient(null)
    setNewCost("")
  }

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const ingredient: Ingredient = {
      id: Math.max(...ingredients.map((i) => i.id)) + 1,
      name: newIngredient.name,
      category: newIngredient.category,
      unit: newIngredient.unit,
      cost_per_unit: newIngredient.cost_per_unit,
      current_stock: newIngredient.current_stock,
      threshold: newIngredient.threshold,
      supplier_id: newIngredient.supplier_id,
      last_updated: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString().split("T")[0],
    }

    setIngredients([...ingredients, ingredient])

    // Reset form
    setNewIngredient({
      name: "",
      category: "",
      unit: "",
      cost_per_unit: 0,
      current_stock: 0,
      threshold: 0,
      supplier_id: 1,
    })
    setIsAddingIngredient(false)

    toast({
      title: "Ingredient Added",
      description: `${ingredient.name} has been added to inventory`,
    })
  }

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.current_stock === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (ingredient.current_stock <= ingredient.threshold) {
      return {
        status: "Low Stock",
        variant: "outline" as const,
        icon: AlertTriangle,
        className: "text-amber-500 border-amber-500",
      }
    } else {
      return { status: "In Stock", variant: "default" as const, icon: Package }
    }
  }

  const calculateTotalValue = () => {
    return ingredients.reduce((sum, ingredient) => sum + ingredient.current_stock * ingredient.cost_per_unit, 0)
  }

  const lowStockCount = ingredients.filter(
    (ingredient) => ingredient.current_stock <= ingredient.threshold && ingredient.current_stock > 0,
  ).length

  const outOfStockCount = ingredients.filter((ingredient) => ingredient.current_stock === 0).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ingredients</p>
                <p className="text-2xl font-bold">{ingredients.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">${calculateTotalValue().toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-500">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Ingredient Dialog */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ingredient Inventory</h3>
        <Dialog open={isAddingIngredient} onOpenChange={setIsAddingIngredient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ingredient-name">Ingredient Name</Label>
                  <Input
                    id="ingredient-name"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    placeholder="Enter ingredient name"
                  />
                </div>
                <div>
                  <Label htmlFor="ingredient-category">Category</Label>
                  <Select
                    value={newIngredient.category}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Proteins">Proteins</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Grains">Grains</SelectItem>
                      <SelectItem value="Dairy">Dairy</SelectItem>
                      <SelectItem value="Oils">Oils</SelectItem>
                      <SelectItem value="Spices">Spices</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ingredient-unit">Unit</Label>
                  <Select
                    value={newIngredient.unit}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="L">Liters (L)</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={newIngredient.supplier_id.toString()}
                    onValueChange={(value) =>
                      setNewIngredient({ ...newIngredient, supplier_id: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(supplierNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost-per-unit">Cost per Unit ($)</Label>
                  <Input
                    id="cost-per-unit"
                    type="number"
                    step="0.01"
                    value={newIngredient.cost_per_unit}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, cost_per_unit: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="current-stock">Current Stock</Label>
                  <Input
                    id="current-stock"
                    type="number"
                    value={newIngredient.current_stock}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, current_stock: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={newIngredient.threshold}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, threshold: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingIngredient(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIngredient}>
                  <Save className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredient Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient)
                const StatusIcon = stockStatus.icon
                const supplierName = ingredient.supplier_id ? supplierNames[ingredient.supplier_id] : "Unknown"

                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{supplierName}</TableCell>
                    <TableCell className="font-mono">{ingredient.current_stock}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell className="font-mono">${ingredient.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">
                      ${(ingredient.current_stock * ingredient.cost_per_unit).toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono">{ingredient.threshold}</TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant} className={stockStatus.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingIngredient(ingredient)
                              setNewCost(ingredient.cost_per_unit.toString())
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Cost - {ingredient.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="current-cost">Current Cost per {ingredient.unit}</Label>
                              <Input id="current-cost" value={`$${ingredient.cost_per_unit.toFixed(2)}`} disabled />
                            </div>
                            <div>
                              <Label htmlFor="new-cost">New Cost per {ingredient.unit}</Label>
                              <Input
                                id="new-cost"
                                type="number"
                                step="0.01"
                                value={newCost}
                                onChange={(e) => setNewCost(e.target.value)}
                                placeholder="Enter new cost"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingIngredient(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleCostUpdate(ingredient)}>Update Cost</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
