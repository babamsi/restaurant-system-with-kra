"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Clock, Users, AlertTriangle } from "lucide-react"
import { useRecipeData } from "@/hooks/use-recipe-data"

interface CustomerMenuProps {
  onAddToCart: (recipeId: number, quantity: number) => void
}

export function EnhancedCustomerMenu({ onAddToCart }: CustomerMenuProps) {
  const { recipes, loading } = useRecipeData()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const categories = [...new Set(recipes.map((recipe) => recipe.category))]

  const getRecipesByCategory = (category: string) => {
    return recipes.filter((recipe) => recipe.category === category)
  }

  const updateQuantity = (recipeId: number, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [recipeId]: Math.max(1, Math.min(quantity, recipes.find((r) => r.id === recipeId)?.available_portions || 0)),
    }))
  }

  const handleAddToCart = (recipeId: number) => {
    const quantity = quantities[recipeId] || 1
    const recipe = recipes.find((r) => r.id === recipeId)

    if (recipe && recipe.available_portions >= quantity) {
      onAddToCart(recipeId, quantity)
      setQuantities((prev) => ({ ...prev, [recipeId]: 1 }))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Menu updates in real-time based on kitchen availability</span>
        </div>

        <Tabs defaultValue={categories[0] || "Main Course"}>
          <TabsList className="mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getRecipesByCategory(category).map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg overflow-hidden">
                    <div className="relative h-40">
                      <Image
                        src={`/placeholder.svg?height=160&width=300&text=${encodeURIComponent(recipe.name)}`}
                        alt={recipe.name}
                        fill
                        className="object-cover"
                      />
                      {recipe.available_portions === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{recipe.name}</h3>
                        <div className="text-right">
                          <p className="font-bold text-lg">${recipe.selling_price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">per portion</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={recipe.available_portions > 5 ? "default" : "secondary"} className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {recipe.available_portions} available
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          1 portion
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-4">
                        <div className="text-center">
                          <p className="font-medium">{recipe.nutritional_info.calories}</p>
                          <p>calories</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{recipe.nutritional_info.protein}g</p>
                          <p>protein</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{recipe.nutritional_info.carbs}g</p>
                          <p>carbs</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={recipe.available_portions === 0 || (quantities[recipe.id] || 1) <= 1}
                            onClick={() => updateQuantity(recipe.id, (quantities[recipe.id] || 1) - 1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={recipe.available_portions}
                            value={quantities[recipe.id] || 1}
                            onChange={(e) => updateQuantity(recipe.id, Number.parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                            disabled={recipe.available_portions === 0}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={
                              recipe.available_portions === 0 ||
                              (quantities[recipe.id] || 1) >= recipe.available_portions
                            }
                            onClick={() => updateQuantity(recipe.id, (quantities[recipe.id] || 1) + 1)}
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          disabled={recipe.available_portions === 0}
                          onClick={() => handleAddToCart(recipe.id)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
