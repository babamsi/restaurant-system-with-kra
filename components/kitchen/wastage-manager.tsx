"use client"

import { useState, useEffect } from "react"
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
import { Trash, PlusCircle, Loader2, Scale } from "lucide-react"
import type { Batch } from "@/stores/kitchen-store"
import { insertWastageEvent } from "@/lib/kitchenSupabase"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import React from "react"
import { insertSystemLog } from "@/lib/kitchenSupabase"
import { convertUnit } from "./corrected-kitchen-manager"

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
  open_container_remaining?: number;
  open_container_unit?: string;
}

interface FreezerItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  portions: number;
  yieldPerPortion: number;
  unit: string;
  dateFrozen: string;
  bestBefore: string;
  notes?: string;
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
  freezerItems?: FreezerItem[]
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
  freezerItems: freezerItemsProp = [],
}: WastageManagerProps) {
  const { toast } = useToast()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [wastageType, setWastageType] = useState<"ingredient" | "batch" | "freezer">("ingredient")
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number | string>("")
  const [reason, setReason] = useState<string>("")
  const [reportedBy, setReportedBy] = useState<string>("")
  const [isReporting, setIsReporting] = useState(false)
  const [batchWastageMode, setBatchWastageMode] = useState<'portions' | 'yield'>('portions')
  const [ingredientWastageUnit, setIngredientWastageUnit] = useState<string>("")
  const [freezerItems, setFreezerItems] = useState<FreezerItem[]>(freezerItemsProp)
  const [selectedFreezerItemId, setSelectedFreezerItemId] = useState<string>("")
  const [freezerWastageQuantity, setFreezerWastageQuantity] = useState<string>("")
  const [freezerWastageMode, setFreezerWastageMode] = useState<'portion' | 'yield'>('portion')

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
      setBatchWastageMode('portions')
    }
  }, [preSelectedBatch])

  React.useEffect(() => {
    if (wastageType === "ingredient" && selectedItem) {
      // Set default unit to storage unit
      const storageItem = kitchenStorage.find((item) => item.ingredient_id === selectedItem);
      if (storageItem) setIngredientWastageUnit(storageItem.unit);
    }
  }, [wastageType, selectedItem, kitchenStorage]);

  // Fetch freezer items if not passed as prop
  useEffect(() => {
    if (!freezerItemsProp.length) {
      (async () => {
        const { data, error } = await supabase.from("freezer_items").select("*");
        if (!error && data) {
          setFreezerItems(data.map((item: any) => ({
            id: item.id,
            ingredientId: item.ingredient_id,
            ingredientName: item.ingredient_name,
            portions: item.number_of_portions,
            yieldPerPortion: item.yield_per_portion,
            unit: item.unit,
            dateFrozen: item.date_frozen,
            bestBefore: item.best_before,
            notes: item.notes,
          })));
        }
      })();
    } else {
      setFreezerItems(freezerItemsProp);
    }
  }, [freezerItemsProp]);

  const handleReportWastage = async () => {
    if (
      (wastageType === 'ingredient' && (!selectedItem || !quantity || !reason || !reportedBy)) ||
      (wastageType === 'batch' && (!selectedItem || !quantity || !reason || !reportedBy)) ||
      (wastageType === 'freezer' && (!selectedFreezerItemId || !freezerWastageQuantity || !reason || !reportedBy))
    ) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all fields to report wastage.",
        variant: "destructive",
      })
      return
    }

    // Use the correct quantity variable depending on wastage type
    let wastageQuantity = 0;
    if (wastageType === 'freezer') {
      wastageQuantity = Number(freezerWastageQuantity);
    } else {
      wastageQuantity = Number(quantity);
    }
    if (wastageQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      })
      return;
    }

    let itemToUpdate: KitchenStorageItem | Batch | FreezerItem | undefined
    let itemName = ""
    let itemUnit = ""
    let maxAvailable = 0

    if (wastageType === "freezer") {
      itemToUpdate = freezerItems.find(item => item.id === selectedFreezerItemId);
      if (!itemToUpdate) {
        toast({
          title: "Item Not Found",
          description: "Selected freezer item not found.",
          variant: "destructive",
        });
        return;
      }
      const freezerItem = itemToUpdate as FreezerItem;
      itemName = freezerItem.ingredientName;
      itemUnit = freezerItem.unit;
      maxAvailable = freezerItem.portions;
      if (freezerWastageMode === 'portion') {
        if (Number(freezerWastageQuantity) > maxAvailable) {
          toast({
            title: "Invalid Quantity",
            description: `Cannot waste more portions than available. Available: ${maxAvailable} portions`,
            variant: "destructive",
          });
          return;
        }
      } else {
        // yield mode
        const yieldToWaste = Number(freezerWastageQuantity);
        const totalYieldAvailable = freezerItem.portions * freezerItem.yieldPerPortion;
        if (yieldToWaste > totalYieldAvailable) {
          toast({
            title: "Invalid Quantity",
            description: `Cannot waste more yield than available. Available: ${totalYieldAvailable} ${freezerItem.unit}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (wastageType === "ingredient") {
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
      itemUnit = ingredientWastageUnit || storageItem.unit
      // Convert wastage quantity to storage unit for max check
      const wastageInStorageUnit = convertUnit(wastageQuantity, itemUnit, storageItem.unit, itemName)
      maxAvailable = storageItem.quantity + (storageItem.open_container_remaining || 0)
      if (wastageInStorageUnit > maxAvailable) {
        toast({
          title: "Invalid Quantity",
          description: `Cannot waste more than available in storage. Available: ${maxAvailable} ${storageItem.unit}`,
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
      if (batchWastageMode === 'yield') {
        itemUnit = batchItem.yield_unit || 'g'
        maxAvailable = batchItem.yield || 0
        if (wastageQuantity > maxAvailable) {
          toast({
            title: "Invalid Quantity",
            description: `Cannot waste more yield than available. Available: ${maxAvailable} ${itemUnit}`,
            variant: "destructive",
          })
          return
        }
      } else {
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
    }

    setIsReporting(true)
    try {
      // Update the item quantity/portions first
      if (wastageType === "ingredient") {
        const storageItem = itemToUpdate as KitchenStorageItem
        let wastageLeft = convertUnit(Number(quantity), ingredientWastageUnit, storageItem.unit, itemName)
        let updates: any = {}
        if (ingredientWastageUnit === storageItem.unit) {
          // Units match: always deduct from main quantity
          updates.quantity = Math.max(0, storageItem.quantity - Number(quantity))
          updates.last_updated = new Date().toISOString()
        } else {
          // Units differ: update open_container_remaining and open_container_unit
          let openContainer = storageItem.open_container_remaining || 0;
          let openUnit = storageItem.open_container_unit || ingredientWastageUnit;
          // If open_container_unit is not set or is different, set it to the selected unit
          if (!storageItem.open_container_unit || storageItem.open_container_unit !== ingredientWastageUnit) {
            openUnit = ingredientWastageUnit;
            openContainer = 0;
          }
          updates.open_container_remaining = openContainer - Number(quantity);
          updates.open_container_unit = openUnit;
          updates.last_updated = new Date().toISOString();
        }
        await supabase
          .from("kitchen_storage")
          .update(updates)
          .eq("id", storageItem.id)
      } else if (wastageType === "freezer") {
        const freezerItem = itemToUpdate as FreezerItem;
        if (freezerWastageMode === 'portion') {
          await supabase
            .from("freezer_items")
            .update({ number_of_portions: freezerItem.portions - Number(freezerWastageQuantity) })
            .eq("id", freezerItem.id);
        } else {
          // yield mode
          const yieldToWaste = Number(freezerWastageQuantity);
          const portionsToDeduct = Math.ceil(yieldToWaste / freezerItem.yieldPerPortion);
          await supabase
            .from("freezer_items")
            .update({ number_of_portions: freezerItem.portions - portionsToDeduct })
            .eq("id", freezerItem.id);
        }
      } else {
        const batchItem = itemToUpdate as Batch
        if (batchWastageMode === 'yield') {
          await supabase
            .from("batches")
            .update({ yield: (batchItem.yield || 0) - wastageQuantity })
            .eq("id", batchItem.id)
        } else {
          await supabase
            .from("batches")
            .update({ portions: (batchItem.portions || 0) - wastageQuantity })
            .eq("id", batchItem.id)
        }
      }

      // Insert wastage event
      await insertWastageEvent({
        item_id: wastageType === 'freezer' ? selectedFreezerItemId : selectedItem,
        item_name: itemName,
        is_batch: wastageType === "batch",
        quantity: wastageType === "freezer"
          ? freezerWastageMode === 'portion'
            ? Number(freezerWastageQuantity)
            : Number(freezerWastageQuantity)
          : wastageQuantity,
        unit: wastageType === 'freezer'
          ? (freezerWastageMode === 'portion' ? 'portion(s)' : itemUnit)
          : itemUnit,
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
      setSelectedFreezerItemId("")
      setFreezerWastageQuantity("")
      setFreezerWastageMode('portion')
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
      const availableIngredients = kitchenStorage.filter(item => (item.quantity > 0) || (item.open_container_remaining && item.open_container_remaining > 0))
      if (availableIngredients.length === 0) {
        return (
          <SelectItem value="" disabled>
            No ingredients available in kitchen storage
          </SelectItem>
        )
      }
      return availableIngredients.map(item => (
        <SelectItem key={item.id} value={item.ingredient_id}>
          {getIngredientName(item.ingredient_id)} ({item.quantity} {item.unit}{item.open_container_remaining && item.open_container_remaining > 0 ? `, open: ${item.open_container_remaining} ${item.open_container_unit || item.unit}` : ""})
        </SelectItem>
      ))
    }
    
    if (wastageType === 'freezer') {
      const availableFreezerItems = freezerItems.filter(item => item.portions > 0);
      if (availableFreezerItems.length === 0) {
        return (
          <SelectItem value="" disabled>
            No items available in freezer
          </SelectItem>
        );
      }
      return availableFreezerItems.map(item => (
        <SelectItem key={item.id} value={item.id}>
          {item.ingredientName} ({item.portions} portions, {item.yieldPerPortion} {item.unit} per portion)
        </SelectItem>
      ));
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
    } else if (wastageType === "freezer") {
      const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId)
      if (!freezerItem) return 0;
      if (freezerWastageMode === 'portion') {
        return freezerItem.portions;
      } else {
        return freezerItem.portions * freezerItem.yieldPerPortion;
      }
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
                    onValueChange={(value: "ingredient" | "batch" | "freezer") => {
                      setWastageType(value)
                      setSelectedItem("")
                      setQuantity("")
                      setSelectedFreezerItemId("")
                      setFreezerWastageQuantity("")
                    }}
                    disabled={!!preSelectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredient">Ingredient</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="freezer">Freezer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Item</Label>
                  {wastageType === 'freezer' ? (
                    <Select
                      value={selectedFreezerItemId}
                      onValueChange={val => {
                        setSelectedFreezerItemId(val);
                        setFreezerWastageQuantity("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a freezer item" />
                      </SelectTrigger>
                      <SelectContent>
                        {renderItemList()}
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Wasted</Label>
                  {wastageType === 'ingredient' && (() => {
                    const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                    if (!storageItem) return null;
                    return (
                      <div className="flex gap-2 mb-2">
                        <Label>Unit</Label>
                        <Select value={ingredientWastageUnit} onValueChange={setIngredientWastageUnit}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={storageItem.unit}>{storageItem.unit}</SelectItem>
                            {/* Add more units if needed, e.g. g/kg/ml/l */}
                            {storageItem.unit !== 'g' && <SelectItem value="g">g</SelectItem>}
                            {storageItem.unit !== 'kg' && <SelectItem value="kg">kg</SelectItem>}
                            {storageItem.unit !== 'ml' && <SelectItem value="ml">ml</SelectItem>}
                            {storageItem.unit !== 'l' && <SelectItem value="l">l</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()}
                  {wastageType === 'freezer' && (() => {
                    const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                    if (!freezerItem) return null;
                    return (
                      <div className="flex gap-2 mb-2 items-center">
                        <Label>Mode</Label>
                        <Select value={freezerWastageMode} onValueChange={v => setFreezerWastageMode(v as 'portion' | 'yield')}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portion">Portion</SelectItem>
                            <SelectItem value="yield">Yield</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label>Unit</Label>
                        <span>{freezerWastageMode === 'portion' ? 'portion(s)' : freezerItem.unit}</span>
                      </div>
                    );
                  })()}
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    max={wastageType === 'ingredient' ? (() => {
                      const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                      if (!storageItem) return 0;
                      return storageItem.quantity + (storageItem.open_container_remaining || 0);
                    })() : wastageType === 'freezer' ? (() => {
                      const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                      if (!freezerItem) return 0;
                      if (freezerWastageMode === 'portion') {
                        return freezerItem.portions;
                      } else {
                        return freezerItem.portions * freezerItem.yieldPerPortion;
                      }
                    })() : maxQuantity}
                    step="0.01"
                    value={wastageType === 'freezer' ? freezerWastageQuantity : quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      if (wastageType === 'ingredient') {
                        const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                        if (!storageItem) return;
                        const wastageInStorageUnit = convertUnit(numValue, ingredientWastageUnit, storageItem.unit, getIngredientName(storageItem.ingredient_id));
                        const maxAvail = storageItem.quantity + (storageItem.open_container_remaining || 0);
                        if (value === "" || (numValue >= 0 && wastageInStorageUnit <= maxAvail)) {
                          setQuantity(value)
                        }
                      } else if (wastageType === 'freezer') {
                        const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                        if (!freezerItem) return;
                        if (freezerWastageMode === 'portion') {
                          if (value === "" || (numValue >= 0 && numValue <= freezerItem.portions)) {
                            setFreezerWastageQuantity(value)
                          }
                        } else {
                          // yield mode
                          const totalYieldAvailable = freezerItem.portions * freezerItem.yieldPerPortion;
                          if (value === "" || (numValue >= 0 && numValue <= totalYieldAvailable)) {
                            setFreezerWastageQuantity(value)
                          }
                        }
                      } else {
                        if (value === "" || (numValue >= 0 && numValue <= maxQuantity)) {
                          setQuantity(value)
                        }
                      }
                    }}
                    placeholder={wastageType === 'batch' ? `Enter quantity (max: ${maxQuantity}) for ${batchWastageMode}` : wastageType === 'freezer' ? `Enter ${freezerWastageMode === 'portion' ? 'portions' : 'yield'} to waste (max: ${(() => {
                      const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                      if (!freezerItem) return 0;
                      if (freezerWastageMode === 'portion') {
                        return freezerItem.portions;
                      } else {
                        return freezerItem.portions * freezerItem.yieldPerPortion;
                      }
                    })()})` : `Enter quantity (max: ${(() => {
                      const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                      if (!storageItem) return 0;
                      return storageItem.quantity + (storageItem.open_container_remaining || 0);
                    })()}`}
                  />
                  {selectedItem && (
                    <p className="text-sm text-muted-foreground">
                      {wastageType === "ingredient"
                        ? (() => {
                            const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                            if (!storageItem) return null;
                            return `Maximum available: ${storageItem.quantity + (storageItem.open_container_remaining || 0)} ${storageItem.unit}`;
                          })()
                        : batchWastageMode === 'yield'
                          ? `Maximum available: ${maxQuantity} ${(() => {
                              const batch = batches.find(b => b.id === selectedItem);
                              return batch?.yield_unit || 'g';
                            })()}`
                        : wastageType === 'freezer'
                          ? (() => {
                              const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                              if (!freezerItem) return null;
                              if (freezerWastageMode === 'portion') {
                                return `Maximum available: ${freezerItem.portions} portions`;
                              } else {
                                return `Maximum available: ${freezerItem.portions * freezerItem.yieldPerPortion} ${freezerItem.unit}`;
                              }
                            })()
                          : `Maximum available: ${maxQuantity} portions`
                      }
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
                  disabled={(() => {
                    if (isReporting || !reason || !reportedBy) return true;
                    if (wastageType === 'ingredient') {
                      if (!selectedItem || !quantity) return true;
                      const numValue = parseFloat(quantity as string);
                      if (isNaN(numValue) || numValue <= 0) return true;
                      const storageItem = kitchenStorage.find(item => item.ingredient_id === selectedItem);
                      if (!storageItem) return true;
                      const wastageInStorageUnit = convertUnit(numValue, ingredientWastageUnit, storageItem.unit, getIngredientName(storageItem.ingredient_id));
                      const maxAvail = storageItem.quantity + (storageItem.open_container_remaining || 0);
                      if (wastageInStorageUnit > maxAvail) return true;
                    } else if (wastageType === 'freezer') {
                      if (!selectedFreezerItemId || !freezerWastageQuantity) return true;
                      const numValue = parseFloat(freezerWastageQuantity);
                      if (isNaN(numValue) || numValue <= 0) return true;
                      const freezerItem = freezerItems.find(item => item.id === selectedFreezerItemId);
                      if (!freezerItem) return true;
                      if (freezerWastageMode === 'portion') {
                        if (numValue > freezerItem.portions) return true;
                      } else {
                        // yield mode
                        const totalYieldAvailable = freezerItem.portions * freezerItem.yieldPerPortion;
                        if (numValue > totalYieldAvailable) return true;
                      }
                    } else {
                      if (!selectedItem || !quantity) return true;
                      const numValue = parseFloat(quantity as string);
                      if (isNaN(numValue) || numValue <= 0) return true;
                      if (numValue > maxQuantity) return true;
                    }
                    return false;
                  })()}
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
                  <TableCell>{event.is_batch ? "Batch" : wastageType === "freezer" ? "Freezer" : "Ingredient"}</TableCell>
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