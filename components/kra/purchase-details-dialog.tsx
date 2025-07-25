import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface PurchaseItem {
  itemSeq: number
  itemCd: string
  itemClsCd: string
  itemNm: string
  qtyUnitCd: string
  qty: number
  prc: number
  splyAmt: number
  taxblAmt: number
  taxTyCd: string
  taxAmt: number
  totAmt: number
}

interface KRAPurchase {
  invcNo: string
  orgInvcNo: string
  spplrInvcNo: string
  spplrNm: string
  spplrTin: string
  spplrBhfId: string
  totItemCnt: number
  totAmt: number
  totTaxblAmt: number
  totTaxAmt: number
  purDt: string
  regTyCd: string
  trnTyCd: string
  trnSttsCd: string
  itemList: PurchaseItem[]
}

interface PurchaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: KRAPurchase | null
}

export function PurchaseDetailsDialog({ open, onOpenChange, purchase }: PurchaseDetailsDialogProps) {
  if (!purchase) return null

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
      // KRA date format: YYYYMMDDHHMMSS
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(8, 10)
      const minute = dateString.substring(10, 12)
      const second = dateString.substring(12, 14)
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
      return format(date, 'dd/MM/yyyy HH:mm')
    } catch (error) {
      return dateString
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '01': return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case '02': return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
      case '03': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case '01': return <Badge variant="outline">Purchase</Badge>
      case '02': return <Badge variant="outline">Sale</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <h3 className="font-semibold">Invoice Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">KRA Invoice:</span> {purchase.invcNo}</div>
                <div><span className="font-medium">Org Invoice:</span> {purchase.orgInvcNo}</div>
                <div><span className="font-medium">Supplier Invoice:</span> {purchase.spplrInvcNo}</div>
                <div><span className="font-medium">Date:</span> {formatDate(purchase.purDt)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Supplier Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Name:</span> {purchase.spplrNm}</div>
                <div><span className="font-medium">TIN:</span> {purchase.spplrTin}</div>
                <div><span className="font-medium">BHF ID:</span> {purchase.spplrBhfId}</div>
              </div>
            </div>
          </div>

          {/* Purchase Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{purchase.totItemCnt}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(purchase.totAmt)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(purchase.totTaxblAmt)}</div>
              <div className="text-sm text-muted-foreground">Taxable Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(purchase.totTaxAmt)}</div>
              <div className="text-sm text-muted-foreground">Tax Amount</div>
            </div>
          </div>

          {/* Status and Type */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium">Status: </span>
              {getStatusBadge(purchase.trnSttsCd)}
            </div>
            <div>
              <span className="text-sm font-medium">Type: </span>
              {getTransactionTypeBadge(purchase.trnTyCd)}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-4">Purchase Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Supply Amount</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.itemList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.itemSeq}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.itemCd}</div>
                          <div className="text-xs text-muted-foreground">{item.itemClsCd}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.itemNm}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{item.qty} {item.qtyUnitCd}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.prc)}</TableCell>
                      <TableCell>{formatCurrency(item.splyAmt)}</TableCell>
                      <TableCell>{formatCurrency(item.taxAmt)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.totAmt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 