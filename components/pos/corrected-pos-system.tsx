"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  History,
  Settings,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  FileText,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore, useCompletePOSStore as usePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import type { MenuItem, CartItem } from "@/types/unified-system"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface TableState {
  id: number
  number: string
  status: "available" | "occupied" | "needs-cleaning"
  orderId?: string
  pax: number
}

interface Recipe {
  id: string
  name: string
  description?: string
  restaurant: 'Omel Dunia' | 'Mamma Mia'
  price?: number
  category?: string
  components: RecipeComponent[]
  available: boolean
}

interface RecipeComponent {
  component_id: string
  component_type: 'ingredient' | 'batch'
  quantity: number
  unit: string
  name: string
}

interface ExtendedMenuItem extends MenuItem {
  restaurant?: 'Omel Dunia' | 'Mamma Mia'
}

export function CorrectedPOSSystem() {
  const { toast } = useToast()
  const {
    menuItems,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateOrder,
    getCartTotal,
    getCartItemCount,
    getAvailableMenuItems,
    loadCart,
    updateOrderStatus,
  } = useCompletePOSStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedRestaurant, setSelectedRestaurant] = useState<"all" | "Omel Dunia" | "Mamma Mia">("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showHistory, setShowHistory] = useState(false)
  const { orders: allOrders } = useOrdersStore()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["All"])

  const [tables, setTables] = useState<TableState[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      number: `T${i + 1}`,
      status: "available",
      pax: 0,
    })),
  )
  const [selectedTable, setSelectedTable] = useState<TableState | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<{ menuItem: ExtendedMenuItem; portionSize?: string } | null>(null)
  const [customizationNotes, setCustomizationNotes] = useState("")

  const [showTableOptions, setShowTableOptions] = useState<null | TableState>(null)
  const [showPayment, setShowPayment] = useState<null | { table: TableState; orderId: string }>(null)
  const [existingOrderItems, setExistingOrderItems] = useState<CartItem[]>([])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const { data: recipesData } = await supabase.from("recipes").select("*")
      if (!recipesData) {
        setRecipes([])
        setLoading(false)
        return
      }
      
      const allRecipes = await Promise.all(recipesData.map(async (recipe) => {
        const { data: components } = await supabase
          .from("recipe_components")
          .select("*")
          .eq("recipe_id", recipe.id)
        
        const resolvedComponents = await Promise.all((components || []).map(async (c) => {
          if (c.component_type === "ingredient") {
            const { data: ing } = await supabase.from("ingredients").select("name, unit").eq("id", c.component_id).single()
            return { ...c, name: ing?.name || "Unknown", unit: c.unit || ing?.unit, type: "ingredient", available: true }
          } else {
            const { data: batch } = await supabase.from("batches").select("name, yield_unit").eq("id", c.component_id).single()
            return { ...c, name: batch?.name || "Unknown", unit: c.unit || batch?.yield_unit, type: "batch", available: true }
          }
        }))
        
        return {
          ...recipe,
          components: resolvedComponents,
          available: true,
        }
      }))
      
      setRecipes(allRecipes)
      
      const uniqueCategories = ["All", ...Array.from(new Set(allRecipes.map(r => r.category).filter(Boolean)))]
      setCategories(uniqueCategories)
      
    } catch (error) {
      console.error("Error fetching recipes:", error)
      toast({
        title: "Error Loading Recipes",
        description: "Failed to load recipes from database",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  const recipesAsMenuItems: ExtendedMenuItem[] = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    price: recipe.price || 0,
    category: recipe.category || "Uncategorized",
    available_quantity: recipe.available ? 999 : 0,
    description: recipe.description || "",
    type: "recipe" as const,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    unit: "portion",
    inventory_deduction: undefined,
    restaurant: recipe.restaurant,
  }))

  const filteredRecipes = recipesAsMenuItems.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory
    const matchesRestaurant = selectedRestaurant === "all" || recipe.restaurant === selectedRestaurant
    
    return matchesSearch && matchesCategory && matchesRestaurant
  })

  const groupedRecipes = filteredRecipes.reduce((acc, recipe) => {
    const category = recipe.category || "Uncategorized"
    if (!acc[category]) acc[category] = []
    acc[category].push(recipe)
    return acc
  }, {} as Record<string, ExtendedMenuItem[]>)

  const handleOpenCustomization = (menuItem: ExtendedMenuItem, portionSize?: string) => {
    setCustomizingItem({ menuItem, portionSize })
    setIsCustomizing(true)
  }

  const handleConfirmAddToCart = () => {
    if (!customizingItem) return

    const { menuItem, portionSize } = customizingItem
    let displayText = menuItem.name
    if (portionSize) displayText = `${portionSize} ${menuItem.name}`

    const cartItemId = `${menuItem.id}${portionSize ? `-${portionSize}` : ""}${
      customizationNotes ? `-${customizationNotes}` : ""
    }`

    addToCart(menuItem, 1, {
      id: cartItemId,
      portionSize,
      customization: customizationNotes,
    })

    toast({
      title: "Added to Order",
      description: displayText + (customizationNotes ? ` (${customizationNotes})` : ""),
      duration: 500,
    })

    setIsCustomizing(false)
    setCustomizingItem(null)
    setCustomizationNotes("")
  }

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Order", description: "Please add items to place an order", variant: "destructive" })
      return
    }

    const orderData = {
      items: cart,
      tableNumber: selectedTable?.number,
      order_type: "dine-in" as const,
      subtotal: getCartTotal(),
      tax: getCartTotal() * 0.16,
      total: getCartTotal() * 1.16,
      status: "pending" as const,
    }

    if (editingOrderId) {
      // When adding more orders, update the existing order with combined items
      const existingOrder = allOrders.find((o) => o.id === editingOrderId)
      if (existingOrder) {
        // Combine existing items with new cart items
        const existingCartItems = existingOrder.items.map(item => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: item.name,
          type: "recipe" as const,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          unit: "portion",
          portionSize: item.portionSize,
          customization: item.customization,
          total_nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sodium: 0,
          },
          inventory_deduction: undefined,
        }))
        
        const mergedItems = [...existingCartItems, ...cart]
        const mergedSubtotal = mergedItems.reduce((sum, item) => sum + item.total_price, 0)
        const mergedTax = mergedSubtotal * 0.16
        const mergedTotal = mergedSubtotal + mergedTax
        
        const updatedOrderData = {
          ...orderData,
          items: mergedItems,
          subtotal: mergedSubtotal,
          tax: mergedTax,
          total: mergedTotal,
        }
        
        updateOrder(editingOrderId, updatedOrderData)
        toast({ title: "Order Updated!", description: `Order for Table ${selectedTable?.number} has been updated with new items.` })
      } else {
        updateOrder(editingOrderId, orderData)
        toast({ title: "Order Updated!", description: `Order for Table ${selectedTable?.number} has been updated.` })
      }
    } else {
      const order = createOrder(orderData)
      if (selectedTable) {
        setTables((prevTables) =>
          prevTables.map((t) =>
            t.id === selectedTable.id ? { ...t, status: "occupied", orderId: order.id } : t,
          ),
        )
      }
      toast({ title: "Order Placed!", description: `Order ${order.id} for Table ${selectedTable?.number} has been sent to the kitchen.` })
    }
    
    handleCloseOrderModal()
  }

  const handleTableSelect = (table: TableState) => {
    if (table.orderId) {
      setShowTableOptions(table)
    } else {
      setEditingOrderId(null)
      setSelectedTable(table)
    }
  }

  const handleAddMoreOrders = () => {
    if (showTableOptions) {
      const table = showTableOptions
      const orderToLoad = allOrders.find((o) => o.id === table.orderId)
      
      if (orderToLoad) {
        // Load existing order items from the current order
        const existingCartItems: CartItem[] = orderToLoad.items
          .map((item) => {
            const recipe = recipes.find((r) => r.id === item.menu_item_id)
            if (!recipe) return undefined
            
            return {
              id: item.id,
              menu_item_id: recipe.id,
              name: recipe.name,
              type: "recipe" as const,
              unit_price: item.price,
              quantity: item.quantity,
              total_price: item.price * item.quantity,
              unit: "portion",
              portionSize: item.portionSize,
              customization: item.customization,
              total_nutrition: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sodium: 0,
              },
              inventory_deduction: undefined,
            } as CartItem
          })
          .filter((item): item is CartItem => item !== undefined)
        
        // Set existing order items to display separately from new cart items
        setExistingOrderItems(existingCartItems)
        setEditingOrderId(table.orderId || null)
      } else {
        setExistingOrderItems([])
        setEditingOrderId(null)
      }
      setSelectedTable(table)
      setShowTableOptions(null)
    }
  }

  const handleProceedToPayment = () => {
    if (showTableOptions && showTableOptions.orderId) {
      setShowPayment({ table: showTableOptions, orderId: showTableOptions.orderId })
      setShowTableOptions(null)
    }
  }

  const handleMarkAsPaid = () => {
    if (showPayment) {
      updateOrderStatus(showPayment.orderId, "completed")
      setTables((prev) =>
        prev.map((t) =>
          t.id === showPayment.table.id ? { ...t, status: "available", orderId: undefined } : t
        )
      )
      toast({ title: "Payment Complete", description: `Table ${showPayment.table.number} is now available.` })
      setShowPayment(null)
    }
  }

  const handleCloseOrderModal = () => {
    clearCart()
    setSelectedTable(null)
    setEditingOrderId(null)
    setExistingOrderItems([])
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Restaurant POS</h1>
            </div>
            <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
            {currentTime.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Order History
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const currentOrder = allOrders.find((o) => o.id === table.orderId)
            
            return (
            <Card 
              key={table.id}
              onClick={() => handleTableSelect(table)}
                className={`cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  table.status === "occupied"
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                    : "border-transparent bg-card"
                }`}
              >
                <CardContent className="p-4 flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-foreground">{table.number}</h3>
                <Badge 
                        variant={table.status === "occupied" ? "default" : "secondary"}
                        className={`capitalize transition-colors duration-300 ${
                          table.status === "occupied"
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                  }`}
                >
                  {table.status}
                </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {table.status === "occupied" ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{currentOrder ? `Order #${currentOrder.id.slice(-4)}` : "In Progress..."}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {table.status === "occupied" && currentOrder ? (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Total Due</p>
                        <p className="text-2xl font-bold text-primary">Ksh {currentOrder.total.toFixed(2)}</p>
                      </div>
                    ) : (
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm text-muted-foreground">Click to start order</p>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!showTableOptions} onOpenChange={(open) => !open && setShowTableOptions(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Table {showTableOptions?.number} Options</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Button size="lg" className="w-full" onClick={handleAddMoreOrders}>
              <Plus className="h-5 w-5 mr-2" /> Add More Orders
            </Button>
            <Button size="lg" className="w-full" variant="secondary" onClick={handleProceedToPayment}>
              <CheckCircle className="h-5 w-5 mr-2" /> Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPayment} onOpenChange={(open) => !open && setShowPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment for Table {showPayment?.table.number}</DialogTitle>
          </DialogHeader>
          {showPayment && (
            <div className="space-y-4">
              {(() => {
                const order = allOrders.find((o) => o.id === showPayment.orderId)
                if (!order) return <div>Order not found.</div>
                
                return (
                  <>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Order Total:</span>
                      <span>Ksh {order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name}{item.portionSize && ` (${item.portionSize})`}</span>
                          <span>x{item.quantity}</span>
                          <span>Ksh {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
              <Button className="w-full mt-4" onClick={handleMarkAsPaid}>
                <CheckCircle className="h-5 w-5 mr-2" /> Mark as Paid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTable} onOpenChange={(isOpen) => !isOpen && handleCloseOrderModal()}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {editingOrderId ? `Editing Order for Table ${selectedTable?.number}` : `New Order for Table ${selectedTable?.number}`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 p-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select value={selectedRestaurant} onValueChange={(value) => setSelectedRestaurant(value as "all" | "Omel Dunia" | "Mamma Mia")}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Restaurants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Restaurants</SelectItem>
                        <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                        <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search menu items..."
                        className="pl-10 w-96"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-muted/20">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading recipes...</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {Object.entries(groupedRecipes).map(([category, items]) => (
                      <div key={category} className="mb-8">
                        <h2 className="text-xl font-bold mb-2">{category}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {items.map(item => (
                            <Card
                              key={item.id}
                              className="overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:border-primary/70 border-2 border-transparent rounded-2xl bg-white dark:bg-card relative"
                            >
                              <CardContent className="p-0">
                                <div className="aspect-[4/3] bg-muted relative rounded-t-2xl overflow-hidden">
                                  {item.image ? (
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-4xl text-muted-foreground/30">
                                      🍽️
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                  <h3 className="absolute bottom-2 left-3 font-bold text-white text-lg drop-shadow-lg">
                                    {item.name}
                                  </h3>
                                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                                    {item.restaurant}
                                  </Badge>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xl text-primary">Ksh {item.price}</span>
                                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-[120px] text-right">{item.description}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full rounded-full"
                                    onClick={() => handleOpenCustomization(item)}
                                    disabled={item.available_quantity === 0}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add to Order
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedRecipes).length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg mb-2">No recipes found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="w-[380px] border-l border-border bg-card flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Current Order ({existingOrderItems.length > 0 ? `${existingOrderItems.length} previous items + ${getCartItemCount()} new` : getCartItemCount()})
                </h2>
                {editingOrderId && existingOrderItems.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Adding to existing orders for Table {selectedTable?.number}
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 && existingOrderItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="font-medium">No items in order</p>
                    <p className="text-sm">Select items from the menu to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingOrderItems.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Previous Order Items
                        </h3>
                        {existingOrderItems.map((item: CartItem) => (
                          <div key={`existing-${item.id}`} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                {item.portionSize && (
                                  <p className="text-xs text-muted-foreground capitalize">{item.portionSize}</p>
                                )}
                              </div>
                              <span className="font-medium text-sm">Ksh {item.total_price}</span>
                            </div>
                            {item.customization && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md my-2">
                                {item.customization}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                              <Badge variant="outline" className="text-xs">Previous</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {cart.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          New Items
                        </h3>
                        {cart.map((item: CartItem) => (
                          <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                {item.portionSize && (
                                  <p className="text-xs text-muted-foreground capitalize">{item.portionSize}</p>
                                )}
                              </div>
                              <span className="font-medium text-sm">Ksh {item.total_price}</span>
                            </div>
                            {item.customization && (
                              <p className="text-xs text-primary/80 bg-primary/10 p-1.5 rounded-md my-2">
                                {item.customization}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(cart.length > 0 || existingOrderItems.length > 0) && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                  {existingOrderItems.length > 0 && (
                    <div className="pb-2 border-b border-border">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Previous Order:</span>
                        <span>Ksh {existingOrderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  {cart.length > 0 && (
                    <div className="pb-2 border-b border-border">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>New Items:</span>
                        <span>Ksh {getCartTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal:</span>
                    <span>Ksh {(getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (16%):</span>
                    <span>Ksh {((getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)) * 0.16).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>Ksh {((getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)) * 1.16).toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {editingOrderId ? "Add to Order" : "Place Order"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Item</DialogTitle>
          </DialogHeader>
          {customizingItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{customizingItem.menuItem.name}</h3>
                {customizingItem.portionSize && (
                  <p className="text-sm text-muted-foreground capitalize">{customizingItem.portionSize}</p>
                )}
              </div>
              <Textarea
                placeholder="e.g., No onions, extra spicy..."
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddToCart}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Order #{order.id.slice(-4)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Table {order.tableNumber} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>x{item.quantity}</span>
                      <span>Ksh{(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>Ksh {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
