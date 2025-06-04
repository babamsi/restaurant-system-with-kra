"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus } from "lucide-react"
import { useToast } from "@/components/ui/toast-context"

interface Ingredient {
  id: number
  name: string
  available: number
  unit: string
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export function IngredientUsageForm() {
  const { addToast } = useToast()
  const [ingredients] = useState<Ingredient[]>([
    { id: 1, name: "Onions", available: 15, unit: "kg", status: "In Stock" },
    { id: 2, name: "Bell Peppers", available: 10, unit: "kg", status: "In Stock" },
    { id: 3, name: "Garlic", available: 8, unit: "kg", status: "In Stock" },
    { id: 4, name: "Pasta", available: 20, unit: "kg", status: "In Stock" },
    { id: 5, name: "Chicken Breast", available: 3, unit: "kg", status: "Low Stock" },
    { id: 6, name: "Olive Oil", available: 2, unit: "bottles", status: "Low Stock" },
    { id: 7, name: "Brown Rice", available: 5, unit: "kg", status: "Low Stock" },
    { id: 8, name: "Fresh Tomatoes", available: 0, unit: "kg", status: "Out of Stock" },
  ])

  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [dish, setDish] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleIngredientSelect = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === Number.parseInt(id))
    if (ingredient) {
      setSelectedIngredient(ingredient)
      setQuantity(1)
    }
  }

  const handleQuantityChange = (value: number) => {
    if (selectedIngredient) {
      const newQuantity = Math.max(0.1, Math.min(selectedIngredient.available, quantity + value))
      setQuantity(Number.parseFloat(newQuantity.toFixed(1)))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIngredient && quantity > 0 && dish) {
      addToast({
        title: "Ingredient Usage Logged",
        description: `${quantity} ${selectedIngredient.unit} of ${selectedIngredient.name} used for ${dish}`,
        type: "success",
        duration: 3000,
      })

      // Reset form
      setSelectedIngredient(null)
      setQuantity(1)
      setDish("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Low Stock":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500 ml-2">
            Low
          </Badge>
        )
      case "Out of Stock":
        return (
          <Badge variant="destructive" className="ml-2">
            Out
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Ingredient Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient-search">Search Ingredients</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="ingredient-search"
                placeholder="Search ingredients..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient">Select Ingredient</Label>
            <Select
              value={selectedIngredient ? selectedIngredient.id.toString() : ""}
              onValueChange={handleIngredientSelect}
            >
              <SelectTrigger id="ingredient">
                <SelectValue placeholder="Select ingredient" />
              </SelectTrigger>
              <SelectContent>
                {filteredIngredients.map((ingredient) => (
                  <SelectItem
                    key={ingredient.id}
                    value={ingredient.id.toString()}
                    disabled={ingredient.status === "Out of Stock"}
                  >
                    <div className="flex items-center">
                      <span>
                        {ingredient.name} ({ingredient.available} {ingredient.unit} available)
                      </span>
                      {getStatusBadge(ingredient.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIngredient && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Used ({selectedIngredient.unit})</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => handleQuantityChange(-0.5)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  max={selectedIngredient.available}
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                  className="rounded-none text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => handleQuantityChange(0.5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Available: {selectedIngredient.available} {selectedIngredient.unit}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dish">For Dish</Label>
            <Select value={dish} onValueChange={setDish}>
              <SelectTrigger id="dish">
                <SelectValue placeholder="Select dish" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grilled Chicken Salad">Grilled Chicken Salad</SelectItem>
                <SelectItem value="Vegetable Stir Fry">Vegetable Stir Fry</SelectItem>
                <SelectItem value="Beef Lasagna">Beef Lasagna</SelectItem>
                <SelectItem value="Fresh Fruit Smoothie">Fresh Fruit Smoothie</SelectItem>
                <SelectItem value="Pasta Primavera">Pasta Primavera</SelectItem>
                <SelectItem value="Chicken Curry">Chicken Curry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={!selectedIngredient || quantity <= 0 || !dish}>
            Log Usage
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
