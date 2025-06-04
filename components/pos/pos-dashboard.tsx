"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Receipt, History, CreditCard } from "lucide-react"
import { CleanPOSMenu } from "@/components/pos/clean-pos-menu"
import { POSPayment } from "@/components/pos/pos-payment"
import { POSHistory } from "@/components/pos/pos-history"
import { POSReceipts } from "@/components/pos/pos-receipts"

interface POSDashboardProps {
  view?: "pos" | "payment" | "history" | "receipts"
}

export function POSDashboard({ view = "pos" }: POSDashboardProps) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("menu")

  const addToCart = (item: any, quantity: number, portionSize: string) => {
    if (quantity <= 0) return

    const itemKey = `${item.id}-${portionSize}-${Date.now()}`
    const portionMultiplier = portionSize === "small" ? 0.8 : portionSize === "large" ? 1.2 : 1
    const adjustedPrice = item.price * portionMultiplier

    const cartItem = {
      ...item,
      quantity,
      portionSize,
      price: adjustedPrice,
      itemKey,
    }

    setCartItems([...cartItems, cartItem])
  }

  const updateQuantity = (itemKey: string, change: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.itemKey === itemKey) {
          const newQuantity = Math.max(1, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      }),
    )
  }

  const removeItem = (itemKey: string) => {
    setCartItems(cartItems.filter((item) => item.itemKey !== itemKey))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground">Process sales efficiently with our streamlined POS system</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Menu & Cart
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <CleanPOSMenu
              cartItems={cartItems}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              calculateTotal={calculateTotal}
              calculateTotalItems={calculateTotalItems}
            />
          </TabsContent>

          <TabsContent value="payment">
            <POSPayment onClearCart={clearCart} />
          </TabsContent>

          <TabsContent value="history">
            <POSHistory />
          </TabsContent>

          <TabsContent value="receipts">
            <POSReceipts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
