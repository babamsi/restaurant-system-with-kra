import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { BaseIngredient, StockMovement } from "@/types/dual-sales"

interface InventoryState {
  ingredients: BaseIngredient[]
  stockMovements: StockMovement[]
  lastUpdated: string

  // Actions
  addIngredient: (ingredient: Omit<BaseIngredient, "id" | "created_at" | "last_updated">) => BaseIngredient
  updateIngredient: (id: number, updates: Partial<BaseIngredient>) => void
  updateStock: (id: number, quantity: number, type: "add" | "subtract", reason: string) => void
  markAsCooked: (id: number, isCooked: boolean) => void
  updateCostPerUnit: (id: number, newCost: number) => void

  // Getters
  getIngredient: (id: number) => BaseIngredient | undefined
  getAvailableIngredients: () => BaseIngredient[]
  getSellableIngredients: () => BaseIngredient[]
  getCookedIngredients: () => BaseIngredient[]
  getLowStockIngredients: () => BaseIngredient[]

  // Sync
  notifyKitchen: () => void
}

const initialIngredients: BaseIngredient[] = [
  {
    id: 1,
    name: "Chicken Breast",
    unit: "kg",
    cost_per_unit: 8.5,
    current_stock: 25,
    threshold: 5,
    category: "Protein",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74,
    },
    is_sellable_individually: true,
    individual_selling_price: 12.0,
    is_cooked: false,
  },
  {
    id: 2,
    name: "Basmati Rice",
    unit: "kg",
    cost_per_unit: 3.2,
    current_stock: 50,
    threshold: 10,
    category: "Grains",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      sodium: 1,
    },
    is_sellable_individually: true,
    individual_selling_price: 4.5,
    is_cooked: false,
  },
  {
    id: 3,
    name: "Fresh Broccoli",
    unit: "kg",
    cost_per_unit: 4.8,
    current_stock: 15,
    threshold: 3,
    category: "Vegetables",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sodium: 33,
    },
    is_sellable_individually: true,
    individual_selling_price: 6.5,
    is_cooked: false,
  },
  {
    id: 4,
    name: "Potatoes",
    unit: "kg",
    cost_per_unit: 2.1,
    current_stock: 40,
    threshold: 8,
    category: "Vegetables",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 77,
      protein: 2,
      carbs: 17,
      fat: 0.1,
      fiber: 2.2,
      sodium: 6,
    },
    is_sellable_individually: true,
    individual_selling_price: 3.0,
    is_cooked: false,
  },
  {
    id: 5,
    name: "Olive Oil",
    unit: "L",
    cost_per_unit: 12.0,
    current_stock: 8,
    threshold: 2,
    category: "Oils",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      sodium: 2,
    },
    is_sellable_individually: false,
    is_cooked: false,
  },
  {
    id: 6,
    name: "Tomatoes",
    unit: "kg",
    cost_per_unit: 3.5,
    current_stock: 20,
    threshold: 4,
    category: "Vegetables",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 18,
      protein: 0.9,
      carbs: 3.9,
      fat: 0.2,
      fiber: 1.2,
      sodium: 5,
    },
    is_sellable_individually: false,
    is_cooked: false,
  },
]

export const useUnifiedInventoryStore = create<InventoryState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ingredients: initialIngredients,
      stockMovements: [],
      lastUpdated: new Date().toISOString(),

      addIngredient: (ingredientData) => {
        const newIngredient: BaseIngredient = {
          ...ingredientData,
          id: Math.max(...get().ingredients.map((i) => i.id), 0) + 1,
          created_at: new Date().toISOString().split("T")[0],
          last_updated: new Date().toISOString(),
        }

        set(
          (state) => ({
            ingredients: [...state.ingredients, newIngredient],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "addIngredient",
        )

        get().notifyKitchen()
        return newIngredient
      },

      updateIngredient: (id, updates) => {
        set(
          (state) => ({
            ingredients: state.ingredients.map((ingredient) =>
              ingredient.id === id ? { ...ingredient, ...updates, last_updated: new Date().toISOString() } : ingredient,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateIngredient",
        )

        get().notifyKitchen()
      },

      updateStock: (id, quantity, type, reason) => {
        const ingredient = get().getIngredient(id)
        if (!ingredient) return

        const newStock =
          type === "add" ? ingredient.current_stock + quantity : Math.max(0, ingredient.current_stock - quantity)

        // Create stock movement record
        const movement: StockMovement = {
          id: Date.now(),
          ingredient_id: id,
          ingredient_name: ingredient.name,
          movement_type: type === "add" ? "purchase" : "usage",
          quantity: quantity,
          unit: ingredient.unit,
          reference_id: reason,
          reference_type: reason,
          notes: `Stock ${type === "add" ? "added" : "consumed"}: ${reason}`,
          created_at: new Date().toISOString(),
        }

        set(
          (state) => ({
            ingredients: state.ingredients.map((ing) =>
              ing.id === id ? { ...ing, current_stock: newStock, last_updated: new Date().toISOString() } : ing,
            ),
            stockMovements: [...state.stockMovements, movement],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          `updateStock-${type}`,
        )

        get().notifyKitchen()
      },

      markAsCooked: (id, isCooked) => {
        get().updateIngredient(id, { is_cooked: isCooked })
      },

      updateCostPerUnit: (id, newCost) => {
        get().updateIngredient(id, { cost_per_unit: newCost })
      },

      getIngredient: (id) => get().ingredients.find((ingredient) => ingredient.id === id),

      getAvailableIngredients: () => get().ingredients.filter((ingredient) => ingredient.current_stock > 0),

      getSellableIngredients: () =>
        get().ingredients.filter((ingredient) => ingredient.is_sellable_individually && ingredient.is_cooked),

      getCookedIngredients: () => get().ingredients.filter((ingredient) => ingredient.is_cooked),

      getLowStockIngredients: () =>
        get().ingredients.filter((ingredient) => ingredient.current_stock <= ingredient.threshold),

      notifyKitchen: () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("inventory-updated", {
              detail: {
                ingredients: get().ingredients,
                timestamp: get().lastUpdated,
              },
            }),
          )
        }
      },
    })),
    { name: "unified-inventory-store" },
  ),
)
