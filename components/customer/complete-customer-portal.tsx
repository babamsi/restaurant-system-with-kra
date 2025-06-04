"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"

export function CompleteCustomerPortal() {
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
  } = useCompletePOSStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [dietaryFilter, setDietaryFilter] = useState("All")
  const [calorieFilter, setCalorieFilter] = useState("All")
  const [favorites, setFavorites] = useState<string[]>([])

  const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  const filteredMenuItems = getAvailableMenuItems().filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory

    let matchesDietary = true
    if (dietaryFilter === "Low Calorie") {
      matchesDietary = item.nutrition.calories < 300
    } else if (dietaryFilter === "High Protein") {
      matchesDietary = item.nutrition.protein > 20
    } else if (dietaryFilter === "Low Carb") {
      matchesDietary = item.nutrition.carbs < 20
    }

    let matchesCalorie = true
    if (calorieFilter === "Under 200") {
      matchesCalorie = item.nutrition.calories < 200
    } else if (calorieFilter === "200-400") {
      matchesCalorie = item.nutrition.calories >= 200 && item.nutrition.calories <= 400
    } else if (calorieFilter === "Over 400") {
      matchesCalorie = item.nutrition.calories > 400
    }

    return matchesSearch && matchesCategory && matchesDietary && matchesCalorie
  })

  const handleAddToCart = (menuItem: any, quantity = 1) => {
    // Default quantity for individual ingredients is 100g/100ml
    const defaultQuantity = menuItem.type === "individual" ? 100 : 1
    const actualQuantity = quantity || defaultQuantity

    if (menuItem.available_quantity < actualQuantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${Math.floor(menuItem.available_quantity)}${menuItem.type === "individual" ? menuItem.display_unit : " available"}`,
        variant: "destructive",
      })
      return
    }

    addToCart(menuItem, actualQuantity)

    const displayQuantity =
      menuItem.type === "individual"
        ? `${actualQuantity}${menuItem.display_unit}`
        : `${actualQuantity} meal${actualQuantity > 1 ? "s" : ""}`

    toast({
      title: "Added to Cart",
      description: `${displayQuantity} of ${menuItem.name} added to your order`,
    })
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const getTotal = () => {
    return getCartTotal() * 1.16 // Including 16% tax
  }

  const completeOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before ordering",
        variant: "destructive",
      })
      return
    }

    const cartNutrition = getCartNutrition()

    const order = createOrder({
      items: cart,
      customer_name: customerName || undefined,
      order_type: "takeaway",
      subtotal: getCartTotal(),
      tax: getCartTotal() * 0.16,
      total: getTotal(),
      total_nutrition: cartNutrition,
      status: "pending",
    })

    // Sync with main orders store for immediate visibility in /orders
    useOrdersStore.getState().addOrder({
      id: order.id,
      tableNumber: "Online Order",
      customerName: customerName || "Online Customer",
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        portionSize: "regular",
        price: item.unit_price,
      })),
      status: "incoming",
      total: order.total,
      createdAt: new Date(),
      updatedAt: new Date(),
      specialInstructions: "Customer Portal Order",
    })

    setShowCheckout(false)
    setShowCart(false)

    toast({
      title: "Order Placed Successfully!",
      description: `Your order ${order.id} has been received. You'll be notified when it's ready.`,
    })

    setCustomerName("")
    setCustomerPhone("")
  }

  const getNutritionColor = (value: number, type: string) => {
    if (type === "calories") {
      if (value < 200) return "text-green-600"
      if (value < 400) return "text-yellow-600"
      return "text-red-600"
    }
    if (type === "protein") {
      if (value > 20) return "text-green-600"
      if (value > 10) return "text-yellow-600"
      return "text-red-600"
    }
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">Maamul Cafeteria</h1>
              <Badge variant="secondary" className="text-xs">
                {menuItems.length} items available
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search delicious food..."
                  className="pl-10 w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="outline" className="relative" onClick={() => setShowCart(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({getCartItemCount()})
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 flex-wrap">
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

            <Select value={dietaryFilter} onValueChange={setDietaryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dietary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Dietary</SelectItem>
                <SelectItem value="Low Calorie">Low Calorie</SelectItem>
                <SelectItem value="High Protein">High Protein</SelectItem>
                <SelectItem value="Low Carb">Low Carb</SelectItem>
              </SelectContent>
            </Select>

            <Select value={calorieFilter} onValueChange={setCalorieFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Calories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Calories</SelectItem>
                <SelectItem value="Under 200">Under 200</SelectItem>
                <SelectItem value="200-400">200-400</SelectItem>
                <SelectItem value="Over 400">Over 400</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {filteredMenuItems.length} items found
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-8">
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Items Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">{item.type === "recipe" ? "🍽️" : "🥘"}</span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {item.type === "recipe" && item.prep_time_minutes && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.prep_time_minutes}m
                        </Badge>
                      )}
                      {item.nutrition.calories < 300 && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <Leaf className="h-3 w-3 mr-1" />
                          Low Cal
                        </Badge>
                      )}
                      {item.nutrition.protein > 20 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          <Zap className="h-3 w-3 mr-1" />
                          High Protein
                        </Badge>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${favorites.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                      />
                    </Button>

                    {/* Availability */}
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {item.type === "individual"
                          ? `${Math.floor(item.available_quantity)}${item.display_unit}`
                          : `${item.available_quantity} available`}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.8</span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    {/* Nutrition Info */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span>Calories:</span>
                          <span className={`font-medium ${getNutritionColor(item.nutrition.calories, "calories")}`}>
                            {Math.round(item.nutrition.calories)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Protein:</span>
                          <span className={`font-medium ${getNutritionColor(item.nutrition.protein, "protein")}`}>
                            {Math.round(item.nutrition.protein)}g
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Carbs:</span>
                          <span className="font-medium">{Math.round(item.nutrition.carbs)}g</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Fat:</span>
                          <span className="font-medium">{Math.round(item.nutrition.fat)}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          {item.type === "individual" ? (
                            <>
                              ${item.price.toFixed(3)}
                              <span className="text-sm text-muted-foreground ml-1">per {item.display_unit}</span>
                            </>
                          ) : (
                            `$${item.price.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item, item.type === "individual" ? 100 : 1)}
                        disabled={item.available_quantity === 0}
                        className="group-hover:scale-105 transition-transform"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {item.type === "individual" ? `Add 100${item.display_unit}` : "Add"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Order ({getCartItemCount()} items)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add some delicious items!</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              ${item.unit_price.toFixed(2)} {item.unit && `per ${item.unit}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
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

                {/* Nutrition Summary */}
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Total Nutrition
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium">{Math.round(getCartNutrition().calories)}</p>
                      <p className="text-muted-foreground">calories</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{Math.round(getCartNutrition().protein)}g</p>
                      <p className="text-muted-foreground">protein</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{Math.round(getCartNutrition().carbs)}g</p>
                      <p className="text-muted-foreground">carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{Math.round(getCartNutrition().fat)}g</p>
                      <p className="text-muted-foreground">fat</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (16%):</span>
                    <span>${(getCartTotal() * 0.16).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearCart}>
                    Clear Cart
                  </Button>
                  <Button className="flex-1" onClick={() => setShowCheckout(true)}>
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Input placeholder="Your Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (16%):</span>
                <span>${(getCartTotal() * 0.16).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={completeOrder}>
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
