import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"
import { ProductionBatch } from "@/types/operational"

interface ProductionManagementState {
  productionBatches: ProductionBatch[]
  lastUpdate: Date | null
  createProductionBatch: (batch: Omit<ProductionBatch, "id" | "created_at" | "last_updated">) => void
  updateProductionBatch: (id: string, updates: Partial<ProductionBatch>) => void
  getProductionBatchById: (id: string) => ProductionBatch | undefined
  getProductionBatchesByItem: (preparedItemId: string) => ProductionBatch[]
  getProductionBatchesByDate: (startDate: Date, endDate: Date) => ProductionBatch[]
  calculateProductionCost: (batchId: string) => number
}

export const useProductionManagementStore = create<ProductionManagementState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      productionBatches: [],
      lastUpdate: null,

      createProductionBatch: (batch) => {
        const newBatch: ProductionBatch = {
          ...batch,
          id: crypto.randomUUID(),
          created_at: new Date(),
          last_updated: new Date(),
        }

        set((state) => ({
          productionBatches: [...state.productionBatches, newBatch],
          lastUpdate: new Date(),
        }))
      },

      updateProductionBatch: (id, updates) => {
        set((state) => ({
          productionBatches: state.productionBatches.map((batch) =>
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

      getProductionBatchById: (id) => {
        return get().productionBatches.find((batch) => batch.id === id)
      },

      getProductionBatchesByItem: (preparedItemId) => {
        return get().productionBatches.filter(
          (batch) => batch.prepared_item_id === preparedItemId
        )
      },

      getProductionBatchesByDate: (startDate, endDate) => {
        return get().productionBatches.filter(
          (batch) =>
            batch.production_date >= startDate && batch.production_date <= endDate
        )
      },

      calculateProductionCost: (batchId) => {
        const batch = get().getProductionBatchById(batchId)
        if (!batch) return 0

        // This would typically integrate with your ingredient cost data
        // For now, returning a placeholder calculation
        return batch.components.reduce(
          (total, component) => total + component.quantity * batch.cost_per_unit,
          0
        )
      },
    }))
  )
) 