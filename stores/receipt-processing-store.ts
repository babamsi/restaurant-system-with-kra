import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"
import { Receipt } from "@/types/operational"
import { useBatchManagementStore } from "./batch-management-store"

interface ReceiptProcessingState {
  receipts: Receipt[]
  lastUpdate: Date | null
  addReceipt: (receipt: Omit<Receipt, "id" | "created_at" | "last_updated">) => void
  processReceipt: (id: string) => void
  getReceiptById: (id: string) => Receipt | undefined
  getPendingReceipts: () => Receipt[]
  getProcessedReceipts: () => Receipt[]
  getReceiptsByDate: (startDate: Date, endDate: Date) => Receipt[]
}

export const useReceiptProcessingStore = create<ReceiptProcessingState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      receipts: [],
      lastUpdate: null,

      addReceipt: (receipt) => {
        const newReceipt: Receipt = {
          ...receipt,
          id: crypto.randomUUID(),
          created_at: new Date(),
          last_updated: new Date(),
        }

        set((state) => ({
          receipts: [...state.receipts, newReceipt],
          lastUpdate: new Date(),
        }))
      },

      processReceipt: (id) => {
        const receipt = get().getReceiptById(id)
        if (!receipt || receipt.status === "processed") return

        // Create batches for each item in the receipt
        receipt.items.forEach((item) => {
          useBatchManagementStore.getState().addBatch({
            ingredient_id: item.ingredient_id,
            purchase_order_id: receipt.id,
            quantity: item.quantity,
            purchase_date: receipt.date,
            expiry_date: new Date(receipt.date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from purchase
            cost_per_unit: item.cost_per_unit,
            location: "storage",
            status: "active",
          })
        })

        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "processed",
                  last_updated: new Date(),
                }
              : r
          ),
          lastUpdate: new Date(),
        }))
      },

      getReceiptById: (id) => {
        return get().receipts.find((receipt) => receipt.id === id)
      },

      getPendingReceipts: () => {
        return get().receipts.filter((receipt) => receipt.status === "pending")
      },

      getProcessedReceipts: () => {
        return get().receipts.filter((receipt) => receipt.status === "processed")
      },

      getReceiptsByDate: (startDate, endDate) => {
        return get().receipts.filter(
          (receipt) => receipt.date >= startDate && receipt.date <= endDate
        )
      },
    }))
  )
) 