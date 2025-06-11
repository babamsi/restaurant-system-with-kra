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
  Eye,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Clock,
  Settings,
  Grid3X3,
  List,
  Star,
  Smartphone,
  Banknote,
  Building2,
  Printer,
  Mail,
  MessageSquare,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FoodItem {
  id: number
  name: string
  price: number
  stock: number
  category: string
  image?: string
  description: string
  prepTime: number
  rating: number
  isPopular: boolean
  portionSizes: {
    half: { price: number; available: number; calories: number }
    full: { price: number; available: number; calories: number }
    double: { price: number; available: number; calories: number }
  }
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  portion: string
  originalId: number
  notes?: string
}

const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Grilled Chicken Caesar",
    price: 12.99,
    stock: 45,
    category: "Main Course",
    description: "Fresh romaine lettuce with grilled chicken breast, parmesan cheese, and caesar dressing",
    prepTime: 15,
    rating: 4.8,
    isPopular: true,
    portionSizes: {
      half: { price: 8.99, available: 45, calories: 320 },
      full: { price: 12.99, available: 45, calories: 640 },
      double: { price: 18.99, available: 20, calories: 1280 },
    },
  },
  {
    id: 2,
    name: "Beef Pasta Bolognese",
    price: 14.99,
    stock: 32,
    category: "Main Course",
    description: "Traditional pasta with rich beef bolognese sauce and fresh herbs",
    prepTime: 25,
    rating: 4.6,
    isPopular: true,
    portionSizes: {
      half: { price: 10.99, available: 32, calories: 450 },
      full: { price: 14.99, available: 32, calories: 900 },
      double: { price: 21.99, available: 15, calories: 1800 },
    },
  },
  {
    id: 3,
    name: "Vegetable Stir Fry",
    price: 9.99,
    stock: 38,
    category: "Vegetarian",
    description: "Fresh seasonal vegetables stir-fried with aromatic spices and jasmine rice",
    prepTime: 12,
    rating: 4.4,
    image: "https://s.lightorangebean.com/media/20240914144639/Thai-Vegetable-Stir-Fry-with-Lime-and-Ginger_done.png",
    isPopular: false,
    portionSizes: {
      half: { price: 6.99, available: 38, calories: 280 },
      full: { price: 9.99, available: 38, calories: 560 },
      double: { price: 14.99, available: 25, calories: 1120 },
    },
  },
  {
    id: 4,
    name: "Grilled Salmon Rice",
    price: 18.99,
    stock: 28,
    category: "Seafood",
    description: "Fresh Atlantic salmon grilled to perfection with jasmine rice and vegetables",
    prepTime: 20,
    rating: 4.9,
    isPopular: true,
    portionSizes: {
      half: { price: 13.99, available: 28, calories: 420 },
      full: { price: 18.99, available: 28, calories: 840 },
      double: { price: 26.99, available: 12, calories: 1680 },
    },
  },
  {
    id: 5,
    name: "Fresh Orange Juice",
    price: 4.0,
    stock: 120,
    category: "Beverages",
    description: "Freshly squeezed orange juice, rich in vitamin C",
    prepTime: 2,
    rating: 4.7,
    isPopular: false,
    portionSizes: {
      half: { price: 2.5, available: 120, calories: 60 },
      full: { price: 4.0, available: 120, calories: 120 },
      double: { price: 6.5, available: 80, calories: 240 },
    },
  },
  {
    id: 6,
    name: "Iced Coffee",
    price: 3.5,
    stock: 85,
    category: "Beverages",
    description: "Premium coffee served cold with ice, perfect for hot days",
    prepTime: 3,
    rating: 4.5,
    isPopular: true,
    portionSizes: {
      half: { price: 2.0, available: 85, calories: 15 },
      full: { price: 3.5, available: 85, calories: 30 },
      double: { price: 5.0, available: 60, calories: 60 },
    },
  },
]

