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
}

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    tableNumber: "Table 12A",
    customerName: "Sarah Johnson",
    items: [
      { id: "item1", name: "Grilled Chicken Caesar Salad", quantity: 1, portionSize: "regular", price: 12.99 },
      { id: "item2", name: "Iced Coffee", quantity: 1, price: 3.5 },
    ],
    status: "incoming",
    total: 16.49,
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(Date.now() - 5 * 60000),
    specialInstructions: "Extra dressing on the side please",
  },
  {
    id: "ORD-002",
    tableNumber: "Table 8B",
    customerName: "Michael Chen",
    items: [
      { id: "item4", name: "Beef Pasta Bolognese", quantity: 1, portionSize: "large", price: 18.49 },
      { id: "item5", name: "Fresh Orange Juice", quantity: 1, price: 4.0 },
    ],
    status: "processing",
    total: 22.49,
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(Date.now() - 10 * 60000),
    preparedBy: "Chef Martinez",
  },
  {
    id: "ORD-003",
    tableNumber: "Table 15C",
    customerName: "Emily Rodriguez",
    items: [{ id: "item7", name: "Vegetable Stir Fry", quantity: 2, portionSize: "regular", price: 9.99 }],
    status: "processing",
    total: 19.98,
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(Date.now() - 20 * 60000),
    preparedBy: "Chef Martinez",
  },
  {
    id: "ORD-004",
    tableNumber: "Table 3A",
    customerName: "David Kim",
    items: [{ id: "item9", name: "Grilled Salmon with Rice", quantity: 1, portionSize: "regular", price: 18.99 }],
    status: "completed",
    total: 18.99,
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(Date.now() - 30 * 60000),
    preparedBy: "Chef Martinez",
  },
]

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
    }),
    { name: "orders-store" },
  ),
)
