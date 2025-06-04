"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, RotateCcw, History, UserPlus, Eye, Minus, Plus, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FoodItem {
  id: number
  name: string
  price: number
  stock: number
  category: string
  portionSizes: {
    half: { price: number; available: number }
    full: { price: number; available: number }
    double: { price: number; available: number }
  }
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  portion: string
  originalId: number
}

const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Grilled Chicken Caesar",
    price: 12.99,
    stock: 45,
    category: "Main Course",
    portionSizes: {
      half: { price: 8.99, available: 45 },
      full: { price: 12.99, available: 45 },
      double: { price: 18.99, available: 20 },
    },
  },
  {
    id: 2,
    name: "Beef Pasta Bolognese",
    price: 14.99,
    stock: 32,
    category: "Main Course",
    portionSizes: {
      half: { price: 10.99, available: 32 },
      full: { price: 14.99, available: 32 },
      double: { price: 21.99, available: 15 },
    },
  },
  {
    id: 3,
    name: "Vegetable Stir Fry",
    price: 9.99,
    stock: 38,
    category: "Vegetarian",
    portionSizes: {
      half: { price: 6.99, available: 38 },
      full: { price: 9.99, available: 38 },
      double: { price: 14.99, available: 25 },
    },
  },
  {
    id: 4,
    name: "Grilled Salmon Rice",
    price: 18.99,
    stock: 28,
    category: "Seafood",
    portionSizes: {
      half: { price: 13.99, available: 28 },
      full: { price: 18.99, available: 28 },
      double: { price: 26.99, available: 12 },
    },
  },
  {
    id: 5,
    name: "Fresh Orange Juice",
    price: 4.0,
    stock: 120,
    category: "Beverages",
    portionSizes: {
      half: { price: 2.5, available: 120 },
      full: { price: 4.0, available: 120 },
      double: { price: 6.5, available: 80 },
    },
  },
  {
    id: 6,
    name: "Iced Coffee",
    price: 3.5,
    stock: 85,
    category: "Beverages",
    portionSizes: {
      half: { price: 2.0, available: 85 },
      full: { price: 3.5, available: 85 },
      double: { price: 5.0, available: 60 },
    },
  },
  {
    id: 7,
    name: "Garden Fresh Salad",
    price: 8.99,
    stock: 42,
    category: "Salads",
    portionSizes: {
      half: { price: 5.99, available: 42 },
      full: { price: 8.99, available: 42 },
      double: { price: 12.99, available: 30 },
    },
  },
  {
    id: 8,
    name: "Cheese Omelette",
    price: 7.99,
    stock: 35,
    category: "Breakfast",
    portionSizes: {
      half: { price: 5.49, available: 35 },
      full: { price: 7.99, available: 35 },
      double: { price: 11.99, available: 20 },
    },
  },
]

const transactions = [
  { id: "INV-174833169082-205", date: "May 27, 2025 2:41 PM", customer: "Guest", total: 18.0 },
  { id: "INV-174477899260-756", date: "Apr 16, 2025 11:49 AM", customer: "Guest", total: 20.0 },
  { id: "INV-174300335946-586", date: "Mar 26, 2025 10:35 PM", customer: "Guest", total: 2.0 },
  { id: "INV-174300302602-689", date: "Mar 26, 2025 10:30 PM", customer: "Guest", total: 2.0 },
  { id: "INV-174300293122-302", date: "Mar 26, 2025 10:28 PM", customer: "Guest", total: 2.0 },
  { id: "INV-174300282779-642", date: "Mar 26, 2025 10:27 PM", customer: "Guest", total: 2.0 },
]

