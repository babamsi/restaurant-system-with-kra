"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Order, OrderStatus } from "@/types/order"
import { mockOrders } from "@/data/mock-data"

interface OrdersContextType {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>
  getOrdersByStatus: (status: OrderStatus) => Order[]
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return context
}

interface OrdersProviderProps {
  children: ReactNode
}

export function OrdersProvider({ children }: OrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const addOrder = useCallback((order: Order) => {
    setOrders((prevOrders) => [order, ...prevOrders])
  }, [])

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    return new Promise<void>((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order,
          ),
        )
        resolve()
      }, 500)
    })
  }, [])

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => {
      return orders.filter((order) => order.status === status)
    },
    [orders],
  )

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        getOrdersByStatus,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}
