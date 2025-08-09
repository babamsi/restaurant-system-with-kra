"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, Database, CheckCircle, TrendingUp } from "lucide-react"
import { TestKRAItem } from "@/lib/kra-test-items-service"

interface SummaryCardsProps {
  items: TestKRAItem[]
  classificationsCount: number
}

export function SummaryCards({ items, classificationsCount }: SummaryCardsProps) {
  const registeredItemsCount = items.filter(item => item.item_cd).length
  const taxTypesUsed = new Set(items.map(item => item.tax_ty_cd).filter(Boolean)).size

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Test Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">KRA Classifications</p>
              <p className="text-2xl font-bold">{classificationsCount}</p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Registered Items</p>
              <p className="text-2xl font-bold text-green-500">
                {registeredItemsCount}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tax Types Used</p>
              <p className="text-2xl font-bold text-purple-500">
                {taxTypesUsed}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 