import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { MenuItemForSale, CartItem, Order } from "@/types/dual-sales"

interface POSState {
  menuItems: MenuItemForSale[]
  cart: CartItem[]
  orders: Order[]
  lastUpdated: string

  // Cart Management
  addToCart: (menuItem: MenuItemForSale, quantity: number) => void
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void

  // Order Management
  createOrder: (orderData: Omit<Order, "id" | "created_at" | "updated_at">) => Order
  updateOrderStatus: (orderId: string, status: Order["status"]) => void

  // Calculations
  getCartTotal: () => number
  getCartNutrition: () => any
  getCartItemCount: () => number

  // Menu Management
  updateMenuItems: (items: MenuItemForSale[]) => void
  getAvailableMenuItems: () => MenuItemForSale[]
  getMenuItemsByCategory: (category: string) => MenuItemForSale[]
  removeMenuItem: (menuItemId: string) => void
  addKitchenItemToMenu: (kitchenItem: any, price: number) => void

  // Sync
  notifyInventoryDeduction: (cartItems: CartItem[]) => void
}

export const useUnifiedPOSStore = create<POSState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      menuItems: [],
      cart: [],
      orders: [],
      lastUpdated: new Date().toISOString(),

      addToCart: (menuItem, quantity) => {
        const existingItem = get().cart.find((item) => item.menu_item_id === menuItem.id)

        if (existingItem) {
          get().updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity)
        } else {
          // Calculate nutrition based on actual quantity and unit type
          let nutritionMultiplier = 1
          if (menuItem.type === "individual") {
            // For individual ingredients, nutrition is per 100g/100ml
            nutritionMultiplier = quantity / 100
          } else {
            // For recipes, nutrition is per portion
            nutritionMultiplier = quantity
          }

          const cartItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random()}`,
            menu_item_id: menuItem.id,
            name: menuItem.name,
            type: menuItem.type,
            quantity: quantity,
            unit_price: menuItem.price,
            total_price: menuItem.price * quantity,
            unit: menuItem.display_unit || menuItem.unit,
            display_unit: menuItem.display_unit,
            bulk_unit: menuItem.bulk_unit,
            conversion_factor: menuItem.conversion_factor || 1,
            total_nutrition: {
              calories: menuItem.nutrition.calories * nutritionMultiplier,
              protein: menuItem.nutrition.protein * nutritionMultiplier,
              carbs: menuItem.nutrition.carbs * nutritionMultiplier,
              fat: menuItem.nutrition.fat * nutritionMultiplier,
              fiber: menuItem.nutrition.fiber * nutritionMultiplier,
              sodium: menuItem.nutrition.sodium * nutritionMultiplier,
            },
          }

          set(
            (state) => ({
              cart: [...state.cart, cartItem],
              lastUpdated: new Date().toISOString(),
            }),
            false,
            "addToCart",
          )
        }
      },

      updateCartItemQuantity: (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
          get().removeFromCart(cartItemId)
          return
        }

        set(
          (state) => ({
            cart: state.cart.map((item) => {
              if (item.id === cartItemId) {
                const menuItem = state.menuItems.find((mi) => mi.id === item.menu_item_id)
                if (!menuItem) return item

                // Calculate nutrition based on actual quantity and unit type
                let nutritionMultiplier = 1
                if (menuItem.type === "individual") {
                  // For individual ingredients, nutrition is per 100g/100ml
                  nutritionMultiplier = newQuantity / 100
                } else {
                  // For recipes, nutrition is per portion
                  nutritionMultiplier = newQuantity
                }

                return {
                  ...item,
                  quantity: newQuantity,
                  total_price: item.unit_price * newQuantity,
                  total_nutrition: {
                    calories: menuItem.nutrition.calories * nutritionMultiplier,
                    protein: menuItem.nutrition.protein * nutritionMultiplier,
                    carbs: menuItem.nutrition.carbs * nutritionMultiplier,
                    fat: menuItem.nutrition.fat * nutritionMultiplier,
                    fiber: menuItem.nutrition.fiber * nutritionMultiplier,
                    sodium: menuItem.nutrition.sodium * nutritionMultiplier,
                  },
                }
              }
              return item
            }),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateCartItemQuantity",
        )
      },

      removeFromCart: (cartItemId) => {
        set(
          (state) => ({
            cart: state.cart.filter((item) => item.id !== cartItemId),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "removeFromCart",
        )
      },

      clearCart: () => {
        set(
          (state) => ({
            cart: [],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "clearCart",
        )
      },

      createOrder: (orderData) => {
        const order: Order = {
          ...orderData,
          id: `ORD-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set(
          (state) => ({
            orders: [...state.orders, order],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "createOrder",
        )

        // Notify inventory for deduction
        get().notifyInventoryDeduction(order.items)

        // Clear cart after order
        get().clearCart()

        return order
      },

      updateOrderStatus: (orderId, status) => {
        set(
          (state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order,
            ),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateOrderStatus",
        )
      },

      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + item.total_price, 0)
      },

      getCartNutrition: () => {
        return get().cart.reduce(
          (total, item) => ({
            calories: total.calories + item.total_nutrition.calories,
            protein: total.protein + item.total_nutrition.protein,
            carbs: total.carbs + item.total_nutrition.carbs,
            fat: total.fat + item.total_nutrition.fat,
            fiber: total.fiber + item.total_nutrition.fiber,
            sodium: total.sodium + item.total_nutrition.sodium,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
        )
      },

      getCartItemCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0)
      },

      updateMenuItems: (items) => {
        set(
          (state) => ({
            menuItems: items,
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "updateMenuItems",
        )
      },

      getAvailableMenuItems: () => {
        return get().menuItems.filter((item) => item.available_quantity > 0)
      },

      getMenuItemsByCategory: (category) => {
        return get().menuItems.filter((item) => item.category === category)
      },

      removeMenuItem: (menuItemId) => {
        set(
          (state) => ({
            menuItems: state.menuItems.filter((item) => item.id !== menuItemId),
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "removeMenuItem",
        )
      },

      addKitchenItemToMenu: (kitchenItem, price) => {
        // Create a menu item from kitchen item
        const newMenuItem: MenuItemForSale = {
          id: `manual-${kitchenItem.id}-${Date.now()}`,
          name: kitchenItem.name,
          type: kitchenItem.type || "individual",
          category: kitchenItem.category || "Other",
          price: price,
          available_quantity: kitchenItem.quantity || 0,
          unit: kitchenItem.unit || "portion",
          display_unit: kitchenItem.unit || "portion",
          bulk_unit: kitchenItem.unit || "portion",
          conversion_factor: 1,
          nutrition: kitchenItem.nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sodium: 0,
          },
        }

        set(
          (state) => ({
            menuItems: [...state.menuItems, newMenuItem],
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "addKitchenItemToMenu",
        )
      },

      notifyInventoryDeduction: (cartItems) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pos-sale-completed", {
              detail: {
                cartItems,
                timestamp: new Date().toISOString(),
              },
            }),
          )
        }
      },
    })),
    { name: "unified-pos-store" },
  ),
)

// Listen for menu updates from kitchen
if (typeof window !== "undefined") {
  window.addEventListener("menu-updated", (event: any) => {
    const { menuItems } = event.detail
    useUnifiedPOSStore.getState().updateMenuItems(menuItems)
  })
}
