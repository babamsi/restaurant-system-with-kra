"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockMenuItems } from "@/data/mock-data"
import type { MenuItem } from "@/data/mock-data"

interface CleanPOSMenuProps {
  cartItems: any[]
  onAddToCart: (item: MenuItem, quantity: number, portionSize: string) => void
  onUpdateQuantity: (itemKey: string, change: number) => void
  onRemoveItem: (itemKey: string) => void
  onClearCart: () => void
  calculateTotal: () => number
  calculateTotalItems: () => number
}

export function CleanPOSMenu({
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  calculateTotal,
  calculateTotalItems,
}: CleanPOSMenuProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...Array.from(new Set(mockMenuItems.map((item) => item.category)))]

  const filteredItems = mockMenuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getItemPrice = (item: MenuItem, portionSize: string) => {
    const multiplier = portionSize === "small" ? 0.8 : portionSize === "large" ? 1.2 : 1
    return item.price * multiplier
  }

  const processOrder = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing order",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Order Processed",
      description: `Order total: $${calculateTotal().toFixed(2)} - Sent to kitchen`,
    })

    onClearCart()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {item.linked_recipe_id > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToCart(item, 1, "small")}
                        className="text-xs"
                      >
                        Small
                        <br />${getItemPrice(item, "small").toFixed(2)}
                      </Button>
                      <Button size="sm" onClick={() => onAddToCart(item, 1, "regular")} className="text-xs">
                        Regular
                        <br />${getItemPrice(item, "regular").toFixed(2)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToCart(item, 1, "large")}
                        className="text-xs"
                      >
                        Large
                        <br />${getItemPrice(item, "large").toFixed(2)}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => onAddToCart(item, 1, "regular")} className="w-full">
                      Add to Cart - ${item.price.toFixed(2)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({calculateTotalItems()})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.itemKey} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.portionSize} - ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateQuantity(item.itemKey, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateQuantity(item.itemKey, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => onRemoveItem(item.itemKey)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={onClearCart}>
                      Clear Cart
                    </Button>
                    <Button onClick={processOrder}>Process Order</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
