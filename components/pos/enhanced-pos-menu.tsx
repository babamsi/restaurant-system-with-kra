"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart, Plus, Minus, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockMenuItems, mockRecipes } from "@/data/mock-data"
import type { MenuItem, RecipeWithAvailability } from "@/data/mock-data"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  portionSize: string
  category: string
  prep_time?: number
}

export function EnhancedPOSMenu() {
  const { toast } = useToast()
  const [menuItems] = useState<MenuItem[]>(mockMenuItems)
  const [recipes] = useState<RecipeWithAvailability[]>(mockRecipes)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  const getRecipeAvailability = (recipeId: number) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    return recipe ? recipe.available_portions : 0
  }

  const getItemPrice = (item: MenuItem, portionSize: string) => {
    if (item.linked_recipe_id === 0) return item.price // Beverages don't have portion sizes

    const recipe = recipes.find((r) => r.id === item.linked_recipe_id)
    if (!recipe) return item.price

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
    if (item.linked_recipe_id > 0) {
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
      prep_time: recipe?.prep_time,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const availability = item.linked_recipe_id > 0 ? getRecipeAvailability(item.linked_recipe_id) : 999
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
                              {item.tags.map((tag) => (
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
                                {recipe.prep_time}m
                              </div>
                            )}
                          </div>
                        </div>

                        {availability < 999 && (
                          <div className="text-xs">
                            <Badge variant={isAvailable ? "default" : "destructive"}>
                              {availability} portions available
                            </Badge>
                          </div>
                        )}

                        {item.linked_recipe_id > 0 && isAvailable ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(item, "small")}
                              className="flex-1"
                            >
                              Small ${getItemPrice(item, "small").toFixed(2)}
                            </Button>
                            <Button size="sm" onClick={() => addToCart(item, "regular")} className="flex-1">
                              Regular ${getItemPrice(item, "regular").toFixed(2)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(item, "large")}
                              className="flex-1"
                            >
                              Large ${getItemPrice(item, "large").toFixed(2)}
                            </Button>
                          </div>
                        ) : item.linked_recipe_id === 0 ? (
                          <Button size="sm" onClick={() => addToCart(item)} className="w-full">
                            Add to Cart - ${item.price.toFixed(2)}
                          </Button>
                        ) : (
                          <Button size="sm" disabled className="w-full">
                            Out of Stock
                          </Button>
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

      {/* Cart */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({calculateTotalItems()})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.portionSize} - ${item.price.toFixed(2)}
                          {item.prep_time && (
                            <span className="ml-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.prep_time}m
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>

                  <Button onClick={processOrder} className="w-full">
                    Process Order
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
