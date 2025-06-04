"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ChevronRight, Clock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Recipe {
  id: number
  name: string
  category: string
  prepTime: string
  servings: number
  ingredients: number
  image: string
  status: "Available" | "Missing Ingredients"
}

export function KitchenRecipes() {
  const [recipes] = useState<Recipe[]>([
    {
      id: 1,
      name: "Grilled Chicken Salad",
      category: "Salads",
      prepTime: "25 mins",
      servings: 4,
      ingredients: 8,
      image: "/grilled-chicken-salad.png",
      status: "Available",
    },
    {
      id: 2,
      name: "Vegetable Stir Fry",
      category: "Main Course",
      prepTime: "20 mins",
      servings: 3,
      ingredients: 10,
      image: "/vegetable-stir-fry.png",
      status: "Available",
    },
    {
      id: 3,
      name: "Beef Lasagna",
      category: "Main Course",
      prepTime: "45 mins",
      servings: 6,
      ingredients: 12,
      image: "/beef-lasagna.png",
      status: "Available",
    },
    {
      id: 4,
      name: "Fresh Fruit Smoothie",
      category: "Beverages",
      prepTime: "10 mins",
      servings: 2,
      ingredients: 5,
      image: "/fruit-smoothie.png",
      status: "Available",
    },
    {
      id: 5,
      name: "Tomato Pasta",
      category: "Main Course",
      prepTime: "30 mins",
      servings: 4,
      ingredients: 7,
      image: "/diverse-food-spread.png",
      status: "Missing Ingredients",
    },
    {
      id: 6,
      name: "Chicken Curry",
      category: "Main Course",
      prepTime: "35 mins",
      servings: 4,
      ingredients: 9,
      image: "/diverse-food-spread.png",
      status: "Available",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Available</Badge>
      case "Missing Ingredients":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Missing Ingredients
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recipes..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>Add New Recipe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="relative h-40">
              <Image src={recipe.image || "/placeholder.svg"} alt={recipe.name} fill className="object-cover" />
              <div className="absolute top-2 right-2">{getStatusBadge(recipe.status)}</div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg">{recipe.name}</h3>
              <p className="text-sm text-muted-foreground">{recipe.category}</p>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {recipe.servings} servings
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm">{recipe.ingredients} ingredients</span>
                <Button variant="outline" size="sm" className="group">
                  View Recipe
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
