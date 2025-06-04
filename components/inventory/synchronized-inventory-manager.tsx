"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, Edit, AlertTriangle, Package, TrendingUp, Bell, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { supplierNames } from "@/data/mock-data"

export function SynchronizedInventoryManager() {
  const { toast } = useToast()
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    updateStock,
    updateCost,
    getLowStockItems,
    getOutOfStockItems,
    getTotalValue,
  } = useSynchronizedInventoryStore()

  const [isAddingIngredient, setIsAddingIngredient] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<any>(null)
  const [newCost, setNewCost] = useState("")
  const [notifications, setNotifications] = useState<string[]>([])

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

  useEffect(() => {
    // Show notifications for low stock items
    const lowStock = getLowStockItems()
    const outOfStock = getOutOfStockItems()

    const newNotifications = [
      ...lowStock.map((item) => `${item.name} is running low (${item.current_stock} ${item.unit} remaining)`),
      ...outOfStock.map((item) => `${item.name} is out of stock`),
    ]

    setNotifications(newNotifications)
  }, [ingredients])

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const ingredient = addIngredient(newIngredient)

    toast({
      title: "Ingredient Added Successfully!",
      description: `${ingredient.name} has been added to inventory and is now available in the Kitchen for recipe creation.`,
    })

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
  }

  const handleCostUpdate = (ingredient: any) => {
    const updatedCost = Number.parseFloat(newCost)
    if (isNaN(updatedCost) || updatedCost <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost per unit",
        variant: "destructive",
      })
      return
    }

    updateCost(ingredient.id, updatedCost)

    toast({
      title: "Cost Updated",
      description: `Updated cost for ${ingredient.name} to $${updatedCost.toFixed(2)}/${ingredient.unit}. Kitchen recipes will reflect new costs.`,
    })

    setEditingIngredient(null)
    setNewCost("")
  }

  const handleStockUpdate = (ingredientId: number, quantity: number, type: "add" | "subtract") => {
    updateStock(ingredientId, quantity, type, "manual-adjustment")

    const ingredient = ingredients.find((i) => i.id === ingredientId)
    toast({
      title: "Stock Updated",
      description: `${ingredient?.name} stock ${type === "add" ? "increased" : "decreased"} by ${quantity} ${ingredient?.unit}. Recipe availability updated automatically.`,
    })
  }

  const getStockStatus = (ingredient: any) => {
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

  const lowStockCount = getLowStockItems().length
  const outOfStockCount = getOutOfStockItems().length

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Bell className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  {notification}
                </div>
              ))}
              {notifications.length > 3 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">+{notifications.length - 3} more alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-2xl font-bold">${getTotalValue().toFixed(2)}</p>
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
              Add New Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="stock">Stock & Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ingredient-name">Ingredient Name *</Label>
                    <Input
                      id="ingredient-name"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                      placeholder="Enter ingredient name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ingredient-category">Category *</Label>
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
                        <SelectItem value="Oils & Condiments">Oils & Condiments</SelectItem>
                        <SelectItem value="Seasonings">Seasonings</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Fruits">Fruits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ingredient-unit">Unit of Measurement *</Label>
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
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Primary Supplier</Label>
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
                </div>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost-per-unit">Cost per Unit ($) *</Label>
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
                    <Label htmlFor="current-stock">Initial Stock Quantity</Label>
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
                    <Label htmlFor="threshold">Low Stock Alert Threshold</Label>
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

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Automatic Integration</h4>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Once added, this ingredient will be automatically available in the Kitchen module for recipe
                    creation. Any recipes using this ingredient will automatically calculate availability based on
                    current stock levels.
                  </p>
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
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
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
                      <div className="flex gap-2">
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
                              <DialogTitle>Update {ingredient.name}</DialogTitle>
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
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleStockUpdate(ingredient.id, 10, "add")}>
                                  Add 10 {ingredient.unit}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleStockUpdate(ingredient.id, 5, "subtract")}
                                >
                                  Remove 5 {ingredient.unit}
                                </Button>
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
                      </div>
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
