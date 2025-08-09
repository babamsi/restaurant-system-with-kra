import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Send, Loader2 } from "lucide-react"

interface KRAImportedItem {
  itemCd: string
  itemClsCd: string
  itemNm: string
  bcd: string | null
  pkgUnitCd: string
  pkg: number
  qtyUnitCd: string
  qty: number
  prc: number
  splyAmt: number
  dcRt: number
  dcAmt: number
  taxTyCd: string
  taxblAmt: number
  taxAmt: number
  totAmt: number
  importDt: string
  importInvcNo: string
  importSpplrNm: string
  importSpplrTin: string
  importSpplrBhfId: string
  importSpplrSdcId: string
  importSpplrMrcNo: string
  importRcptTyCd: string
  importPmtTyCd: string
  importCfmDt: string
  importSalesDt: string
  importStockRlsDt: string | null
  importTotItemCnt: number
  importTaxblAmtA: number
  importTaxblAmtB: number
  importTaxblAmtC: number
  importTaxblAmtD: number
  importTaxblAmtE: number
  importTaxRtA: number
  importTaxRtB: number
  importTaxRtC: number
  importTaxRtD: number
  importTaxRtE: number
  importTaxAmtA: number
  importTaxAmtB: number
  importTaxAmtC: number
  importTaxAmtD: number
  importTaxAmtE: number
  importTotTaxblAmt: number
  importTotTaxAmt: number
  importTotAmt: number
  importRemark: string | null
}

interface ImportedItemDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: KRAImportedItem | null
}

