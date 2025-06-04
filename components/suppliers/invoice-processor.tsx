"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Plus, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceItem, Ingredient } from "@/types/operational"

export function InvoiceProcessor() {
  const { toast } = useToast()
  const [extractedItems, setExtractedItems] = useState<InvoiceItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock existing ingredients for mapping
  const [existingIngredients] = useState<Ingredient[]>([
    {
      id: 1,
      name: "Fresh Tomatoes",
      unit: "kg",
      cost_per_unit: 2.5,
      current_stock: 15,
      threshold: 5,
      category: "Vegetables",
      last_updated: "2024-01-15",
      created_at: "2024-01-01",
    },
    {
      id: 2,
      name: "Onions",
      unit: "kg",
      cost_per_unit: 1.5,
      current_stock: 25,
      threshold: 10,
      category: "Vegetables",
      last_updated: "2024-01-15",
      created_at: "2024-01-01",
    },
    {
      id: 3,
      name: "Chicken Breast",
      unit: "kg",
      cost_per_unit: 8.0,
      current_stock: 12,
      threshold: 5,
      category: "Proteins",
      last_updated: "2024-01-15",
      created_at: "2024-01-01",
    },
    {
      id: 4,
      name: "Rice",
      unit: "kg",
      cost_per_unit: 3.0,
      current_stock: 50,
      threshold: 20,
      category: "Grains",
      last_updated: "2024-01-15",
      created_at: "2024-01-01",
    },
  ])

  // Simulate OCR extraction
  const handleInvoiceUpload = () => {
    setIsProcessing(true)

    setTimeout(() => {
      const mockExtractedItems: InvoiceItem[] = [
        {
          id: 1,
          name: "Fresh Tomatoes",
          quantity: 20,
          unit: "kg",
          total_cost: 50.0,
          cost_per_unit: 2.5,
          mapped_ingredient_id: 1,
          is_new_ingredient: false,
        },
        {
          id: 2,
          name: "Yellow Onions",
          quantity: 15,
          unit: "kg",
          total_cost: 22.5,
          cost_per_unit: 1.5,
          mapped_ingredient_id: 2,
          is_new_ingredient: false,
        },
        {
          id: 3,
          name: "Bell Peppers",
          quantity: 8,
          unit: "kg",
          total_cost: 32.0,
          cost_per_unit: 4.0,
          mapped_ingredient_id: undefined,
          is_new_ingredient: true,
        },
        {
          id: 4,
          name: "Olive Oil",
          quantity: 5,
          unit: "L",
          total_cost: 45.0,
          cost_per_unit: 9.0,
          mapped_ingredient_id: undefined,
          is_new_ingredient: true,
        },
      ]

      setExtractedItems(mockExtractedItems)
      setIsProcessing(false)

      toast({
        title: "Invoice Processed",
        description: "Successfully extracted 4 items from invoice",
      })
    }, 2000)
  }

  const handleIngredientMapping = (itemId: number, ingredientId: string) => {
    setExtractedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              mapped_ingredient_id: ingredientId === "new" ? undefined : Number.parseInt(ingredientId),
              is_new_ingredient: ingredientId === "new",
            }
          : item,
      ),
    )
  }

  const handleSaveToInventory = () => {
    // Here we would update the inventory with new stock and costs
    toast({
      title: "Inventory Updated",
      description: `Updated stock levels for ${extractedItems.length} items`,
    })

    // Reset the form
    setExtractedItems([])
  }

  const calculateTotalValue = () => {
    return extractedItems.reduce((sum, item) => sum + item.total_cost, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Invoice Processing & Stock Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {extractedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="border-2 border-dashed rounded-lg p-8">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Supplier Invoice</h3>
              <p className="text-muted-foreground mb-4">
                Upload an invoice to automatically extract items and update inventory
              </p>
              <Button onClick={handleInvoiceUpload} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Upload & Process Invoice"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Extracted Invoice Items</h3>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Invoice Value</p>
                <p className="text-2xl font-bold">${calculateTotalValue().toFixed(2)}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Map to Ingredient</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>${item.total_cost.toFixed(2)}</TableCell>
                    <TableCell>${item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={item.mapped_ingredient_id?.toString() || (item.is_new_ingredient ? "new" : "")}
                        onValueChange={(value) => handleIngredientMapping(item.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Create New Ingredient
                            </div>
                          </SelectItem>
                          {existingIngredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                              {ingredient.name} ({ingredient.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {item.is_new_ingredient ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      ) : item.mapped_ingredient_id ? (
                        <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Mapped</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExtractedItems([])}>
                Cancel
              </Button>
              <Button onClick={handleSaveToInventory} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save to Inventory
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
