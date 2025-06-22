"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash, PlusCircle, Loader2 } from "lucide-react"
import type { Batch } from "@/stores/kitchen-store"
import { insertWastageEvent } from "@/lib/kitchenSupabase"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import React from "react"
import { insertSystemLog } from "@/lib/kitchenSupabase"

export interface WastageEvent {
  id: string
  item_id: string
  item_name: string
  is_batch: boolean
  quantity: number
  unit: string
  reason: string
  reported_by: string | null
  created_at: string
}

interface KitchenStorageItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  used_grams?: number;
  used_liters?: number;
  last_updated?: string;
}

interface WastageManagerProps {
  kitchenStorage: KitchenStorageItem[]
  batches: Batch[]
  wastageEvents: WastageEvent[]
  onWastageReported: () => void
  getIngredientName: (id: string, isBatch?: boolean) => string
  showDialog?: boolean
  onDialogChange?: (show: boolean) => void
  preSelectedBatch?: Batch | null
  onPreSelectedBatchChange?: (batch: Batch | null) => void
}

const wastageReasons = [
  "Spoiled",
  "Expired",
  "Spilled",
  "Cooking Error",
  "Contamination",
  "Damaged",
  "Other",
]

export function WastageManager({
  kitchenStorage,
  batches,
  wastageEvents,
  onWastageReported,
  getIngredientName,
  showDialog = false,
  onDialogChange,
  preSelectedBatch,
  onPreSelectedBatchChange,
}: WastageManagerProps) {
  const { toast } = useToast()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [wastageType, setWastageType] = useState<"ingredient" | "batch">("ingredient")
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number | string>("")
  const [reason, setReason] = useState<string>("")
  const [reportedBy, setReportedBy] = useState<string>("")
  const [isReporting, setIsReporting] = useState(false)

  // Handle external dialog control
  const isDialogOpen = showDialog || showReportDialog
  const handleDialogChange = (open: boolean) => {
    if (onDialogChange) {
      onDialogChange(open)
    } else {
      setShowReportDialog(open)
    }
    
    if (!open) {
      // Reset form when dialog closes
      setSelectedItem("")
      setQuantity("")
      setReason("")
      setReportedBy("")
      if (onPreSelectedBatchChange) {
        onPreSelectedBatchChange(null)
      }
    }
  }

  // Handle pre-selected batch
  React.useEffect(() => {
    if (preSelectedBatch) {
      setWastageType("batch")
      setSelectedItem(preSelectedBatch.id)
      setQuantity("")
      setReason("")
      setReportedBy("")
    }
  }, [preSelectedBatch])

  const handleReportWastage = async () => {
    if (!selectedItem || !quantity || !reason || !reportedBy) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all fields to report wastage.",
        variant: "destructive",
      })
      return
    }

    const wastageQuantity = Number(quantity)
    if (wastageQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      })
      return
    }

    let itemToUpdate: KitchenStorageItem | Batch | undefined
    let itemName = ""
    let itemUnit = ""
    let maxAvailable = 0

    if (wastageType === "ingredient") {
      itemToUpdate = kitchenStorage.find((item) => item.ingredient_id === selectedItem)
      if (!itemToUpdate) {
        toast({
          title: "Item Not Found",
          description: "Selected ingredient not found in kitchen storage.",
          variant: "destructive",
        })
        return
      }
      const storageItem = itemToUpdate as KitchenStorageItem
      itemName = getIngredientName(storageItem.ingredient_id)
      itemUnit = storageItem.unit
      maxAvailable = storageItem.quantity

      if (wastageQuantity > maxAvailable) {
        toast({
          title: "Invalid Quantity",
          description: `Cannot waste more than available in storage. Available: ${maxAvailable} ${itemUnit}`,
          variant: "destructive",
        })
        return
      }
    } else {
      itemToUpdate = batches.find((batch) => batch.id === selectedItem)
      if (!itemToUpdate) {
        toast({
          title: "Item Not Found",
          description: "Selected batch not found.",
          variant: "destructive",
        })
        return
      }
      const batchItem = itemToUpdate as Batch
      itemName = batchItem.name
      itemUnit = "portion(s)"
      maxAvailable = batchItem.portions || 0

      if (wastageQuantity > maxAvailable) {
        toast({
          title: "Invalid Quantity",
          description: `Cannot waste more portions than available. Available: ${maxAvailable} portions`,
          variant: "destructive",
        })
        return
      }
    }

    setIsReporting(true)
    try {
      // Update the item quantity/portions first
      if (wastageType === "ingredient") {
        const storageItem = itemToUpdate as KitchenStorageItem
        await supabase
          .from("kitchen_storage")
          .update({ quantity: storageItem.quantity - wastageQuantity })
          .eq("id", storageItem.id)
      } else {
        const batchItem = itemToUpdate as Batch
        await supabase
          .from("batches")
          .update({ portions: (batchItem.portions || 0) - wastageQuantity })
          .eq("id", batchItem.id)
      }

      // Insert wastage event
      await insertWastageEvent({
        item_id: selectedItem,
        item_name: itemName,
        is_batch: wastageType === "batch",
        quantity: wastageQuantity,
        unit: itemUnit,
        reason: reason,
        reported_by: reportedBy,
      })

      // Log the wastage event in system logs
      await insertSystemLog({
        type: "batch",
        action: "Wastage Reported",
        details: `Wastage reported for ${itemName}: ${wastageQuantity} ${itemUnit} - Reason: ${reason} - Reported by: ${reportedBy}`,
        status: "info"
      })

      toast({
        title: "Wastage Reported",
        description: `Successfully reported wastage for ${itemName}.`,
      })

      // Reset form and close dialog
      handleDialogChange(false)
      setSelectedItem("")
      setQuantity("")
      setReason("")
      setReportedBy("")
      onWastageReported()
    } catch (error) {
      console.error("Error reporting wastage:", error)
      toast({
        title: "Error",
        description: "Failed to report wastage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReporting(false)
    }
  }

  const renderItemList = () => {
    if (wastageType === 'ingredient') {
      const availableIngredients = kitchenStorage.filter(item => item.quantity > 0)
      if (availableIngredients.length === 0) {
        return (
          <SelectItem value="" disabled>
            No ingredients available in kitchen storage
          </SelectItem>
        )
      }
      return availableIngredients.map(item => (
        <SelectItem key={item.id} value={item.ingredient_id}>
          {getIngredientName(item.ingredient_id)} ({item.quantity} {item.unit})
        </SelectItem>
      ))
    }
    
    // For batches, show ready, preparing, and completed batches with portions > 0
    const availableBatches = batches.filter(batch => 
      (batch.status === 'ready' || batch.status === 'preparing' || batch.status === 'completed') && 
      batch.portions && 
      batch.portions > 0
    )
    
    if (availableBatches.length === 0) {
      return (
        <SelectItem value="" disabled>
          No batches available for wastage reporting
        </SelectItem>
      )
    }
    
    return availableBatches.map(batch => (
      <SelectItem key={batch.id} value={batch.id}>
        {batch.name} ({batch.portions} portions) - {batch.status}
      </SelectItem>
    ))
  }

  const getMaxQuantity = () => {
    if (!selectedItem) return 0
    
    if (wastageType === "ingredient") {
      const item = kitchenStorage.find((item) => item.ingredient_id === selectedItem)
      return item ? item.quantity : 0
    } else {
      const batch = batches.find((batch) => batch.id === selectedItem)
      return batch ? (batch.portions || 0) : 0
    }
  }

  const maxQuantity = getMaxQuantity()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Wastage Log</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Report Wastage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {preSelectedBatch ? `Report Wastage - ${preSelectedBatch.name}` : "Report New Wastage"}
                </DialogTitle>
                <DialogDescription>
                  {preSelectedBatch 
                    ? `Report wastage for batch "${preSelectedBatch.name}" (${preSelectedBatch.portions || 0} portions available)`
                    : "Select an item and specify the quantity that was wasted."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Wastage Type</Label>
                  <Select
                    value={wastageType}
                    onValueChange={(value: "ingredient" | "batch") => {
                      setWastageType(value)
                      setSelectedItem("")
                      setQuantity("")
                    }}
                    disabled={!!preSelectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredient">Ingredient</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Item</Label>
                  <Select 
                    value={selectedItem} 
                    onValueChange={(value) => {
                      setSelectedItem(value)
                      setQuantity("")
                    }}
                    disabled={!!preSelectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${wastageType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {renderItemList()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Wasted</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    max={maxQuantity}
                    step="0.01"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = parseFloat(value)
                      if (value === "" || (numValue >= 0 && numValue <= maxQuantity)) {
                        setQuantity(value)
                      }
                    }}
                    placeholder={`Enter quantity (max: ${maxQuantity})`}
                  />
                  {selectedItem && (
                    <p className="text-sm text-muted-foreground">
                      Maximum available: {maxQuantity} {wastageType === "ingredient" ? "units" : "portions"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {wastageReasons.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportedBy">Reported By</Label>
                  <Input
                    id="reportedBy"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isReporting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReportWastage}
                  disabled={
                    isReporting || 
                    !selectedItem || 
                    !quantity || 
                    !reason || 
                    !reportedBy ||
                    Number(quantity) <= 0 ||
                    Number(quantity) > maxQuantity
                  }
                >
                  {isReporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reporting...
                    </>
                  ) : (
                    "Report"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wastageEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.item_name}</TableCell>
                  <TableCell>{event.is_batch ? "Batch" : "Ingredient"}</TableCell>
                  <TableCell>
                    {event.quantity} {event.unit}
                  </TableCell>
                  <TableCell>{event.reason}</TableCell>
                  <TableCell>{event.reported_by}</TableCell>
                  <TableCell>
                    {format(new Date(event.created_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
              {wastageEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No wastage events recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 