export function ImportedItemDetailsDialog({ open, onOpenChange, item }: ImportedItemDetailsDialogProps) {
  const { toast } = useToast()
  const [sendingToKRA, setSendingToKRA] = useState(false)

  if (!item) return null

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      // KRA date format: YYYY-MM-DD HH:mm:ss
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy HH:mm')
    } catch (error) {
      return dateString
    }
  }

  // Get payment type badge
  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case '01': return <Badge variant="default" className="bg-green-100 text-green-800">Cash</Badge>
      case '02': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Card</Badge>
      case '03': return <Badge variant="outline" className="bg-purple-100 text-purple-800">Mobile Money</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  // Get receipt type badge
  const getReceiptTypeBadge = (type: string) => {
    switch (type) {
      case 'S': return <Badge variant="outline">Standard</Badge>
      case 'Z': return <Badge variant="outline">Zero Rated</Badge>
      case 'E': return <Badge variant="outline">Exempt</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  // Get tax type badge
  const getTaxTypeBadge = (type: string) => {
    switch (type) {
      case 'A': return <Badge variant="outline" className="bg-red-100 text-red-800">Type A</Badge>
      case 'B': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Type B</Badge>
      case 'C': return <Badge variant="outline" className="bg-green-100 text-green-800">Type C</Badge>
      case 'D': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Type D</Badge>
      case 'E': return <Badge variant="outline" className="bg-purple-100 text-purple-800">Type E</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  // Send imported item to KRA
  const sendToKRA = async () => {
    if (!item) return

    setSendingToKRA(true)
    try {
      // Format date for KRA (YYYYMMDD)
      const importDate = new Date(item.importDt)
      const dclDe = importDate.getFullYear().toString() + 
                   String(importDate.getMonth() + 1).padStart(2, '0') + 
                   String(importDate.getDate()).padStart(2, '0')

      const payload = {
        taskCd: item.importInvcNo || "2231943", // Use invoice number as task code or default
        dclDe: dclDe,
        itemSeq: 1, // Default to 1 for single item
        hsCd: item.itemClsCd || "1231531231", // Use item classification as HS code or default
        itemClsCd: item.itemClsCd,
        itemCd: item.itemCd,
        imptItemSttsCd: "1", // Default to "1" for active status
        remark: item.importRemark || `Imported item: ${item.itemNm}`,
        modrNm: "TestVSCU",
        modrId: "11999"
      }

      console.log('Sending imported item to KRA:', payload)

      const response = await fetch('/api/kra/update-import-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send imported item to KRA')
      }

      toast({
        title: "Success",
        description: `Imported item "${item.itemNm}" successfully sent to KRA`,
      })

    } catch (error: any) {
      console.error('Error sending imported item to KRA:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send imported item to KRA",
        variant: "destructive",
      })
    } finally {
      setSendingToKRA(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Imported Item Details</span>
            <Button
              onClick={sendToKRA}
              disabled={sendingToKRA}
              className="ml-4"
            >
              {sendingToKRA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending to KRA...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to KRA
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <h3 className="font-semibold">Item Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Item Code:</span> {item.itemCd}</div>
                <div><span className="font-medium">Item Name:</span> {item.itemNm}</div>
                <div><span className="font-medium">Classification:</span> {item.itemClsCd}</div>
                <div><span className="font-medium">Barcode:</span> {item.bcd || 'N/A'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Import Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Import Invoice:</span> {item.importInvcNo}</div>
                <div><span className="font-medium">Import Date:</span> {item.importDt}</div>
                <div><span className="font-medium">Confirm Date:</span> {formatDate(item.importCfmDt)}</div>
                <div><span className="font-medium">Sales Date:</span> {item.importSalesDt}</div>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div><span className="font-medium">Name:</span> {item.importSpplrNm}</div>
                <div><span className="font-medium">TIN:</span> {item.importSpplrTin}</div>
                <div><span className="font-medium">BHF ID:</span> {item.importSpplrBhfId}</div>
              </div>
              <div className="space-y-1">
                <div><span className="font-medium">SDC ID:</span> {item.importSpplrSdcId}</div>
                <div><span className="font-medium">MRC No:</span> {item.importSpplrMrcNo}</div>
                <div><span className="font-medium">Payment Type:</span> {getPaymentTypeBadge(item.importPmtTyCd)}</div>
                <div><span className="font-medium">Receipt Type:</span> {getReceiptTypeBadge(item.importRcptTyCd)}</div>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{item.qty}</div>
              <div className="text-sm text-muted-foreground">Quantity ({item.qtyUnitCd})</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(item.totAmt)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(item.taxblAmt)}</div>
              <div className="text-sm text-muted-foreground">Taxable Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(item.taxAmt)}</div>
              <div className="text-sm text-muted-foreground">Tax Amount</div>
            </div>
          </div>

          {/* Item Pricing Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Pricing Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>{formatCurrency(item.prc)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supply Amount:</span>
                  <span>{formatCurrency(item.splyAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span>{item.pkg} {item.pkgUnitCd}</span>
                </div>
                {item.dcRt > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Discount Rate:</span>
                      <span>{item.dcRt}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount Amount:</span>
                      <span>{formatCurrency(item.dcAmt)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Tax Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tax Type:</span>
                  <span>{getTaxTypeBadge(item.taxTyCd)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>{formatCurrency(item.taxblAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span>{formatCurrency(item.taxAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formatCurrency(item.totAmt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Import Tax Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Import Taxable Amounts by Type</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type A (0%):</span>
                  <span>{formatCurrency(item.importTaxblAmtA)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type B (18%):</span>
                  <span>{formatCurrency(item.importTaxblAmtB)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type C (0%):</span>
                  <span>{formatCurrency(item.importTaxblAmtC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type D (0%):</span>
                  <span>{formatCurrency(item.importTaxblAmtD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type E (16%):</span>
                  <span>{formatCurrency(item.importTaxblAmtE)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Import Tax Amounts by Type</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type A:</span>
                  <span>{formatCurrency(item.importTaxAmtA)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type B:</span>
                  <span>{formatCurrency(item.importTaxAmtB)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type C:</span>
                  <span>{formatCurrency(item.importTaxAmtC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type D:</span>
                  <span>{formatCurrency(item.importTaxAmtD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type E:</span>
                  <span>{formatCurrency(item.importTaxAmtE)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Import Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{item.importTotItemCnt}</div>
              <div className="text-sm text-muted-foreground">Total Import Items</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(item.importTotAmt)}</div>
              <div className="text-sm text-muted-foreground">Import Total Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(item.importTotTaxblAmt)}</div>
              <div className="text-sm text-muted-foreground">Import Taxable Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(item.importTotTaxAmt)}</div>
              <div className="text-sm text-muted-foreground">Import Tax Amount</div>
            </div>
          </div>

          {/* Remarks */}
          {item.importRemark && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Import Remarks</h3>
              <p className="text-sm text-muted-foreground">{item.importRemark}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 