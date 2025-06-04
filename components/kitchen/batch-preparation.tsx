"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChefHat, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Recipe, BatchLog } from "@/types/operational"

export function BatchPreparation() {
  const { toast } = useToast()

  // Mock data
  const [recipes] = useState<Recipe[]>([
    {
      id: 1,
      name: "Chicken Fried Rice",
      category: "Main Course",
      default_yield: 50,
      ingredients: [
        {
          ingredient_id: 3,
          ingredient_name: "Chicken Breast",
          quantity_per_batch: 5,
          unit: "kg",
          cost_per_unit: 8.0,
          total_cost: 40.0,
        },
        {
          ingredient_id: 4,
          ingredient_name: "Rice",
          quantity_per_batch: 8,
          unit: "kg",
          cost_per_unit: 3.0,
          total_cost: 24.0,
        },
        {
          ingredient_id: 2,
          ingredient_name: "Onions",
          quantity_per_batch: 2,
          unit: "kg",
          cost_per_unit: 1.5,
          total_cost: 3.0,
        },
      ],
      total_raw_cost: 67.0,
      cost_per_portion: 1.34,
      selling_price: 2.5,
      markup_percentage: 87,
      is_published: true,
      created_at: "2024-01-10",
      updated_at: "2024-01-15",
    },
  ])

  const [currentStock] = useState<Record<number, number>>({
    2: 25, // Onions
    3: 12, // Chicken Breast
    4: 50, // Rice
  })

  const [batchLogs, setBatchLogs] = useState<BatchLog[]>([
    {
      id: 1,
      recipe_id: "1",
      recipe_name: "Chicken Fried Rice",
      batch_count: 2,
      total_portions_produced: 100,
      ingredients_used: [
        { ingredient_id: 3, ingredient_name: "Chicken Breast", quantity_used: 10, unit: "kg", cost: 80.0 },
        { ingredient_id: 4, ingredient_name: "Rice", quantity_used: 16, unit: "kg", cost: 48.0 },
        { ingredient_id: 2, ingredient_name: "Onions", quantity_used: 4, unit: "kg", cost: 6.0 },
      ],
      total_cost: 134.0,
      prepared_at: "2024-01-15T10:30:00",
      prepared_by: "Chef Johnson",
    },
  ])

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [batchCount, setBatchCount] = useState(1)

  const checkStockAvailability = (recipe: Recipe, batches: number) => {
    const warnings: string[] = []
    const canPrepare = recipe.ingredients.every((ingredient) => {
      const required = ingredient.quantity_per_batch * batches
      const available = currentStock[ingredient.ingredient_id] || 0

      if (available < required) {
        warnings.push(
          `${ingredient.ingredient_name}: Need ${required}${ingredient.unit}, only ${available}${ingredient.unit} available`,
        )
        return false
      }
      return true
    })

    return { canPrepare, warnings }
  }

  const logBatch = () => {
    if (!selectedRecipe) return

    const { canPrepare, warnings } = checkStockAvailability(selectedRecipe, batchCount)

    if (!canPrepare) {
      toast({
        title: "Insufficient Stock",
        description: "Cannot prepare batch due to insufficient ingredients",
        variant: "destructive",
      })
      return
    }

    const newBatchLog: BatchLog = {
      id: batchLogs.length + 1,
      recipe_id: selectedRecipe.id.toString(),
      recipe_name: selectedRecipe.name,
      batch_count: batchCount,
      total_portions_produced: selectedRecipe.default_yield * batchCount,
      ingredients_used: selectedRecipe.ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        quantity_used: ingredient.quantity_per_batch * batchCount,
        unit: ingredient.unit,
        cost: ingredient.total_cost * batchCount,
      })),
      total_cost: selectedRecipe.total_raw_cost * batchCount,
      prepared_at: new Date().toISOString(),
      prepared_by: "Chef Johnson",
    }

    setBatchLogs([newBatchLog, ...batchLogs])

    toast({
      title: "Batch Logged Successfully",
      description: `Prepared ${newBatchLog.total_portions_produced} portions of ${selectedRecipe.name}`,
    })

    // Reset form
    setSelectedRecipe(null)
    setBatchCount(1)
  }

  const stockCheck = selectedRecipe
    ? checkStockAvailability(selectedRecipe, batchCount)
    : { canPrepare: true, warnings: [] }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Preparation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Log New Batch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipe-select">Select Recipe</Label>
              <Select
                value={selectedRecipe?.id.toString() || ""}
                onValueChange={(value) => {
                  const recipe = recipes.find((r) => r.id.toString() === value)
                  setSelectedRecipe(recipe || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a recipe to prepare" />
                </SelectTrigger>
                <SelectContent>
                  {recipes
                    .filter((r) => r.is_published)
                    .map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id.toString()}>
                        {recipe.name} (Yield: {recipe.default_yield} portions)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="batch-count">Number of Batches</Label>
              <Input
                id="batch-count"
                type="number"
                min="1"
                value={batchCount}
                onChange={(e) => setBatchCount(Number.parseInt(e.target.value) || 1)}
              />
            </div>

            {selectedRecipe && (
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Batch Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Total Portions:</span>
                    <span className="font-medium">{selectedRecipe.default_yield * batchCount}</span>
                    <span>Total Cost:</span>
                    <span className="font-medium">${(selectedRecipe.total_raw_cost * batchCount).toFixed(2)}</span>
                    <span>Cost per Portion:</span>
                    <span className="font-medium">${selectedRecipe.cost_per_portion.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Required Ingredients</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecipe.ingredients.map((ingredient) => {
                        const required = ingredient.quantity_per_batch * batchCount
                        const available = currentStock[ingredient.ingredient_id] || 0
                        const sufficient = available >= required

                        return (
                          <TableRow key={ingredient.ingredient_id}>
                            <TableCell>{ingredient.ingredient_name}</TableCell>
                            <TableCell>
                              {required}
                              {ingredient.unit}
                            </TableCell>
                            <TableCell>
                              {available}
                              {ingredient.unit}
                            </TableCell>
                            <TableCell>
                              <Badge variant={sufficient ? "default" : "destructive"}>
                                {sufficient ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Available
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Insufficient
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {stockCheck.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Stock Warnings:</p>
                        {stockCheck.warnings.map((warning, index) => (
                          <p key={index} className="text-sm">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={logBatch} disabled={!stockCheck.canPrepare} className="w-full">
                  Log Batch Preparation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Batch Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Batch Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{log.recipe_name}</h4>
                    <Badge variant="outline">
                      {log.batch_count} batch{log.batch_count > 1 ? "es" : ""}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Portions: {log.total_portions_produced}</p>
                    <p>Cost: ${log.total_cost.toFixed(2)}</p>
                    <p>Prepared: {new Date(log.prepared_at).toLocaleString()}</p>
                    <p>By: {log.prepared_by}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
