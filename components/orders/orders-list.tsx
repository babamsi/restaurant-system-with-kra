// components/orders/orders-list.tsx

import type React from "react"

interface OrderItem {
  name: string
  quantity: number
  price: number
  type: "individual" | "bulk"
  display_unit?: string
}

interface Order {
  id: string
  customerName: string
  items: OrderItem[]
  total: number
  status: string
}

interface OrdersListProps {
  orders: Order[]
}

const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Order Items with precise units for kitchen */}
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.type === "individual" ? (
                          <>
                            {item.quantity}
                            {item.display_unit} {item.name}
                          </>
                        ) : (
                          <>
                            {item.quantity}x {item.name}
                          </>
                        )}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrdersList
