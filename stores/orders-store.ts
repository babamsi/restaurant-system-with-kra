import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Order, OrderStatus } from "@/types/order"

interface OrdersState {
  orders: Order[]

  // Actions
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
  updateOrder: (orderId: string, updates: Partial<Order>) => void
  deleteOrder: (orderId: string) => void
  getOrder: (orderId: string) => Order | undefined
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getTodaysOrders: () => Order[]
  getTotalRevenue: () => number
  clearOrders: () => void
}

const initialOrders: Order[] = []

export const useOrdersStore = create<OrdersState>()(
  devtools(
    (set, get) => ({
      orders: initialOrders,

      addOrder: (order) =>
        set(
          (state) => ({
            orders: [order, ...state.orders],
          }),
          false,
          "addOrder",
        ),

      updateOrderStatus: (orderId, newStatus) =>
        set(
          (state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order,
            ),
          }),
          false,
          "updateOrderStatus",
        ),

      updateOrder: (orderId, updates) =>
        set(
          (state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, ...updates, updatedAt: new Date() } : order,
            ),
          }),
          false,
          "updateOrder",
        ),

      deleteOrder: (orderId) =>
        set(
          (state) => ({
            orders: state.orders.filter((order) => order.id !== orderId),
          }),
          false,
          "deleteOrder",
        ),

      getOrder: (orderId) => get().orders.find((order) => order.id === orderId),

      getOrdersByStatus: (status) => get().orders.filter((order) => order.status === status),

      getTodaysOrders: () => {
        const today = new Date().toDateString()
        return get().orders.filter((order) => order.createdAt.toDateString() === today)
      },

      getTotalRevenue: () =>
        get()
          .orders.filter((order) => order.status === "completed")
          .reduce((sum, order) => sum + order.total, 0),

      clearOrders: () => set({ orders: [] }, false, "clearOrders"),
    }),
    { name: "orders-store" },
  ),
)
