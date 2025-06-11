import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdvancedInventoryStore } from "@/stores/advanced-inventory-store"
import { useToast } from "@/hooks/use-toast"
import { ChefHat, Plus } from "lucide-react"

interface PreparedItem {
  id: string
  name: string
  description: string
  unit: string
  components: {
    ingredient_id: string
    quantity: number
  }[]
}

export function ProductionManagement() {
  const { toast } = useToast()
  const [isAddingProduction, setIsAddingProduction] = useState(false)
  const [selectedItem, setSelectedItem] = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiryDate, setExpiryDate] = useState("")

  const { createPreparedItemBatch, calculateProductionCost } = useAdvancedInventoryStore()

  // This would come from your recipe management system
  const preparedItems: PreparedItem[] = [
    {
      id: "1",
      name: "Tomato Sauce Base",
      description: "Base tomato sauce for pasta dishes",
      unit: "L",
      components: [
        { ingredient_id: "1", quantity: 2 }, // Tomatoes
        { ingredient_id: "2", quantity: 0.5 }, // Onions
        { ingredient_id: "3", quantity: 0.2 }, // Garlic
      ],
    },
    // Add more prepared items as needed
  ]

  const handleCreateBatch = () => {
    if (!selectedItem || !quantity || !expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const item = preparedItems.find((i) => i.id === selectedItem)
    if (!item) return

    createPreparedItemBatch({
      prepared_item_id: selectedItem,
      quantity_produced: parseFloat(quantity),
      production_date: new Date(),
      expiry_date: new Date(expiryDate),
      cost_per_unit: 0, // This will be calculated based on components
      components: item.components.map((comp) => ({
        batch_id: "", // This should be selected from available batches
        quantity_used: comp.quantity * parseFloat(quantity),
      })),
    })

    toast({
      title: "Production Batch Created",
      description: `Created new batch of ${item.name}`,
    })

    setIsAddingProduction(false)
    setSelectedItem("")
    setQuantity("")
    setExpiryDate("")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Production Management</CardTitle>
        <Button onClick={() => setIsAddingProduction(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Production
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Production Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Cost per Unit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* This would be populated from your preparedItemBatches */}
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No production batches yet
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>

      {/* Add Production Dialog */}
      {isAddingProduction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>New Production Batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Prepared Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {preparedItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingProduction(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch}>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Create Batch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
} 