"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, Trash2, ShoppingCart, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRecipeData } from "@/hooks/use-recipe-data"
import type { Order, OrderItem } from "@/types/order"
import { useOrders } from "@/contexts/orders-context"

interface CartItem {
  recipeId: number
  recipeName: string
  quantity: number
  pricePerPortion: number
  totalPrice: number
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface EnhancedCustomerCartProps {
  cartItems: CartItem[]
  onUpdateQuantity: (recipeId: number, newQuantity: number) => void
  onRemoveItem: (recipeId: number) => void
  onClearCart: () => void
}

export function EnhancedCustomerCart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: EnhancedCustomerCartProps) {
  const { toast } = useToast()
  const { updatePortions } = useRecipeData()
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    tableNumber: "",
    specialInstructions: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addOrder } = useOrders()

  const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0)
  const tax = subtotal * 0.16 // 16% VAT
  const total = subtotal + tax

  const totalNutrition = cartItems.reduce(
    (totals, item) => ({
      calories: totals.calories + item.nutritionalInfo.calories * item.quantity,
      protein: totals.protein + item.nutritionalInfo.protein * item.quantity,
      carbs: totals.carbs + item.nutritionalInfo.carbs * item.quantity,
      fat: totals.fat + item.nutritionalInfo.fat * item.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      })
      return
    }

    if (!customerInfo.name.trim()) {
      toast({
        title: "Customer Information Required",
        description: "Please enter your name to place an order",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create order items with proper portion sizes
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        id: `item-${item.recipeId}-${Date.now()}`,
        name: item.recipeName,
        quantity: item.quantity,
        portionSize: "regular", // Default portion size - can be enhanced later
        price: item.pricePerPortion,
        specialInstructions: customerInfo.specialInstructions || undefined,
      }))

      // Create order object
      const order: Order = {
        id: `ORD-${Date.now()}`,
        tableNumber: customerInfo.tableNumber || undefined,
        customerName: customerInfo.name,
        items: orderItems,
        status: "incoming",
        total: total,
        createdAt: new Date(),
        updatedAt: new Date(),
        specialInstructions: customerInfo.specialInstructions || undefined,
      }

      // Simulate API call to submit order
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update available portions for each recipe
      cartItems.forEach((item) => {
        updatePortions(item.recipeId, item.quantity)
      })

      // Add order to the orders system
      addOrder(order)

      toast({
        title: "Order Placed Successfully!",
        description: `Order ${order.id} has been sent to the kitchen. Estimated time: 15-20 minutes.`,
      })

      // Clear cart and customer info
      onClearCart()
      setCustomerInfo({
        name: "",
        phone: "",
        tableNumber: "",
        specialInstructions: "",
      })
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Your Order ({cartItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cartItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.recipeId} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.recipeName}</p>
                      <p className="text-sm text-muted-foreground">${item.pricePerPortion.toFixed(2)} per portion</p>
                    </div>
                    <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.recipeId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.recipeId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => onRemoveItem(item.recipeId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-medium">{item.nutritionalInfo.calories * item.quantity}</p>
                      <p>cal</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{item.nutritionalInfo.protein * item.quantity}g</p>
                      <p>protein</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{item.nutritionalInfo.carbs * item.quantity}g</p>
                      <p>carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{item.nutritionalInfo.fat.toFixed(1)}g</p>
                      <p>fat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (16%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Nutritional Summary */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-sm mb-2">Total Nutritional Information</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-medium">{totalNutrition.calories}</p>
                  <p className="text-muted-foreground">calories</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{totalNutrition.protein.toFixed(1)}g</p>
                  <p className="text-muted-foreground">protein</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{totalNutrition.carbs.toFixed(1)}g</p>
                  <p className="text-muted-foreground">carbs</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{totalNutrition.fat.toFixed(1)}g</p>
                  <p className="text-muted-foreground">fat</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customer-name">Name *</Label>
                  <Input
                    id="customer-name"
                    placeholder="Your name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="table-number">Table Number</Label>
                  <Input
                    id="table-number"
                    placeholder="e.g., 12A"
                    value={customerInfo.tableNumber}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, tableNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Your phone number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Input
                  id="special-instructions"
                  placeholder="Any special requests or dietary notes"
                  value={customerInfo.specialInstructions}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full"
          disabled={cartItems.length === 0 || isSubmitting || !customerInfo.name.trim()}
          onClick={handleSubmitOrder}
        >
          {isSubmitting ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}
        </Button>
        {cartItems.length > 0 && (
          <Button variant="outline" className="w-full" onClick={onClearCart} disabled={isSubmitting}>
            Clear Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
