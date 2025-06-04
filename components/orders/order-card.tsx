"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, User, MapPin, ChevronRight, MoreVertical } from "lucide-react"
import type { Order } from "@/types/order"

interface OrderCardProps {
  order: Order
  onMoveNext: (orderId: string) => void
}

export function OrderCard({ order, onMoveNext }: OrderCardProps) {
  const getTimeElapsed = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "incoming":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{getTimeElapsed(order.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{order.table_number}</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {item.type === "individual" && item.display_unit && (
                    <span className="text-muted-foreground ml-1">
                      ({item.quantity}
                      {item.display_unit})
                    </span>
                  )}
                  {item.type === "recipe" && (
                    <span className="text-muted-foreground ml-1">
                      ({item.quantity} meal{item.quantity > 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="p-2 bg-muted/20 rounded text-sm">
              <span className="font-medium">Note: </span>
              {order.special_instructions}
            </div>
          )}

          {/* Action Button */}
          {order.status !== "completed" && (
            <Button onClick={() => onMoveNext(order.id)} className="w-full" size="sm">
              {order.status === "incoming" ? "Start Preparing" : "Mark Complete"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
