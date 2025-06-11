"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Upload, Check, X, Loader2, Trash2, Edit2, Save, XCircle } from "lucide-react"
import type { BaseIngredient } from "@/types/operational"
import Tesseract from "tesseract.js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useSupplierStore } from "@/stores/supplier-store"

export interface ReceiptItem {
  name: string
  quantity: number
  unit: string
  cost_per_unit: number
  matches?: BaseIngredient
  category?: string
  supplier_id?: string
}

interface ReceiptUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProcessReceipt: (items: ReceiptItem[]) => void
  isBulkUpdate?: boolean
}

export function ReceiptUploadDialog({
  open,
  onOpenChange,
  onProcessReceipt,
  isBulkUpdate = false
}: ReceiptUploadDialogProps) {
  const { toast } = useToast()
  const { ingredients, updateStock, addIngredient, updateCost } = useSynchronizedInventoryStore()
  const { suppliers, getSuppliersByCategory } = useSupplierStore()
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedItems, setProcessedItems] = useState<ReceiptItem[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [editingItem, setEditingItem] = useState<ReceiptItem | null>(null)
  const [editForm, setEditForm] = useState<Partial<ReceiptItem>>({})

  // Get suppliers for the selected category
  const categorySuppliers = editForm.category
    ? getSuppliersByCategory(editForm.category)
    : suppliers

  // Helper function to get supplier name
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    return supplier ? supplier.name : "Unknown Supplier"
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setReceiptImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const findMatchingIngredient = (item: ReceiptItem): BaseIngredient | undefined => {
    return ingredients.find((ingredient) => {
      // Normalize strings for comparison
      const normalizedItemName = item.name.toLowerCase().trim()
      const normalizedIngredientName = ingredient.name.toLowerCase().trim()
      
      // Check if names match (allowing for some flexibility)
      const nameMatches = normalizedItemName === normalizedIngredientName ||
        normalizedItemName.includes(normalizedIngredientName) ||
        normalizedIngredientName.includes(normalizedItemName)

      // Check if units match
      const unitMatches = item.unit === ingredient.unit

      return nameMatches && unitMatches
    })
  }

  const parseReceiptText = (text: string): ReceiptItem[] => {
    // Split text into lines and filter out empty lines
    const lines = text.split("\n").filter((line) => line.trim().length > 0)

    const items: ReceiptItem[] = []
    const priceRegex = /\$?\d+\.?\d*/g
    const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|g|L|ml|pieces|dozen)/i

    lines.forEach((line) => {
      // Skip header lines and total lines
      if (line.toLowerCase().includes("total") || line.toLowerCase().includes("subtotal")) {
        return
      }

      // Extract price
      const prices = line.match(priceRegex)
      if (!prices || prices.length === 0) return

      const price = parseFloat(prices[prices.length - 1].replace("$", ""))
      if (isNaN(price)) return

      // Extract quantity and unit
      const quantityMatch = line.match(quantityRegex)
      let quantity = 1
      let unit = "pieces"

      if (quantityMatch) {
        quantity = parseFloat(quantityMatch[1])
        unit = quantityMatch[2].toLowerCase()
      }

      // Extract name (everything before the price)
      const name = line
        .split(priceRegex)[0]
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "")

      if (name.length > 0) {
        const item: ReceiptItem = {
          name,
          quantity,
          unit,
          cost_per_unit: price / quantity,
        }
        // Find match before adding to items array
        const match = findMatchingIngredient(item)
        items.push({
          ...item,
          matches: match
        })
      }
    })

    return items
  }

  const handleProcessReceipt = async () => {
    if (!receiptImage) {
      toast({
        title: "Error",
        description: "Please select a receipt image first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(
        receiptImage,
        "eng",
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100))
            }
          },
        }
      )

      // Parse the extracted text
      const items = parseReceiptText(result.data.text)

      if (items.length === 0) {
        toast({
          title: "Warning",
          description: "No items could be extracted from the receipt. Please check the image quality.",
          variant: "destructive",
        })
        return
      }

      setProcessedItems(items)
    } catch (error) {
      console.error("OCR Error:", error)
      toast({
        title: "Error",
        description: "Failed to process receipt. Please try again with a clearer image.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleEditItem = (item: ReceiptItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
      category: item.category,
      supplier_id: item.supplier_id,
    })
  }

  const handleSaveEdit = () => {
    if (!editingItem) return

    const updatedItems = processedItems.map((item) =>
      item === editingItem ? { ...item, ...editForm } : item
    )

    setProcessedItems(updatedItems)
    setEditingItem(null)
    setEditForm({})
  }

  const handleRemoveItem = (itemToRemove: ReceiptItem) => {
    setProcessedItems((items) => items.filter((item) => item !== itemToRemove))
  }

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      name: "",
      quantity: 0,
      unit: "kg",
      cost_per_unit: 0,
    }
    setProcessedItems((items) => [...items, newItem])
    handleEditItem(newItem)
  }

  const handleSubmit = async () => {
    if (!processedItems.length) {
      toast({
        title: "No Text Extracted",
        description: "Please upload a receipt first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process the extracted text to identify items
      const items = processedItems
      
      // If this is being used in bulk update, just pass the items to the parent
      if (isBulkUpdate) {
        onProcessReceipt(items)
        onOpenChange(false)
        return
      }

      // Otherwise, process the receipt as before
      items.forEach((item) => {
        if (item.matches) {
          // Update existing ingredient
          updateStock(
            item.matches.id,
            item.quantity,
            "add",
            "receipt-upload"
          )
          if (item.cost_per_unit !== item.matches.cost_per_unit) {
            updateCost(item.matches.id, item.cost_per_unit)
          }
        } else {
          // Add new ingredient
          addIngredient({
            name: item.name,
            category: "Uncategorized",
            unit: item.unit,
            cost_per_unit: item.cost_per_unit,
            available_quantity: item.quantity,
            threshold: Math.ceil(item.quantity * 0.2),
            description: `Added from receipt upload on ${new Date().toLocaleDateString()}`,
            supplier_id: "",
          })
        }
      })

      toast({
        title: "Receipt Processed",
        description: "Inventory has been updated with the receipt items.",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process the receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Process Supplier Receipt</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden flex-1">
          {/* Upload Section */}
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <Label
                htmlFor="receipt-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {receiptImage ? "Change Image" : "Upload Receipt Image"}
                </span>
              </Label>
            </div>

            {previewUrl && (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <Button
              onClick={handleProcessReceipt}
              disabled={!receiptImage || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing... {progress}%
                </div>
              ) : (
                "Process Receipt"
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="flex justify-between items-center sticky top-0 bg-background z-10 pb-2">
              <h3 className="font-medium">Processed Items</h3>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                Add Item
              </Button>
            </div>
            {processedItems.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Cost/Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {editingItem === item ? (
                              <Input
                                value={editForm.name || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                              />
                            ) : (
                              item.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem === item ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.quantity || 0}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    quantity: parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem === item ? (
                              <Select
                                value={editForm.unit}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({ ...prev, unit: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                  <SelectItem value="g">Grams (g)</SelectItem>
                                  <SelectItem value="L">Liters (L)</SelectItem>
                                  <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                  <SelectItem value="pieces">Pieces</SelectItem>
                                  <SelectItem value="dozen">Dozen</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              item.unit
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem === item ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.cost_per_unit || 0}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    cost_per_unit: parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            ) : (
                              `$${item.cost_per_unit.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            {item.matches ? (
                              <span className="flex items-center text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                Match Found
                              </span>
                            ) : (
                              <span className="flex items-center text-blue-600">
                                <X className="h-4 w-4 mr-1" />
                                New Item
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem === item && !item.matches ? (
                              <Select
                                value={editForm.category}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({ ...prev, category: value, supplier_id: "" }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Proteins">Proteins</SelectItem>
                                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                                  <SelectItem value="Grains">Grains</SelectItem>
                                  <SelectItem value="Dairy">Dairy</SelectItem>
                                  <SelectItem value="Spices">Spices</SelectItem>
                                  <SelectItem value="Oils">Oils</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              item.matches ? item.matches.category : (item.category || "Not set")
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem === item && !item.matches ? (
                              <Select
                                value={editForm.supplier_id}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({ ...prev, supplier_id: value }))
                                }
                                disabled={!editForm.category}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categorySuppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              item.matches ? getSupplierName(item.matches.supplier_id) : (item.supplier_id ? suppliers.find((s) => s.id === item.supplier_id)?.name : "Not set")
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {editingItem === item ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveEdit}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingItem(null)
                                      setEditForm({})
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    Confirm & Update Inventory
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {isProcessing
                  ? "Processing receipt..."
                  : "Upload and process a receipt to see the results"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 