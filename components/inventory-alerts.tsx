import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function InventoryAlerts() {
  const alerts = [
    { name: "Fresh Tomatoes", status: "Out of Stock", color: "destructive" },
    { name: "Olive Oil", status: "Low Stock", color: "warning" },
    { name: "Chicken Breast", status: "Low Stock", color: "warning" },
    { name: "Brown Rice", status: "Low Stock", color: "warning" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">Items that need attention</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${item.color === "destructive" ? "bg-destructive" : "bg-amber-500"}`}
                ></span>
                <span className="font-medium">{item.name}</span>
              </div>
              <Badge
                variant={item.color === "destructive" ? "destructive" : "outline"}
                className={item.color === "warning" ? "text-amber-500 border-amber-500" : ""}
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
