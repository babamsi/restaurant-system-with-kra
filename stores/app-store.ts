import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { useInventoryStore } from "./inventory-store"
import { useRecipesStore } from "./recipes-store"
import { useOrdersStore } from "./orders-store"
import { useSuppliersStore } from "./suppliers-store"
import type { Order } from "@/types/order"
import type { Ingredient } from "@/types/operational"

interface AppState {
  // Orchestration actions
  processOrder: (order: Order) => void
  prepareBatch: (recipeId: number, batchSize: number) => void
  processSupplierInvoice: (invoiceId: string) => void
  completeOrder: (orderId: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      processOrder: (order) => {
        // Add order to orders store
        useOrdersStore.getState().addOrder(order)

        // Deduct ingredients from inventory for each item
        order.items.forEach((item) => {
          // Find the recipe for this item
          const recipe = useRecipesStore.getState().getRecipe(getRecipeIdFromItemName(item.name))

          if (recipe) {
            // Deduct available portions
            useRecipesStore.getState().updateAvailablePortions(recipe.id, item.quantity, "subtract")

            // Deduct ingredients from inventory
            recipe.ingredients.forEach((ingredient) => {
              const quantityNeeded = ingredient.quantity_per_batch * item.quantity
              useInventoryStore.getState().updateStock(ingredient.ingredient_id, quantityNeeded, "subtract")
            })
          }
        })
      },

      prepareBatch: (recipeId, batchSize) => {
        const recipe = useRecipesStore.getState().getRecipe(recipeId)

        if (recipe) {
          // Check if we have enough ingredients
          const canPrepare = recipe.ingredients.every((ingredient) => {
            const availableStock =
              useInventoryStore.getState().getIngredient(ingredient.ingredient_id)?.current_stock || 0
            const requiredQuantity = ingredient.quantity_per_batch * batchSize
            return availableStock >= requiredQuantity
          })

          if (canPrepare) {
            // Deduct ingredients
            recipe.ingredients.forEach((ingredient) => {
              const quantityNeeded = ingredient.quantity_per_batch * batchSize
              useInventoryStore.getState().updateStock(ingredient.ingredient_id, quantityNeeded, "subtract")
            })

            // Add prepared portions
            const portionsProduced = batchSize * recipe.default_yield
            useRecipesStore.getState().updateAvailablePortions(recipeId, portionsProduced, "add")
          }
        }
      },

      processSupplierInvoice: (invoiceId) => {
        const invoice = useSuppliersStore.getState().getInvoice(invoiceId)

        if (invoice) {
          // Update inventory with new stock and costs
          invoice.items.forEach((item) => {
            if (item.mapped_ingredient_id) {
              // Update existing ingredient
              useInventoryStore.getState().updateStock(item.mapped_ingredient_id, item.quantity, "add")
              useInventoryStore.getState().updateCost(item.mapped_ingredient_id, item.cost_per_unit)
            } else if (item.is_new_ingredient) {
              // Add new ingredient
              const newIngredient: Ingredient = {
                id: Date.now(), // Generate unique ID
                name: item.name,
                unit: item.unit,
                cost_per_unit: item.cost_per_unit,
                current_stock: item.quantity,
                threshold: Math.ceil(item.quantity * 0.2), // 20% of initial stock as threshold
                category: "Uncategorized",
                supplier_id: 1,
                last_updated: new Date().toISOString().split("T")[0],
                created_at: new Date().toISOString().split("T")[0],
              }
              useInventoryStore.getState().addIngredient(newIngredient)
            }
          })

          // Mark invoice as processed
          useSuppliersStore.getState().processInvoice(invoiceId)
        }
      },

      completeOrder: (orderId) => {
        useOrdersStore.getState().updateOrderStatus(orderId, "completed")
      },
    }),
    { name: "app-store" },
  ),
)

// Helper function to map item names to recipe IDs
function getRecipeIdFromItemName(itemName: string): number {
  const recipeMap: Record<string, number> = {
    "Grilled Chicken Caesar Salad": 1,
    "Beef Pasta Bolognese": 2,
    "Grilled Salmon with Rice": 3,
    "Vegetable Stir Fry": 4,
    "Fresh Orange Juice": 5,
    "Iced Coffee": 6,
  }
  return recipeMap[itemName] || 0
}