const transactions = [
  {
    id: "INV-174833169082-205",
    date: "May 27, 2025 2:41 PM",
    customer: "Sarah Johnson",
    total: 18.0,
    items: 3,
    status: "Completed",
  },
  {
    id: "INV-174477899260-756",
    date: "May 27, 2025 1:49 PM",
    customer: "Michael Chen",
    total: 24.5,
    items: 2,
    status: "Completed",
  },
  {
    id: "INV-174300335946-586",
    date: "May 27, 2025 12:35 PM",
    customer: "Guest",
    total: 12.99,
    items: 1,
    status: "Completed",
  },
  {
    id: "INV-174300302602-689",
    date: "May 27, 2025 11:30 AM",
    customer: "Emily Davis",
    total: 31.48,
    items: 4,
    status: "Completed",
  },
  {
    id: "INV-174300293122-302",
    date: "May 27, 2025 10:28 AM",
    customer: "Guest",
    total: 7.5,
    items: 2,
    status: "Completed",
  },
]

export function AdvancedPOSSystem() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
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
  const [tax, setTax] = useState(0.08) // 8% tax

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const categories = ["All", ...Array.from(new Set(foodItems.map((item) => item.category)))]

  const filteredItems = foodItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (item: FoodItem, portion: "half" | "full" | "double") => {
    const price = item.portionSizes[portion].price
    const available = item.portionSizes[portion].available

    if (available <= 0) {
      toast({
        title: "Out of Stock",
        description: `${item.name} (${portion} portion) is out of stock`,
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find((cartItem) => cartItem.originalId === item.id && cartItem.portion === portion)

    if (existingItem) {
      updateQuantity(existingItem.id, 1)
    } else {
      const cartItem: CartItem = {
        id: `${item.id}-${portion}-${Date.now()}`,
        name: item.name,
        price: price,
        quantity: 1,
        portion: portion,
        originalId: item.id,
      }
      setCart((prev) => [...prev, cartItem])
    }

    toast({
      title: "Added to Cart",
      description: `${item.name} (${portion} portion) added to cart`,
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

    setShowCheckout(false)
    setShowSuccess(true)

    // Auto close success modal after 5 seconds
    setTimeout(() => {
      setShowSuccess(false)
      clearCart()
      setSelectedPayment("")
      setCustomerName("")
      setCustomerPhone("")
      setCashReceived("")
      setTableNumber("")
      setDiscount(0)
    }, 5000)
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
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
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
                {filteredItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        {item.isPopular && (
                          <Badge className="absolute top-2 left-2 bg-orange-500">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.prepTime}m
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {item.rating}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                          <Badge variant={item.stock > 10 ? "secondary" : "destructive"} className="text-xs">
                            Stock: {item.stock}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-1 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => addToCart(item, "half")}
                            disabled={item.portionSizes.half.available === 0}
                          >
                            Half
                            <br />${item.portionSizes.half.price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => addToCart(item, "full")}
                            disabled={item.portionSizes.full.available === 0}
                          >
                            Full
                            <br />${item.portionSizes.full.price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => addToCart(item, "double")}
                            disabled={item.portionSizes.double.available === 0}
                          >
                            Double
                            <br />${item.portionSizes.double.price.toFixed(2)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🍽️</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="flex items-center gap-2">
                              {item.isPopular && <Badge className="bg-orange-500">Popular</Badge>}
                              <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.prepTime}m
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {item.rating}
                            </span>
                            <span>Stock: {item.stock}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(item, "half")}
                            disabled={item.portionSizes.half.available === 0}
                          >
                            Half ${item.portionSizes.half.price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item, "full")}
                            disabled={item.portionSizes.full.available === 0}
                          >
                            Full ${item.portionSizes.full.price.toFixed(2)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(item, "double")}
                            disabled={item.portionSizes.double.available === 0}
                          >
                            Double ${item.portionSizes.double.price.toFixed(2)}
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

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder="Search transactions..." className="flex-1" />
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 gap-4 p-3 bg-muted font-medium text-sm">
                <span>Invoice ID</span>
                <span>Date & Time</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Actions</span>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="grid grid-cols-6 gap-4 p-3 hover:bg-muted/50">
                    <span className="text-sm font-mono">{transaction.id}</span>
                    <span className="text-sm">{transaction.date}</span>
                    <span className="text-sm">{transaction.customer}</span>
                    <span className="text-sm">{transaction.items} items</span>
                    <span className="text-sm font-medium">${transaction.total.toFixed(2)}</span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
