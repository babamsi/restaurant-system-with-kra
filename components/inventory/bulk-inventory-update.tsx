"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSupplierStore, type SupplierOrder } from "@/stores/supplier-store"
import { Upload, FileText, CheckCircle, Loader2, Search, ChevronsUpDown, X, Calculator, Building2 } from "lucide-react"
import type { BaseIngredient } from "@/types/operational"
import { ReceiptUploadDialog } from "./receipt-upload-dialog"
import type { ReceiptItem } from "./receipt-upload-dialog"
import { cn } from "@/lib/utils"
import { inventoryService } from '@/lib/inventory-service'
import { useSuppliers } from '@/hooks/use-suppliers'
import { supplierOrdersService } from '@/lib/database'

interface BulkUpdateItem {
  ingredient: BaseIngredient
  selected: boolean
  newQuantity?: number
  newCost?: number
}

interface BulkInventoryUpdateProps {
  onInventoryUpdated?: () => void
}

export function BulkInventoryUpdate({ onInventoryUpdated }: BulkInventoryUpdateProps) {
  const { toast } = useToast()
  const { suppliers } = useSuppliers()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [updateItems, setUpdateItems] = useState<BulkUpdateItem[]>([])
  const [ingredients, setIngredients] = useState<BaseIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [vatAmount, setVatAmount] = useState("")
  const [vatRate, setVatRate] = useState("20") // Default VAT rate
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Load ingredients from Supabase when dialog opens
  const loadIngredients = async () => {
    setLoading(true)
    const result = await inventoryService.getIngredients()
    if (result.success) {
      setIngredients(result.data)
      setUpdateItems(result.data.map((ingredient: BaseIngredient) => ({
        ingredient,
        selected: false
      })))
    } else {
      toast({
        title: "Error Loading Ingredients",
        description: result.error || "Failed to load ingredients",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleOpen = () => {
    loadIngredients()
    setIsOpen(true)
  }

  // Calculate totals based on changes only
  const totals = useMemo(() => {
    const selectedItems = updateItems.filter(item => item.selected)
    const subtotal = selectedItems.reduce((sum, item) => {
      if (item.newQuantity === undefined && item.newCost === undefined) {
        return sum
      }
      const addQuantity = item.newQuantity ?? 0
      const currentQuantity = item.ingredient.available_quantity
      const currentCost = item.ingredient.cost_per_unit
      const newCost = item.newCost ?? currentCost
      const valueChange = (addQuantity * currentCost) + (addQuantity * (newCost - currentCost))
      return sum + valueChange
    }, 0)
    
    const vatValue = vatAmount ? parseFloat(vatAmount) : (subtotal * parseFloat(vatRate)) / 100
    const total = subtotal + vatValue

    return {
      subtotal,
      vatAmount: vatValue,
      total
    }
  }, [updateItems, vatAmount, vatRate])

  // Filter ingredients based on search query
  const filteredIngredients = useMemo(() => {
    if (!searchQuery) return ingredients
    const query = searchQuery.toLowerCase()
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(query) ||
      ingredient.category.toLowerCase().includes(query)
    )
  }, [ingredients, searchQuery])

  const handleSelectIngredient = (ingredient: BaseIngredient) => {
    setUpdateItems(currentItems => {
      // Check if ingredient is already in the list
      const existingIndex = currentItems.findIndex(item => item.ingredient.id === ingredient.id)
      
      if (existingIndex === -1) {
        // Add new ingredient at the top of the list
        return [{
          ingredient,
          selected: true
        }, ...currentItems]
      } else {
        // Move existing ingredient to top and ensure it's selected
        const item = currentItems[existingIndex]
        const newItems = currentItems.filter((_, i) => i !== existingIndex)
        return [{
          ...item,
          selected: true
        }, ...newItems]
      }
    })
    setSearchOpen(false)
    setSearchQuery("")
  }

  const handleSelectAll = (checked: boolean) => {
    setUpdateItems(items =>
      items.map(item => ({
        ...item,
        selected: checked
      }))
    )
  }

  const handleSelectItem = (index: number, checked: boolean) => {
    setUpdateItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, selected: checked } : item
      )
    )
  }

  const handleQuantityChange = (index: number, value: string) => {
    if (value === "") {
      setUpdateItems(items =>
        items.map((item, i) =>
          i === index ? { ...item, newQuantity: undefined } : item
        )
      )
      return
    }
    const quantity = parseFloat(value)
    if (isNaN(quantity)) {
      setUpdateItems(items =>
        items.map((item, i) =>
          i === index ? { ...item, newQuantity: undefined } : item
        )
      )
      return
    }
    if (quantity < 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity cannot be negative.",
        variant: "destructive"
      })
      return
    }
    setUpdateItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, newQuantity: quantity } : item
      )
    )
  }

  const handleCostChange = (index: number, value: string) => {
    const cost = parseFloat(value)
    if (isNaN(cost)) {
      setUpdateItems(items =>
        items.map((item, i) =>
          i === index ? { ...item, newCost: undefined } : item
        )
      )
      return
    }

    // Check if quantity is also being changed
    const currentItem = updateItems[index]
    if (currentItem.newQuantity === undefined) {
      toast({
        title: "Quantity Required",
        description: "Please update the quantity before changing the cost.",
        variant: "destructive"
      })
      return
    }

    setUpdateItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, newCost: cost } : item
      )
    )
  }

  const handleVatChange = (value: string) => {
    // Allow empty value to reset
    if (!value) {
      setVatAmount("")
      return
    }

    const amount = parseFloat(value)
    if (isNaN(amount) || amount < 0) {
      return
    }

    setVatAmount(value)
  }

  const handleProcessReceipt = (items: ReceiptItem[]) => {
    // Update the bulk update items based on receipt data
    setUpdateItems(currentItems => {
      return currentItems.map(item => {
        const receiptItem = items.find(ri => 
          ri.matches?.id === item.ingredient.id || 
          ri.name.toLowerCase() === item.ingredient.name.toLowerCase()
        )
        
        if (receiptItem) {
          return {
            ...item,
            selected: true,
            // Only update the newQuantity and newCost fields without affecting the main inventory
            newQuantity: item.ingredient.available_quantity + receiptItem.quantity,
            newCost: receiptItem.cost_per_unit
          }
        }
        return item
      })
    })

    toast({
      title: "Receipt Processed",
      description: "Items from receipt have been added to the update list. Review and confirm the changes.",
    })
  }

  // Helper functions for KRA integration
  async function registerIngredientWithKRA(ingredient: BaseIngredient) {
    const res = await fetch('/api/kra/register-ingredient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.cost_per_unit,
        description: ingredient.description,
        itemCd: ingredient.itemCd,
        unit: ingredient.unit, // Always send unit
      }),
    })
    return res.json()
  }

  function generateUniqueSarNo() {
    // Generate a unique 38-character string (timestamp + random)
    const ts = Date.now().toString()
    const rand = Math.random().toString(36).substring(2, 38 - ts.length)
    return (ts + rand).padEnd(38, '0')
  }

  async function stockInKRAItems(items: BulkUpdateItem[], receiptCode: string, vatAmount: string) {
    // Map unit to KRA code
    const KRA_UNIT_MAP: Record<string, string> = {
      'bag': 'BG', 'box': 'BOX', 'can': 'CA', 'dozen': 'DZ', 'gram': 'GRM', 'g': 'GRM', 'kg': 'KG', 'kilogram': 'KG', 'kilo gramme': 'KG', 'litre': 'L', 'liter': 'L', 'l': 'L', 'milligram': 'MGM', 'mg': 'MGM', 'packet': 'PA', 'set': 'SET', 'piece': 'U', 'pieces': 'U', 'item': 'U', 'number': 'U', 'pcs': 'U', 'u': 'U',
    }
    function mapToKRAUnit(unit: string): string {
      if (!unit) return 'U'
      const normalized = unit.trim().toLowerCase()
      return KRA_UNIT_MAP[normalized] || 'U'
    }
    const now = new Date()
    const ocrnDt = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    // const sarNo = generateUniqueSarNo()  
    const sarNo = 1
    // const orgSarNo = generateUniqueSarNo()
    const orgSarNo = 1
    const sarTyCd = '02' // purchase
    const safeName = receiptCode.length > 20 ? receiptCode.slice(0, 20) : receiptCode
    // Build itemList
    let totTaxblAmt = 0
    let totTaxAmt = 0
    let totAmt = 0
    const itemList = items.map((item, idx) => {
      const qty = item.newQuantity ?? 0
      const prc = item.newCost ?? item.ingredient.cost_per_unit
      const splyAmt = qty * prc
      const taxAmt = vatAmount && parseFloat(vatAmount) > 0 ? (splyAmt * parseFloat(vatAmount) / items.length) / splyAmt : 0
      const totItemAmt = splyAmt + taxAmt
      totTaxblAmt += splyAmt
      totTaxAmt += taxAmt
      totAmt += totItemAmt
      return {
        itemSeq: idx + 1,
        itemCd: item.ingredient.itemCd,
        itemClsCd: item.ingredient.itemClsCd,
        itemNm: item.ingredient.name,
        pkgUnitCd: 'NT',
        pkg: 1,
        qtyUnitCd: mapToKRAUnit(item.ingredient.unit),
        qty,
        prc,
        splyAmt,
        totDcAmt: 0,
        taxblAmt: splyAmt,
        taxTyCd: 'B',
        taxAmt,
        totAmt: totItemAmt,
      }
    })
    const kraPayload = {
      tin: 'P052380018M',
      bhfId: '01',
      sarNo,
      orgSarNo,
      regTyCd: 'M',
      sarTyCd,
      ocrnDt,
      totItemCnt: itemList.length,
      totTaxblAmt,
      totTaxAmt,
      totAmt,
      regrId: safeName,
      regrNm: safeName,
      modrId: safeName,
      modrNm: safeName,
      itemList,
    }
    const res = await fetch('/api/kra/stock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kraPayload),
    })
    return res.json()
  }

  const handleProcessUpdates = async () => {
    if (!selectedSupplier) {
      toast({ title: "Error", description: "Please select a supplier first.", variant: "destructive" })
      return
    }
    if (!invoiceNumber) {
      toast({ title: "Error", description: "Please enter an invoice number.", variant: "destructive" })
      return
    }

    const itemsToUpdate = updateItems.filter(item => item.newQuantity !== undefined || item.newCost !== undefined)
    if (itemsToUpdate.length === 0) {
      toast({ title: "Error", description: "Please select at least one item to update.", variant: "destructive" })
      return
    }

    setIsProcessing(true)

    try {
      // For every item, register with KRA if needed
      for (const item of itemsToUpdate) {
        if (!item.ingredient.itemCd || !item.ingredient.itemClsCd) {
          const kraRes = await registerIngredientWithKRA(item.ingredient)
          if (!kraRes.success) {
            toast({ title: "KRA Registration Error", description: kraRes.error || "Failed to register ingredient with KRA", variant: "destructive" })
            setIsProcessing(false)
            return
          }
          await inventoryService.updateIngredient(item.ingredient.id, {
            itemCd: kraRes.itemCd,
            itemClsCd: kraRes.itemClsCd,
            kra_status: 'ok',
          })
          item.ingredient.itemCd = kraRes.itemCd
          item.ingredient.itemClsCd = kraRes.itemClsCd
        }
      }
      // Always inform KRA of stock update for all items in one call
      const kraStockInRes = await stockInKRAItems(itemsToUpdate, invoiceNumber, vatAmount)
      if (kraStockInRes.kraData && kraStockInRes.kraData.resultCd === '000') {
        toast({ title: 'KRA Stock-In Success', description: kraStockInRes.kraData.resultMsg || 'Stock-in succeeded.' })
      } else {
        toast({ title: 'KRA Stock-In Error', description: (kraStockInRes.kraData && kraStockInRes.kraData.resultMsg) || kraStockInRes.error || 'Failed to notify KRA', variant: 'destructive' })
        setIsProcessing(false)
        return
      }
      // Proceed with your normal inventory update (existing logic)
      for (const item of itemsToUpdate) {
        if (item.newQuantity !== undefined) {
          const addQuantity = item.newQuantity
          if (addQuantity > 0) {
            await inventoryService.updateStock(
              item.ingredient.id,
              addQuantity,
              "add",
              "bulk-update"
            )
          }
        }
        if (item.newCost !== undefined) {
          await inventoryService.updateCost(item.ingredient.id, item.newCost)
        }
      }

      // Create supplier order and order items in the database
      const orderItems = itemsToUpdate.map(item => ({
        ingredient_id: item.ingredient.id,
        quantity: item.newQuantity ?? 0,
        cost_per_unit: item.newCost ?? item.ingredient.cost_per_unit,
        total_cost: ((item.newQuantity ?? 0) * (item.newCost ?? item.ingredient.cost_per_unit))
      }))
      const orderResult = await supplierOrdersService.createOrderWithItems({
        supplier_id: selectedSupplier,
        invoice_number: invoiceNumber,
        total_amount: totals.total,
        vat_amount: totals.vatAmount,
        items: orderItems
      })
      if (!orderResult.success) {
        toast({
          title: "Order Logging Error",
          description: orderResult.error || "Failed to log supplier order.",
          variant: "destructive",
        })
      }

      toast({
        title: "Success",
        description: `Inventory updated successfully.`,
      })

      // Reload ingredients after update and before closing dialog
      await loadIngredients()
      if (onInventoryUpdated) {
        onInventoryUpdated()
      }
      setUpdateItems([])
      setSelectedSupplier("")
      setInvoiceNumber("")
      setVatAmount("")
      setShowReceiptUpload(false)
      setIsOpen(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to process updates. Please try again.", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Inventory Update</span>
          <Button onClick={handleOpen} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Start Update
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Update multiple inventory items at once or process a receipt to automatically update stock levels.
        </p>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk Inventory Update</DialogTitle>
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
                    <CommandEmpty>No ingredients found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {filteredIngredients.map((ingredient) => (
                        <CommandItem
                          key={ingredient.id}
                          onSelect={() => handleSelectIngredient(ingredient)}
                          className="flex items-center justify-between"
                        >
                          <span>{ingredient.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {ingredient.category}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full sm:w-[200px]"
                  placeholder="Invoice Number"
                />

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={vatAmount}
                    onChange={(e) => handleVatChange(e.target.value)}
                    className="w-32"
                    min="0"
                    step="0.01"
                    placeholder="Enter VAT amount"
                  />
                  <span className="text-sm text-muted-foreground">VAT Amount</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowReceiptUpload(true)}
                  className="ml-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
            </div>

            <div className="border rounded-md flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>New Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updateItems.map((item, index) => (
                    <TableRow key={item.ingredient.id}>
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked) =>
                            handleSelectItem(index, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.ingredient.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.ingredient.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.ingredient.available_quantity} {item.ingredient.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            className="w-24 px-3 py-2 border rounded text-lg"
                            value={item.newQuantity === undefined ? "" : item.newQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            min={0}
                            step={0.1}
                            inputMode="decimal"
                          />
                          <div className="flex flex-col">
                            <button
                              className="p-1 border rounded-t"
                              onClick={() => handleQuantityChange(index, String((item.newQuantity ?? item.ingredient.available_quantity) + 1))}
                            >
                              ▲
                            </button>
                            <button
                              className="p-1 border rounded-b"
                              onClick={() => handleQuantityChange(index, String((item.newQuantity ?? item.ingredient.available_quantity) - 1))}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${item.ingredient.cost_per_unit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            className="w-24 px-3 py-2 border rounded text-lg"
                            value={item.newCost ?? item.ingredient.cost_per_unit}
                            onChange={(e) => handleCostChange(index, e.target.value)}
                            min={0}
                            step={0.01}
                            inputMode="decimal"
                          />
                          <div className="flex flex-col">
                            <button
                              className="p-1 border rounded-t"
                              onClick={() => handleCostChange(index, String((item.newCost ?? item.ingredient.cost_per_unit) + 0.01))}
                            >
                              ▲
                            </button>
                            <button
                              className="p-1 border rounded-b"
                              onClick={() => handleCostChange(index, String((item.newCost ?? item.ingredient.cost_per_unit) - 0.01))}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.newQuantity !== undefined || item.newCost !== undefined
                              ? "default"
                              : "secondary"
                          }
                        >
                          {item.newQuantity !== undefined || item.newCost !== undefined ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : null}
                          {item.newQuantity !== undefined || item.newCost !== undefined
                            ? "Modified"
                            : "Unchanged"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUpdateItems(items => items.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Change in Value</p>
                <p className="text-2xl font-bold">${totals.subtotal.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">VAT Amount</p>
                <p className="text-2xl font-bold">${totals.vatAmount.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Change</p>
                <p className="text-2xl font-bold">${totals.total.toFixed(2)}</p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessUpdates} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Update Selected Items
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptUploadDialog
        open={showReceiptUpload}
        onOpenChange={setShowReceiptUpload}
        onProcessReceipt={handleProcessReceipt}
        isBulkUpdate={true}
      />
    </Card>
  )
} 