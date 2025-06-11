import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { 
  RawMaterialBatch, 
  PreparedItemBatch, 
  StockTake, 
  InventoryTransfer,
  WastageLog 
} from "@/types/operational"

interface AdvancedInventoryState {
  rawMaterialBatches: RawMaterialBatch[]
  preparedItemBatches: PreparedItemBatch[]
  stockTakes: StockTake[]
  transfers: InventoryTransfer[]
  wastageLogs: WastageLog[]
  lastUpdated: string

  // Batch Management
  addRawMaterialBatch: (batch: Omit<RawMaterialBatch, 'id' | 'created_at' | 'last_updated'>) => RawMaterialBatch
  updateBatchStatus: (batchId: string, status: RawMaterialBatch['status']) => void
  getBatchesByIngredient: (ingredientId: string) => RawMaterialBatch[]
  getBatchesByLocation: (location: 'storage' | 'kitchen') => RawMaterialBatch[]
  getBatchesByExpiry: (daysUntilExpiry: number) => RawMaterialBatch[]

  // Production Management
  createPreparedItemBatch: (batch: Omit<PreparedItemBatch, 'id' | 'created_at' | 'last_updated'>) => PreparedItemBatch
  getPreparedItemBatches: (preparedItemId: string) => PreparedItemBatch[]
  calculateProductionCost: (batchId: string) => number

  // Stock Management
  createStockTake: (location: 'storage' | 'kitchen') => StockTake
  completeStockTake: (stockTakeId: string, counts: {ingredient_id: string, actual_quantity: number}[]) => void
  getActiveStockTake: (location: 'storage' | 'kitchen') => StockTake | undefined
  getStockTakeVariance: (stockTakeId: string) => {ingredient_id: string, variance: number}[]

  // Transfer Management
  createTransfer: (transfer: Omit<InventoryTransfer, 'id' | 'created_at' | 'last_updated'>) => InventoryTransfer
  getTransfersByBatch: (batchId: string) => InventoryTransfer[]
  getTransfersByLocation: (location: 'storage' | 'kitchen') => InventoryTransfer[]

  // Wastage Management
  logWastage: (wastage: Omit<WastageLog, 'id' | 'created_at' | 'last_updated'>) => WastageLog
  getWastageByBatch: (batchId: string) => WastageLog[]
  getTotalWastageCost: (startDate: Date, endDate: Date) => number
}

export const useAdvancedInventoryStore = create<AdvancedInventoryState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      rawMaterialBatches: [],
      preparedItemBatches: [],
      stockTakes: [],
      transfers: [],
      wastageLogs: [],
      lastUpdated: new Date().toISOString(),

      addRawMaterialBatch: (batch) => {
        const newBatch: RawMaterialBatch = {
          ...batch,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        set((state) => ({
          rawMaterialBatches: [...state.rawMaterialBatches, newBatch],
          lastUpdated: new Date().toISOString(),
        }))
        return newBatch
      },

      updateBatchStatus: (batchId, status) => {
        set((state) => ({
          rawMaterialBatches: state.rawMaterialBatches.map((batch) =>
            batch.id === batchId
              ? { ...batch, status, last_updated: new Date().toISOString() }
              : batch
          ),
          lastUpdated: new Date().toISOString(),
        }))
      },

      getBatchesByIngredient: (ingredientId) =>
        get().rawMaterialBatches.filter((batch) => batch.ingredient_id === ingredientId),

      getBatchesByLocation: (location) =>
        get().rawMaterialBatches.filter((batch) => batch.location === location),

      getBatchesByExpiry: (daysUntilExpiry) => {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry)
        return get().rawMaterialBatches.filter(
          (batch) => new Date(batch.expiry_date) <= expiryDate && batch.status === 'active'
        )
      },

      createPreparedItemBatch: (batch) => {
        const newBatch: PreparedItemBatch = {
          ...batch,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        set((state) => ({
          preparedItemBatches: [...state.preparedItemBatches, newBatch],
          lastUpdated: new Date().toISOString(),
        }))
        return newBatch
      },

      getPreparedItemBatches: (preparedItemId) =>
        get().preparedItemBatches.filter((batch) => batch.prepared_item_id === preparedItemId),

      calculateProductionCost: (batchId) => {
        const batch = get().preparedItemBatches.find((b) => b.id === batchId)
        if (!batch) return 0

        return batch.components.reduce((total, component) => {
          const rawBatch = get().rawMaterialBatches.find((b) => b.id === component.batch_id)
          return total + (rawBatch?.cost_per_unit || 0) * component.quantity_used
        }, 0)
      },

      createStockTake: (location) => {
        const newStockTake: StockTake = {
          id: crypto.randomUUID(),
          date: new Date(),
          location,
          status: 'in_progress',
          items: [],
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        set((state) => ({
          stockTakes: [...state.stockTakes, newStockTake],
          lastUpdated: new Date().toISOString(),
        }))
        return newStockTake
      },

      completeStockTake: (stockTakeId, counts) => {
        set((state) => {
          const stockTake = state.stockTakes.find((st) => st.id === stockTakeId)
          if (!stockTake) return state

          const updatedItems = counts.map((count) => ({
            ...count,
            expected_quantity: 0, // This should be calculated from current inventory
            variance: count.actual_quantity - 0, // This should be calculated from current inventory
          }))

          return {
            stockTakes: state.stockTakes.map((st) =>
              st.id === stockTakeId
                ? {
                    ...st,
                    status: 'completed',
                    items: updatedItems,
                    last_updated: new Date().toISOString(),
                  }
                : st
            ),
            lastUpdated: new Date().toISOString(),
          }
        })
      },

      getActiveStockTake: (location) =>
        get().stockTakes.find((st) => st.location === location && st.status === 'in_progress'),

      getStockTakeVariance: (stockTakeId) => {
        const stockTake = get().stockTakes.find((st) => st.id === stockTakeId)
        if (!stockTake) return []
        return stockTake.items.map((item) => ({
          ingredient_id: item.ingredient_id,
          variance: item.variance,
        }))
      },

      createTransfer: (transfer) => {
        const newTransfer: InventoryTransfer = {
          ...transfer,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        set((state) => ({
          transfers: [...state.transfers, newTransfer],
          lastUpdated: new Date().toISOString(),
        }))
        return newTransfer
      },

      getTransfersByBatch: (batchId) =>
        get().transfers.filter((transfer) => transfer.batch_id === batchId),

      getTransfersByLocation: (location) =>
        get().transfers.filter(
          (transfer) => transfer.from_location === location || transfer.to_location === location
        ),

      logWastage: (wastage) => {
        const newWastage: WastageLog = {
          ...wastage,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        set((state) => ({
          wastageLogs: [...state.wastageLogs, newWastage],
          lastUpdated: new Date().toISOString(),
        }))
        return newWastage
      },

      getWastageByBatch: (batchId) =>
        get().wastageLogs.filter((wastage) => wastage.batch_id === batchId),

      getTotalWastageCost: (startDate, endDate) =>
        get()
          .wastageLogs.filter(
            (wastage) =>
              new Date(wastage.created_at) >= startDate && new Date(wastage.created_at) <= endDate
          )
          .reduce((total, wastage) => total + wastage.cost_impact, 0),
    })),
    { name: "advanced-inventory-store" }
  )
) 