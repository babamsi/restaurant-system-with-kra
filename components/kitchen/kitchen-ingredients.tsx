"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Ingredient {
  id: number
  name: string
  category: string
  available: number
  unit: string
  lastUsed: string
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export function KitchenIngredients() {
  const [ingredients] = useState<Ingredient[]>([
    { id: 1, name: "Onions", category: "Vegetables", available: 15, unit: "kg", lastUsed: "Today", status: "In Stock" },
    {
      id: 2,
      name: "Bell Peppers",
      category: "Vegetables",
      available: 10,
      unit: "kg",
      lastUsed: "Today",
      status: "In Stock",
    },
    {
      id: 3,
      name: "Garlic",
      category: "Vegetables",
      available: 8,
      unit: "kg",
      lastUsed: "Yesterday",
      status: "In Stock",
    },
    { id: 4, name: "Pasta", category: "Grains", available: 20, unit: "kg", lastUsed: "3 days ago", status: "In Stock" },
    {
      id: 5,
      name: "Chicken Breast",
      category: "Meat",
      available: 3,
      unit: "kg",
      lastUsed: "Today",
      status: "Low Stock",
    },
    {
      id: 6,
      name: "Olive Oil",
      category: "Oils",
      available: 2,
      unit: "bottles",
      lastUsed: "Yesterday",
      status: "Low Stock",
    },
    {
      id: 7,
      name: "Brown Rice",
      category: "Grains",
      available: 5,
      unit: "kg",
      lastUsed: "2 days ago",
      status: "Low Stock",
    },
    {
      id: 8,
      name: "Fresh Tomatoes",
      category: "Vegetables",
      available: 0,
      unit: "kg",
      lastUsed: "3 days ago",
      status: "Out of Stock",
    },
    { id: 9, name: "Beef", category: "Meat", available: 7, unit: "kg", lastUsed: "Today", status: "In Stock" },
    {
      id: 10,
      name: "Potatoes",
      category: "Vegetables",
      available: 25,
      unit: "kg",
      lastUsed: "Yesterday",
      status: "In Stock",
    },
    { id: 11, name: "Milk", category: "Dairy", available: 12, unit: "liters", lastUsed: "Today", status: "In Stock" },
    { id: 12, name: "Eggs", category: "Dairy", available: 60, unit: "pieces", lastUsed: "Today", status: "In Stock" },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredIngredients = ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-200">In Stock</Badge>
      case "Low Stock":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return null
    }
  }

  // Group ingredients by category
  const groupedIngredients = filteredIngredients.reduce(
    (acc, ingredient) => {
      if (!acc[ingredient.category]) {
        acc[ingredient.category] = []
      }
      acc[ingredient.category].push(ingredient)
      return acc
    },
    {} as Record<string, Ingredient[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ingredients..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList className="w-32 mb-4">
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map((ingredient) => (
              <Card key={ingredient.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{ingredient.name}</h3>
                      <p className="text-sm text-muted-foreground">{ingredient.category}</p>
                    </div>
                    {getStatusBadge(ingredient.status)}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">
                        {ingredient.available} {ingredient.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">Last used: {ingredient.lastUsed}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="category" className="mt-0">
          <div className="space-y-6">
            {Object.entries(groupedIngredients).map(([category, items]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((ingredient) => (
                      <div key={ingredient.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{ingredient.name}</h3>
                          {getStatusBadge(ingredient.status)}
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm">
                            {ingredient.available} {ingredient.unit}
                          </p>
                          <Button variant="outline" size="sm">
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
