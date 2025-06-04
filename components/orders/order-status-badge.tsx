import type { OrderStatus } from "@/types/order"
import { orderStatusColors, orderStatusLabels } from "@/utils/order-status"
import { cn } from "@/lib/utils"

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        orderStatusColors[status],
        className,
      )}
    >
      {orderStatusLabels[status]}
    </span>
  )
}
