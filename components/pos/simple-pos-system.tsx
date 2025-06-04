"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Search, Minus, Plus, Trash2, ShoppingCart, CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Simple menu item type
type MenuItem = {
  id: string
  name: string
  type: "meal" | "ingredient"
  category: string
  price: number
  unit?: string
  available: number
  prepTime?: number
  calories: number
  protein: number
}

// Simple cart item type
type CartItem = {
  id: string
  menuItemId: string
  name: string
  type: "meal" | "ingredient"
  quantity: number
  unit?: string
  unitPrice: number
  totalPrice: number
  calories: number
  protein: number
}

export function SimplePOSSystem() {
  const { toast } = useToast()

  // Sample menu items
  const menuItems: MenuItem[] = [
    {
      id: "meal-1",
      name: "Grilled Chicken with Rice",
      type: "meal",
      category: "Main Course",
      price: 15.0,
      available: 25,
      prepTime: 25,
      calories: 450,
      protein: 35,
    },
    {
      id: "meal-2",
      name: "Vegetable Stir Fry",
      type: "meal",
      category: "Vegetarian",
      price: 12.0,
      available: 20,
      prepTime: 15,
      calories: 180,
      protein: 6,
    },
    {
      id: "ingredient-1",
      name: "Orange Juice",
      type: "ingredient",
      category: "Drinks",
      price: 0.35, // Price per 100ml
      unit: "ml",
      available: 2000,
      calories: 45,
      protein: 0.7,
    },
    {
      id: "ingredient-2",
      name: "Milk",
      type: "ingredient",
      category: "Drinks",
      price: 0.25, // Price per 100ml
      unit: "ml",
      available: 1000,
      calories: 42,
      protein: 3.4,
    },
  ]

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter menu items based on search and category
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory && item.available > 0
  })

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    // Default quantities
    const quantity = item.type === "ingredient" ? 100 : 1
    const unitLabel = item.type === "ingredient" ? item.unit : "portion"

    // Check if we have enough stock
    if (item.available < quantity) {
      toast({
        title: "Not enough stock",
        description: `Only ${item.available}${item.unit || ""} available`,
        variant: "destructive",
      })
      return
    }

    // Check if item already in cart
    const existingItem = cart.find((cartItem) => cartItem.menuItemId === item.id)

    if (existingItem) {
      // Update quantity
      updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity)
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        type: item.type,
        quantity: quantity,
        unit: item.unit,
        unitPrice: item.price,
        totalPrice: item.price * quantity,
        calories: item.calories * (item.type === "ingredient" ? quantity / 100 : quantity),
        protein: item.protein * (item.type === "ingredient" ? quantity / 100 : quantity),
      }

      setCart([...cart, newItem])

      toast({
        title: "Added to cart",
        description: `${quantity}${item.unit || ""} ${item.name}`,
      })
    }
  }

  // Update cart item quantity
  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)

          // Check stock
          if (menuItem && newQuantity > menuItem.available) {
            toast({
              title: "Not enough stock",
              description: `Only ${menuItem.available}${menuItem.unit || ""} available`,
              variant: "destructive",
            })
            return item
          }

          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
            calories: menuItem
              ? menuItem.calories * (menuItem.type === "ingredient" ? newQuantity / 100 : newQuantity)
              : 0,
            protein: menuItem
              ? menuItem.protein * (menuItem.type === "ingredient" ? newQuantity / 100 : newQuantity)
              : 0,
          }
        }
        return item
      }),
    )
  }

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  // Complete order
  const completeOrder = () => {
    if (!selectedPayment) {
      toast({
        title: "Select payment method",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    // Process order
    toast({
      title: "Order placed",
      description: `Order #${Math.floor(Math.random() * 1000)} has been placed`,
    })

    setShowCheckout(false)
    setShowSuccess(true)

    // Reset after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      clearCart()
      setSelectedPayment("")
      setCustomerName("")
      setTableNumber("")
    }, 3000)
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Point of Sale</h1>
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
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
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
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
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
                <p className="text-muted-foreground">No items match your current search criteria.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-2xl">{item.type === "meal" ? "🍽️" : "🥤"}</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.type === "meal" ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                {item.prepTime}m
                              </>
                            ) : (
                              "Individual"
                            )}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {item.type === "ingredient" ? (
                              <>
                                ${item.price.toFixed(2)}
                                <span className="text-xs text-muted-foreground">/100{item.unit}</span>
                              </>
                            ) : (
                              `$${item.price.toFixed(2)}`
                            )}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.type === "ingredient"
                              ? `${item.available}${item.unit}`
                              : `${item.available} available`}
                          </Badge>
                        </div>

                        {/* Nutrition Info */}
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          <div className="grid grid-cols-2 gap-1">
                            <span>{item.calories} cal</span>
                            <span>{item.protein}g protein</span>
                          </div>
                        </div>

                        <Button size="sm" className="w-full" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" />
                          {item.type === "ingredient" ? `Add 100${item.unit}` : "Add to Cart"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{item.type === "meal" ? "🍽️" : "🥤"}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">
                                {item.type === "ingredient" ? (
                                  <>
                                    ${item.price.toFixed(2)}
                                    <span className="text-xs text-muted-foreground">/100{item.unit}</span>
                                  </>
                                ) : (
                                  `$${item.price.toFixed(2)}`
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {item.type === "meal" && item.prepTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.prepTime}m
                              </span>
                            )}
                            <span>
                              Stock:{" "}
                              {item.type === "ingredient"
                                ? `${item.available}${item.unit}`
                                : `${item.available} available`}
                            </span>
                            <span>
                              {item.calories} cal, {item.protein}g protein
                            </span>
                          </div>
                        </div>

                        <Button size="sm" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" />
                          {item.type === "ingredient" ? `Add 100${item.unit}` : "Add to Cart"}
                        </Button>
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
                Cart ({cart.length})
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
                            {item.type === "ingredient" && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.quantity}
                                {item.unit})
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.type === "ingredient"
                              ? `$${item.unitPrice.toFixed(2)} per 100${item.unit}`
                              : `$${item.unitPrice.toFixed(2)} each`}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round(item.calories)} cal • {item.protein.toFixed(1)}g protein
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
                              const decrement = item.type === "ingredient" ? 50 : 1
                              updateCartItemQuantity(item.id, item.quantity - decrement)
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center text-sm">
                            {item.type === "ingredient" ? `${item.quantity}${item.unit}` : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const increment = item.type === "ingredient" ? 50 : 1
                              updateCartItemQuantity(item.id, item.quantity + increment)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">${item.totalPrice.toFixed(2)}</span>
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
                <h4 className="font-medium text-sm mb-2">Total Nutrition</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-medium">{Math.round(cart.reduce((sum, item) => sum + item.calories, 0))}</p>
                    <p className="text-muted-foreground">calories</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{cart.reduce((sum, item) => sum + item.protein, 0).toFixed(1)}g</p>
                    <p className="text-muted-foreground">protein</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
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
            </div>

            <div>
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedPayment === "cash" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("cash")}
                >
                  Cash
                </Button>
                <Button
                  variant={selectedPayment === "card" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("card")}
                >
                  Card
                </Button>
                <Button
                  variant={selectedPayment === "mobile" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("mobile")}
                >
                  Mobile
                </Button>
                <Button
                  variant={selectedPayment === "bank" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => setSelectedPayment("bank")}
                >
                  Bank
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={completeOrder}>
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
            <p>Your order has been placed successfully.</p>
            <Button className="w-full" onClick={() => setShowSuccess(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
