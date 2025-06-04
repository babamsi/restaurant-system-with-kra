import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, DollarSign, Users, Package } from "lucide-react"

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="overflow-hidden border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Today's Revenue</div>
              <div className="text-3xl font-bold tracking-tight">$1,248.42</div>
              <div className="flex items-center text-xs text-green-500 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>23% increase from yesterday</span>
              </div>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/20">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Meals Served</div>
              <div className="text-3xl font-bold tracking-tight">187</div>
              <div className="flex items-center text-xs text-green-500 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>12% increase from yesterday</span>
              </div>
            </div>
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Low Stock Items</div>
              <div className="text-3xl font-bold tracking-tight">7</div>
              <div className="flex items-center text-xs text-red-500 mt-1">
                <span>3% Needs attention</span>
              </div>
            </div>
            <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
