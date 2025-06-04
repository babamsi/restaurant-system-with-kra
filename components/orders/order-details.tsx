"use client"

import { useState } from "react"
import type { Order, OrderStatus } from "@/types/order"
import { OrderStatusBadge } from "./order-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Clock, ChevronRight, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { canChangeStatus, getNextStatus, orderStatusLabels } from "@/utils/order-status"

interface OrderDetailsProps {
  order: Order
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void
}

export function OrderDetails({ order, onStatusChange }: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async () => {
    const nextStatus = getNextStatus(order.status)
    if (!nextStatus || !onStatusChange) return

    setIsUpdating(true)
    try {
      await onStatusChange(order.id, nextStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const nextStatus = getNextStatus(order.status)
  const canUpdate = canChangeStatus(order.status)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Order #{order.id.slice(-6)}</CardTitle>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium">{order.customerName}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="mr-1 h-3 w-3" />
              <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Total</p>
            <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Items</h4>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div>
                <span className="font-medium">{item.quantity}x </span>
                {item.name}
                {item.portionSize && item.portionSize !== "regular" && (
                  <span className="text-xs text-muted-foreground ml-1">({item.portionSize})</span>
                )}
              </div>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="mt-4 p-3 bg-muted rounded-md flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium">Special Instructions</p>
              <p className="text-xs">{order.specialInstructions}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {canUpdate && nextStatus && (
          <Button className="w-full" onClick={handleStatusChange} disabled={isUpdating}>
            Mark as {orderStatusLabels[nextStatus]}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
