import { ZustandOrdersDashboard } from "@/components/orders/zustand-orders-dashboard"

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <ZustandOrdersDashboard />
      </div>
    </div>
  )
}
