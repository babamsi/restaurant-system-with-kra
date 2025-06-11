import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"
import { Batch } from "@/types/operational"

interface BatchManagementState {
  batches: Batch[]
  lastUpdate: Date | null
  addBatch: (batch: Omit<Batch, "id" | "created_at" | "last_updated">) => void
  updateBatch: (id: string, updates: Partial<Batch>) => void
  transferBatch: (id: string, toLocation: "storage" | "kitchen") => void
  getBatchById: (id: string) => Batch | undefined
  getBatchesByIngredient: (ingredientId: string) => Batch[]
  getBatchesByLocation: (location: "storage" | "kitchen") => Batch[]
  getBatchesByExpiry: (days: number) => Batch[]
}

export const useBatchManagementStore = create<BatchManagementState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      batches: [],
      lastUpdate: null,

      addBatch: (batch) => {
        const newBatch: Batch = {
          ...batch,
          id: crypto.randomUUID(),
          created_at: new Date(),
          last_updated: new Date(),
        }

        set((state) => ({
          batches: [...state.batches, newBatch],
          lastUpdate: new Date(),
        }))
      },

      updateBatch: (id, updates) => {
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  ...updates,
                  last_updated: new Date(),
                }
              : batch
          ),
          lastUpdate: new Date(),
        }))
      },

      transferBatch: (id, toLocation) => {
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  location: toLocation,
                  last_updated: new Date(),
                }
              : batch
          ),
          lastUpdate: new Date(),
        }))
      },

      getBatchById: (id) => {
        return get().batches.find((batch) => batch.id === id)
      },

      getBatchesByIngredient: (ingredientId) => {
        return get().batches.filter((batch) => batch.ingredient_id === ingredientId)
      },

      getBatchesByLocation: (location) => {
        return get().batches.filter((batch) => batch.location === location)
      },

      getBatchesByExpiry: (days) => {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        return get().batches.filter(
          (batch) => batch.expiry_date <= expiryDate && batch.status === "active"
        )
      },
    }))
  )
) 