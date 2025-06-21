import { create } from "zustand"
import { useSynchronizedInventoryStore } from "./synchronized-inventory-store"

export interface KitchenStorage {
  id: string
  ingredientId: string
  quantity: number
  unit: string
  lastUpdated: Date
  usedGrams?: number // Track used grams for ingredients with GM amounts
}

export interface BatchIngredient {
  ingredientId: string
  requiredQuantity: number
  unit: string
  status: "low" | "available" | "missing"
  isBatch?: boolean
  batchName?: string
}

export interface Batch {
  id: string
  name: string
  ingredients: BatchIngredient[]
  status: "draft" | "preparing" | "ready" | "completed" | "finished"
  notes?: string
  start_time?: string
  end_time?: string
  yield?: number
  yield_unit?: string
  portions?: number
}

interface KitchenStore {
  storage: KitchenStorage[]
  batches: Batch[]
  addToStorage: (ingredientId: string, quantity: number, unit: string) => void
  removeFromStorage: (ingredientId: string, quantity: number) => void
  createBatch: (name: string, ingredients: BatchIngredient[], notes?: string, batchDetails?: { yield: number; portions: number; yieldUnit?: string }) => void
  updateBatchStatus: (batchId: string, status: Batch["status"]) => void
  checkStorageLevels: () => void
  requestIngredients: (ingredientId: string, quantity: number) => void
}

export const useKitchenStore = create<KitchenStore>((set, get) => ({
  storage: [],
  batches: [],

  addToStorage: (ingredientId, quantity, unit) => {
    set((state) => {
      const existingItem = state.storage.find((item) => item.ingredientId === ingredientId)
      if (existingItem) {
        return {
          storage: state.storage.map((item) =>
            item.ingredientId === ingredientId
              ? { ...item, quantity: item.quantity + quantity, lastUpdated: new Date() }
              : item
          ),
        }
      }
      return {
        storage: [
          ...state.storage,
          {
            id: Math.random().toString(36).substr(2, 9),
            ingredientId,
            quantity,
            unit,
            lastUpdated: new Date(),
            usedGrams: 0,
          },
        ],
      }
    })
  },

  removeFromStorage: (ingredientId, quantity) => {
    set((state) => ({
      storage: state.storage.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, quantity: Math.max(0, item.quantity - quantity), lastUpdated: new Date() }
          : item
      ),
    }))
  },

  createBatch: (name, ingredients, notes, batchDetails) => {
    const newBatch: Batch = {
      id: crypto.randomUUID(),
      name,
      ingredients,
      status: "preparing",
      start_time: new Date().toISOString(),
      end_time: undefined,
      notes,
      yield: batchDetails?.yield,
      yield_unit: batchDetails?.yieldUnit,
      portions: batchDetails?.portions
    }

    set((state) => ({
      batches: [...state.batches, newBatch],
    }))

    // Check storage levels after creating batch
    get().checkStorageLevels()
  },

  updateBatchStatus: (batchId, status) => {
    set((state) => ({
      batches: state.batches.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              status,
              end_time: status === "completed" || status === "finished" ? new Date().toISOString() : batch.end_time
            }
          : batch
      ),
    }))
  },

  checkStorageLevels: () => {
    const { storage, batches } = get()
    const { ingredients: mainInventory } = useSynchronizedInventoryStore.getState()

    // Update batch ingredient statuses based on storage levels
    set((state) => ({
      batches: state.batches.map((batch) => ({
        ...batch,
        ingredients: batch.ingredients.map((ing) => {
          const storageItem = storage.find((item) => item.ingredientId === ing.ingredientId)
          const mainItem = mainInventory.find((item) => item.id === ing.ingredientId)

          if (!storageItem || storageItem.quantity < ing.requiredQuantity) {
            // Request from main inventory if needed
            if (mainItem && mainItem.available_quantity >= ing.requiredQuantity) {
              get().requestIngredients(ing.ingredientId, ing.requiredQuantity)
            }
            return { ...ing, status: "missing" }
          }

          if (storageItem.quantity <= ing.requiredQuantity * 1.2) {
            return { ...ing, status: "low" }
          }

          return { ...ing, status: "available" }
        }),
      })),
    }))
  },

  requestIngredients: (ingredientId, quantity) => {
    const { ingredients, updateStock } = useSynchronizedInventoryStore.getState()
    const ingredient = ingredients.find((i) => i.id === ingredientId)

    if (ingredient && ingredient.available_quantity >= quantity) {
      // Transfer from main inventory to kitchen storage
      updateStock(ingredientId, quantity, "subtract", "kitchen-transfer")
      get().addToStorage(ingredientId, quantity, ingredient.unit)
    }
  },
})) 