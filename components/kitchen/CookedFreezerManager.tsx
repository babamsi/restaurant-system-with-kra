"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Calendar, Package, Clock, AlertTriangle, Scale } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { insertSystemLog } from "@/lib/kitchenSupabase"
import { format, addDays, isAfter, isBefore } from "date-fns"

interface CookedFreezerItem {
  id: string
  batchId: string
  batchName: string
  portions: number
  originalPortions: number
  bestBefore: string
  dateFrozen: string
  notes?: string
  status: "fresh" | "expiring" | "expired"
  sourceType: "portions" | "yield"
  sourceAmount: number
  sourceUnit: string
}

interface Batch {
  id: string
  name: string
  portions: number
  yield: number
  yield_unit: string
  status: string
}

interface CookedFreezerManagerProps {
  batches: Batch[]
  onItemsChange?: (items: CookedFreezerItem[]) => void
}

export function CookedFreezerManager({ batches, onItemsChange }: CookedFreezerManagerProps) {
  const { toast } = useToast()
  const [cookedFreezerItems, setCookedFreezerItems] = useState<CookedFreezerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isAddingToFreezer, setIsAddingToFreezer] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<string>("")
  const [sourceType, setSourceType] = useState<"portions" | "yield">("portions")
  const [sourceAmount, setSourceAmount] = useState<number>(1)
  const [independentPortions, setIndependentPortions] = useState<number>(1)
  const [bestBeforeDays, setBestBeforeDays] = useState<number>(7)
  const [notes, setNotes] = useState("")

  // Fetch cooked freezer items on component mount
  useEffect(() => {
    fetchCookedFreezerItems()
  }, [])

  const fetchCookedFreezerItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cooked_freezer_items")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          batchId: item.batch_id,
          batchName: item.batch_name,
          portions: item.portions,
          originalPortions: item.original_portions,
          bestBefore: item.best_before,
          dateFrozen: item.date_frozen,
          notes: item.notes,
          status: getItemStatus(item.best_before),
          sourceType: item.source_type || "portions",
          sourceAmount: item.source_amount || 0,
          sourceUnit: item.source_unit || "portions"
        }))
        setCookedFreezerItems(mapped)
        if (onItemsChange) onItemsChange(mapped)
      }
    } catch (error) {
      console.error("Error fetching cooked freezer items:", error)
      toast({
        title: "Error",
        description: "Failed to load cooked freezer items.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getItemStatus = (bestBefore: string): "fresh" | "expiring" | "expired" => {
    const now = new Date()
    const bestBeforeDate = new Date(bestBefore)
    const threeDaysFromNow = addDays(now, 3)

    if (isBefore(bestBeforeDate, now)) {
      return "expired"
    } else if (isBefore(bestBeforeDate, threeDaysFromNow)) {
      return "expiring"
    } else {
      return "fresh"
    }
  }

  const handleAddToFreezer = async () => {
    if (!selectedBatch || sourceAmount <= 0 || independentPortions <= 0 || bestBeforeDays <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values (> 0).",
        variant: "destructive"
      })
      return
    }

    const batch = batches.find(b => b.id === selectedBatch)
    if (!batch) {
      toast({
        title: "Batch Not Found",
        description: "Selected batch could not be found.",
        variant: "destructive"
      })
      return
    }

    // Validate source amount against available batch resources
    if (sourceType === "portions" && sourceAmount > batch.portions) {
      toast({
        title: "Insufficient Portions",
        description: `Cannot take ${sourceAmount} portions. Available: ${batch.portions} portions.`,
        variant: "destructive"
      })
      return
    }

    if (sourceType === "yield" && sourceAmount > batch.yield) {
      toast({
        title: "Insufficient Yield",
        description: `Cannot take ${sourceAmount} ${batch.yield_unit}. Available: ${batch.yield} ${batch.yield_unit}.`,
        variant: "destructive"
      })
      return
    }

    setIsAddingToFreezer(true)
    try {
      const bestBeforeDate = addDays(new Date(), bestBeforeDays)
      
      const { data, error } = await supabase
        .from("cooked_freezer_items")
        .insert({
          batch_id: selectedBatch,
          batch_name: batch.name,
          portions: independentPortions,
          original_portions: independentPortions,
          best_before: bestBeforeDate.toISOString(),
          date_frozen: new Date().toISOString(),
          notes: notes || null,
          source_type: sourceType,
          source_amount: sourceAmount,
          source_unit: sourceType === "portions" ? "portions" : batch.yield_unit
        })
        .select()
        .single()

      if (error) throw error

      // Update source batch by deducting the used amount
      const updateData: any = {}
      if (sourceType === "portions") {
        updateData.portions = batch.portions - sourceAmount
      } else {
        updateData.yield = batch.yield - sourceAmount
      }

      await supabase
        .from("batches")
        .update(updateData)
        .eq("id", selectedBatch)

      // Update local state
      const newItem: CookedFreezerItem = {
        id: data.id,
        batchId: data.batch_id,
        batchName: data.batch_name,
        portions: data.portions,
        originalPortions: data.original_portions,
        bestBefore: data.best_before,
        dateFrozen: data.date_frozen,
        notes: data.notes,
        status: getItemStatus(data.best_before),
        sourceType: data.source_type,
        sourceAmount: data.source_amount,
        sourceUnit: data.source_unit
      }

      setCookedFreezerItems(prev => [newItem, ...prev])
      if (onItemsChange) onItemsChange([newItem, ...cookedFreezerItems])

      // Log the action with correct type
      await insertSystemLog({
        type: "batch",
        action: "Cooked Batch Added to Freezer",
        details: `Added ${independentPortions} portions to cooked freezer from "${batch.name}". Used ${sourceAmount} ${sourceType === "portions" ? "portions" : batch.yield_unit} from batch. Best before: ${format(bestBeforeDate, "MMM d, yyyy")}`,
        status: "success"
      })

      toast({
        title: "Added to Freezer",
        description: `${independentPortions} portions have been added to the cooked freezer from "${batch.name}".`,
      })

      // Reset form
      setSelectedBatch("")
      setSourceType("portions")
      setSourceAmount(1)
      setIndependentPortions(1)
      setBestBeforeDays(7)
      setNotes("")
      setShowAddDialog(false)

    } catch (error) {
      console.error("Error adding to cooked freezer:", error)
      toast({
        title: "Error",
        description: "Failed to add batch to freezer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAddingToFreezer(false)
    }
  }

  const handleUsePortion = async (item: CookedFreezerItem) => {
    try {
      const newPortions = item.portions - 1
      
      if (newPortions < 0) {
        toast({
          title: "No Portions Left",
          description: "This item has no portions remaining.",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from("cooked_freezer_items")
        .update({ portions: newPortions })
        .eq("id", item.id)

      if (error) throw error

      // Update local state
      setCookedFreezerItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, portions: newPortions }
            : i
        ).filter(i => i.portions > 0) // Remove items with 0 portions
      )

      if (onItemsChange) {
        const updatedItems = cookedFreezerItems.map(i => 
          i.id === item.id 
            ? { ...i, portions: newPortions }
            : i
        ).filter(i => i.portions > 0)
        onItemsChange(updatedItems)
      }

      toast({
        title: "Portion Used",
        description: `Used 1 portion of "${item.batchName}". ${newPortions} portions remaining.`,
      })

    } catch (error) {
      console.error("Error using portion:", error)
      toast({
        title: "Error",
        description: "Failed to use portion. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (item: CookedFreezerItem) => {
    try {
      const { error } = await supabase
        .from("cooked_freezer_items")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      // Update local state
      setCookedFreezerItems(prev => prev.filter(i => i.id !== item.id))
      if (onItemsChange) {
        onItemsChange(cookedFreezerItems.filter(i => i.id !== item.id))
      }

      toast({
        title: "Item Removed",
        description: `"${item.batchName}" has been removed from the cooked freezer.`,
      })

    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: "fresh" | "expiring" | "expired") => {
    switch (status) {
      case "fresh":
        return <Badge variant="default" className="bg-green-500">Fresh</Badge>
      case "expiring":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Expiring Soon</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
    }
  }

  const availableBatches = batches.filter(batch => 
    batch.status === "ready" && (batch.portions > 0 || batch.yield > 0)
  )

  const selectedBatchData = batches.find(b => b.id === selectedBatch)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Cooked Freezer</h3>
          <p className="text-sm text-muted-foreground">
            Manage cooked batches stored in the freezer
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cooked Batch
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4" />
              <span>Loading cooked freezer items...</span>
            </div>
          ) : cookedFreezerItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No cooked batches in freezer</p>
              <p className="text-sm">Add cooked batches to start managing freezer storage</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Portions</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Best Before</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Frozen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cookedFreezerItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.batchName}</span>
                          {item.notes && (
                            <span className="text-sm text-muted-foreground">{item.notes}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.portions}</span>
                          <span className="text-sm text-muted-foreground">
                            / {item.originalPortions}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.sourceAmount} {item.sourceUnit}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(item.bestBefore), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(item.dateFrozen), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUsePortion(item)}
                            disabled={item.portions <= 0}
                          >
                            Use Portion
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Cooked Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cooked Batch to Freezer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-select">Select Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a batch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.portions} portions, {batch.yield} {batch.yield_unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBatchData && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Available:</strong> {selectedBatchData.portions} portions</p>
                  <p><strong>Yield:</strong> {selectedBatchData.yield} {selectedBatchData.yield_unit}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Source Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sourceType === "portions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSourceType("portions")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Portions
                </Button>
                <Button
                  type="button"
                  variant={sourceType === "yield" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSourceType("yield")}
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Yield
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-amount">
                {sourceType === "portions" ? "Portions to Use" : "Yield to Use"} ({selectedBatchData?.yield_unit || "g"})
              </Label>
              <Input
                id="source-amount"
                type="number"
                min="0"
                max={sourceType === "portions" ? selectedBatchData?.portions : selectedBatchData?.yield}
                value={sourceAmount || ""}
                onChange={(e) => {
                  const value = e.target.value
                  setSourceAmount(value === "" ? 0 : parseFloat(value) || 0)
                }}
                placeholder={`Amount from batch`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="independent-portions">Independent Portions to Freeze</Label>
              <Input
                id="independent-portions"
                type="number"
                min="0"
                value={independentPortions || ""}
                onChange={(e) => {
                  const value = e.target.value
                  setIndependentPortions(value === "" ? 0 : parseInt(value) || 0)
                }}
                placeholder="Number of portions"
              />
              <p className="text-xs text-muted-foreground">
                This is independent of the batch portions. You can freeze any number of portions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="best-before">Best Before (days from now)</Label>
              <Input
                id="best-before"
                type="number"
                min="0"
                value={bestBeforeDays || ""}
                onChange={(e) => {
                  const value = e.target.value
                  setBestBeforeDays(value === "" ? 0 : parseInt(value) || 7)
                }}
                placeholder="Days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes about this batch..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isAddingToFreezer}>
              Cancel
            </Button>
            <Button onClick={handleAddToFreezer} disabled={isAddingToFreezer}>
              {isAddingToFreezer ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Adding...
                </>
              ) : (
                "Add to Freezer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 