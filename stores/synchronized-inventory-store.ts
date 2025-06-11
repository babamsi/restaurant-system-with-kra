import { create } from "zustand"
import { devtools, subscribeWithSelector, persist } from "zustand/middleware"
import type { BaseIngredient } from "@/types/operational"
import { mockIngredients } from "@/data/mock/ingredients"

export interface InventoryLog {
  id: string
  timestamp: Date
  action: "create" | "update" | "delete"
  ingredientId: string
  ingredientName: string
  changes?: {
    field: string
    from: any
    to: any
  }[]
  quantity?: number
  unit?: string
  source: "manual" | "pos" | "kitchen" | "system"
}

interface InventoryState {
  ingredients: BaseIngredient[]
  logs: InventoryLog[]
  lastUpdated: string

  // Actions
  addIngredient: (ingredient: Omit<BaseIngredient, "id" | "created_at" | "last_updated">) => BaseIngredient
  updateIngredient: (id: string, updates: Partial<BaseIngredient>) => void
  updateStock: (id: string, quantity: number, type: "add" | "subtract", reason?: string) => void
  updateCost: (id: string, newCost: number) => void
  getIngredient: (id: string) => BaseIngredient | undefined
  getLowStockItems: () => BaseIngredient[]
  getOutOfStockItems: () => BaseIngredient[]
  getTotalValue: () => number
  getAvailableIngredients: () => BaseIngredient[]

  // Sync actions
  notifyRecipeStore: () => void

  // New actions
  deleteIngredient: (id: string) => void
  adjustQuantity: (id: string, quantity: number, source: InventoryLog["source"]) => void
  addLog: (log: Omit<InventoryLog, "id" | "timestamp">) => void
  getIngredientLogs: (ingredientId: string) => InventoryLog[]
}

export const useSynchronizedInventoryStore = create<InventoryState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ingredients: mockIngredients,
        logs: [],
        lastUpdated: new Date().toISOString(),

        addIngredient: (ingredient) => {
          const newIngredient: BaseIngredient = {
            ...ingredient,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          }
          set((state) => ({
            ingredients: [...state.ingredients, newIngredient],
            logs: [
              ...state.logs,
              {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                action: "create",
                ingredientId: newIngredient.id,
                ingredientName: newIngredient.name,
                source: "manual",
              },
            ],
          }))
          return newIngredient
        },

        updateIngredient: (id, updates) => {
          set((state) => {
            const ingredient = state.ingredients.find((i) => i.id === id)
            if (!ingredient) return state

            const updatedIngredient = { ...ingredient, ...updates, last_updated: new Date().toISOString() }
            return {
              ingredients: state.ingredients.map((i) => (i.id === id ? updatedIngredient : i)),
              logs: [
                ...state.logs,
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date(),
                  action: "update",
                  ingredientId: id,
                  ingredientName: ingredient.name,
                  changes: Object.entries(updates).map(([field, value]) => ({
                    field,
                    from: ingredient[field as keyof BaseIngredient],
                    to: value,
                  })),
                  source: "manual",
                },
              ],
            }
          })
        },

        updateStock: (id, quantity, type, reason = "manual-adjustment") => {
          set((state) => {
            const ingredient = state.ingredients.find((i) => i.id === id)
            if (!ingredient) return state

            const updatedIngredient = {
              ...ingredient,
              available_quantity:
                type === "add"
                  ? ingredient.available_quantity + quantity
                  : Math.max(0, ingredient.available_quantity - quantity),
              last_updated: new Date().toISOString(),
            }

            return {
              ingredients: state.ingredients.map((i) => (i.id === id ? updatedIngredient : i)),
              logs: [
                ...state.logs,
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date(),
                  action: "update",
                  ingredientId: id,
                  ingredientName: ingredient.name,
                  quantity: type === "add" ? quantity : -quantity,
                  unit: ingredient.unit,
                  changes: [
                    {
                      field: "available_quantity",
                      from: ingredient.available_quantity,
                      to: updatedIngredient.available_quantity,
                    },
                  ],
                  source: reason as InventoryLog["source"],
                },
              ],
            }
          })
        },

        updateCost: (id, newCost) => {
          set((state) => {
            const ingredient = state.ingredients.find((i) => i.id === id)
            if (!ingredient) return state

            const updatedIngredient = {
              ...ingredient,
              cost_per_unit: newCost,
              last_updated: new Date().toISOString(),
            }

            return {
              ingredients: state.ingredients.map((i) => (i.id === id ? updatedIngredient : i)),
              logs: [
                ...state.logs,
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date(),
                  action: "update",
                  ingredientId: id,
                  ingredientName: ingredient.name,
                  changes: [
                    {
                      field: "cost_per_unit",
                      from: ingredient.cost_per_unit,
                      to: newCost,
                    },
                  ],
                  source: "manual",
                },
              ],
            }
          })
        },

        getIngredient: (id) => get().ingredients.find((i) => i.id === id),

        getLowStockItems: () =>
          get().ingredients.filter(
            (ingredient) => ingredient.available_quantity <= ingredient.threshold && ingredient.available_quantity > 0,
          ),

        getOutOfStockItems: () => get().ingredients.filter((ingredient) => ingredient.available_quantity === 0),

        getTotalValue: () =>
          get().ingredients.reduce((sum, ingredient) => sum + ingredient.available_quantity * ingredient.cost_per_unit, 0),

        getAvailableIngredients: () => get().ingredients.filter((ingredient) => ingredient.available_quantity > 0),

        notifyRecipeStore: () => {
          // Implementation for recipe store notification
        },

        deleteIngredient: (id) => {
          set((state) => {
            const ingredient = state.ingredients.find((i) => i.id === id)
            if (!ingredient) return state

            return {
              ingredients: state.ingredients.filter((i) => i.id !== id),
              logs: [
                ...state.logs,
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date(),
                  action: "delete",
                  ingredientId: id,
                  ingredientName: ingredient.name,
                  source: "manual",
                },
              ],
            }
          })
        },

        adjustQuantity: (id, quantity, source) => {
          set((state) => {
            const ingredient = state.ingredients.find((i) => i.id === id)
            if (!ingredient) return state

            const newQuantity = ingredient.available_quantity + quantity
            if (newQuantity < 0) return state

            return {
              ingredients: state.ingredients.map((i) =>
                i.id === id ? { ...i, available_quantity: newQuantity } : i
              ),
              logs: [
                ...state.logs,
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date(),
                  action: "update",
                  ingredientId: id,
                  ingredientName: ingredient.name,
                  quantity,
                  unit: ingredient.unit,
                  changes: [
                    {
                      field: "available_quantity",
                      from: ingredient.available_quantity,
                      to: newQuantity,
                    },
                  ],
                  source,
                },
              ],
            }
          })
        },

        addLog: (log) => {
          set((state) => ({
            logs: [
              ...state.logs,
              {
                ...log,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          }))
        },

        getIngredientLogs: (ingredientId) => {
          return get().logs.filter((log) => log.ingredientId === ingredientId)
        },
      })),
      {
        name: "inventory-storage",
      }
    )
  )
)
