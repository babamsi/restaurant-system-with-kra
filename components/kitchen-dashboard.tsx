"\"use client"
import { KitchenStats } from "@/components/kitchen/kitchen-stats"
import { IngredientUsageForm } from "@/components/kitchen/ingredient-usage-form"
import { PreparedFoodList } from "@/components/kitchen/prepared-food-list"

export function KitchenDashboard() {
  return (
    <div className="space-y-6">
      <KitchenStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IngredientUsageForm />
        <PreparedFoodList />
      </div>
    </div>
  )
}
