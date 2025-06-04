import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { Recipe } from "@/types/operational"

interface RecipeWithAvailability extends Recipe {
  available_portions: number
  prep_time: number
  nutritional_info: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  portion_sizes: {
    small: { multiplier: number; price_adjustment: number }
    regular: { multiplier: number; price_adjustment: number }
    large: { multiplier: number; price_adjustment: number }
  }
}

interface RecipesState {
  recipes: RecipeWithAvailability[]
  lastUpdated: string
  availableIngredients: any[]

  // Actions
  addRecipe: (recipe: Omit<RecipeWithAvailability, "id" | "created_at" | "updated_at">) => RecipeWithAvailability
  updateRecipe: (id: number, updates: Partial<RecipeWithAvailability>) => void
  updateAvailablePortions: (id: number, quantity: number, type: "add" | "subtract") => void
  publishRecipe: (id: number) => void
  unpublishRecipe: (id: number) => void
  getRecipe: (id: number) => RecipeWithAvailability | undefined
  getRecipesByCategory: (category: string) => RecipeWithAvailability[]
  getAvailableRecipes: () => RecipeWithAvailability[]
  getPublishedRecipes: () => RecipeWithAvailability[]
  calculateAvailablePortions: (recipeId: number) => number

  // Sync actions
  updateAvailableIngredients: (ingredients: any[]) => void
  notifyPOSStore: () => void
}

const initialRecipes: RecipeWithAvailability[] = [
  {
    id: 1,
    name: "Grilled Chicken Caesar Salad",
    category: "Main Course",
    default_yield: 1,
    ingredients: [
      {
        ingredient_id: 1,
        ingredient_name: "Chicken Breast",
        quantity_per_batch: 0.2,
        unit: "kg",
        cost_per_unit: 8.5,
        total_cost: 1.7,
      },
      {
        ingredient_id: 6,
        ingredient_name: "Fresh Lettuce",
        quantity_per_batch: 0.15,
        unit: "kg",
        cost_per_unit: 4.5,
        total_cost: 0.68,
      },
      {
        ingredient_id: 12,
        ingredient_name: "Cheddar Cheese",
        quantity_per_batch: 0.05,
        unit: "kg",
        cost_per_unit: 15.5,
        total_cost: 0.78,
      },
    ],
    total_raw_cost: 3.16,
    cost_per_portion: 3.16,
    selling_price: 12.99,
    markup_percentage: 311,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 45,
    prep_time: 15,
    nutritional_info: {
      calories: 420,
      protein: 35,
      carbs: 12,
      fat: 18,
    },
    portion_sizes: {
      small: { multiplier: 0.7, price_adjustment: -2.0 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.4, price_adjustment: 3.0 },
    },
  },
  {
    id: 2,
    name: "Beef Pasta Bolognese",
    category: "Main Course",
    default_yield: 1,
    ingredients: [
      {
        ingredient_id: 2,
        ingredient_name: "Ground Beef",
        quantity_per_batch: 0.15,
        unit: "kg",
        cost_per_unit: 12.0,
        total_cost: 1.8,
      },
      {
        ingredient_id: 5,
        ingredient_name: "Pasta",
        quantity_per_batch: 0.12,
        unit: "kg",
        cost_per_unit: 2.8,
        total_cost: 0.34,
      },
      {
        ingredient_id: 7,
        ingredient_name: "Roma Tomatoes",
        quantity_per_batch: 0.1,
        unit: "kg",
        cost_per_unit: 3.8,
        total_cost: 0.38,
      },
    ],
    total_raw_cost: 2.52,
    cost_per_portion: 2.52,
    selling_price: 14.99,
    markup_percentage: 495,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 32,
    prep_time: 25,
    nutritional_info: {
      calories: 580,
      protein: 28,
      carbs: 65,
      fat: 22,
    },
    portion_sizes: {
      small: { multiplier: 0.8, price_adjustment: -2.5 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.3, price_adjustment: 3.5 },
    },
  },
]

export const useSynchronizedRecipesStore = create<RecipesState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      recipes: initialRecipes,
      lastUpdated: new Date().toISOString(),
      availableIngredients: [],

      addRecipe: (recipeData) => {
        const newRecipe: RecipeWithAvailability = {
          ...recipeData,
          id: Math.max(...get().recipes.map((r) => r.id), 0) + 1,
          created_at: new Date().toISOString().split("T")[0],
          updated_at: new Date().toISOString().split("T")[0],
        }

        set(
          (state) => ({
            recipes: [...state.recipes, newRecipe],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "addRecipe",
        )

        return newRecipe
      },

      updateRecipe: (id, updates) =>
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id ? { ...recipe, ...updates, updated_at: new Date().toISOString().split("T")[0] } : recipe,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateRecipe",
        ),

      updateAvailablePortions: (id, quantity, type) =>
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id
                ? {
                    ...recipe,
                    available_portions:
                      type === "add"
                        ? recipe.available_portions + quantity
                        : Math.max(0, recipe.available_portions - quantity),
                  }
                : recipe,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          `updateAvailablePortions-${type}`,
        ),

      publishRecipe: (id) => {
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id
                ? { ...recipe, is_published: true, updated_at: new Date().toISOString().split("T")[0] }
                : recipe,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "publishRecipe",
        )

        // Notify POS store
        get().notifyPOSStore()
      },

      unpublishRecipe: (id) => {
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id
                ? { ...recipe, is_published: false, updated_at: new Date().toISOString().split("T")[0] }
                : recipe,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "unpublishRecipe",
        )

        // Notify POS store
        get().notifyPOSStore()
      },

      getRecipe: (id) => get().recipes.find((recipe) => recipe.id === id),

      getRecipesByCategory: (category) => get().recipes.filter((recipe) => recipe.category === category),

      getAvailableRecipes: () => get().recipes.filter((recipe) => recipe.available_portions > 0),

      getPublishedRecipes: () => get().recipes.filter((recipe) => recipe.is_published),

      calculateAvailablePortions: (recipeId) => {
        const recipe = get().getRecipe(recipeId)
        if (!recipe) return 0

        let minPortions = Number.POSITIVE_INFINITY

        for (const ingredient of recipe.ingredients) {
          const stockIngredient = get().availableIngredients.find((ing) => ing.id === ingredient.ingredient_id)
          if (stockIngredient) {
            const possiblePortions = Math.floor(stockIngredient.current_stock / ingredient.quantity_per_batch)
            minPortions = Math.min(minPortions, possiblePortions)
          }
        }

        return minPortions === Number.POSITIVE_INFINITY ? 0 : Math.min(minPortions, recipe.available_portions)
      },

      updateAvailableIngredients: (ingredients) =>
        set(
          (state) => ({
            availableIngredients: ingredients,
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateAvailableIngredients",
        ),

      notifyPOSStore: () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("recipes-updated", {
              detail: {
                recipes: get().getPublishedRecipes(),
                timestamp: get().lastUpdated,
              },
            }),
          )
        }
      },
    })),
    { name: "synchronized-recipes-store" },
  ),
)

// Listen for inventory updates
if (typeof window !== "undefined") {
  window.addEventListener("inventory-updated", (event: any) => {
    const { ingredients } = event.detail
    useSynchronizedRecipesStore.getState().updateAvailableIngredients(ingredients)
  })
}
