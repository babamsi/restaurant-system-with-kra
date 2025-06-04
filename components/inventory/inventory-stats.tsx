import { Card, CardContent } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp } from "lucide-react"

export function InventoryStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="overflow-hidden border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">248</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">7</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-red-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Value</p>
              <p className="text-2xl font-bold">$5,248</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
