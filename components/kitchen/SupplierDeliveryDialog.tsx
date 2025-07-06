import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ChevronsUpDown, Search, X } from "lucide-react"
import { useSuppliers } from "@/hooks/use-suppliers"
import { supabase } from "@/lib/supabase"
import { upsertKitchenStorage, insertSystemLog } from "@/lib/kitchenSupabase"

interface Ingredient {
  id: number
  name: string
  unit?: string
  category?: string
  cost_per_unit?: number
}

interface Supplier {
  id: string
  name: string
}

interface SupplierDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients: Ingredient[]
  suppliers?: Supplier[]
  onDeliverySuccess?: () => void
}

interface UpsertPayload {
    id?: string;
    ingredient_id: string;
    quantity: number;
    unit: string;
    last_updated?: string;
    reference_weight_per_bunch?: number;
    reference_weight_unit?: string;
}

export function SupplierDeliveryDialog({ open, onOpenChange, ingredients, suppliers = [], onDeliverySuccess }: SupplierDeliveryDialogProps) {
  const { toast } = useToast()
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Reference weight prompt state
  const [showReferenceWeightDialog, setShowReferenceWeightDialog] = useState(false)
  const [referenceWeightIngredient, setReferenceWeightIngredient] = useState<Ingredient | null>(null)
  const [referenceWeightValue, setReferenceWeightValue] = useState("")
  const [referenceWeightUnit, setReferenceWeightUnit] = useState("g")
  const [pendingDeliveryData, setPendingDeliveryData] = useState<any>(null)

  // Always call the hook at the top level
  const { suppliers: fetchedSuppliers } = useSuppliers()
  // Decide which list to use, preferring the prop if available
  const supplierList = suppliers && suppliers.length > 0 ? suppliers : (fetchedSuppliers || [])
  const [vatRate, setVatRate] = useState("20")
  const [vatAmount, setVatAmount] = useState("")

  // Calculate totals
  const subtotal = selectedIngredients.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const cost = parseFloat(item.cost) || 0
    return sum + qty * cost
  }, 0)
  const vatValue = vatAmount ? parseFloat(vatAmount) : (subtotal * parseFloat(vatRate || "0")) / 100
  const total = subtotal + vatValue

  // Filter ingredients based on search query
  const filteredIngredients = useMemo(() => {
    try {
      if (!Array.isArray(ingredients)) {
        return []
      }
  
      // Filter out any potential null/undefined entries first
      const safeIngredients = ingredients.filter(Boolean);
  
      if (!searchQuery) {
        return safeIngredients
      }
      
      const query = searchQuery.toLowerCase()
  
      return safeIngredients.filter((ingredient) => {
        // Defensive check for each item in the array
        if (!ingredient || typeof ingredient !== 'object') {
          return false
        }
        const name = ingredient.name || ""
        const category = ingredient.category || ""
        return name.toLowerCase().includes(query) || category.toLowerCase().includes(query)
      })

    } catch (error) {
      console.error("A critical error occurred while filtering ingredients:", error);
      // Return an empty array as a fallback to prevent the application from crashing.
      return [];
    }
  }, [ingredients, searchQuery])

  // Helper to fetch latest price for an ingredient
  async function fetchLatestPrice(ingredientId: number): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("cost_per_unit")
        .eq("id", ingredientId)
        .single()
      if (error) return null
      return data?.cost_per_unit ?? null
    } catch {
      return null
    }
  }

  // When an ingredient is selected, fetch its latest price
  const handleSelectIngredient = async (ingredient: Ingredient) => {
    if (selectedIngredients.some((i) => i.id === ingredient.id)) return
    let latestPrice = ingredient.cost_per_unit ?? ""
    const fetchedPrice = await fetchLatestPrice(ingredient.id)
    if (fetchedPrice !== null) latestPrice = fetchedPrice
    setSelectedIngredients([
      { ...ingredient, quantity: "", unit: ingredient.unit || "", cost: latestPrice },
      ...selectedIngredients
    ])
    setSearchOpen(false)
    setSearchQuery("")
  }

  // When dialog opens, update prices for all selected ingredients
  useEffect(() => {
    if (!open || selectedIngredients.length === 0) return
    const updatePrices = async () => {
      const updated = await Promise.all(selectedIngredients.map(async (item) => {
        const fetchedPrice = await fetchLatestPrice(item.id)
        return {
          ...item,
          cost: fetchedPrice !== null ? fetchedPrice : item.cost
        }
      }))
      setSelectedIngredients(updated)
    }
    updatePrices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleRemoveIngredient = (id: number) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== id))
  }

  const handleChange = (id: number, field: string, value: string) => {
    setSelectedIngredients(selectedIngredients.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // Handler for reference weight dialog submission
  const handleReferenceWeightSubmit = async () => {
    if (!referenceWeightIngredient || !pendingDeliveryData) return;
    const value = parseFloat(referenceWeightValue)
    if (!value || value <= 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid positive number for the conversion.",
        variant: "destructive"
      })
      return;
    }

    // Update the pending delivery data with reference weight
    const updatedPendingData = {
      ...pendingDeliveryData,
      referenceWeightData: {
        ingredientId: referenceWeightIngredient.id,
        value: value,
        unit: referenceWeightUnit
      }
    }
    setPendingDeliveryData(updatedPendingData)

    // Close the dialog and continue with delivery
    setShowReferenceWeightDialog(false)
    setReferenceWeightIngredient(null)
    setReferenceWeightValue("")
    setReferenceWeightUnit("g")

    // Continue with the delivery process
    await processDelivery(updatedPendingData)
  }

  // Separate function to process the actual delivery
  const processDelivery = async (deliveryData?: any) => {
    const data = deliveryData || {
      selectedIngredients,
      selectedSupplier,
      invoiceNumber,
      notes,
      vatRate,
      vatAmount,
      total,
      vatValue
    }

    setLoading(true)
    try {
      const supplierName = supplierList.find((s) => s.id === data.selectedSupplier)?.name || "Unknown"

      const kitchenUpdates = data.selectedIngredients.map(async (ing: any) => {
        const { data: existingItem, error } = await supabase
          .from("kitchen_storage")
          .select("id, quantity, reference_weight_per_bunch, reference_weight_unit")
          .eq("ingredient_id", ing.id)
          .single()

        // error code PGRST116 means no row was found, which is fine for a new item.
        if (error && error.code !== "PGRST116") {
          throw new Error(`Failed to fetch kitchen stock for ${ing.name}: ${error.message}`)
        }

        const newQuantity = (existingItem?.quantity || 0) + parseFloat(ing.quantity)

        const payload: any = {
          ingredient_id: ing.id,
          quantity: newQuantity,
          unit: ing.unit,
          last_updated: new Date().toISOString(),
        }
        if (existingItem?.id) {
          payload.id = existingItem.id
        }

        // Add reference weight if this is a bunch ingredient and we have reference weight data
        if (ing.unit === 'bunch' && data.referenceWeightData && data.referenceWeightData.ingredientId === ing.id) {
          payload.reference_weight_per_bunch = data.referenceWeightData.value
          payload.reference_weight_unit = data.referenceWeightData.unit
        } else if (ing.unit === 'bunch' && existingItem?.reference_weight_per_bunch) {
          // Keep existing reference weight if available
          payload.reference_weight_per_bunch = existingItem.reference_weight_per_bunch
          payload.reference_weight_unit = existingItem.reference_weight_unit
        }

        await supabase.from("kitchen_storage").upsert(payload)

        // NOTE: Here you would also insert into a supplier delivery history table.
        // This is not implemented as the table structure is not defined.
      })

      await Promise.all(kitchenUpdates)

      // Step 1: Insert into supplier_orders to get a new order ID
      const { data: newOrder, error: orderError } = await supabase
        .from("supplier_orders")
        .insert({
          supplier_id: data.selectedSupplier,
          invoice_number: data.invoiceNumber,
          order_date: new Date().toISOString(),
          total_amount: data.total,
          vat_amount: data.vatValue,
          notes: data.notes,
        })
        .select("id")
        .single()

      if (orderError || !newOrder) {
        throw new Error(`Failed to create supplier order: ${orderError?.message || "Could not get new order ID."}`)
      }

      const orderId = newOrder.id

      // Step 2: Insert each item into supplier_order_items
      const orderItemsPayload = data.selectedIngredients.map((ing: any) => ({
        order_id: orderId,
        ingredient_id: ing.id,
        quantity: parseFloat(ing.quantity) || 0,
        cost_per_unit: parseFloat(ing.cost) || 0,
        total_cost: (parseFloat(ing.quantity) || 0) * (parseFloat(ing.cost) || 0),
      }))

      const { error: orderItemsError } = await supabase.from("supplier_order_items").insert(orderItemsPayload)

      if (orderItemsError) {
        // Here, we might want to consider deleting the supplier_order record we just created for consistency.
        // For now, we will just throw the error.
        throw new Error(`Failed to record supplier order items: ${orderItemsError.message}`)
      }

      // Step 3: Also update the supplier's last_order_date
      const { error: supplierUpdateError } = await supabase
        .from("suppliers")
        .update({ last_order_date: new Date().toISOString() })
        .eq("id", data.selectedSupplier)

      if (supplierUpdateError) {
        // Log this error but don't fail the whole operation, as the main delivery was recorded.
        console.error(`Failed to update supplier last_order_date: ${supplierUpdateError.message}`)
      }

      await insertSystemLog({
        type: "storage",
        action: "Supplier Delivery",
        details: `Supplier: ${supplierName}, Invoice: ${data.invoiceNumber}, Items: ${data.selectedIngredients.length}`,
        status: "success",
      })

      toast({ title: "Delivery Recorded", description: "Kitchen storage updated.", duration: 1500 })
      setSelectedIngredients([])
      setSelectedSupplier("")
      setInvoiceNumber("")
      setNotes("")
      setPendingDeliveryData(null)
      onDeliverySuccess?.()
      onOpenChange(false)
    } catch (e: any) {
      console.error("Failed to record delivery:", e)
      toast({ title: "Error", description: e.message || "Failed to record delivery.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSupplier || !invoiceNumber || selectedIngredients.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields and add at least one ingredient.",
        variant: "destructive",
        duration: 2000,
      })
      return
    }
    if (selectedIngredients.some((i) => !i.quantity || !i.unit || !i.cost)) {
      toast({
        title: "Missing Fields",
        description: "Please enter quantity, unit, and cost for all ingredients.",
        variant: "destructive",
        duration: 2000,
      })
      return
    }

    // Check if any selected ingredient with unit 'bunch' is missing reference weight
    for (const ingredient of selectedIngredients) {
      if (ingredient.unit === 'bunch') {
        // Check if kitchen storage already has reference_weight_per_bunch
        const { data: existingItem } = await supabase
          .from("kitchen_storage")
          .select("reference_weight_per_bunch")
          .eq("ingredient_id", ingredient.id)
          .single()

        if (!existingItem || !existingItem.reference_weight_per_bunch) {
          // Show reference weight prompt
          setReferenceWeightIngredient(ingredient)
          setPendingDeliveryData({
            selectedIngredients,
            selectedSupplier,
            invoiceNumber,
            notes,
            vatRate,
            vatAmount,
            total,
            vatValue
          })
          setShowReferenceWeightDialog(true)
          return // Pause delivery until user provides value
        }
      }
    }

    // If no bunch ingredients need reference weight, proceed with delivery
    await processDelivery()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Direct Supplier Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full sm:w-[300px] justify-between"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {searchQuery ? searchQuery : "Search ingredients..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full sm:w-[300px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search ingredients..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>No ingredient found.</CommandEmpty>
                    <CommandGroup>
                      {filteredIngredients.map((ingredient) => (
                        <CommandItem
                          key={ingredient.id}
                          onSelect={() => handleSelectIngredient(ingredient)}
                        >
                          {ingredient.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {supplierList.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-full sm:w-[180px]"
                placeholder="Invoice number"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
              <Input
                className="w-full sm:w-[120px]"
                placeholder="VAT rate %"
                value={vatRate}
                onChange={e => setVatRate(e.target.value)}
                type="number"
                min="0"
                max="100"
              />
              <Input
                className="w-full sm:w-[120px]"
                placeholder="VAT amount"
                value={vatAmount}
                onChange={e => setVatAmount(e.target.value)}
                type="number"
                min="0"
              />
            </div>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No ingredients selected</TableCell>
                    </TableRow>
                  ) : (
                    selectedIngredients.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={e => handleChange(item.id, "quantity", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            onChange={e => handleChange(item.id, "unit", e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.cost}
                            onChange={e => handleChange(item.id, "cost", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            {/* Totals summary */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end items-end mt-4">
              <div className="flex flex-col gap-1 text-right">
                <div>Subtotal: <span className="font-semibold">{subtotal.toFixed(2)}</span></div>
                <div>VAT: <span className="font-semibold">{vatValue.toFixed(2)}</span></div>
                <div>Total: <span className="font-bold">{total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Recording..." : "Record Delivery"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reference Weight Dialog */}
      <Dialog open={showReferenceWeightDialog} onOpenChange={setShowReferenceWeightDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reference Weight Required</DialogTitle>
            <DialogDescription>
              {referenceWeightIngredient && (
                <>
                  <p className="mb-4">
                    <strong>{referenceWeightIngredient.name}</strong> is measured in bunches. 
                    Please provide the weight conversion for accurate inventory tracking.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This helps convert bunch quantities to weight for better inventory management.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference-weight">Weight per bunch</Label>
                <Input
                  id="reference-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={referenceWeightValue}
                  onChange={(e) => setReferenceWeightValue(e.target.value)}
                  placeholder="e.g., 250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference-unit">Unit</Label>
                <Select value={referenceWeightUnit} onValueChange={setReferenceWeightUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReferenceWeightDialog(false)
                setReferenceWeightIngredient(null)
                setReferenceWeightValue("")
                setReferenceWeightUnit("g")
                setPendingDeliveryData(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReferenceWeightSubmit} disabled={!referenceWeightValue}>
              Continue Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 