export function ModernPOSDashboard() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState("")
  const [catalogHidden, setCatalogHidden] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [cashReceived, setCashReceived] = useState("")

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

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getTotal = () => {
    return getSubtotal() // No tax for simplicity
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

    setShowCheckout(false)
    setShowSuccess(true)

    // Auto close success modal after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      setCart([])
      setSelectedPayment("")
      setCustomerName("")
      setCashReceived("")
    }, 3000)
  }

  const getChange = () => {
    if (selectedPayment === "cash" && cashReceived) {
      return Math.max(0, Number.parseFloat(cashReceived) - getTotal())
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              <RotateCcw className="h-4 w-4 mr-2" />
              Return
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Product Catalog */}
        {!catalogHidden && (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Product Catalog</h2>
              <div className="flex items-center gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => setCatalogHidden(true)}
                >
                  Hide
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {filteredItems.map((item) => {
                const inCartItems = cart.filter((cartItem) => cartItem.originalId === item.id)
                const isInCart = inCartItems.length > 0

                return (
                  <div
                    key={item.id}
                    className={`bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors relative ${isInCart ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => addToCart(item, "full")}
                  >
                    <div className="text-center">
                      <h3 className="font-medium mb-2">{item.name}</h3>
                      <p className="text-xl font-bold text-green-400 mb-2">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">Stock: {item.stock}</p>
                    </div>
                    {isInCart && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 text-white">In Cart</Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Load More</Button>
          </div>
        )}

        {/* Shopping Cart */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <span className="text-gray-400">({getTotalItems()})</span>
          </div>

          {catalogHidden && (
            <Button
              variant="outline"
              className="w-full mb-4 border-gray-700 text-white hover:bg-gray-700"
              onClick={() => setCatalogHidden(false)}
            >
              Show Catalog
            </Button>
          )}

          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-400">
                    {item.price.toFixed(2)} each ({item.portion} portion)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 border-gray-600"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 border-gray-600"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 border-red-600 text-red-400 hover:bg-red-600"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-gray-400">{getTotalItems()}</span>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCheckout}>
            Proceed to Checkout
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Checkout</DialogTitle>
                <p className="text-gray-400">Complete your purchase</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCheckout(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <Input
              placeholder="Add Customer (Optional)"
              className="bg-gray-700 border-gray-600"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div>
              <h3 className="mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={selectedPayment === "cash" ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center ${
                    selectedPayment === "cash" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedPayment("cash")}
                >
                  <span className="text-2xl mb-1">$</span>
                  <span>Cash</span>
                </Button>
                <Button
                  variant={selectedPayment === "bank" ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center ${
                    selectedPayment === "bank" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedPayment("bank")}
                >
                  <span className="text-2xl mb-1">🏦</span>
                  <span>Bank</span>
                </Button>
                <Button
                  variant={selectedPayment === "mobile" ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center ${
                    selectedPayment === "mobile" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedPayment("mobile")}
                >
                  <span className="text-2xl mb-1">📱</span>
                  <span>Mobile</span>
                </Button>
              </div>
            </div>

            {selectedPayment === "cash" && (
              <Input
                placeholder="Cash Received"
                type="number"
                className="bg-gray-700 border-gray-600"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={completePayment}>
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold">Sale Completed Successfully</h2>
            <div className="space-y-2 text-left">
              <p>
                <strong>Total:</strong> ${getTotal().toFixed(2)}
              </p>
              <p>
                <strong>Payment Method:</strong> {selectedPayment}
              </p>
              {selectedPayment === "cash" && cashReceived && (
                <>
                  <p>
                    <strong>Cash Received:</strong> ${Number.parseFloat(cashReceived).toFixed(2)}
                  </p>
                  <p>
                    <strong>Change:</strong> ${getChange().toFixed(2)}
                  </p>
                </>
              )}
            </div>
            <div>
              <h3 className="mb-2">Receipt Options:</h3>
              <Select>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select receipt method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="email" className="text-white">
                    Email
                  </SelectItem>
                  <SelectItem value="sms" className="text-white">
                    SMS
                  </SelectItem>
                  <SelectItem value="print" className="text-white">
                    Print
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Send Receipt</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Transaction History</DialogTitle>
                <p className="text-gray-400">View and search past transactions.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Input placeholder="Search transactions..." className="bg-gray-700 border-gray-600" />
            <Select>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                <SelectValue placeholder="All Transactions" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white">
                  All Transactions
                </SelectItem>
                <SelectItem value="today" className="text-white">
                  Today
                </SelectItem>
                <SelectItem value="week" className="text-white">
                  This Week
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 p-3 border-b border-gray-700 text-sm font-medium text-gray-400">
                <span>Invoice</span>
                <span>Date</span>
                <span>Customer</span>
                <span>Total</span>
                <span>Actions</span>
              </div>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-5 gap-4 p-3 hover:bg-gray-700 rounded">
                  <span className="text-sm">{transaction.id}</span>
                  <span className="text-sm">{transaction.date}</span>
                  <span className="text-sm">{transaction.customer}</span>
                  <span className="text-sm">${transaction.total.toFixed(2)}</span>
                  <Button variant="ghost" size="sm" className="justify-start p-0 h-auto">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
