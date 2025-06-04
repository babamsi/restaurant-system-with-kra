import type { OrderStatus } from "@/types/order"

export const orderStatusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
  switch (currentStatus) {
    case "pending":
      return "in-progress"
    case "in-progress":
      return "ready"
    case "ready":
      return "completed"
    default:
      return null
  }
}

export const canChangeStatus = (currentStatus: OrderStatus): boolean => {
  return currentStatus !== "completed" && currentStatus !== "cancelled"
}
