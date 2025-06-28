"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit, CheckCircle, Snowflake, Calendar, Package } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface KitchenStorageItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  used_grams?: number;
  used_liters?: number;
  last_updated?: string;
}

export interface FreezerItem {
  id: string
  ingredientId: string
  ingredientName: string
  portions: number
  yieldPerPortion: number
  unit: string
  dateFrozen: string
  bestBefore: string
  notes?: string
}

interface FreezerManagerProps {
  kitchenStorage: KitchenStorageItem[]
  getIngredientName?: (ingredientId: string) => string
  onItemsChange?: (items: FreezerItem[]) => void
}

interface FreezerFormState {
  ingredientId: string
  quantityToFreeze: string
  numberOfPortions: string
  unit: string
  dateFrozen: string
  bestBefore: string
  notes: string
}

// Helper for safe date formatting
function formatDateSafe(dateValue: string | null | undefined): string {
  if (!dateValue) return '-';
  try {
    return format(parseISO(dateValue), "MMM d, yyyy");
  } catch {
    return '-';
  }
}

export function FreezerManager({ kitchenStorage, getIngredientName, onItemsChange }: FreezerManagerProps) {
  const [items, setItems] = useState<FreezerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<FreezerItem | null>(null)
  const [form, setForm] = useState<FreezerFormState>({
    ingredientId: "",
    quantityToFreeze: "",
    numberOfPortions: "",
    unit: "g",
    dateFrozen: new Date().toISOString().slice(0, 10),
    bestBefore: "",
    notes: ""
  })

  // Memoize filtered ingredients for the dropdown
  const availableIngredients = useMemo(() => {
    // Show all kitchen storage items that have a quantity > 0
    return kitchenStorage.filter(item => item.quantity > 0);
  }, [kitchenStorage])

  // Fetch freezer items from Supabase
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("freezer_items")
        .select("*")
        .order("created_at", { ascending: false })
      if (!error && data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          ingredientId: item.ingredient_id,
          ingredientName: item.ingredient_name,
          portions: item.number_of_portions,
          yieldPerPortion: item.yield_per_portion,
          unit: item.unit,
          dateFrozen: item.date_frozen,
          bestBefore: item.best_before,
          notes: item.notes,
        }))
        setItems(mapped)
        if (onItemsChange) onItemsChange(mapped)
      }
      setLoading(false)
    }
    fetchItems()
  }, [])

  // Calculate yield per portion
  const yieldPerPortion =
    form.quantityToFreeze && form.numberOfPortions && Number(form.numberOfPortions) > 0
      ? (Number(form.quantityToFreeze) / Number(form.numberOfPortions)).toFixed(2)
      : ""

  // Add or update item
  const handleSave = async () => {
    if (!form.ingredientId || form.quantityToFreeze === "" || form.numberOfPortions === "" || !form.bestBefore) return
    const quantityNum = Number(form.quantityToFreeze)
    const portionsNum = Number(form.numberOfPortions)
    const yieldNum = Number(yieldPerPortion)
    if (isNaN(quantityNum) || isNaN(portionsNum) || isNaN(yieldNum) || quantityNum <= 0 || portionsNum <= 0 || yieldNum <= 0) return
    const ingredientName = getIngredientName
      ? getIngredientName(form.ingredientId)
      : kitchenStorage.find(i => i.ingredient_id === form.ingredientId)?.ingredient_id || ""
    if (editingItem) {
      // Update in Supabase
      const { error } = await supabase
        .from("freezer_items")
        .update({
          ingredient_id: form.ingredientId,
          ingredient_name: ingredientName,
          quantity_to_freeze: quantityNum,
          number_of_portions: portionsNum,
          yield_per_portion: yieldNum,
          unit: form.unit,
          date_frozen: form.dateFrozen,
          best_before: form.bestBefore,
          notes: form.notes
        })
        .eq("id", editingItem.id)
      if (!error) {
        setItems(items.map(i => i.id === editingItem.id ? {
          ...editingItem,
          ingredientId: form.ingredientId,
          ingredientName,
          portions: portionsNum,
          yieldPerPortion: yieldNum,
          unit: form.unit,
          dateFrozen: form.dateFrozen,
          bestBefore: form.bestBefore,
          notes: form.notes
        } : i))
      }
    } else {
      // Insert into Supabase
      const { data, error } = await supabase
        .from("freezer_items")
        .insert({
          ingredient_id: form.ingredientId,
          ingredient_name: ingredientName,
          quantity_to_freeze: quantityNum,
          number_of_portions: portionsNum,
          yield_per_portion: yieldNum,
          unit: form.unit,
          date_frozen: form.dateFrozen,
          best_before: form.bestBefore,
          notes: form.notes
        })
        .select()
        .single()
      if (!error && data) {
        setItems([{
          id: data.id,
          ingredientId: data.ingredient_id,
          ingredientName: data.ingredient_name,
          portions: data.number_of_portions,
          yieldPerPortion: data.yield_per_portion,
          unit: data.unit,
          dateFrozen: data.date_frozen,
          bestBefore: data.best_before,
          notes: data.notes
        }, ...items])
        if (onItemsChange) onItemsChange([{
          id: data.id,
          ingredientId: data.ingredient_id,
          ingredientName: data.ingredient_name,
          portions: data.number_of_portions,
          yieldPerPortion: data.yield_per_portion,
          unit: data.unit,
          dateFrozen: data.date_frozen,
          bestBefore: data.best_before,
          notes: data.notes
        }, ...items])
        // Decrement kitchen storage in Supabase
        const storage = kitchenStorage.find(i => i.ingredient_id === form.ingredientId)
        if (storage) {
          const newQty = Math.max(0, storage.quantity - quantityNum)
          await supabase
            .from("kitchen_storage")
            .update({ quantity: newQty })
            .eq("id", storage.id)
        }
      }
    }
    setShowDialog(false)
    setEditingItem(null)
    setForm({
      ingredientId: "",
      quantityToFreeze: "",
      numberOfPortions: "",
      unit: "g",
      dateFrozen: new Date().toISOString().slice(0, 10),
      bestBefore: "",
      notes: ""
    })
  }

  // Edit item
  const handleEdit = (item: FreezerItem) => {
    setEditingItem(item)
    setForm({
      ingredientId: item.ingredientId,
      quantityToFreeze: String(item.yieldPerPortion * item.portions),
      numberOfPortions: String(item.portions),
      unit: item.unit,
      dateFrozen: item.dateFrozen,
      bestBefore: item.bestBefore,
      notes: item.notes || ""
    })
    setShowDialog(true)
  }

  // Delete item
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("freezer_items").delete().eq("id", id)
    if (!error) setItems(items.filter(i => i.id !== id))
  }

  // Mark portion as used
  const handleUsePortion = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item || item.portions <= 0) return
    const newPortions = item.portions - 1
    const { error } = await supabase
      .from("freezer_items")
      .update({ number_of_portions: newPortions })
      .eq("id", id)
    if (!error) setItems(items.map(i => i.id === id ? { ...i, portions: newPortions } : i))
  }

  // Ingredient options for select
  const ingredientOptions = availableIngredients.map(item => ({
    value: item.ingredient_id,
    label: getIngredientName ? getIngredientName(item.ingredient_id) : item.ingredient_id,
    unit: item.unit
  }))

  // Find available quantity for selected ingredient
  const selectedStorage = kitchenStorage.find(i => i.ingredient_id === form.ingredientId)
  const availableQuantity = selectedStorage ? selectedStorage.quantity : null
  const quantityTooHigh =
    form.quantityToFreeze !== "" && availableQuantity !== null && Number(form.quantityToFreeze) > availableQuantity

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Snowflake className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">Freezer Manager</h2>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4" />
          <span>Loading freezer items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mb-2" />
          <p>No items in freezer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <Card key={item.id} className="relative group">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="truncate text-base flex items-center gap-2">
                  {item.ingredientName}
                  {item.portions === 0 && (
                    <Badge variant="destructive" className="ml-2">Empty</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{item.portions}</span>
                  <span className="text-xs text-muted-foreground">portions</span>
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => handleUsePortion(item.id)} disabled={item.portions === 0}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Use 1
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Yield:</span>
                  <span className="font-semibold">{item.yieldPerPortion} {item.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Frozen: {formatDateSafe(item.dateFrozen)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Best Before: {formatDateSafe(item.bestBefore)}</span>
                </div>
                {item.notes && (
                  <div className="text-xs text-muted-foreground mt-2">{item.notes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Freezer Item" : "Add Freezer Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ingredient</Label>
              <Select
                value={form.ingredientId}
                onValueChange={val => {
                  setForm(f => ({
                    ...f,
                    ingredientId: val,
                    unit: ingredientOptions.find(opt => opt.value === val)?.unit || "g"
                  }))
                }}
                disabled={!!editingItem}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ingredient from kitchen storage" />
                </SelectTrigger>
                <SelectContent>
                  {ingredientOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Quantity to Freeze</Label>
                <Input
                  type="number"
                  min={1}
                  max={availableQuantity ?? undefined}
                  value={form.quantityToFreeze}
                  onChange={e => setForm(f => ({ ...f, quantityToFreeze: e.target.value }))}
                  placeholder="e.g. 2000"
                />
                {availableQuantity !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Available: {availableQuantity} {selectedStorage?.unit}
                  </div>
                )}
                {quantityTooHigh && (
                  <div className="text-xs text-red-500 mt-1">
                    Cannot freeze more than available in kitchen storage.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Number of Portions</Label>
                <Input type="number" min={1} value={form.numberOfPortions} onChange={e => setForm(f => ({ ...f, numberOfPortions: e.target.value }))} placeholder="e.g. 4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. g, kg" />
              </div>
              <div className="space-y-2">
                <Label>Yield per Portion</Label>
                <Input value={yieldPerPortion} readOnly placeholder="Auto-calculated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Frozen</Label>
              <Input type="date" value={form.dateFrozen} onChange={e => setForm(f => ({ ...f, dateFrozen: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Best Before</Label>
              <Input type="date" value={form.bestBefore} onChange={e => setForm(f => ({ ...f, bestBefore: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={quantityTooHigh}>{editingItem ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 