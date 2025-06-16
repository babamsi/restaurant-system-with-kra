"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, Edit, AlertTriangle, Package, TrendingUp, Bell, CheckCircle, History, Receipt, Trash2, Edit2, Upload, Search, Filter, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useSupplierStore } from "@/stores/supplier-store"
import { supplierNames } from "@/data/mock-data"
import type { BaseIngredient } from "@/types/operational"
import type { InventoryLog } from "@/stores/synchronized-inventory-store"
import { ReceiptUploadDialog } from "./receipt-upload-dialog"
import type { ReceiptItem } from "./receipt-upload-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ReceiptList } from "./receipt-list"
import { BulkInventoryUpdate } from "./bulk-inventory-update"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    getIngredientLogs,
    deleteIngredient,
  } = useSynchronizedInventoryStore()

  const { suppliers: allSuppliers, getSuppliersByCategory } = useSupplierStore()
  const [isAddingIngredient, setIsAddingIngredient] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<BaseIngredient | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [newCost, setNewCost] = useState("")
  const [notifications, setNotifications] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [selectedIngredientLogs, setSelectedIngredientLogs] = useState<InventoryLog[]>([])
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<BaseIngredient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<Partial<BaseIngredient>>({
    name: "",
    category: "",
    unit: "",
    cost_per_unit: 0,
    available_quantity: 0,
    threshold: 10,
    description: "",
    supplier_id: "",
  })

  // Get suppliers for the selected category
  const categorySuppliers = newIngredient.category
    ? getSuppliersByCategory(newIngredient.category)
    : allSuppliers

  // Get unique categories and supplier IDs for filters
  const categories = Array.from(new Set(ingredients.map(i => i.category)))
  const supplierIds = Array.from(new Set(ingredients.map(i => i.supplier_id)))

  // Filter ingredients based on all criteria
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || !selectedCategory || ingredient.category === selectedCategory
    const matchesSupplier = selectedSupplier === "all" || !selectedSupplier || ingredient.supplier_id === selectedSupplier
    const matchesStatus = selectedStatus === "all" || !selectedStatus || (
      selectedStatus === "out_of_stock" && ingredient.available_quantity === 0 ||
      selectedStatus === "low_stock" && ingredient.available_quantity <= ingredient.threshold ||
      selectedStatus === "in_stock" && ingredient.available_quantity > ingredient.threshold
    )

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
  })

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useSynchronizedInventoryStore.subscribe(
      (state: { ingredients: BaseIngredient[] }) => state.ingredients,
      (ingredients: BaseIngredient[]) => {
        // Update notifications when ingredients change
        const lowStock = getLowStockItems()
        const outOfStock = getOutOfStockItems()

        const newNotifications = [
          ...lowStock.map((item: BaseIngredient) => `${item.name} is running low (${item.available_quantity} ${item.unit} remaining)`),
          ...outOfStock.map((item: BaseIngredient) => `${item.name} is out of stock`),
        ]

        setNotifications(newNotifications)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit || !newIngredient.supplier_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including supplier.",
        variant: "destructive",
      })
      return
    }

    addIngredient({
      name: newIngredient.name,
      category: newIngredient.category,
      unit: newIngredient.unit,
      cost_per_unit: newIngredient.cost_per_unit || 0,
      available_quantity: newIngredient.available_quantity || 0,
      threshold: newIngredient.threshold || 10,
      description: newIngredient.description || "",
      supplier_id: newIngredient.supplier_id,
    })

    setIsAddingIngredient(false)
    setNewIngredient({
      name: "",
      category: "",
      unit: "",
      cost_per_unit: 0,
      available_quantity: 0,
      threshold: 10,
      description: "",
      supplier_id: "",
    })
  }

  const handleCostUpdate = (ingredient: BaseIngredient) => {
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

  const handleStockUpdate = (ingredientId: string, quantity: number, type: "add" | "subtract") => {
    updateStock(ingredientId, quantity, type, "manual-adjustment")

    const ingredient = ingredients.find((i) => i.id === ingredientId)
    toast({
      title: "Stock Updated",
      description: `${ingredient?.name} stock ${type === "add" ? "increased" : "decreased"} by ${quantity} ${ingredient?.unit}. Recipe availability updated automatically.`,
    })
  }

  const getStockStatus = (ingredient: BaseIngredient) => {
    if (ingredient.available_quantity === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (ingredient.available_quantity <= ingredient.threshold) {
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

  const handleViewLogs = (ingredientId: string) => {
    const logs = getIngredientLogs(ingredientId)
    setSelectedIngredientLogs(logs)
    setShowLogs(true)
  }

  const handleProcessReceipt = (items: ReceiptItem[]) => {
    items.forEach((item) => {
      if (item.matches) {
        // Update existing ingredient
        updateStock(
          item.matches.id,
          item.quantity,
          "add",
          "receipt-upload"
        )
        if (item.cost_per_unit !== item.matches.cost_per_unit) {
          updateCost(item.matches.id, item.cost_per_unit)
        }
      } else {
        // Add new ingredient
        addIngredient({
          name: item.name,
          category: "Uncategorized", // Default category
          unit: item.unit,
          cost_per_unit: item.cost_per_unit,
          available_quantity: item.quantity,
          threshold: Math.ceil(item.quantity * 0.2), // Default threshold as 20% of initial quantity
          description: `Added from receipt upload on ${new Date().toLocaleDateString()}`,
          supplier_id: "", // Assuming no supplier for default category
        })
      }
    })

    toast({
      title: "Receipt Processed",
      description: "Inventory has been updated with the receipt items.",
    })
  }

  const handleDeleteClick = (ingredient: BaseIngredient) => {
    setIngredientToDelete(ingredient)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (ingredientToDelete) {
      deleteIngredient(ingredientToDelete.id)
      toast({
        title: "Ingredient Deleted",
        description: `${ingredientToDelete.name} has been removed from inventory.`,
      })
      setShowDeleteDialog(false)
      setIngredientToDelete(null)
    }
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = allSuppliers.find((s) => s.id === supplierId)
    return supplier ? supplier.name : "Unknown Supplier"
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedSupplier("all")
    setSelectedStatus("all")
  }

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

      {/* Bulk Update and Receipt List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BulkInventoryUpdate />
        <ReceiptList />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {supplierIds.map(supplierId => (
                  <SelectItem key={supplierId} value={supplierId}>
                    {getSupplierName(supplierId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all" || selectedSupplier !== "all" || selectedStatus !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedCategory !== "all" || selectedSupplier !== "all" || selectedStatus !== "all") && (
          <div className="flex flex-wrap gap-2 text-sm">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {selectedCategory}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCategory("all")}
                />
              </Badge>
            )}
            {selectedSupplier !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Supplier: {getSupplierName(selectedSupplier)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedSupplier("all")}
                />
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {selectedStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedStatus("all")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

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
                          updateStock(editingIngredient.id, Math.abs(difference), difference > 0 ? "add" : "subtract")
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

      {/* Add Ingredient Dialog */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ingredient Inventory</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReceiptUpload(true)}>
            <Receipt className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
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
                          <SelectItem value="Spices">Spices</SelectItem>
                          <SelectItem value="Oils">Oils</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ingredient-unit">Unit *</Label>
                      <Select
                        value={newIngredient.unit}
                        onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="L">Liters (L)</SelectItem>
                          <SelectItem value="ml">Milliliters (ml)</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stock" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ingredient-cost">Cost per Unit *</Label>
                      <Input
                        id="ingredient-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newIngredient.cost_per_unit}
                        onChange={(e) => setNewIngredient({ ...newIngredient, cost_per_unit: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter cost per unit"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ingredient-stock">Initial Stock *</Label>
                      <Input
                        id="ingredient-stock"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newIngredient.available_quantity}
                        onChange={(e) => setNewIngredient({ ...newIngredient, available_quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter initial stock"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ingredient-threshold">Low Stock Threshold *</Label>
                    <Input
                      id="ingredient-threshold"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newIngredient.threshold}
                      onChange={(e) => setNewIngredient({ ...newIngredient, threshold: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter low stock threshold"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={newIngredient.supplier_id}
                  onValueChange={(value) =>
                    setNewIngredient((prev) => ({ ...prev, supplier_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorySuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddingIngredient(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIngredient}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Ingredient
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Receipt Upload Dialog */}
      <ReceiptUploadDialog
        open={showReceiptUpload}
        onOpenChange={setShowReceiptUpload}
        onProcessReceipt={handleProcessReceipt}
      />

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ingredient) => {
                  const status = getStockStatus(ingredient)
                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>{ingredient.category}</TableCell>
                      <TableCell>{getSupplierName(ingredient.supplier_id)}</TableCell>
                      <TableCell>
                        {ingredient.available_quantity}
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>${ingredient.cost_per_unit.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className={status.className}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(ingredient)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{ingredientToDelete?.name}</span> from the
              inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
