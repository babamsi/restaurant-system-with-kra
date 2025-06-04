"use client"

import { useState, useEffect, useCallback } from "react"
import { mockRecipes } from "@/data/mock-data"
import type { RecipeWithAvailability } from "@/data/mock-data"

interface RecipeWithNutrition extends RecipeWithAvailability {
  nutritional_info: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
}

export function useRecipeData() {
  const [recipes, setRecipes] = useState<RecipeWithNutrition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Add nutritional information to mock recipes
    const recipesWithNutrition: RecipeWithNutrition[] = mockRecipes.map((recipe) => ({
      ...recipe,
      nutritional_info: {
        calories: Math.floor(Math.random() * 300) + 200, // 200-500 calories
        protein: Math.floor(Math.random() * 25) + 10, // 10-35g protein
        carbs: Math.floor(Math.random() * 40) + 15, // 15-55g carbs
        fat: Math.floor(Math.random() * 20) + 5, // 5-25g fat
        fiber: Math.floor(Math.random() * 8) + 2, // 2-10g fiber
        sodium: Math.floor(Math.random() * 400) + 200, // 200-600mg sodium
      },
    }))

    // Simulate API call delay
    setTimeout(() => {
      setRecipes(recipesWithNutrition)
      setLoading(false)
    }, 1000)

    // Simulate real-time updates from kitchen
    const interval = setInterval(() => {
      setRecipes((prev) =>
        prev.map((recipe) => ({
          ...recipe,
          // Randomly update available portions to simulate kitchen activity
          available_portions: Math.max(0, recipe.available_portions + Math.floor(Math.random() * 3) - 1),
        })),
      )
    }, 45000) // Update every 45 seconds

    return () => clearInterval(interval)
  }, [])

  const updatePortions = useCallback((recipeId: number, quantityOrdered: number) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, available_portions: Math.max(0, recipe.available_portions - quantityOrdered) }
          : recipe,
      ),
    )
  }, [])

  return {
    recipes: recipes.filter((r) => r.is_published),
    loading,
    updatePortions,
  }
}
