import { create } from "zustand"
import { devtools } from "zustand/middleware"
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

  // Actions
  addRecipe: (recipe: RecipeWithAvailability) => void
  updateRecipe: (id: number, updates: Partial<RecipeWithAvailability>) => void
  updateAvailablePortions: (id: number, quantity: number, type: "add" | "subtract") => void
  getRecipe: (id: number) => RecipeWithAvailability | undefined
  getRecipesByCategory: (category: string) => RecipeWithAvailability[]
  getAvailableRecipes: () => RecipeWithAvailability[]
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
  {
    id: 3,
    name: "Grilled Salmon with Rice",
    category: "Main Course",
    default_yield: 1,
    ingredients: [
      {
        ingredient_id: 3,
        ingredient_name: "Fresh Salmon",
        quantity_per_batch: 0.18,
        unit: "kg",
        cost_per_unit: 22.0,
        total_cost: 3.96,
      },
      {
        ingredient_id: 4,
        ingredient_name: "Jasmine Rice",
        quantity_per_batch: 0.08,
        unit: "kg",
        cost_per_unit: 3.2,
        total_cost: 0.26,
      },
    ],
    total_raw_cost: 4.22,
    cost_per_portion: 4.22,
    selling_price: 18.99,
    markup_percentage: 350,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 28,
    prep_time: 20,
    nutritional_info: {
      calories: 520,
      protein: 42,
      carbs: 35,
      fat: 24,
    },
    portion_sizes: {
      small: { multiplier: 0.75, price_adjustment: -3.0 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.25, price_adjustment: 4.0 },
    },
  },
  {
    id: 4,
    name: "Vegetable Stir Fry",
    category: "Vegetarian",
    default_yield: 1,
    ingredients: [
      {
        ingredient_id: 9,
        ingredient_name: "Bell Peppers",
        quantity_per_batch: 0.12,
        unit: "kg",
        cost_per_unit: 6.5,
        total_cost: 0.78,
      },
      {
        ingredient_id: 8,
        ingredient_name: "Yellow Onions",
        quantity_per_batch: 0.08,
        unit: "kg",
        cost_per_unit: 2.2,
        total_cost: 0.18,
      },
      {
        ingredient_id: 4,
        ingredient_name: "Jasmine Rice",
        quantity_per_batch: 0.1,
        unit: "kg",
        cost_per_unit: 3.2,
        total_cost: 0.32,
      },
    ],
    total_raw_cost: 1.28,
    cost_per_portion: 1.28,
    selling_price: 9.99,
    markup_percentage: 680,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 38,
    prep_time: 12,
    nutritional_info: {
      calories: 320,
      protein: 8,
      carbs: 58,
      fat: 12,
    },
    portion_sizes: {
      small: { multiplier: 0.8, price_adjustment: -1.5 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.2, price_adjustment: 2.0 },
    },
  },
  {
    id: 5,
    name: "Fresh Orange Juice",
    category: "Beverages",
    default_yield: 1,
    ingredients: [],
    total_raw_cost: 1.2,
    cost_per_portion: 1.2,
    selling_price: 4.0,
    markup_percentage: 233,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 120,
    prep_time: 2,
    nutritional_info: {
      calories: 110,
      protein: 2,
      carbs: 26,
      fat: 0,
    },
    portion_sizes: {
      small: { multiplier: 0.6, price_adjustment: -1.5 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.5, price_adjustment: 2.0 },
    },
  },
  {
    id: 6,
    name: "Iced Coffee",
    category: "Beverages",
    default_yield: 1,
    ingredients: [],
    total_raw_cost: 0.8,
    cost_per_portion: 0.8,
    selling_price: 3.5,
    markup_percentage: 338,
    is_published: true,
    created_at: "2024-01-10",
    updated_at: "2024-01-15",
    available_portions: 85,
    prep_time: 3,
    nutritional_info: {
      calories: 25,
      protein: 1,
      carbs: 3,
      fat: 1,
    },
    portion_sizes: {
      small: { multiplier: 0.7, price_adjustment: -1.0 },
      regular: { multiplier: 1.0, price_adjustment: 0 },
      large: { multiplier: 1.4, price_adjustment: 1.5 },
    },
  },
]

export const useRecipesStore = create<RecipesState>()(
  devtools(
    (set, get) => ({
      recipes: initialRecipes,

      addRecipe: (recipe) =>
        set(
          (state) => ({
            recipes: [...state.recipes, recipe],
          }),
          false,
          "addRecipe",
        ),

      updateRecipe: (id, updates) =>
        set(
          (state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id ? { ...recipe, ...updates, updated_at: new Date().toISOString().split("T")[0] } : recipe,
            ),
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
          }),
          false,
          `updateAvailablePortions-${type}`,
        ),

      getRecipe: (id) => get().recipes.find((recipe) => recipe.id === id),

      getRecipesByCategory: (category) => get().recipes.filter((recipe) => recipe.category === category),

      getAvailableRecipes: () => get().recipes.filter((recipe) => recipe.available_portions > 0),
    }),
    { name: "recipes-store" },
  ),
)
