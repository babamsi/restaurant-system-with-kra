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
import { useSuppliers } from "@/hooks/use-suppliers"
import { supplierNames } from "@/data/mock-data"
import type { BaseIngredient } from "@/types/operational"
import { ReceiptUploadDialog } from "./receipt-upload-dialog"
import type { ReceiptItem } from "./receipt-upload-dialog"
import { SupplierReceiptUploadDialog } from "./supplier-receipt-upload-dialog"
import { SupplierReceiptsList } from "./supplier-receipts-list"
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
import { inventoryService } from "@/lib/inventory-service"
import { SupplierSelector } from "@/components/suppliers/supplier-selector"

// Database ingredient type
interface DatabaseIngredient {
  id: string
  name: string
  description: string | null
  category: string
  unit: string
  supplier_id: string | null
  current_stock: number
  minimum_stock: number
  maximum_stock: number | null
  reorder_point: number
  cost_per_unit: number
  selling_price: number | null
  markup_percentage: number | null
  calories_per_unit: number | null
  protein_per_unit: number | null
  carbs_per_unit: number | null
  fat_per_unit: number | null
  fiber_per_unit: number | null
  sodium_per_unit: number | null
  is_sellable_individually: boolean
  is_cooked: boolean
  is_active: boolean
  is_perishable: boolean
  expiry_date: string | null
  barcode: string | null
  sku: string | null
  notes: string | null
  created_at: string
  updated_at: string
  suppliers?: { name: string; contact_person: string | null }
}

// System log type
interface SystemLog {
  id: string
  type: string
  action: string
  details: string
  status: string
  entity_type: string | null
  entity_id: string | null
  user_id: string | null
  created_at: string
}

