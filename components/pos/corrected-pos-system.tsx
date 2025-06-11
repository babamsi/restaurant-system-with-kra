"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  RotateCcw,
  History,
  UserPlus,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Clock,
  Settings,
  Grid3X3,
  List,
  Smartphone,
  Banknote,
  Building2,
  Printer,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import { useUnifiedKitchenStore } from "@/stores/unified-kitchen-store"
import Image from "next/image"

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
    getCartTotal,
    getCartNutrition,
    getCartItemCount,
    getAvailableMenuItems,
    addKitchenItemToMenu,
    removeMenuItem,
  } = useCompletePOSStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in")
  const [tableNumber, setTableNumber] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tax] = useState(0.16) // 16% VAT
  const [menuUpdateNotification, setMenuUpdateNotification] = useState(false)
  const [lastOrderId, setLastOrderId] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const { orders: allOrders } = useOrdersStore()
  const [showMenuManager, setShowMenuManager] = useState(false)
  const [kitchenItemPrice, setKitchenItemPrice] = useState<Record<string, string>>({})
  const { ingredients, recipes } = useUnifiedKitchenStore()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Listen for menu updates from kitchen
    const handleMenuUpdate = () => {
      setMenuUpdateNotification(true)
      setTimeout(() => setMenuUpdateNotification(false), 3000)
    }

    window.addEventListener("menu-updated", handleMenuUpdate)
    return () => window.removeEventListener("menu-updated", handleMenuUpdate)
  }, [])

  const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  const filteredMenuItems = getAvailableMenuItems().filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddToCart = (menuItem: MenuItem, portionSize = "regular") => {
    // For individual ingredients, use a default serving size
    let actualQuantity = 1
    let displayText = ""

    if (menuItem.type === "individual") {
      // Default serving sizes for individual ingredients
      const defaultServings = {
        g: 100, // 100g default serving
        ml: 200, // 200ml default serving
      }

      const unit = menuItem.unit || "g"
      actualQuantity = defaultServings[unit] || 100
      displayText = `${actualQuantity}${unit} of ${menuItem.name}`
    } else {
      displayText = `${portionSize} ${menuItem.name}`
    }

    if (menuItem.available_quantity < actualQuantity) {
      const unit = menuItem.unit || ""
      toast({
        title: "Insufficient Stock",
        description: `Only ${Math.floor(menuItem.available_quantity)}${unit} available`,
        variant: "destructive",
      })
      return
    }

    addToCart(menuItem, actualQuantity, portionSize)

    toast({
      title: "Added to Cart",
      description: displayText,
    })
  }

  const getSubtotal = () => {
    return getCartTotal()
  }

  const getDiscountAmount = () => {
    return getSubtotal() * (discount / 100)
  }

  const getTaxAmount = () => {
    return (getSubtotal() - getDiscountAmount()) * tax
  }

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount() + getTaxAmount()
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      })
      return
    }
    setShowCheckout(true)
  }

  const completePayment = () => {
    if (!selectedPayment) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    if (selectedPayment === "cash" && (!cashReceived || Number.parseFloat(cashReceived) < getTotal())) {
      toast({
        title: "Insufficient Cash",
        description: "Cash received must be greater than or equal to total amount",
        variant: "destructive",
      })
      return
    }

    const cartNutrition = getCartNutrition()

    const order = createOrder({
      items: cart,
      customer_name: customerName || undefined,
      table_number: orderType === "dine-in" ? tableNumber || undefined : undefined,
      order_type: orderType,
      subtotal: getSubtotal(),
      tax: getTaxAmount(),
      total: getTotal(),
      total_nutrition: cartNutrition,
      status: "pending",
    })

    setLastOrderId(order.id)
    setShowCheckout(false)
    setShowSuccess(true)

    toast({
      title: "Order Placed Successfully!",
      description: `Order ${order.id} has been processed and inventory updated automatically.`,
    })

    // Auto close success modal after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedPayment("")
      setCustomerName("")
      setCustomerPhone("")
      setCashReceived("")
      setTableNumber("")
      setDiscount(0)
    }, 3000)
  }

  const getChange = () => {
    if (selectedPayment === "cash" && cashReceived) {
      return Math.max(0, Number.parseFloat(cashReceived) - getTotal())
    }
    return 0
  }

  const handleAddKitchenItemToMenu = (item: any) => {
    const price = Number.parseFloat(kitchenItemPrice[item.id] || "0")
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      })
      return
    }
    
    addKitchenItemToMenu(item, price)
    
    toast({
      title: "Item Added to Menu",
      description: `${item.name} has been added to the POS menu`,
    })
    
    // Clear the price input
    setKitchenItemPrice(prev => ({...prev, [item.id]: ""}))
  }

  const handleRemoveMenuItem = (menuItemId: string) => {
    removeMenuItem(menuItemId)
    
    toast({
      title: "Item Removed",
      description: "The item has been removed from the POS menu",
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Menu Update Notification */}
      {menuUpdateNotification && (
        <div className="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800 border-b p-2">
          <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Menu updated! New items are now available.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Point of Sale</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
            </div>
            <Badge variant="secondary" className="text-xs">
              {menuItems.length} items available
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                className="pl-10 w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Return
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMenuManager(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Menu
            </Button>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Customer
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters and Controls */}
          <div className="flex-shrink-0 p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "dine-in" | "takeaway")}>
                  <TabsList>
                    <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                    <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
                  </TabsList>
                </Tabs>

                {orderType === "dine-in" && (
                  <Input
                    placeholder="Table #"
                    className="w-24"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-auto p-4">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Menu Items Available</h3>
                <p className="text-muted-foreground">
                  {menuItems.length === 0
                    ? "No recipes have been published from the Kitchen module yet."
                    : "No items match your current search criteria."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{item.type === "recipe" ? "🍽️" : "🥘"}</span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.type === "recipe" ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                {item.prep_time_minutes}m
                              </>
                            ) : (
                              "Individual"
                            )}
                          </Badge>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {item.type === "individual" ? (
                              <>
                                ${(item.price * 100).toFixed(2)}
                                <span className="text-xs text-muted-foreground">/100{item.unit}</span>
                              </>
                            ) : (
                              `$${item.price.toFixed(2)}`
                            )}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.type === "individual"
                              ? `${Math.floor(item.available_quantity)}${item.unit}`
                              : `${item.available_quantity} available`}
                          </Badge>
                        </div>

                        {/* Nutrition Info */}
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          <div className="grid grid-cols-2 gap-1">
                            <span>{item.nutrition.calories} cal</span>
                            <span>{item.nutrition.protein}g protein</span>
                          </div>
                        </div>

                        {item.type === "recipe" && item.portion_sizes ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAddToCart(item, "small")}
                              disabled={item.available_quantity === 0}
                            >
                              Small
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAddToCart(item, "regular")}
                              disabled={item.available_quantity === 0}
                            >
                              Regular
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAddToCart(item, "large")}
                              disabled={item.available_quantity === 0}
                            >
                              Large
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddToCart(item)}
                            disabled={item.available_quantity === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {item.type === "individual" ? `Add 100${item.unit}` : "Add to Cart"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 border-l border-border bg-card flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({getCartItemCount()})
              </h2>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {orderType === "dine-in" && tableNumber && (
              <Badge variant="secondary" className="mb-2">
                Table {tableNumber}
              </Badge>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.name}
                            {item.type === "individual" && item.unit && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.quantity}
                                {item.unit})
                              </span>
                            )}
                            {item.type === "recipe" && item.portionSize && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.portionSize})
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.type === "individual"
                              ? `$${(item.unit_price * 100).toFixed(2)} per 100${item.unit}`
                              : `$${item.unit_price.toFixed(2)} per item`}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.total_nutrition.calories} cal • {item.total_nutrition.protein.toFixed(1)}g protein
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const decrement = item.type === "individual" ? 50 : 1
                              updateCartItemQuantity(item.id, Math.max(0, item.quantity - decrement))
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center text-sm">
                            {item.type === "individual" ? `${item.quantity}${item.unit}` : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const increment = item.type === "individual" ? 50 : 1
                              updateCartItemQuantity(item.id, item.quantity + increment)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">${item.total_price.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              {/* Nutrition Summary */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Nutrition
                </h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-medium">{getCartNutrition().calories}</p>
                    <p className="text-muted-foreground">calories</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{getCartNutrition().protein.toFixed(1)}g</p>
                    <p className="text-muted-foreground">protein</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{getCartNutrition().carbs.toFixed(1)}g</p>
                    <p className="text-muted-foreground">carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{getCartNutrition().fat.toFixed(1)}g</p>
                    <p className="text-muted-foreground">fat</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>Discount:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-16 h-6 text-xs"
                      value={discount}
                      onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <span className="text-xs">%</span>
                    <span>-${getDiscountAmount().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>${getTaxAmount().toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCheckout}>
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Checkout
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Input
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone Number (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div>
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedPayment === "cash" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("cash")}
                >
                  <Banknote className="h-6 w-6 mb-1" />
                  <span>Cash</span>
                </Button>
                <Button
                  variant={selectedPayment === "card" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("card")}
                >
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span>Card</span>
                </Button>
                <Button
                  variant={selectedPayment === "mobile" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("mobile")}
                >
                  <Smartphone className="h-6 w-6 mb-1" />
                  <span>Mobile Pay</span>
                </Button>
                <Button
                  variant={selectedPayment === "bank" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("bank")}
                >
                  <Building2 className="h-6 w-6 mb-1" />
                  <span>Bank Transfer</span>
                </Button>
              </div>
            </div>

            {selectedPayment === "cash" && (
              <Input
                placeholder="Cash Received"
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                min={getTotal()}
                step="0.01"
              />
            )}

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">${getTotal().toFixed(2)}</span>
              </div>
              {selectedPayment === "cash" && cashReceived && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-bold">${getChange().toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={completePayment}>
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Payment Successful!</h2>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-bold">{lastOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="font-bold">${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{selectedPayment}</span>
              </div>
              {selectedPayment === "cash" && cashReceived && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>${Number.parseFloat(cashReceived).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${getChange().toFixed(2)}</span>
                  </div>
                </>
              )}
              {customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{customerName}</span>
                </div>
              )}
              {orderType === "dine-in" && tableNumber && (
                <div className="flex justify-between">
                  <span>Table:</span>
                  <span>{tableNumber}</span>
                </div>
              )}
            </div>

            {/* Nutrition Summary */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Nutritional Summary</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div className="text-center">
                  <p className="font-medium">{getCartNutrition().calories}</p>
                  <p>calories</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{getCartNutrition().protein.toFixed(1)}g</p>
                  <p>protein</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{getCartNutrition().carbs.toFixed(1)}g</p>
                  <p>carbs</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{getCartNutrition().fat.toFixed(1)}g</p>
                  <p>fat</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Inventory Updated</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Ingredient stock levels have been automatically updated based on this order.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Receipt Options</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setShowSuccess(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Order History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {allOrders.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No order history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allOrders
                  .slice()
                  .reverse()
                  .map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{order.id}</h4>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName} • {order.tableNumber || "Takeaway"}
                            </p>
                            <p className="text-xs text-muted-foreground">{order.createdAt.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${order.total.toFixed(2)}</p>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "processing"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {order.specialInstructions && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{order.specialInstructions}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Manager Modal */}
      <Dialog open={showMenuManager} onOpenChange={setShowMenuManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        </DialogContent>\
      </Dialog>
      </div>
  )}
