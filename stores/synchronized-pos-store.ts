import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"

interface POSState {
  availableMenuItems: any[]
  lastUpdated: string

  // Actions
  updateMenuItems: (recipes: any[]) => void
  getAvailableItems: () => any[]
  getItemsByCategory: (category: string) => any[]
}

export const useSynchronizedPOSStore = create<POSState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      availableMenuItems: [],
      lastUpdated: new Date().toISOString(),

      updateMenuItems: (recipes) =>
        set(
          (state) => ({
            availableMenuItems: recipes,
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateMenuItems",
        ),

      getAvailableItems: () => get().availableMenuItems.filter((item) => item.available_portions > 0),

      getItemsByCategory: (category) => get().availableMenuItems.filter((item) => item.category === category),
    })),
    { name: "synchronized-pos-store" },
  ),
)

// Listen for recipe updates
if (typeof window !== "undefined") {
  window.addEventListener("recipes-updated", (event: any) => {
    const { recipes } = event.detail
    useSynchronizedPOSStore.getState().updateMenuItems(recipes)
  })
}
