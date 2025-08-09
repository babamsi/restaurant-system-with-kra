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
import { Label } from "@/components/ui/label"
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
  Loader2,
  CreditCard,
  DollarSign,
  Smartphone,
  UtensilsCrossed,
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash')
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

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

  // Comprehensive session validation function (same as POS)
  const validateSession = async (): Promise<{ valid: boolean; error?: string }> => {
    if (!sessionId) {
      return { valid: false, error: 'No active session' }
    }
    
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, opened_at, closed_at')
        .eq('id', sessionId)
        .single()
      
      if (error || !session) {
        return { valid: false, error: 'Session not found' }
      }
      
      if (session.closed_at) {
        return { valid: false, error: 'Session is closed' }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Failed to validate session' }
    }
  }

  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      if (isTableOrder) {
        const sessionValidation = await validateSession()
        setSessionValid(sessionValidation.valid)
        setSessionError(sessionValidation.error || null)
        
        if (!sessionValidation.valid) {
          setShowSessionDialog(true)
          toast({
            title: 'Session Error',
            description: sessionValidation.error || 'Invalid session',
            variant: 'destructive',
          })
        }
      } else {
        setSessionValid(true)
        setSessionError(null)
      }
    }

    checkSession()
  }, [sessionId, isTableOrder, toast])

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
      if (isTableOrder && sessionValid) {
        setLoading(true)
        try {
          // Get table information
          const tableNumber = `T${tableId}`
          setTableInfo({ number: tableNumber, id: parseInt(tableId) })
          
          // Check for existing order on this table in current session
          const { data: existingOrderData } = await tableOrdersService.getActiveOrderByTable(parseInt(tableId))
          if (existingOrderData && existingOrderData.session_id === sessionId) {
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
      } else if (!isTableOrder) {
        setLoading(false)
      }
    }

    if (sessionValid) {
    initializeTableOrder()
    }
  }, [tableId, sessionId, isTableOrder, sessionValid, toast])

  const recipesAsMenuItems: CartItem[] = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    price: recipe.price || 0,
    category: recipe.category || "Uncategorized",
    available_quantity: recipe.available ? 999 : 0,
    description: recipe.description || "",
    restaurant: recipe.restaurant,
    quantity: 1,
    total_price: recipe.price || 0,
    type: "recipe" as const,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    unit: "portion",
  }))

  const filteredMenuItems = recipesAsMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesRestaurant = selectedRestaurant === "all" || item.restaurant === selectedRestaurant
    return matchesSearch && matchesCategory && matchesRestaurant && item.available_quantity > 0
  })

  const handleOpenCustomization = (menuItem: CartItem) => {
    setCustomizingItem(menuItem)
    setIsCustomizing(true)
  }

  const handleConfirmAddToCart = () => {
    if (!customizingItem) return

    const cartItem: CartItem = {
      ...customizingItem,
      customization: customizationNotes,
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.id === cartItem.id)
      if (existingItem) {
        return prev.map(item =>
          item.id === cartItem.id
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.price }
            : item
        )
      } else {
        return [...prev, cartItem]
      }
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
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.price }
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

  const completeOrder = async () => {
    // Validate session first (same as POS)
    if (isTableOrder) {
      const sessionValidation = await validateSession()
      if (!sessionValidation.valid) {
        toast({
          title: 'Session Error',
          description: sessionValidation.error || 'Invalid session',
          variant: 'destructive',
        })
        return
      }
    }

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
      // Validate session is still active before placing order (same as POS)
      if (isTableOrder) {
        const { data: sessionCheck, error: sessionError } = await supabase
          .from('sessions')
          .select('id')
          .eq('id', sessionId)
          .is('closed_at', null)
          .single()
        
        if (sessionError || !sessionCheck) {
          throw new Error('Session is no longer active. Please refresh and try again.')
        }
      }

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
          setExistingOrder(data)
          setAddingToExisting(false)
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

  const handlePayment = async () => {
    if (!existingOrder) {
      toast({
        title: "No Order",
        description: "No order found to process payment",
        variant: "destructive",
      })
      return
    }

    setPlacingOrder(true)
    try {
      // Update order with payment information
      const { error } = await tableOrdersService.updateOrder(existingOrder.id, {
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        status: 'paid'
      })

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Payment Successful",
        description: `Payment processed for ${tableInfo?.number}`,
      })

      setShowPaymentDialog(false)
      setExistingOrder((prev: any) => prev ? { ...prev, status: 'paid', payment_method: paymentMethod } : null)
    } catch (error: any) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-lg font-medium text-slate-900">Loading menu...</p>
          <p className="text-sm text-slate-600 mt-2">Please wait while we fetch the latest menu items</p>
        </div>
      </div>
    )
  }

  if (!sessionValid && isTableOrder) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl border border-slate-200">
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
              </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Session Error</h2>
          <p className="text-slate-600 mb-4">{sessionError || 'Invalid session'}</p>
          <p className="text-sm text-slate-500 mb-6">Please scan the QR code again or contact staff for assistance.</p>
                <Button
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
                >
            Refresh Page
                </Button>
              </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Table className="h-6 w-6 text-white" />
            </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {isTableOrder ? `Table ${tableInfo?.number}` : 'Customer Portal'}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {isTableOrder ? 'Order & Pay at Your Table' : 'Browse Our Menu'}
                  </p>
                </div>
              </div>
              {isTableOrder && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active Session
                  </Badge>
                )}
              </div>
            
            <div className="flex items-center space-x-4">
              {existingOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOrderStatus(true)}
                  className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Order
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCart(true)}
                className="relative bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({getCartItemCount()})
              </Button>
            </div>
          </div>
            </div>
          </div>

      {/* Active Order Banner */}
                {existingOrder && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Active Order on {tableInfo?.number}</h3>
                  <p className="text-sm text-amber-700">
                    Status: {getOrderStatusLabel(existingOrder.status)} • Total: ${existingOrder.total_amount}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setAddingToExisting(true)
                    setShowCart(true)
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add More Items
                </Button>
                {existingOrder.status !== 'paid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentDialog(true)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
        </div>
      </div>
          )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
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
            
            <Select value={selectedRestaurant} onValueChange={(value: any) => setSelectedRestaurant(value)}>
              <SelectTrigger className="w-full sm:w-48 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenuItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-blue-300">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <UtensilsCrossed className="h-12 w-12 text-slate-400" />
        </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{item.name}</h3>
                    <span className="text-lg font-bold text-blue-600">${item.price}</span>
          </div>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                      {item.category}
                    </Badge>
                      <Button
                        size="sm"
                                  onClick={() => handleOpenCustomization(item)}
                      className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
                    </div>

        {/* Empty State */}
        {filteredMenuItems.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-slate-400" />
                  </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No items found</h3>
            <p className="text-slate-600">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span>{addingToExisting ? 'Add to Existing Order' : 'Shopping Cart'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500">
                  {addingToExisting ? 'Add items to your existing order' : 'Your cart is empty'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                        <p className="text-sm text-slate-600">${item.price} each</p>
                            {item.customization && (
                          <p className="text-xs text-slate-500 mt-1">Note: {item.customization}</p>
                            )}
                          </div>
                      <div className="flex items-center space-x-2">
                            <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0 border-slate-300"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0 border-slate-300"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                              onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                            >
                          <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Subtotal:</span>
                    <span className="text-lg font-bold text-blue-600">${getCartTotal()}</span>
                      </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tax (16%):</span>
                    <span className="text-slate-600">${(getCartTotal() * 0.16).toFixed(2)}</span>
                    </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">${(getCartTotal() * 1.16).toFixed(2)}</span>
                    </div>
                    </div>
                <Button
                  onClick={() => {
                    setShowCart(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {addingToExisting ? 'Add to Order' : 'Proceed to Checkout'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>{addingToExisting ? 'Add to Order' : 'Checkout'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!addingToExisting && (
                      <>
                        <div>
                  <Label htmlFor="customerName" className="text-slate-700">Name (Optional)</Label>
                          <Input
                    id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                  </div>
                        <div>
                  <Label htmlFor="customerPhone" className="text-slate-700">Phone (Optional)</Label>
                          <Input
                    id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                </div>
                <Separator />
                      </>
                    )}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">${getCartTotal()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax (16%):</span>
                <span className="font-medium">${(getCartTotal() * 0.16).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-slate-900">Total:</span>
                <span className="text-blue-600">${(getCartTotal() * 1.16).toFixed(2)}</span>
              </div>
            </div>
                    <Button 
              onClick={completeOrder}
                      disabled={placingOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {placingOrder ? (
                        <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {addingToExisting ? 'Adding to Order...' : 'Placing Order...'}
                        </>
              ) : (
                addingToExisting ? 'Add to Order' : 'Place Order'
                      )}
                  </Button>
          </div>
        </DialogContent>
      </Dialog>

          {/* Customization Dialog */}
          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              <span>Customize {customizingItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
                    <div>
              <Label htmlFor="customizationNotes" className="text-slate-700">Special Instructions</Label>
                    <Textarea
                id="customizationNotes"
                      value={customizationNotes}
                      onChange={(e) => setCustomizationNotes(e.target.value)}
                placeholder="Any special requests or modifications..."
                      rows={3}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomizing(false)} className="border-slate-300">
                Cancel
              </Button>
              <Button onClick={handleConfirmAddToCart} className="bg-blue-600 hover:bg-blue-700 text-white">
                Add to Cart
              </Button>
              </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment for {tableInfo?.number}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center gap-2 ${paymentMethod === 'cash' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300'}`}
                >
                  <DollarSign className="h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-2 ${paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('mobile')}
                  className={`flex items-center gap-2 ${paymentMethod === 'mobile' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300'}`}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </Button>
              </div>
            </div>
            <div className="text-center bg-slate-50 p-4 rounded-lg">
              <p className="text-lg font-semibold text-slate-900">Total: ${existingOrder?.total_amount || 0}</p>
            </div>
            <Button
              onClick={handlePayment}
              disabled={placingOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                'Process Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Status Dialog */}
      <Dialog open={showOrderStatus} onOpenChange={setShowOrderStatus}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Order Status - {tableInfo?.number}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {existingOrder && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">Status:</span>
                  <Badge variant={existingOrder.status === 'paid' ? 'default' : 'secondary'} className="bg-blue-100 text-blue-700">
                    {getOrderStatusLabel(existingOrder.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Amount:</span>
                    <span className="font-semibold text-slate-900">${existingOrder.total_amount}</span>
                  </div>
                  {existingOrder.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Method:</span>
                      <span className="capitalize text-slate-900">{existingOrder.payment_method}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Order Items:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {existingOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                        <span className="text-slate-700">{item.menu_item_name} x{item.quantity}</span>
                        <span className="font-medium text-slate-900">${item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {existingOrder.status !== 'paid' && (
                  <Button
                    onClick={() => {
                      setShowOrderStatus(false)
                      setShowPaymentDialog(true)
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Pay Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Error Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <span>Session Error</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700">{sessionError || 'Invalid session'}</p>
            </div>
            <p className="text-sm text-slate-600">
              Please scan the QR code again or contact staff for assistance.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
