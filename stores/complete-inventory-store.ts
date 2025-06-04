import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { BaseIngredient, StockMovement } from "@/types/unified-system"

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
  processOrderDeduction: (orderItems: any[]) => void

  // Getters
  getIngredient: (id: number) => BaseIngredient | undefined
  getAvailableIngredients: () => BaseIngredient[]
  getSellableIngredients: () => BaseIngredient[]
  getCookedIngredients: () => BaseIngredient[]
  getLowStockIngredients: () => BaseIngredient[]
  getIngredientsByCategory: (category?: string) => BaseIngredient[]
  getIngredientsForRecipes: () => BaseIngredient[]
}

const initialIngredients: BaseIngredient[] = [
  {
    id: 1,
    name: "Chicken Breast",
    unit: "kg",
    cost_per_unit: 8.5,
    current_stock: 25,
    threshold: 5,
    category: "Proteins",
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
    customer_unit: "piece",
    customer_unit_size: 0.15,
  },
  {
    id: 2,
    name: "Ground Beef",
    unit: "kg",
    cost_per_unit: 12.0,
    current_stock: 18,
    threshold: 4,
    category: "Proteins",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 250,
      protein: 26,
      carbs: 0,
      fat: 15,
      fiber: 0,
      sodium: 75,
    },
    is_sellable_individually: true,
    individual_selling_price: 15.0,
    is_cooked: false,
    customer_unit: "portion",
    customer_unit_size: 0.2,
  },
  {
    id: 3,
    name: "Fresh Salmon",
    unit: "kg",
    cost_per_unit: 22.0,
    current_stock: 8,
    threshold: 3,
    category: "Proteins",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 208,
      protein: 22,
      carbs: 0,
      fat: 12,
      fiber: 0,
      sodium: 59,
    },
    is_sellable_individually: true,
    individual_selling_price: 28.0,
    is_cooked: false,
    customer_unit: "fillet",
    customer_unit_size: 0.18,
  },
  {
    id: 4,
    name: "Jasmine Rice",
    unit: "kg",
    cost_per_unit: 3.2,
    current_stock: 45,
    threshold: 15,
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
    customer_unit: "cup",
    customer_unit_size: 0.2,
  },
  {
    id: 5,
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
    customer_unit: "cup",
    customer_unit_size: 0.2,
  },
  {
    id: 6,
    name: "Brown Rice",
    unit: "kg",
    cost_per_unit: 3.8,
    current_stock: 30,
    threshold: 8,
    category: "Grains",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      sodium: 5,
    },
    is_sellable_individually: true,
    individual_selling_price: 5.0,
    is_cooked: false,
    customer_unit: "cup",
    customer_unit_size: 0.2,
  },
  {
    id: 7,
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
    customer_unit: "serving",
    customer_unit_size: 0.15,
  },
  {
    id: 8,
    name: "Carrots",
    unit: "kg",
    cost_per_unit: 2.5,
    current_stock: 20,
    threshold: 5,
    category: "Vegetables",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 41,
      protein: 0.9,
      carbs: 10,
      fat: 0.2,
      fiber: 2.8,
      sodium: 69,
    },
    is_sellable_individually: true,
    individual_selling_price: 3.5,
    is_cooked: false,
    customer_unit: "serving",
    customer_unit_size: 0.1,
  },
  {
    id: 9,
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
    customer_unit: "portion",
    customer_unit_size: 0.2,
  },
  {
    id: 10,
    name: "Bell Peppers",
    unit: "kg",
    cost_per_unit: 5.2,
    current_stock: 12,
    threshold: 3,
    category: "Vegetables",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 31,
      protein: 1,
      carbs: 7,
      fat: 0.3,
      fiber: 2.5,
      sodium: 4,
    },
    is_sellable_individually: true,
    individual_selling_price: 7.0,
    is_cooked: false,
    customer_unit: "piece",
    customer_unit_size: 0.15,
  },
  {
    id: 11,
    name: "Olive Oil",
    unit: "L",
    cost_per_unit: 12.0,
    current_stock: 8,
    threshold: 2,
    category: "Oils & Fats",
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
    individual_selling_price: 0,
    is_cooked: true,
    customer_unit: "tbsp",
    customer_unit_size: 0.015,
  },
  {
    id: 12,
    name: "Salt",
    unit: "kg",
    cost_per_unit: 1.5,
    current_stock: 5,
    threshold: 1,
    category: "Seasonings",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 38758,
    },
    is_sellable_individually: false,
    individual_selling_price: 0,
    is_cooked: true,
    customer_unit: "tsp",
    customer_unit_size: 0.006,
  },
  {
    id: 13,
    name: "Black Pepper",
    unit: "kg",
    cost_per_unit: 25.0,
    current_stock: 2,
    threshold: 0.5,
    category: "Seasonings",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 251,
      protein: 10.4,
      carbs: 64,
      fat: 3.3,
      fiber: 25,
      sodium: 20,
    },
    is_sellable_individually: false,
    individual_selling_price: 0,
    is_cooked: true,
    customer_unit: "tsp",
    customer_unit_size: 0.002,
  },
  {
    id: 14,
    name: "Orange Juice",
    unit: "L",
    cost_per_unit: 5.0,
    current_stock: 20,
    threshold: 5,
    category: "Beverages",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 45,
      protein: 0.7,
      carbs: 10.4,
      fat: 0.2,
      fiber: 0.2,
      sodium: 1,
    },
    is_sellable_individually: true,
    individual_selling_price: 3.5,
    is_cooked: true,
    customer_unit: "glass",
    customer_unit_size: 0.25,
  },
  {
    id: 15,
    name: "Milk",
    unit: "L",
    cost_per_unit: 3.8,
    current_stock: 25,
    threshold: 6,
    category: "Beverages",
    created_at: "2024-01-10",
    last_updated: "2024-01-15",
    nutrition_per_unit: {
      calories: 42,
      protein: 3.4,
      carbs: 5,
      fat: 1,
      fiber: 0,
      sodium: 44,
    },
    is_sellable_individually: true,
    individual_selling_price: 2.5,
    is_cooked: true,
    customer_unit: "glass",
    customer_unit_size: 0.25,
  },
]

