import { create } from "zustand"
import { persist } from "zustand/middleware"
import { mockSuppliers } from "@/data/mock/suppliers"

export interface OrderItem {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  price: number
}

export interface SupplierOrder {
  id: string
  invoiceNumber: string
  date: string
  items: OrderItem[]
  subtotal: number
  vatAmount: number
  total: number
  status: "pending" | "paid"
  paymentMethod?: string
  paymentDate?: Date
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  categories: string[]
  payment_terms?: string
  orders: SupplierOrder[]
}

interface SupplierStore {
  suppliers: Supplier[]
  addSupplier: (supplier: Omit<Supplier, 'id' | 'orders'>) => void
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  getSupplier: (id: string) => Supplier | undefined
  getSuppliersByCategory: (category: string) => Supplier[]
  addOrder: (supplierId: string, order: Omit<SupplierOrder, 'id'>) => void
  updateOrderStatus: (supplierId: string, orderId: string, status: "pending" | "paid", paymentDate?: Date, paymentMethod?: string) => void
  getSupplierOrders: (supplierId: string) => SupplierOrder[]
  getUnpaidOrders: () => { supplier: Supplier; order: SupplierOrder }[]
  createOrderFromInventoryUpdate: (supplierId: string, items: { id: string; quantity: number; cost: number }[], invoiceNumber: string, vatAmount: number) => void
}

export const useSupplierStore = create<SupplierStore>()(
  persist(
    (set, get) => ({
      suppliers: mockSuppliers,

      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: crypto.randomUUID(),
          orders: [],
        }
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }))
      },

      updateSupplier: (id, supplier) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        }))
      },

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }))
      },

      getSupplier: (id) => {
        return get().suppliers.find((s) => s.id === id)
      },

      getSuppliersByCategory: (category) => {
        return get().suppliers.filter((s) => s.categories.includes(category))
      },

      addOrder: (supplierId, order) => {
        const newOrder: SupplierOrder = {
          ...order,
          id: crypto.randomUUID(),
        }
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === supplierId
              ? { ...s, orders: [...s.orders, newOrder] }
              : s
          ),
        }))
      },

      updateOrderStatus: (supplierId, orderId, status, paymentDate, paymentMethod) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) => {
            if (supplier.id === supplierId) {
              return {
                ...supplier,
                orders: supplier.orders.map((order) => {
                  if (order.id === orderId) {
                    return {
                      ...order,
                      status,
                      paymentDate,
                      paymentMethod,
                    }
                  }
                  return order
                }),
              }
            }
            return supplier
          }),
        }))
      },

      getSupplierOrders: (supplierId) => {
        const supplier = get().suppliers.find((s) => s.id === supplierId)
        return supplier?.orders || []
      },

      getUnpaidOrders: () => {
        const unpaidOrders: { supplier: Supplier; order: SupplierOrder }[] = []
        get().suppliers.forEach((supplier) => {
          supplier.orders
            .filter((order: SupplierOrder) => order.status === 'pending')
            .forEach((order: SupplierOrder) => {
              unpaidOrders.push({ supplier, order })
            })
        })
        return unpaidOrders
      },

      createOrderFromInventoryUpdate: (supplierId, items, invoiceNumber, vatAmount) => {
        const orderItems: OrderItem[] = items.map(item => ({
          ingredientId: item.id,
          ingredientName: item.id,
          quantity: item.quantity,
          unit: item.id,
          price: item.cost
        }))

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0)
        const total = subtotal + vatAmount

        const newOrder: Omit<SupplierOrder, 'id'> = {
          invoiceNumber,
          date: new Date().toISOString(),
          items: orderItems,
          subtotal,
          vatAmount,
          total,
          status: 'pending'
        }

        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === supplierId
              ? { ...s, orders: [...s.orders, { ...newOrder, id: crypto.randomUUID() }] }
              : s
          ),
        }))
      }
    }),
    {
      name: "supplier-store",
    }
  )
) 