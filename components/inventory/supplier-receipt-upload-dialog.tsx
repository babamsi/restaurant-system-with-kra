"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Camera, Loader2, CheckCircle, X, FileText, Building2, Calendar, DollarSign, Search, AlertCircle } from "lucide-react"
import { SupplierSelector } from "@/components/suppliers/supplier-selector"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { supplierReceiptsService } from "@/lib/database"

interface SupplierReceiptUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptUploaded?: (receiptId: string) => void
}

interface SupplierOrder {
  id: string
  invoice_number: string
  order_date: string
  total_amount: number
  vat_amount: number
  status: string
  notes?: string
}

export function SupplierReceiptUploadDialog({
  open,
  onOpenChange,
  onReceiptUploaded
}: SupplierReceiptUploadDialogProps) {
  const { toast } = useToast()
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string>("")
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Receipt details
  const [receiptDate, setReceiptDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [totalAmount, setTotalAmount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // New state for smart functionality
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [searchInvoice, setSearchInvoice] = useState("")

  // Load supplier orders when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierOrders(selectedSupplier)
    } else {
      setSupplierOrders([])
      setSelectedOrder(null)
      resetReceiptDetails()
    }
  }, [selectedSupplier])

  // Auto-populate receipt details when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setReceiptDate(format(new Date(selectedOrder.order_date), "yyyy-MM-dd"))
      setInvoiceNumber(selectedOrder.invoice_number)
      setTotalAmount(selectedOrder.total_amount.toString())
      setNotes(selectedOrder.notes || "")
    }
  }, [selectedOrder])

  const loadSupplierOrders = async (supplierId: string) => {
    try {
      setLoadingOrders(true)
      const result = await supplierReceiptsService.getSupplierOrders(supplierId)
      
      if (result.success) {
        setSupplierOrders(result.data || [])
      } else {
        throw new Error(result.error || "Failed to load supplier orders")
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Orders",
        description: error.message || "Failed to load supplier orders",
        variant: "destructive",
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  const resetReceiptDetails = () => {
    setReceiptDate(format(new Date(), "yyyy-MM-dd"))
    setInvoiceNumber("")
    setTotalAmount("")
    setNotes("")
    setSelectedOrder(null)
    setSelectedInvoiceNumber("")
  }

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    resetReceiptDetails()
  }

  const handleInvoiceSelection = (invoiceNumber: string) => {
    setSelectedInvoiceNumber(invoiceNumber)
    const order = supplierOrders.find(o => o.invoice_number === invoiceNumber)
    setSelectedOrder(order || null)
  }

  const filteredOrders = supplierOrders.filter(order =>
    order.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase())
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setReceiptImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleCameraCapture = () => {
    // This would integrate with device camera
    // For now, we'll just trigger the file input
    document.getElementById('receipt-camera-input')?.click()
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `supplier-receipts/${fileName}`

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const saveReceiptToDatabase = async (imageUrl: string, filename: string) => {
    const result = await supplierReceiptsService.uploadReceipt({
      supplier_id: selectedSupplier,
      receipt_date: receiptDate,
      invoice_number: invoiceNumber || undefined,
      total_amount: totalAmount ? parseFloat(totalAmount) : 0,
      image_url: imageUrl,
      image_filename: filename,
      file_size: receiptImage?.size || 0,
      mime_type: receiptImage?.type || '',
      notes: notes || undefined
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to save receipt")
    }

    return result.data
  }

  const handleUpload = async () => {
    if (!selectedSupplier) {
      toast({
        title: "Missing Supplier",
        description: "Please select a supplier for this receipt",
        variant: "destructive",
      })
      return
    }

    if (!receiptImage) {
      toast({
        title: "Missing Image",
        description: "Please select a receipt image to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload image to storage (30% of progress)
      setUploadProgress(10)
      const imageUrl = await uploadImageToStorage(receiptImage)
      setUploadProgress(30)

      // Step 2: Save receipt metadata to database (70% of progress)
      setUploadProgress(50)
      const receiptData = await saveReceiptToDatabase(imageUrl, receiptImage.name)
      setUploadProgress(100)

      toast({
        title: "Receipt Uploaded Successfully",
        description: `Receipt for ${receiptData.invoice_number || 'Unknown Invoice'} has been saved.`,
      })

      // Reset form
      resetForm()
      
      // Notify parent component
      if (onReceiptUploaded) {
        onReceiptUploaded(receiptData.id)
      }

      // Close dialog
      onOpenChange(false)

    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setSelectedSupplier("")
    setSelectedInvoiceNumber("")
    setReceiptImage(null)
    setPreviewUrl(null)
    resetReceiptDetails()
    
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Supplier Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
          {/* Step 1: Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Step 1: Select Supplier *
            </Label>
            <SupplierSelector
              value={selectedSupplier}
              onValueChange={handleSupplierChange}
              placeholder="Choose supplier for this receipt"
              showAddButton={true}
            />
          </div>

          {/* Step 2: Invoice Selection (only show if supplier is selected) */}
          {selectedSupplier && (
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Step 2: Select Invoice Number (Optional)
              </Label>
              
              {loadingOrders ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading supplier orders...
                </div>
              ) : supplierOrders.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoice numbers..."
                      value={searchInvoice}
                      onChange={(e) => setSearchInvoice(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    <div className="grid gap-1 p-2">
                      {filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleInvoiceSelection(order.invoice_number)}
                          className={`p-3 text-left rounded-md border transition-colors ${
                            selectedInvoiceNumber === order.invoice_number
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'hover:bg-muted/50 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{order.invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.order_date), "MMM d, yyyy")} • Ksh {order.total_amount.toFixed(2)}
                              </p>
                            </div>
                            <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {filteredOrders.length === 0 && searchInvoice && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No invoices found matching "{searchInvoice}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No orders found for this supplier</p>
                  <p className="text-sm">You can still upload a receipt manually</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Receipt Details */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Step 3: Receipt Details
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-date">Receipt Date *</Label>
                <Input
                  id="receipt-date"
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </Label>
                <Input
                  id="total-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this receipt"
                />
              </div>
            </div>

            {/* Auto-population indicator */}
            {selectedOrder && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Details auto-populated from invoice {selectedOrder.invoice_number}
                </span>
              </div>
            )}
          </div>

          {/* Step 4: Image Upload */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Step 4: Receipt Image *</Label>
            
            {!previewUrl ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload a clear image of the supplier receipt
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPEG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <Label
                      htmlFor="receipt-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Label>
                    <Button
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="inline-flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] max-w-md mx-auto rounded-lg overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="object-contain w-full h-full bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setReceiptImage(null)
                      URL.revokeObjectURL(previewUrl)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {receiptImage && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>File: {receiptImage.name}</p>
                    <p>Size: {(receiptImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading receipt...</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 flex-shrink-0 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedSupplier || !receiptImage || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Upload Receipt
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Hidden camera input for mobile devices */}
        <Input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          id="receipt-camera-input"
        />
      </DialogContent>
    </Dialog>
  )
} 