export function SynchronizedInventoryManager() {
  const { toast } = useToast()
  const { suppliers: allSuppliers, getSupplierById } = useSuppliers()
  
  // State for database operations
  const [ingredients, setIngredients] = useState<DatabaseIngredient[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingIngredient, setIsAddingIngredient] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<DatabaseIngredient | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [newCost, setNewCost] = useState("")
  const [notifications, setNotifications] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [selectedIngredientLogs, setSelectedIngredientLogs] = useState<SystemLog[]>([])
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [showSupplierReceiptUpload, setShowSupplierReceiptUpload] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<DatabaseIngredient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<Partial<DatabaseIngredient>>({
    name: "",
    category: "",
    unit: "",
    cost_per_unit: 0,
    current_stock: 0,
    reorder_point: 10,
    description: "",
    supplier_id: "",
  })

  // Get suppliers for the selected category
  const categorySuppliers = allSuppliers.filter(supplier => supplier.status === 'active')

  // Get unique categories and supplier IDs for filters
  const categories = Array.from(new Set(ingredients.map(i => i.category || 'Uncategorized')))
  const supplierIds = Array.from(new Set(ingredients.map(i => i.supplier_id).filter(Boolean) as string[]))

  // Filter ingredients based on all criteria
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || !selectedCategory || ingredient.category === selectedCategory
    const matchesSupplier = selectedSupplier === "all" || !selectedSupplier || ingredient.supplier_id === selectedSupplier
    const matchesStatus = selectedStatus === "all" || !selectedStatus || (
      selectedStatus === "out_of_stock" && ingredient.current_stock === 0 ||
      selectedStatus === "low_stock" && ingredient.current_stock <= ingredient.reorder_point ||
      selectedStatus === "in_stock" && ingredient.current_stock > ingredient.reorder_point
    )

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
  })

  // Load ingredients from database
  const loadIngredients = async () => {
    try {
      setLoading(true)
      const result = await inventoryService.getIngredients()
      if (result.success) {
        setIngredients(result.data)
        updateNotifications(result.data)
      } else {
        toast({
          title: "Error Loading Ingredients",
          description: result.error || "Failed to load ingredients",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Ingredients",
        description: "Failed to load ingredients from database",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update notifications based on current ingredients
  const updateNotifications = (currentIngredients: DatabaseIngredient[]) => {
    const lowStock = currentIngredients.filter(
      item => item.current_stock <= item.reorder_point && item.current_stock > 0
    )
    const outOfStock = currentIngredients.filter(item => item.current_stock === 0)

    const newNotifications = [
      ...lowStock.map((item) => `${item.name} is running low (${item.current_stock} ${item.unit} remaining)`),
      ...outOfStock.map((item) => `${item.name} is out of stock`),
    ]

    setNotifications(newNotifications)
  }

  // Load ingredients on component mount
  useEffect(() => {
    loadIngredients()
  }, [])

  const handleAddIngredient = async () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit || !newIngredient.supplier_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including supplier.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(newIngredient)
      const result = await inventoryService.createIngredient({
        name: newIngredient.name,
        category: newIngredient.category,
        unit: newIngredient.unit,
        supplier_id: newIngredient.supplier_id,
        current_stock: newIngredient.current_stock || 0,
        minimum_stock: newIngredient.reorder_point || 10,
        reorder_point: newIngredient.reorder_point || 10,
        cost_per_unit: newIngredient.cost_per_unit || 0,
        is_active: true,
        is_sellable_individually: true,
      })

      if (result.success) {
        toast({
          title: "Ingredient Added",
          description: `${newIngredient.name} has been added to inventory.`,
        })
        
        // Reset form
        setIsAddingIngredient(false)
        setNewIngredient({
          name: "",
          category: "",
          unit: "",
          cost_per_unit: 0,
          current_stock: 0,
          reorder_point: 10,
          description: "",
          supplier_id: "",
        })
        
        // Reload ingredients
        await loadIngredients()
      } else {
        toast({
          title: "Error Adding Ingredient",
          description: result.error || "Failed to add ingredient",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Adding Ingredient",
        description: "Failed to add ingredient to database",
        variant: "destructive",
      })
    }
  }

  const handleCostUpdate = async (ingredient: DatabaseIngredient) => {
    const updatedCost = Number.parseFloat(newCost)
    if (isNaN(updatedCost) || updatedCost <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost per unit",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await inventoryService.updateCost(ingredient.id, updatedCost)
      if (result.success) {
        toast({
          title: "Cost Updated",
          description: `Updated cost for ${ingredient.name} to Ksh ${updatedCost.toFixed(2)}/${ingredient.unit}.`,
        })
        setEditingIngredient(null)
        setNewCost("")
        await loadIngredients()
      } else {
        toast({
          title: "Error Updating Cost",
          description: result.error || "Failed to update cost",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Updating Cost",
        description: "Failed to update cost in database",
        variant: "destructive",
      })
    }
  }

  const handleStockUpdate = async (ingredientId: string, quantity: number, type: "add" | "subtract") => {
    try {
      const result = await inventoryService.updateStock(ingredientId, quantity, type, "manual-adjustment")
      if (result.success) {
        const ingredient = ingredients.find((i) => i.id === ingredientId)
        toast({
          title: "Stock Updated",
          description: `${ingredient?.name} stock ${type === "add" ? "increased" : "decreased"} by ${quantity} ${ingredient?.unit}.`,
        })
        await loadIngredients()
      } else {
        toast({
          title: "Error Updating Stock",
          description: result.error || "Failed to update stock",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Updating Stock",
        description: "Failed to update stock in database",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (ingredient: DatabaseIngredient) => {
    if (ingredient.current_stock === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (ingredient.current_stock <= ingredient.reorder_point) {
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

  const lowStockCount = ingredients.filter(
    item => item.current_stock <= item.reorder_point && item.current_stock > 0
  ).length
  const outOfStockCount = ingredients.filter(item => item.current_stock === 0).length

  const handleViewLogs = async (ingredientId: string) => {
    try {
      const result = await inventoryService.getIngredientLogs(ingredientId)
      if (result.success) {
        setSelectedIngredientLogs(result.data)
        setShowLogs(true)
      } else {
        toast({
          title: "Error Loading Logs",
          description: result.error || "Failed to load logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Logs",
        description: "Failed to load logs from database",
        variant: "destructive",
      })
    }
  }

  const handleProcessReceipt = async (items: ReceiptItem[]) => {
    try {
      for (const item of items) {
        if (item.matches) {
          // Update existing ingredient
          await inventoryService.updateStock(
            item.matches.id,
            item.quantity,
            "add",
            "receipt-upload"
          )
          if (item.cost_per_unit !== item.matches.cost_per_unit) {
            await inventoryService.updateCost(item.matches.id, item.cost_per_unit)
          }
        } else {
          // Add new ingredient - you'll need to implement this based on your category/unit mapping
          toast({
            title: "New Ingredient",
            description: `Please add ${item.name} manually as it's not in the system.`,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Receipt Processed",
        description: "Inventory has been updated with the receipt items.",
      })
      
      await loadIngredients()
    } catch (error) {
      toast({
        title: "Error Processing Receipt",
        description: "Failed to process receipt",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (ingredient: DatabaseIngredient) => {
    setIngredientToDelete(ingredient)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!ingredientToDelete) return

    try {
      const result = await inventoryService.deleteIngredient(ingredientToDelete.id)
      if (result.success) {
        toast({
          title: "Ingredient Deleted",
          description: `${ingredientToDelete.name} has been removed from inventory.`,
        })
        setShowDeleteDialog(false)
        setIngredientToDelete(null)
        await loadIngredients()
      } else {
        toast({
          title: "Error Deleting Ingredient",
          description: result.error || "Failed to delete ingredient",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Deleting Ingredient",
        description: "Failed to delete ingredient from database",
        variant: "destructive",
      })
    }
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = getSupplierById(supplierId)
    return supplier ? supplier.name : "Unknown Supplier"
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedSupplier("all")
    setSelectedStatus("all")
  }

  // Calculate total inventory value
  const getTotalValue = () => {
    return ingredients.reduce((sum, ingredient) => 
      sum + (ingredient.current_stock * ingredient.cost_per_unit), 0
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading ingredients...</p>
        </div>
      </div>
    )
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
                <p className="text-2xl font-bold">Ksh {getTotalValue().toFixed(2)}</p>
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
        <BulkInventoryUpdate onInventoryUpdated={loadIngredients} />
        <SupplierReceiptsList />
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
                    setEditingIngredient((prev: DatabaseIngredient | null) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editingIngredient?.category || ""}
                  disabled
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
                          const difference = quantity - editingIngredient.current_stock
                          handleStockUpdate(editingIngredient.id, Math.abs(difference), difference > 0 ? "add" : "subtract")
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
                  disabled
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
                    setEditingIngredient((prev: DatabaseIngredient | null) =>
                      prev ? { ...prev, cost_per_unit: parseFloat(e.target.value) || 0 } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder Point</Label>
                <Input
                  type="number"
                  value={editingIngredient?.reorder_point || ""}
                  onChange={(e) =>
                    setEditingIngredient((prev: DatabaseIngredient | null) =>
                      prev ? { ...prev, reorder_point: parseFloat(e.target.value) || 0 } : null
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
                onClick={async () => {
                  if (editingIngredient) {
                    try {
                      const result = await inventoryService.updateIngredient(editingIngredient.id, {
                        name: editingIngredient.name,
                        cost_per_unit: editingIngredient.cost_per_unit,
                        reorder_point: editingIngredient.reorder_point,
                      })
                      
                      if (result.success) {
                        toast({
                          title: "Ingredient Updated",
                          description: `${editingIngredient.name} has been updated.`,
                        })
                        setEditingIngredient(null)
                        await loadIngredients()
                      } else {
                        toast({
                          title: "Error Updating Ingredient",
                          description: result.error || "Failed to update ingredient",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Error Updating Ingredient",
                        description: "Failed to update ingredient in database",
                        variant: "destructive",
                      })
                    }
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>Inventory Change History</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
            {selectedIngredientLogs.length === 0 ? (
              <p className="text-center text-muted-foreground">No changes recorded</p>
            ) : (
              <div className="space-y-2">
                {selectedIngredientLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-sm mt-2">{log.details}</p>
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
          <Button variant="outline" onClick={() => setShowSupplierReceiptUpload(true)}>
            <Receipt className="h-4 w-4 mr-2" />
            New Receipt
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
                          <SelectItem value="proteins">Proteins</SelectItem>
                          <SelectItem value="meats">Meats</SelectItem>
                          <SelectItem value="drinks">Drinks</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="grains">Grains</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="spices">Spices</SelectItem>
                          <SelectItem value="oils">Oils</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="dishes">Dishes</SelectItem>
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
                          <SelectItem value="bunch">Bunch</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                          <SelectItem value="punnet">Punnet</SelectItem>
                          <SelectItem value="tray">Tray</SelectItem>
                          <SelectItem value="bag">Bag</SelectItem>
                          {/* <SelectItem value="tablespoon">Tablespoon</SelectItem> */}
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
                        value={newIngredient.current_stock}
                        onChange={(e) => setNewIngredient({ ...newIngredient, current_stock: parseFloat(e.target.value) || 0 })}
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
                      value={newIngredient.reorder_point}
                      onChange={(e) => setNewIngredient({ ...newIngredient, reorder_point: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter low stock threshold"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <SupplierSelector
                  value={newIngredient.supplier_id || ""}
                  onValueChange={(value) =>
                    setNewIngredient((prev) => ({ ...prev, supplier_id: value }))
                  }
                  placeholder="Select supplier"
                  showAddButton={true}
                />
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

      {/* Supplier Receipt Upload Dialog */}
      <SupplierReceiptUploadDialog
        open={showSupplierReceiptUpload}
        onOpenChange={setShowSupplierReceiptUpload}
        onReceiptUploaded={(receiptId) => {
          toast({
            title: "Receipt Uploaded",
            description: "Supplier receipt has been uploaded successfully.",
          })
        }}
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
                      <TableCell>{getSupplierName(ingredient.supplier_id || '')}</TableCell>
                      <TableCell>
                        {ingredient.current_stock}
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>Ksh {ingredient.cost_per_unit.toFixed(2)}</TableCell>
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
                            onClick={() => handleViewLogs(ingredient.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingIngredient(ingredient)
                              setEditQuantity(ingredient.current_stock.toString())
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
