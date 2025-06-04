"use client"

import { useCompleteInventoryStore } from "@/stores/complete-inventory-store"
import { useCompleteKitchenStore } from "@/stores/complete-kitchen-store"

// ✅ SIMPLIFIED: Pure debug hook - no complex sync logic
export function useInventoryKitchenSync() {
  // ✅ Direct subscriptions to store state
  const ingredients = useCompleteInventoryStore((state) => state.ingredients)
  const recipes = useCompleteKitchenStore((state) => state.recipes)

  return {
    ingredients,
    recipes,
    totalIngredients: ingredients.length,
    availableIngredients: ingredients.filter((ing) => ing.current_stock > 0).length,
  }
}
