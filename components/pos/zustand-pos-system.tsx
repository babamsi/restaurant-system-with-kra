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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRecipesStore } from "@/stores/recipes-store"
import { useAppStore } from "@/stores/app-store"
import type { Order, OrderItem } from "@/types/order"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  portion: string
  originalId: number
  notes?: string
}

export function ZustandPOSSystem() {
  const { toast } = useToast()
  const { recipes } = useRecipesStore()
  const { processOrder } = useAppStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
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
  const [tax, setTax] = useState(0.08)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const categories = ["All", ...Array.from(new Set(recipes.map((recipe) => recipe.category)))]

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory
    return matchesSearch && matchesCategory && recipe.is_published
  })

  const addToCart = (recipe: any, portion: "small" | "regular" | "large") => {
    const portionData = recipe.portion_sizes[portion]
    const price = recipe.selling_price + portionData.price_adjustment

    if (recipe.available_portions <= 0) {
      toast({
        title: "Out of Stock",
        description: `${recipe.name} is out of stock`,
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find((cartItem) => cartItem.originalId === recipe.id && cartItem.portion === portion)

    if (existingItem) {
      updateQuantity(existingItem.id, 1)
    } else {
      const cartItem: CartItem = {
        id: `${recipe.id}-${portion}-${Date.now()}`,
        name: recipe.name,
        price: price,
        quantity: 1,
        portion: portion,
        originalId: recipe.id,
      }
      setCart((prev) => [...prev, cartItem])
    }

    toast({
      title: "Added to Cart",
      description: `${recipe.name} (${portion}) added to cart`,
    })
  }

  const updateQuantity = (id: string, change: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      }),
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
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

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
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

    // Create order object
    const orderItems: OrderItem[] = cart.map((item) => ({
      id: `item-${item.id}`,
      name: item.name,
      quantity: item.quantity,
      portionSize: item.portion as "small" | "regular" | "large",
      price: item.price,
    }))

    const order: Order = {
      id: `ORD-${Date.now()}`,
      tableNumber: orderType === "dine-in" ? tableNumber : undefined,
      customerName: customerName || "Guest",
      items: orderItems,
      status: "incoming",
      total: getTotal(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Process order through Zustand store
    processOrder(order)

    setShowCheckout(false)
    setShowSuccess(true)

    toast({
      title: "Order Placed Successfully!",
      description: `Order ${order.id} has been sent to the kitchen.`,
    })

    // Auto close success modal after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      clearCart()
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
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
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {recipe.prep_time}m
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm leading-tight">{recipe.name}</h3>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">${recipe.selling_price.toFixed(2)}</span>
                          <Badge
                            variant={recipe.available_portions > 10 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            Stock: {recipe.available_portions}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-1 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => addToCart(recipe, "small")}
                            disabled={recipe.available_portions === 0}
                          >
                            Small
                            <br />${(recipe.selling_price + recipe.portion_sizes.small.price_adjustment).toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => addToCart(recipe, "regular")}
                            disabled={recipe.available_portions === 0}
                          >
                            Regular
                            <br />${recipe.selling_price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => addToCart(recipe, "large")}
                            disabled={recipe.available_portions === 0}
                          >
                            Large
                            <br />${(recipe.selling_price + recipe.portion_sizes.large.price_adjustment).toFixed(2)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🍽️</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold">{recipe.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">${recipe.selling_price.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {recipe.prep_time}m
                            </span>
                            <span>Stock: {recipe.available_portions}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(recipe, "small")}
                            disabled={recipe.available_portions === 0}
                          >
                            Small ${(recipe.selling_price + recipe.portion_sizes.small.price_adjustment).toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addToCart(recipe, "regular")}
                            disabled={recipe.available_portions === 0}
                          >
                            Regular ${recipe.selling_price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(recipe, "large")}
                            disabled={recipe.available_portions === 0}
                          >
                            Large ${(recipe.selling_price + recipe.portion_sizes.large.price_adjustment).toFixed(2)}
                          </Button>
                        </div>
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
                Cart ({getTotalItems()})
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
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.portion} portion • ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
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
                  <span>Tax (8%):</span>
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
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold">Payment Successful!</h2>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm text-left">
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
    </div>
  )
}
