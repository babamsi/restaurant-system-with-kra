"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function InventoryCategories() {
  const [categories] = useState([
    {
      id: 1,
      name: "Vegetables",
      itemCount: 28,
      totalValue: 420.5,
      stockHealth: 85,
      lowStockItems: 2,
      outOfStockItems: 0,
    },
    {
      id: 2,
      name: "Meat",
      itemCount: 12,
      totalValue: 850.75,
      stockHealth: 70,
      lowStockItems: 1,
      outOfStockItems: 0,
    },
    {
      id: 3,
      name: "Dairy",
      itemCount: 15,
      totalValue: 320.25,
      stockHealth: 90,
      lowStockItems: 0,
      outOfStockItems: 0,
    },
    {
      id: 4,
      name: "Grains",
      itemCount: 18,
      totalValue: 275.8,
      stockHealth: 75,
      lowStockItems: 1,
      outOfStockItems: 0,
    },
    {
      id: 5,
      name: "Fruits",
      itemCount: 22,
      totalValue: 380.6,
      stockHealth: 65,
      lowStockItems: 2,
      outOfStockItems: 1,
    },
    {
      id: 6,
      name: "Spices",
      itemCount: 30,
      totalValue: 520.4,
      stockHealth: 95,
      lowStockItems: 0,
      outOfStockItems: 0,
    },
    {
      id: 7,
      name: "Oils",
      itemCount: 8,
      totalValue: 210.3,
      stockHealth: 60,
      lowStockItems: 1,
      outOfStockItems: 0,
    },
    {
      id: 8,
      name: "Beverages",
      itemCount: 14,
      totalValue: 430.9,
      stockHealth: 80,
      lowStockItems: 0,
      outOfStockItems: 0,
    },
  ])

  // Get progress color based on stock health
  const getProgressColor = (health: number) => {
    if (health >= 80) return "bg-green-500"
    if (health >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              {category.name}
              <Badge variant="outline" className="ml-2">
                {category.itemCount} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">${category.totalValue.toFixed(2)}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stock Health:</span>
                  <span className="font-medium">{category.stockHealth}%</span>
                </div>
                <Progress value={category.stockHealth} className={`h-2 ${getProgressColor(category.stockHealth)}`} />
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  {category.lowStockItems > 0 && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500 mr-2">
                      {category.lowStockItems} low
                    </Badge>
                  )}
                  {category.outOfStockItems > 0 && <Badge variant="destructive">{category.outOfStockItems} out</Badge>}
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  View Items
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
