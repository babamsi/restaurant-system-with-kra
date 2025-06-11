import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdvancedInventoryStore } from "@/stores/advanced-inventory-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { AlertTriangle, Package, ArrowRight } from "lucide-react"
import { BatchManagementDialog } from "./batch-management-dialog"

export function BatchList() {
  const { rawMaterialBatches, getBatchesByLocation, createTransfer } = useAdvancedInventoryStore()
  const { ingredients } = useSynchronizedInventoryStore()
  const [selectedLocation, setSelectedLocation] = useState<"storage" | "kitchen">("storage")

  const batches = getBatchesByLocation(selectedLocation)
  const otherLocation = selectedLocation === "storage" ? "kitchen" : "storage"

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || "Unknown"
  }

  const handleTransfer = (batchId: string) => {
    createTransfer({
      from_location: selectedLocation,
      to_location: otherLocation,
      batch_id: batchId,
      quantity: 0, // This should be calculated based on available quantity
      transferred_by: "system", // This should be the current user
      reason: "Manual transfer",
    })
  }

  const getExpiryStatus = (expiryDate: Date) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 0) return { status: "Expired", variant: "destructive" as const }
    if (daysUntilExpiry <= 7) return { status: "Expiring Soon", variant: "outline" as const, className: "text-amber-500 border-amber-500" }
    return { status: "Good", variant: "default" as const }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Batch Management</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={selectedLocation === "storage" ? "default" : "outline"}
            onClick={() => setSelectedLocation("storage")}
          >
            Storage
          </Button>
          <Button
            variant={selectedLocation === "kitchen" ? "default" : "outline"}
            onClick={() => setSelectedLocation("kitchen")}
          >
            Kitchen
          </Button>
          <BatchManagementDialog />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
              const ingredient = ingredients.find((i) => i.id === batch.ingredient_id)
              const expiryStatus = getExpiryStatus(batch.expiry_date)
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{getIngredientName(batch.ingredient_id)}</TableCell>
                  <TableCell>
                    {batch.quantity} {ingredient?.unit}
                  </TableCell>
                  <TableCell>{new Date(batch.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(batch.expiry_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "active" ? "default" : "outline"}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expiryStatus.variant} className={expiryStatus.className}>
                      {expiryStatus.status === "Expiring Soon" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {expiryStatus.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransfer(batch.id)}
                      disabled={batch.status !== "active"}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Transfer to {otherLocation}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 