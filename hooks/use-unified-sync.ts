"use client"

import { useEffect } from "react"
import { useInventoryStore } from "@/stores/complete-inventory-store"
import { useKitchenStore } from "@/stores/complete-kitchen-store"
import { usePOSStore } from "@/stores/complete-pos-store"

export function useUnifiedSync() {
  const inventory = useInventoryStore()
  const kitchen = useKitchenStore()
  const pos = usePOSStore()

  useEffect(() => {
    // Sync kitchen menu changes to POS
    const unsubscribeKitchen = useKitchenStore.subscribe(
      (state) => state.availableMenu,
      (availableMenu) => {
        pos.updateAvailableMenu(availableMenu)
      },
    )

    // Sync POS orders to kitchen
    const unsubscribePOS = usePOSStore.subscribe(
      (state) => state.orders,
      (orders) => {
        const pendingOrders = orders.filter((order) => order.status === "pending")
        kitchen.updatePendingOrders(pendingOrders)
      },
    )

    // Sync inventory changes across all modules
    const unsubscribeInventory = useInventoryStore.subscribe(
      (state) => state.ingredients,
      (ingredients) => {
        kitchen.updateInventoryLevels(ingredients)
        pos.updateInventoryLevels(ingredients)
      },
    )

    return () => {
      unsubscribeKitchen()
      unsubscribePOS()
      unsubscribeInventory()
    }
  }, [inventory, kitchen, pos])
}
