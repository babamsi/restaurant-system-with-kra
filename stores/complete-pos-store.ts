import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { MenuItem, CartItem, Order, NutritionInfo } from "@/types/unified-system"
import { useCompleteInventoryStore } from "./complete-inventory-store"
import { useCompleteKitchenStore } from "./complete-kitchen-store"
import { useOrdersStore } from "./orders-store"

interface POSState {
  menuItems: MenuItem[]
  cart: CartItem[]
  orders: Order[]
  lastUpdated: string

  // Cart Actions
  addToCart: (menuItem: MenuItem, quantity: number) => void
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void

  // Order Actions
  createOrder: (orderData: Partial<Order>) => Order
  updateOrderStatus: (orderId: string, status: string) => void

  // Getters
  getCartTotal: () => number
  getCartItemCount: () => number
  getCartNutrition: () => NutritionInfo
  getAvailableMenuItems: () => MenuItem[]
  getOrder: (orderId: string) => Order | undefined

  // Sync
  syncWithKitchen: () => void
  syncWithInventory: () => void
}

export const useCompletePOSStore = create<POSState>()(
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
          const cartItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random()}`,
            menu_item_id: menuItem.id,
            name: menuItem.name,
            type: menuItem.type,
            unit_price: menuItem.price,
            quantity: quantity,
            total_price: menuItem.price * quantity,
            unit: menuItem.unit,
            total_nutrition: {
              calories: menuItem.nutrition.calories * quantity,
              protein: menuItem.nutrition.protein * quantity,
              carbs: menuItem.nutrition.carbs * quantity,
              fat: menuItem.nutrition.fat * quantity,
              fiber: menuItem.nutrition.fiber * quantity,
              sodium: menuItem.nutrition.sodium * quantity,
            },
            inventory_deduction: menuItem.inventory_deduction
              ? {
                  ingredient_id: menuItem.inventory_deduction.ingredient_id,
                  quantity_to_deduct: menuItem.inventory_deduction.quantity_per_unit * quantity,
                }
              : undefined,
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
                const updatedItem = {
                  ...item,
                  quantity: newQuantity,
                  total_price: item.unit_price * newQuantity,
                  total_nutrition: {
                    calories: (item.total_nutrition.calories / item.quantity) * newQuantity,
                    protein: (item.total_nutrition.protein / item.quantity) * newQuantity,
                    carbs: (item.total_nutrition.carbs / item.quantity) * newQuantity,
                    fat: (item.total_nutrition.fat / item.quantity) * newQuantity,
                    fiber: (item.total_nutrition.fiber / item.quantity) * newQuantity,
                    sodium: (item.total_nutrition.sodium / item.quantity) * newQuantity,
                  },
                }

                if (updatedItem.inventory_deduction) {
                  updatedItem.inventory_deduction.quantity_to_deduct =
                    (item.inventory_deduction!.quantity_to_deduct / item.quantity) * newQuantity
                }

                return updatedItem
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
          id: `ORD-${Date.now()}`,
          items: [...get().cart],
          customer_name: orderData.customer_name,
          table_number: orderData.table_number,
          order_type: orderData.order_type || "dine-in",
          subtotal: orderData.subtotal || get().getCartTotal(),
          tax: orderData.tax || 0,
          total: orderData.total || get().getCartTotal(),
          total_nutrition: orderData.total_nutrition || get().getCartNutrition(),
          status: orderData.status || "pending",
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

        // Sync with main orders store
        useOrdersStore.getState().addOrder({
          id: order.id,
          tableNumber: order.table_number,
          customerName: order.customer_name || "Customer",
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            portionSize: "regular",
            price: item.unit_price,
          })),
          status: "incoming",
          total: order.total,
          createdAt: new Date(),
          updatedAt: new Date(),
          specialInstructions: order.order_type === "takeaway" ? "Takeaway order" : undefined,
        })

        // Notify inventory to deduct stock
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("order-completed", {
              detail: {
                orderId: order.id,
                orderItems: order.items,
              },
            }),
          )
        }

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

      getCartItemCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0)
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

      getAvailableMenuItems: () => {
        return get().menuItems.filter((item) => item.available_quantity > 0)
      },

      getOrder: (orderId) => {
        return get().orders.find((order) => order.id === orderId)
      },

      syncWithKitchen: () => {
        const kitchenStore = useCompleteKitchenStore.getState()
        const inventoryStore = useCompleteInventoryStore.getState()

        const menuItems: MenuItem[] = []

        // Add published recipes
        kitchenStore.getPublishedRecipes().forEach((recipe) => {
          if (recipe.available_portions > 0) {
            menuItems.push({
              id: `recipe-${recipe.id}`,
              name: recipe.name,
              category: recipe.category,
              description: recipe.description,
              price: recipe.selling_price,
              type: "recipe",
              available_quantity: recipe.available_portions,
              unit: "portion",
              prep_time_minutes: recipe.prep_time_minutes,
              nutrition: recipe.nutrition_per_portion,
              inventory_deduction: undefined, // Recipes handle their own ingredient deduction
            })
          }
        })

        // Add sellable individual ingredients
        inventoryStore.getSellableIngredients().forEach((ingredient) => {
          if (ingredient.current_stock > 0 && ingredient.individual_selling_price) {
            const availableCustomerUnits = Math.floor(ingredient.current_stock / (ingredient.customer_unit_size || 1))

            if (availableCustomerUnits > 0) {
              menuItems.push({
                id: `ingredient-${ingredient.id}`,
                name: ingredient.name,
                category: ingredient.category,
                description: `Fresh ${ingredient.name.toLowerCase()}`,
                price: ingredient.individual_selling_price,
                type: "individual",
                available_quantity: availableCustomerUnits,
                unit: ingredient.customer_unit || ingredient.unit,
                nutrition: ingredient.nutrition_per_unit,
                inventory_deduction: {
                  ingredient_id: ingredient.id,
                  quantity_per_unit: ingredient.customer_unit_size || 1,
                },
              })
            }
          }
        })

        set(
          (state) => ({
            menuItems,
            lastUpdated: new Date().toISOString(),
          }),
          false,
          "syncWithKitchen",
        )
      },

      syncWithInventory: () => {
        // This will be called when inventory updates
        get().syncWithKitchen()
      },
    })),
    { name: "complete-pos-store" },
  ),
)

// Initialize menu items on store creation
useCompletePOSStore.getState().syncWithKitchen()

// Listen for kitchen and inventory updates
if (typeof window !== "undefined") {
  window.addEventListener("menu-updated", () => {
    useCompletePOSStore.getState().syncWithKitchen()
  })

  window.addEventListener("inventory-pos-update", () => {
    useCompletePOSStore.getState().syncWithInventory()
  })
}
