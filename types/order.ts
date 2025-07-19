export type OrderStatus = "incoming" | "processing" | "ready" | "completed" | "cancelled"

export interface OrderItem {
  id: string
  menu_item_id: string
  name: string
  quantity: number
  portionSize?: string
  price: number
  customization?: string
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
