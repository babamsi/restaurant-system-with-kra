"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Clock,
  Activity,
  CheckCircle,
  Heart,
  Star,
  Filter,
  Leaf,
  Zap,
  Users,
  Table,
  QrCode,
  ArrowLeft,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { tableOrdersService } from "@/lib/database"
import Image from "next/image"

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

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total_price: number
  portionSize?: string
  customization?: string
  type: "recipe" | "individual"
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number }
  unit: string
  available_quantity: number
  description: string
  category: string
  restaurant?: 'Omel Dunia' | 'Mamma Mia'
}

export function CompleteCustomerPortal() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')
  const sessionId = searchParams.get('session')

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedRestaurant, setSelectedRestaurant] = useState<"all" | "Omel Dunia" | "Mamma Mia">("all")
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [tableInfo, setTableInfo] = useState<{ number: string; id: number } | null>(null)
  const [existingOrder, setExistingOrder] = useState<any>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingToExisting, setAddingToExisting] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showOrderStatus, setShowOrderStatus] = useState(false)

  // Recipe and cart state
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])

  // Customization state
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<CartItem | null>(null)
  const [customizationNotes, setCustomizationNotes] = useState("")

  // Check if this is a table-specific order
  const isTableOrder = !!tableId && !!sessionId

  // Fetch recipes from database
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
        title: "Error Loading Menu",
        description: "Failed to load menu from database",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  useEffect(() => {
    const initializeTableOrder = async () => {
      if (isTableOrder) {
        setLoading(true)
        try {
          // Get table information
          const tableNumber = `T${tableId}`
          setTableInfo({ number: tableNumber, id: parseInt(tableId) })
          
          // Check for existing order on this table
          const { data: existingOrderData } = await tableOrdersService.getActiveOrderByTable(parseInt(tableId))
          if (existingOrderData) {
            setExistingOrder(existingOrderData)
            toast({
              title: "Existing Order Found",
              description: `You have an active order on ${tableNumber}. You can add more items.`,
            })
          }
        } catch (error) {
          console.error("Error initializing table order:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initializeTableOrder()
  }, [tableId, sessionId, isTableOrder, toast])

  const recipesAsMenuItems: CartItem[] = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    price: recipe.price || 0,
    category: recipe.category || "Uncategorized",
    available_quantity: recipe.available ? 999 : 0,
    description: recipe.description || "",
    type: "recipe" as const,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    unit: "portion",
    restaurant: recipe.restaurant,
    quantity: 0,
    total_price: 0,
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
  }, {} as Record<string, CartItem[]>)

  const handleOpenCustomization = (menuItem: CartItem) => {
    setCustomizingItem(menuItem)
    setIsCustomizing(true)
  }

  const handleConfirmAddToCart = () => {
    if (!customizingItem) return

    let displayText = customizingItem.name
    const cartItemId = `${customizingItem.id}${customizationNotes ? `-${customizationNotes}` : ""}`

    const newCartItem: CartItem = {
      ...customizingItem,
      id: cartItemId,
      quantity: 1,
      total_price: customizingItem.price,
      customization: customizationNotes,
    }

    setCart(prev => [...prev, newCartItem])

    toast({
      title: "Added to Order",
      description: displayText + (customizationNotes ? ` (${customizationNotes})` : ""),
      duration: 500,
    })

    setIsCustomizing(false)
    setCustomizingItem(null)
    setCustomizationNotes("")
  }

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total_price: item.price * newQuantity }
        : item
    ))
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Remove or update getTotal function if not needed
  // function getTotal() { ... }

  const completeOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before ordering",
        variant: "destructive",
      })
      return
    }

    if (isTableOrder && !tableInfo) {
      toast({
        title: "Table Error",
        description: "Unable to identify table. Please scan the QR code again.",
        variant: "destructive",
      })
      return
    }

    setPlacingOrder(true)
    try {
      const cartItems = cart.map(item => ({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price,
        portion_size: item.portionSize,
        customization_notes: item.customization
      }))

      const subtotal = getCartTotal()
      const taxRate = 16 // 16% tax rate
      const taxAmount = subtotal * (taxRate / 100)
      const totalAmount = subtotal + taxAmount

      if (isTableOrder) {
        // Table-specific order
        if (existingOrder) {
          // Add to existing order
          const { data, error } = await tableOrdersService.addItemsToOrder(existingOrder.id, cartItems)
          if (error) {
            throw new Error(error)
          }
          toast({
            title: "Order Updated",
            description: `Added items to your order on ${tableInfo?.number}`,
            duration: 2000,
          })
        } else {
          // Create new table order
          const { data, error } = await tableOrdersService.createOrderWithItems({
            table_number: tableInfo!.number,
            table_id: tableInfo!.id,
            customer_name: customerName || undefined,
            order_type: "dine-in",
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            items: cartItems,
            session_id: sessionId!
          })
          if (error) {
            throw new Error(error)
          }
          setExistingOrder(data)
          toast({
            title: "Order Placed",
            description: `Your order has been placed for ${tableInfo?.number}`,
            duration: 2000,
          })
        }
      } else {
        // Regular online order (fallback)
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been received. You'll be notified when it's ready.",
        })
      }

    setShowCheckout(false)
    setShowCart(false)
      clearCart()
    setCustomerName("")
    setCustomerPhone("")
    } catch (error: any) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setPlacingOrder(false)
    }
  }

  // Helper to get readable status
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending (awaiting confirmation)';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup/Serving';
      case 'completed': return 'Completed';
      case 'paid': return 'Paid';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // Show order status after placing order or if there's an active order and not adding more
  useEffect(() => {
    if (existingOrder && !addingToExisting) {
      setShowOrderStatus(true)
    } else {
      setShowOrderStatus(false)
    }
  }, [existingOrder, addingToExisting])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Order Status Card (show after placing order or if there's an active order and not adding more) */}
      {showOrderStatus && isTableOrder && existingOrder && !addingToExisting && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-3 py-8">
          <Card className="w-full max-w-xs mx-auto shadow-lg border-yellow-300 border-2 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-yellow-600 animate-pulse" />
                <span className="font-semibold text-yellow-800 dark:text-yellow-200 text-base">
                  Order for <span className="font-bold">{tableInfo?.number}</span>
                </span>
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-200 mb-2">
                Status: <span className="font-semibold">{getOrderStatusLabel(existingOrder.status)}</span>
              </div>
              <div className="mb-3">
                <div className="font-semibold text-sm mb-1">Items in your order:</div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {existingOrder.items && existingOrder.items.length > 0 ? (
                    existingOrder.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/40 rounded px-2 py-1">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{item.menu_item_name}</span>
                          {item.portion_size && <span className="text-xs text-muted-foreground ml-1">({item.portion_size})</span>}
                          {item.customization_notes && <span className="block text-xs text-yellow-700 dark:text-yellow-200 italic">{item.customization_notes}</span>}
                        </div>
                        <span className="text-xs font-semibold">x{item.quantity}</span>
                        <span className="text-xs font-semibold ml-2">Ksh {item.total_price?.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No items in this order yet.</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  size="sm"
                  className="rounded-full px-4 py-1 text-xs h-9 bg-yellow-500 hover:bg-yellow-600 text-yellow-50 font-semibold"
                  onClick={() => { setAddingToExisting(true); setShowOrderStatus(false); }}
                >
                  Add More Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Dialog (placeholder, you can expand this as needed) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-xs w-full mx-auto rounded-xl p-0 overflow-hidden">
          <DialogHeader className="p-3 border-b">
            <DialogTitle>Payment Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Payment processing will be available soon. Please pay at the counter or ask a staff member.
            </div>
          <DialogFooter className="p-3 pt-0 flex gap-2">
            <Button onClick={() => setShowPaymentDialog(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipes, Cart, and Checkout (always show unless order just placed or user is viewing status) */}
      {(!showOrderStatus || addingToExisting || !isTableOrder) && (
        <>
          {/* Mobile Header */}
          <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-primary tracking-tight">Maamul Cafeteria</h1>
                {isTableOrder && tableInfo && (
                  <Badge variant="default" className="text-xs px-2 py-0.5">
                    <Table className="h-3 w-3 mr-1" />
                    {tableInfo.number}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="icon" className="relative rounded-full h-9 w-9 p-0" onClick={() => setShowCart(true)}>
                <ShoppingCart className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Table Order Info */}
          {isTableOrder && tableInfo && (
            <div className="bg-primary/10 border-b border-primary/20">
              <div className="px-3 py-2 text-xs flex items-center gap-2 justify-between">
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Users className="h-4 w-4" /> Table {tableInfo.number}
                </span>
                {existingOrder && (
                  <span className="flex items-center gap-1 text-green-700">
                    <Activity className="h-3 w-3" /> Order: #{existingOrder.id.slice(-6)}
                  </span>
                )}
                <span className="text-muted-foreground">Scan QR to order</span>
        </div>
      </div>
          )}

          {/* Mobile Filters */}
          <div className="bg-white dark:bg-gray-900 border-b sticky top-[48px] z-10">
            <div className="p-3 flex items-center gap-2 flex-wrap">
              <Select value={selectedRestaurant} onValueChange={(value) => setSelectedRestaurant(value as "all" | "Omel Dunia" | "Mamma Mia")}>
                <SelectTrigger className="w-28 text-xs h-8">
                  <SelectValue placeholder="Restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                  <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
                </SelectContent>
              </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-28 text-xs h-8">
                  <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <div className="relative flex-1 min-w-[120px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu..."
                  className="pl-9 text-xs h-8 rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <div className="flex-1 overflow-auto p-2 bg-muted/20">
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
                  <div key={category} className="mb-4">
                    <h2 className="text-base font-semibold mb-2 px-1 text-primary/80 tracking-tight">{category}</h2>
                    <div className="flex flex-col gap-2">
                      {items.map(item => (
                        <Card
                          key={item.id}
                          className="overflow-hidden group border border-border rounded-xl bg-white dark:bg-card shadow-sm"
                        >
                          <CardContent className="p-0 flex items-center gap-3">
                            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-muted rounded-l-xl">
                              <span className="text-3xl text-muted-foreground/30">🍽️</span>
                    </div>
                            <div className="flex-1 py-2 pr-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-base text-primary line-clamp-1">{item.name}</span>
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 ml-2">{item.restaurant}</Badge>
                  </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{item.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-lg text-primary">Ksh {item.price}</span>
                      <Button
                        size="sm"
                                  className="rounded-full px-4 py-1 text-xs h-8"
                                  onClick={() => handleOpenCustomization(item)}
                        disabled={item.available_quantity === 0}
                      >
                                  <Plus className="h-4 w-4 mr-1" />Add
                      </Button>
                    </div>
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

          {/* Cart & Checkout Dialog: single step */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
            <DialogContent className="max-w-xs w-full mx-auto rounded-xl p-0 overflow-hidden">
              <DialogHeader className="p-3 border-b">
                <DialogTitle>
                  <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
                    Your Order
                    {isTableOrder && tableInfo && (
                      <Badge variant="outline" className="ml-2">
                        {tableInfo.number}
                      </Badge>
                    )}
                  </div>
            </DialogTitle>
          </DialogHeader>
              <div className="space-y-3 p-3">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                    <div className="space-y-2 max-h-56 overflow-auto">
                  {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Ksh {item.price.toFixed(2)} × {item.quantity}
                            </p>
                            {item.customization && (
                              <p className="text-xs text-primary/80 bg-primary/10 p-1 rounded mt-1">
                                {item.customization}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-sm">Ksh {item.total_price.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal (before VAT):</span>
                        <span>Ksh {(getCartTotal() / 1.16).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tax (16% VAT, included):</span>
                        <span>Ksh {(getCartTotal() * 0.16 / 1.16).toFixed(2)}</span>
                    </div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span className="font-bold">Ksh {getCartTotal().toFixed(2)}</span>
                    </div>
                    </div>
                    {/* Single step checkout: name/phone and place order */}
                    {!existingOrder && (
                      <>
                        <div>
                          <label className="text-xs font-medium">Name (Optional)</label>
                          <Input
                            placeholder="Your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="h-8 text-xs"
                          />
                  </div>
                        <div>
                          <label className="text-xs font-medium">Phone (Optional)</label>
                          <Input
                            placeholder="Your phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="h-8 text-xs"
                          />
                </div>
                      </>
                    )}
                    <Button 
                      className="w-full mt-2" 
                      onClick={async () => {
                        await completeOrder();
                        setShowCart(false);
                        setShowOrderStatus(true);
                        setAddingToExisting(false);
                      }}
                      disabled={placingOrder}
                    >
                      {placingOrder ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Placing...
                        </span>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isTableOrder ? "Place Table Order" : "Place Order"}
                        </>
                      )}
                  </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

          {/* Customization Dialog */}
          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
            <DialogContent className="max-w-xs w-full mx-auto rounded-xl p-0 overflow-hidden">
              <DialogHeader className="p-3 border-b">
                <DialogTitle>Customize Item</DialogTitle>
          </DialogHeader>
              <div className="p-3">
                {customizingItem && (
            <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-base">{customizingItem.name}</h3>
                      {customizingItem.portionSize && (
                        <p className="text-xs text-muted-foreground capitalize">{customizingItem.portionSize}</p>
                      )}
                    </div>
                    <Textarea
                      placeholder="e.g., No onions, extra spicy..."
                      value={customizationNotes}
                      onChange={(e) => setCustomizationNotes(e.target.value)}
                      rows={3}
                      className="text-xs"
              />
            </div>
                )}
              </div>
              <DialogFooter className="p-3 pt-0 flex gap-2">
                <Button variant="ghost" onClick={() => setIsCustomizing(false)} className="flex-1">
                Cancel
              </Button>
                <Button onClick={handleConfirmAddToCart} className="flex-1">Add to Order</Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
