"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle, Package, ChefHat } from "lucide-react"

export function OperationalReports() {
  // Mock data for reports
  const recipeMargins = [
    { name: "Chicken Fried Rice", cost: 1.34, selling: 2.5, margin: 87, sales: 45 },
    { name: "Beef Stew", cost: 2.1, selling: 3.5, margin: 67, sales: 32 },
    { name: "Vegetable Curry", cost: 0.85, selling: 2.0, margin: 135, sales: 28 },
  ]

  const ingredientUsage = [
    { name: "Rice", used: 24, remaining: 26, total: 50, cost: 72.0 },
    { name: "Chicken Breast", used: 8, remaining: 4, total: 12, cost: 64.0 },
    { name: "Onions", used: 6, remaining: 19, total: 25, cost: 9.0 },
  ]

  const batchEfficiency = [
    { recipe: "Chicken Fried Rice", batches: 3, produced: 150, sold: 105, remaining: 45, efficiency: 70 },
    { recipe: "Beef Stew", batches: 2, produced: 80, sold: 48, remaining: 32, efficiency: 60 },
    { recipe: "Vegetable Curry", batches: 1, produced: 40, sold: 28, remaining: 12, efficiency: 70 },
  ]

  const lowMarginAlerts = recipeMargins.filter((recipe) => recipe.margin < 75)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Recipe Margin</p>
                <p className="text-2xl font-bold">96%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Utilization</p>
                <p className="text-2xl font-bold">76%</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Batch Efficiency</p>
                <p className="text-2xl font-bold">67%</p>
              </div>
              <ChefHat className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Margin Alerts</p>
                <p className="text-2xl font-bold text-amber-500">{lowMarginAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="margins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="margins">Recipe Margins</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Usage</TabsTrigger>
          <TabsTrigger value="efficiency">Batch Efficiency</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Cost vs Selling Price Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>Cost per Portion</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Markup %</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Total Profit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeMargins.map((recipe) => {
                    const profit = (recipe.selling - recipe.cost) * recipe.sales
                    return (
                      <TableRow key={recipe.name}>
                        <TableCell className="font-medium">{recipe.name}</TableCell>
                        <TableCell>${recipe.cost.toFixed(2)}</TableCell>
                        <TableCell>${recipe.selling.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {recipe.margin}%
                            {recipe.margin > 75 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{recipe.sales}</TableCell>
                        <TableCell>${profit.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={recipe.margin > 75 ? "default" : "destructive"}>
                            {recipe.margin > 75 ? "Healthy" : "Low Margin"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Usage vs Stock Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Usage Rate</TableHead>
                    <TableHead>Value Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientUsage.map((ingredient) => {
                    const usageRate = (ingredient.used / ingredient.total) * 100
                    return (
                      <TableRow key={ingredient.name}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>{ingredient.used} kg</TableCell>
                        <TableCell>{ingredient.remaining} kg</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={usageRate} className="w-16" />
                            <span className="text-sm">{usageRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>${ingredient.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={usageRate > 80 ? "destructive" : usageRate > 50 ? "outline" : "default"}>
                            {usageRate > 80 ? "High Usage" : usageRate > 50 ? "Moderate" : "Low Usage"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency">
          <Card>
            <CardHeader>
              <CardTitle>Batch Preparation vs Portions Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe</TableHead>
                    <TableHead>Batches Prepared</TableHead>
                    <TableHead>Portions Produced</TableHead>
                    <TableHead>Portions Sold</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchEfficiency.map((batch) => (
                    <TableRow key={batch.recipe}>
                      <TableCell className="font-medium">{batch.recipe}</TableCell>
                      <TableCell>{batch.batches}</TableCell>
                      <TableCell>{batch.produced}</TableCell>
                      <TableCell>{batch.sold}</TableCell>
                      <TableCell>{batch.remaining}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={batch.efficiency} className="w-16" />
                          <span className="text-sm">{batch.efficiency}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            batch.efficiency > 75 ? "default" : batch.efficiency > 50 ? "outline" : "destructive"
                          }
                        >
                          {batch.efficiency > 75 ? "Efficient" : batch.efficiency > 50 ? "Moderate" : "Inefficient"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Low Profit Margin Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowMarginAlerts.length === 0 ? (
                  <p className="text-muted-foreground">No low margin alerts at this time.</p>
                ) : (
                  <div className="space-y-2">
                    {lowMarginAlerts.map((recipe) => (
                      <div key={recipe.name} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{recipe.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Margin: {recipe.margin}% (Cost: ${recipe.cost.toFixed(2)}, Price: $
                            {recipe.selling.toFixed(2)})
                          </p>
                        </div>
                        <Badge variant="destructive">Low Margin</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
