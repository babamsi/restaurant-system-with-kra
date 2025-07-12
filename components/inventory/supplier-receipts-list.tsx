"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { FileText, Eye, Download, Search, Filter, Calendar, Building2, DollarSign, Image as ImageIcon, Link, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useSuppliers } from "@/hooks/use-suppliers"
import { supplierReceiptsService } from "@/lib/database"

interface SupplierReceipt {
  id: string
  supplier_id: string
  receipt_date: string
  invoice_number: string | null
  total_amount: number
  image_url: string
  image_filename: string
  file_size: number
  mime_type: string
  ocr_text: string | null
  is_processed: boolean
  processed_at: string | null
  status: 'uploaded' | 'processing' | 'processed' | 'error'
  notes: string | null
  created_at: string
  updated_at: string
  suppliers?: {
    name: string
    contact_person: string | null
  }
  linked_order?: {
    id: string
    invoice_number: string
    order_date: string
    total_amount: number
    vat_amount: number
    status: string
  }
}

export function SupplierReceiptsList() {
  const { toast } = useToast()
  const { getSupplierById } = useSuppliers()
  const [receipts, setReceipts] = useState<SupplierReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [selectedReceipt, setSelectedReceipt] = useState<SupplierReceipt | null>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)

  // Load receipts from database with linked order information
  const loadReceipts = async () => {
    try {
      setLoading(true)
      const result = await supplierReceiptsService.getReceipts()
      
      if (result.success) {
        setReceipts(result.data || [])
      } else {
        throw new Error(result.error || "Failed to load receipts")
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Receipts",
        description: error.message || "Failed to load receipts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReceipts()
  }, [])

  // Filter receipts based on search and supplier
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.suppliers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.linked_order?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSupplier = selectedSupplier === "all" || receipt.supplier_id === selectedSupplier
    
    return matchesSearch && matchesSupplier
  })

  // Get unique suppliers for filter
  const suppliers = Array.from(new Set(receipts.map(r => r.supplier_id)))

  const handleViewImage = (receipt: SupplierReceipt) => {
    setSelectedReceipt(receipt)
    setShowImageDialog(true)
  }

  const handleDownloadImage = async (receipt: SupplierReceipt) => {
    try {
      const response = await fetch(receipt.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = receipt.image_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Started",
        description: "Receipt image is being downloaded",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download receipt image",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: SupplierReceipt['status']) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary">Uploaded</Badge>
      case 'processing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Processing</Badge>
      case 'processed':
        return <Badge variant="default" className="bg-green-500">Processed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>
      case 'partially_paid':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Partially Paid</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading receipts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Receipts ({receipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts, invoices, or suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(supplierId => {
                    const supplier = getSupplierById(supplierId)
                    return (
                      <option key={supplierId} value={supplierId}>
                        {supplier?.name || 'Unknown Supplier'}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {receipts.length === 0 ? (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <p>No receipts uploaded yet</p>
                          <p className="text-sm">Upload your first supplier receipt to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Search className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <p>No receipts found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {receipt.invoice_number || 'No Invoice Number'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {receipt.image_filename}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{receipt.suppliers?.name || 'Unknown Supplier'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {receipt.invoice_number || 'Manual Entry'}
                            </span>
                          </div>
                          {receipt.linked_order && (
                            <div className="flex items-center gap-1">
                              <Link className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Linked to Order</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(receipt.receipt_date), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Ksh {receipt.total_amount.toFixed(2)}</span>
                          </div>
                          {receipt.linked_order && (
                            <div className="text-xs text-muted-foreground">
                              Order: Ksh {receipt.linked_order.total_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(receipt.status)}
                          {receipt.linked_order && (
                            <div>
                              {getOrderStatusBadge(receipt.linked_order.status)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(receipt.file_size)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewImage(receipt)}
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadImage(receipt)}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Image View Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Receipt Image
              {selectedReceipt && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {selectedReceipt.invoice_number || 'No Invoice Number'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            {selectedReceipt && (
              <div className="space-y-6">
                {/* Receipt Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{selectedReceipt.suppliers?.name || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedReceipt.receipt_date), "MMM d, yyyy")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">Ksh {selectedReceipt.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Linked Order Information */}
                {selectedReceipt.linked_order && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Link className="h-4 w-4 text-green-600" />
                      <h3 className="font-medium text-green-800 dark:text-green-200">Linked Supplier Order</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Invoice Number</p>
                        <p className="font-medium">{selectedReceipt.linked_order.invoice_number}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-medium">{format(new Date(selectedReceipt.linked_order.order_date), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Order Amount</p>
                        <p className="font-medium">Ksh {selectedReceipt.linked_order.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Order Status</p>
                        <div className="mt-1">{getOrderStatusBadge(selectedReceipt.linked_order.status)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Receipt Image */}
                <div className="flex justify-center">
                  <div className="relative max-w-full">
                    <img
                      src={selectedReceipt.image_url}
                      alt="Receipt"
                      className="max-w-full h-auto rounded-lg border shadow-lg"
                      style={{ maxHeight: '70vh' }}
                    />
                  </div>
                </div>

                {/* OCR Text (if available) */}
                {selectedReceipt.ocr_text && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Extracted Text</h3>
                    <div className="p-4 bg-muted/30 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {selectedReceipt.ocr_text}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedReceipt.notes && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="text-sm p-4 bg-muted/30 rounded-lg">
                      {selectedReceipt.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 