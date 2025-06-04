import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Ingredient } from "@/types/operational"

interface InventoryState {
  ingredients: Ingredient[]

  // Actions
  addIngredient: (ingredient: Ingredient) => void
  updateIngredient: (id: number, updates: Partial<Ingredient>) => void
  updateStock: (id: number, quantity: number, type: "add" | "subtract") => void
  updateCost: (id: number, newCost: number) => void
  getIngredient: (id: number) => Ingredient | undefined
  getLowStockItems: () => Ingredient[]
  getOutOfStockItems: () => Ingredient[]
  getTotalValue: () => number
}

const initialIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Chicken Breast",
    unit: "kg",
    cost_per_unit: 8.5,
    current_stock: 25,
    threshold: 5,
    category: "Proteins",
    supplier_id: 1,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 2,
    name: "Ground Beef",
    unit: "kg",
    cost_per_unit: 12.0,
    current_stock: 18,
    threshold: 4,
    category: "Proteins",
    supplier_id: 1,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 3,
    name: "Fresh Salmon",
    unit: "kg",
    cost_per_unit: 22.0,
    current_stock: 8,
    threshold: 3,
    category: "Proteins",
    supplier_id: 2,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 4,
    name: "Jasmine Rice",
    unit: "kg",
    cost_per_unit: 3.2,
    current_stock: 45,
    threshold: 15,
    category: "Grains",
    supplier_id: 3,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 5,
    name: "Pasta",
    unit: "kg",
    cost_per_unit: 2.8,
    current_stock: 32,
    threshold: 10,
    category: "Grains",
    supplier_id: 3,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 6,
    name: "Fresh Lettuce",
    unit: "kg",
    cost_per_unit: 4.5,
    current_stock: 12,
    threshold: 3,
    category: "Vegetables",
    supplier_id: 4,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 7,
    name: "Roma Tomatoes",
    unit: "kg",
    cost_per_unit: 3.8,
    current_stock: 20,
    threshold: 5,
    category: "Vegetables",
    supplier_id: 4,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 8,
    name: "Yellow Onions",
    unit: "kg",
    cost_per_unit: 2.2,
    current_stock: 35,
    threshold: 8,
    category: "Vegetables",
    supplier_id: 4,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 9,
    name: "Bell Peppers",
    unit: "kg",
    cost_per_unit: 6.5,
    current_stock: 15,
    threshold: 4,
    category: "Vegetables",
    supplier_id: 4,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 10,
    name: "Fresh Eggs",
    unit: "dozen",
    cost_per_unit: 4.2,
    current_stock: 24,
    threshold: 6,
    category: "Dairy",
    supplier_id: 5,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 11,
    name: "Whole Milk",
    unit: "L",
    cost_per_unit: 1.8,
    current_stock: 40,
    threshold: 10,
    category: "Dairy",
    supplier_id: 5,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 12,
    name: "Cheddar Cheese",
    unit: "kg",
    cost_per_unit: 15.5,
    current_stock: 8,
    threshold: 2,
    category: "Dairy",
    supplier_id: 5,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 13,
    name: "Extra Virgin Olive Oil",
    unit: "L",
    cost_per_unit: 12.0,
    current_stock: 15,
    threshold: 3,
    category: "Oils & Condiments",
    supplier_id: 6,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 14,
    name: "Sea Salt",
    unit: "kg",
    cost_per_unit: 3.5,
    current_stock: 10,
    threshold: 2,
    category: "Seasonings",
    supplier_id: 6,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
  {
    id: 15,
    name: "Black Pepper",
    unit: "kg",
    cost_per_unit: 25.0,
    current_stock: 3,
    threshold: 1,
    category: "Seasonings",
    supplier_id: 6,
    last_updated: "2024-01-15",
    created_at: "2024-01-01",
  },
]

export const useInventoryStore = create<InventoryState>()(
  devtools(
    (set, get) => ({
      ingredients: initialIngredients,

      addIngredient: (ingredient) =>
        set(
          (state) => ({
            ingredients: [...state.ingredients, ingredient],
          }),
          false,
          "addIngredient",
        ),

      updateIngredient: (id, updates) =>
        set(
          (state) => ({
            ingredients: state.ingredients.map((ingredient) =>
              ingredient.id === id
                ? { ...ingredient, ...updates, last_updated: new Date().toISOString().split("T")[0] }
                : ingredient,
            ),
          }),
          false,
          "updateIngredient",
        ),

      updateStock: (id, quantity, type) =>
        set(
          (state) => ({
            ingredients: state.ingredients.map((ingredient) =>
              ingredient.id === id
                ? {
                    ...ingredient,
                    current_stock:
                      type === "add"
                        ? ingredient.current_stock + quantity
                        : Math.max(0, ingredient.current_stock - quantity),
                    last_updated: new Date().toISOString().split("T")[0],
                  }
                : ingredient,
            ),
          }),
          false,
          `updateStock-${type}`,
        ),

      updateCost: (id, newCost) =>
        set(
          (state) => ({
            ingredients: state.ingredients.map((ingredient) =>
              ingredient.id === id
                ? { ...ingredient, cost_per_unit: newCost, last_updated: new Date().toISOString().split("T")[0] }
                : ingredient,
            ),
          }),
          false,
          "updateCost",
        ),

      getIngredient: (id) => get().ingredients.find((ingredient) => ingredient.id === id),

      getLowStockItems: () =>
        get().ingredients.filter(
          (ingredient) => ingredient.current_stock <= ingredient.threshold && ingredient.current_stock > 0,
        ),

      getOutOfStockItems: () => get().ingredients.filter((ingredient) => ingredient.current_stock === 0),

      getTotalValue: () =>
        get().ingredients.reduce((sum, ingredient) => sum + ingredient.current_stock * ingredient.cost_per_unit, 0),
    }),
    { name: "inventory-store" },
  ),
)
