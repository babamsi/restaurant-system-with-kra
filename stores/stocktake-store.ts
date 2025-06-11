import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"

export interface StocktakeItem {
  ingredient_id: string
  expected_quantity: number
  actual_quantity: number
  variance: number
}

export interface Stocktake {
  id: string
  date: Date
  location: "storage" | "kitchen"
  status: "in_progress" | "completed"
  items: StocktakeItem[]
  created_at: Date
  last_updated: Date
}

interface StocktakeState {
  stocktakes: Stocktake[]
  lastUpdate: Date | null
  createStocktake: (stocktake: Omit<Stocktake, "id" | "created_at" | "last_updated">) => void
  updateStocktake: (id: string, stocktake: Partial<Stocktake>) => void
  completeStocktake: (id: string) => void
  getStocktakeById: (id: string) => Stocktake | undefined
  getActiveStocktake: (location: "storage" | "kitchen") => Stocktake | undefined
  getStocktakeVariance: (id: string) => { total: number; items: { [key: string]: number } }
}

export const useStocktakeStore = create<StocktakeState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      stocktakes: [],
      lastUpdate: null,

      createStocktake: (stocktake) => {
        const newStocktake: Stocktake = {
          ...stocktake,
          id: crypto.randomUUID(),
          created_at: new Date(),
          last_updated: new Date(),
        }

        set((state) => ({
          stocktakes: [...state.stocktakes, newStocktake],
          lastUpdate: new Date(),
        }))
      },

      updateStocktake: (id, stocktake) => {
        set((state) => ({
          stocktakes: state.stocktakes.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...stocktake,
                  last_updated: new Date(),
                }
              : s
          ),
          lastUpdate: new Date(),
        }))
      },

      completeStocktake: (id) => {
        set((state) => ({
          stocktakes: state.stocktakes.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "completed",
                  last_updated: new Date(),
                }
              : s
          ),
          lastUpdate: new Date(),
        }))
      },

      getStocktakeById: (id) => {
        return get().stocktakes.find((s) => s.id === id)
      },

      getActiveStocktake: (location) => {
        return get().stocktakes.find(
          (s) => s.location === location && s.status === "in_progress"
        )
      },

      getStocktakeVariance: (id) => {
        const stocktake = get().getStocktakeById(id)
        if (!stocktake) return { total: 0, items: {} }

        const items: { [key: string]: number } = {}
        let total = 0

        stocktake.items.forEach((item) => {
          items[item.ingredient_id] = item.variance
          total += item.variance
        })

        return { total, items }
      },
    }))
  )
) 