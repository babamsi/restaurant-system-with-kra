"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart, Plus, Minus, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockMenuItems, mockRecipes } from "@/data/unified-mock-data"
import type { MenuItem } from "@/types/unified-system"
import type { Recipe } from "@/types/operational"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  portionSize: string
  category: string
  prep_time_minutes?: number
}

export function EnhancedPOSMenu() {
  const { toast } = useToast()
  const [menuItems] = useState<MenuItem[]>(mockMenuItems)
  const [recipes] = useState<Recipe[]>(mockRecipes)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  const getRecipeAvailability = (recipeId: number) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    return recipe ? recipe.available_portions : 0
  }

  const getItemPrice = (item: MenuItem, portionSize: string) => {
    if (!item.linked_recipe_id) return item.price // Beverages don't have portion sizes

    const recipe = recipes.find((r) => r.id === item.linked_recipe_id)
    if (!recipe || !recipe.portion_sizes) return item.price

    switch (portionSize) {
      case "small":
        return item.price + recipe.portion_sizes.small.price_adjustment
      case "large":
        return item.price + recipe.portion_sizes.large.price_adjustment
      default:
        return item.price
    }
  }

  const addToCart = (item: MenuItem, portionSize = "regular") => {
    if (item.linked_recipe_id) {
      const availability = getRecipeAvailability(item.linked_recipe_id)
      if (availability <= 0) {
        toast({
          title: "Out of Stock",
          description: `${item.name} is currently out of stock`,
          variant: "destructive",
        })
        return
      }
    }

    const price = getItemPrice(item, portionSize)
    const recipe = recipes.find((r) => r.id === item.linked_recipe_id)

    const cartItem: CartItem = {
      id: `${item.id}-${portionSize}-${Date.now()}`,
      name: item.name,
      price: price,
      quantity: 1,
      portionSize: portionSize,
      category: item.category,
      prep_time_minutes: recipe?.prep_time_minutes,
    }

    setCart((prev) => [...prev, cartItem])

    toast({
      title: "Added to Cart",
      description: `${item.name} (${portionSize}) - $${price.toFixed(2)}`,
    })
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const processOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing order",
        variant: "destructive",
      })
      return
    }

    // Here we would process the order and update inventory/recipes
    toast({
      title: "Order Processed",
      description: `Order total: $${calculateTotal().toFixed(2)} - Sent to kitchen`,
    })

    setCart([])
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Menu Items</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const availability = item.linked_recipe_id ? getRecipeAvailability(item.linked_recipe_id) : 999
                const recipe = recipes.find((r) => r.id === item.linked_recipe_id)
                const isAvailable = availability > 0

                return (
                  <Card key={item.id} className={`${!isAvailable ? "opacity-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex gap-1 mt-1">
                              {item.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${item.price.toFixed(2)}</p>
                            {recipe && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {recipe.prep_time_minutes}m
                              </div>
                            )}
                          </div>
                        </div>
                        {isAvailable && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(item, "small")}
                              className="flex-1"
                            >
                              Small
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(item, "regular")}
                              className="flex-1"
                            >
                              Regular
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(item, "large")}
                              className="flex-1"
                            >
                              Large
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Cart</CardTitle>
              <Badge variant="outline" className="text-sm">
                {calculateTotalItems()} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.portionSize} - ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <Button className="w-full" onClick={processOrder}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Process Order
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
