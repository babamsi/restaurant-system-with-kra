export type OrderStatus = "incoming" | "processing" | "completed" | "cancelled"

export interface OrderItem {
  id: string
  name: string
  quantity: number
  portionSize?: "small" | "regular" | "large"
  price: number
  specialInstructions?: string
}

export interface Order {
  id: string
  tableNumber?: string
  customerName: string
  items: OrderItem[]
  status: OrderStatus
  total: number
  createdAt: Date
  updatedAt: Date
  preparedBy?: string
  specialInstructions?: string
  estimatedReadyTime?: Date
}
