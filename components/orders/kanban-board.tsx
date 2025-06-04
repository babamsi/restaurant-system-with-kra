"use client"

import { useState } from "react"
import type { Order, OrderStatus } from "@/types/order"
import { OrderCard } from "./order-card"
import { useToast } from "@/hooks/use-toast"

interface KanbanBoardProps {
  orders: Order[]
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>
}

export function KanbanBoard({ orders, onStatusChange }: KanbanBoardProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const incomingOrders = orders.filter((order) => order.status === "incoming")
  const processingOrders = orders.filter((order) => order.status === "processing")
  const completedOrders = orders.filter((order) => order.status === "completed")

  const handleMoveNext = async (orderId: string) => {
    if (isUpdating) return

    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    let newStatus: OrderStatus

    if (order.status === "incoming") {
      newStatus = "processing"
    } else if (order.status === "processing") {
      newStatus = "completed"
    } else {
      return
    }

    setIsUpdating(true)
    try {
      await onStatusChange(orderId, newStatus)
      toast({
        title: "Order Updated",
        description: `Order moved to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Incoming Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <h3 className="font-semibold text-lg">Incoming Orders</h3>
          <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 text-sm font-medium px-3 py-1 rounded-full">
            {incomingOrders.length}
          </div>
        </div>
        <div className="space-y-3 min-h-[400px]">
          {incomingOrders.length > 0 ? (
            incomingOrders.map((order) => <OrderCard key={order.id} order={order} onMoveNext={handleMoveNext} />)
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              No incoming orders
            </div>
          )}
        </div>
      </div>

      {/* In Progress Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <h3 className="font-semibold text-lg">In Progress</h3>
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full">
            {processingOrders.length}
          </div>
        </div>
        <div className="space-y-3 min-h-[400px]">
          {processingOrders.length > 0 ? (
            processingOrders.map((order) => <OrderCard key={order.id} order={order} onMoveNext={handleMoveNext} />)
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              No orders in progress
            </div>
          )}
        </div>
      </div>

      {/* Completed Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <h3 className="font-semibold text-lg">Completed</h3>
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-medium px-3 py-1 rounded-full">
            {completedOrders.length}
          </div>
        </div>
        <div className="space-y-3 min-h-[400px]">
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => <OrderCard key={order.id} order={order} onMoveNext={() => {}} />)
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              No completed orders
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