export const useCompleteInventoryStore = create<InventoryState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ingredients: initialIngredients,
      stockMovements: [],
      lastUpdated: new Date().toISOString(),

      // ✅ FIXED: Proper immutable updates with new array references
      addIngredient: (ingredientData) => {
        const newIngredient: BaseIngredient = {
          ...ingredientData,
          id: Math.max(...get().ingredients.map((i) => i.id), 0) + 1,
          created_at: new Date().toISOString().split("T")[0],
          last_updated: new Date().toISOString(),
        }

        // ✅ CRITICAL: Always create new array reference for reactivity
        set((state) => ({
          ingredients: [...state.ingredients, newIngredient], // New array reference
          lastUpdated: new Date().toISOString(),
        }))

        // ✅ DEBUG: Log state after update to confirm it's in Zustand
        console.log("🔄 ZUSTAND STATE AFTER ADD:", get().ingredients.length, "ingredients")
        console.log("🔄 NEW INGREDIENT ADDED:", newIngredient.name, "ID:", newIngredient.id)
        console.log(
          "🔄 FULL INVENTORY STATE:",
          get().ingredients.map((i) => ({ id: i.id, name: i.name })),
        )

        return newIngredient
      },

      // ✅ FIXED: Proper immutable updates for ingredient modifications
      updateIngredient: (id, updates) => {
        set((state) => ({
          ingredients: state.ingredients.map((ingredient) =>
            ingredient.id === id
              ? { ...ingredient, ...updates, last_updated: new Date().toISOString() } // New object reference
              : ingredient,
          ),
          lastUpdated: new Date().toISOString(),
        }))

        // ✅ DEBUG: Log state after update
        console.log("🔄 ZUSTAND STATE AFTER UPDATE:", get().ingredients.length, "ingredients")
      },

      // ✅ FIXED: Proper immutable updates for stock changes
      updateStock: (id, quantity, type, reason) => {
        const ingredient = get().getIngredient(id)
        if (!ingredient) return

        const newStock =
          type === "add" ? ingredient.current_stock + quantity : Math.max(0, ingredient.current_stock - quantity)

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

        set((state) => ({
          ingredients: state.ingredients.map((ing) =>
            ing.id === id
              ? { ...ing, current_stock: newStock, last_updated: new Date().toISOString() } // New object reference
              : ing,
          ),
          stockMovements: [...state.stockMovements, movement], // New array reference
          lastUpdated: new Date().toISOString(),
        }))

        // ✅ DEBUG: Log state after stock update
        console.log("🔄 ZUSTAND STATE AFTER STOCK UPDATE:", get().ingredients.length, "ingredients")
      },

      markAsCooked: (id, isCooked) => {
        get().updateIngredient(id, { is_cooked: isCooked })
      },

      updateCostPerUnit: (id, newCost) => {
        get().updateIngredient(id, { cost_per_unit: newCost })
      },

      processOrderDeduction: (orderItems) => {
        orderItems.forEach((item) => {
          if (item.inventory_deduction) {
            const { ingredient_id, quantity_to_deduct } = item.inventory_deduction
            if (ingredient_id) {
              get().updateStock(ingredient_id, quantity_to_deduct, "subtract", `Order: ${item.name}`)
            }
          }
        })
      },

      // ✅ Getters that always return fresh data
      getIngredient: (id) => get().ingredients.find((ingredient) => ingredient.id === id),

      getAvailableIngredients: () => get().ingredients.filter((ingredient) => ingredient.current_stock > 0),

      getSellableIngredients: () =>
        get().ingredients.filter((ingredient) => ingredient.is_sellable_individually && ingredient.is_cooked),

      getCookedIngredients: () => get().ingredients.filter((ingredient) => ingredient.is_cooked),

      getLowStockIngredients: () =>
        get().ingredients.filter((ingredient) => ingredient.current_stock <= ingredient.threshold),

      getIngredientsByCategory: (category?: string) => {
        const ingredients = get().ingredients
        if (!category || category === "All") return ingredients
        return ingredients.filter((ingredient) => ingredient.category === category)
      },

      getIngredientsForRecipes: () => {
        return get().ingredients.filter((ingredient) => ingredient.current_stock > 0)
      },
    })),
    { name: "complete-inventory-store" },
  ),
)

// Order completion listener
if (typeof window !== "undefined") {
  window.addEventListener("order-completed", (event: any) => {
    const { orderItems } = event.detail
    useCompleteInventoryStore.getState().processOrderDeduction(orderItems)
  })
}
