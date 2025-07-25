import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface KRASaleItem {
  itemSeq: number
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
}

interface KRASale {
  spplrTin: string
  spplrNm: string
  spplrBhfId: string
  spplrInvcNo: number
  spplrSdcId: string
  spplrMrcNo: string
  rcptTyCd: string
  pmtTyCd: string
  cfmDt: string
  salesDt: string
  stockRlsDt: string | null
  totItemCnt: number
  taxblAmtA: number
  taxblAmtB: number
  taxblAmtC: number
  taxblAmtD: number
  taxblAmtE: number
  taxRtA: number
  taxRtB: number
  taxRtC: number
  taxRtD: number
  taxRtE: number
  taxAmtA: number
  taxAmtB: number
  taxAmtC: number
  taxAmtD: number
  taxAmtE: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark: string | null
  itemList: KRASaleItem[]
}

interface SalesDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: KRASale | null
}

export function SalesDetailsDialog({ open, onOpenChange, sale }: SalesDetailsDialogProps) {
  if (!sale) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sale Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <h3 className="font-semibold">Invoice Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Invoice No:</span> {sale.spplrInvcNo}</div>
                <div><span className="font-medium">SDC ID:</span> {sale.spplrSdcId}</div>
                <div><span className="font-medium">MRC No:</span> {sale.spplrMrcNo}</div>
                <div><span className="font-medium">Confirm Date:</span> {formatDate(sale.cfmDt)}</div>
                <div><span className="font-medium">Sales Date:</span> {sale.salesDt}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Supplier Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Name:</span> {sale.spplrNm}</div>
                <div><span className="font-medium">TIN:</span> {sale.spplrTin}</div>
                <div><span className="font-medium">BHF ID:</span> {sale.spplrBhfId}</div>
                <div><span className="font-medium">Payment Type:</span> {getPaymentTypeBadge(sale.pmtTyCd)}</div>
                <div><span className="font-medium">Receipt Type:</span> {getReceiptTypeBadge(sale.rcptTyCd)}</div>
              </div>
            </div>
          </div>

          {/* Sale Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{sale.totItemCnt}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(sale.totAmt)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(sale.totTaxblAmt)}</div>
              <div className="text-sm text-muted-foreground">Taxable Amount</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(sale.totTaxAmt)}</div>
              <div className="text-sm text-muted-foreground">Tax Amount</div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Taxable Amounts by Type</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type A (0%):</span>
                  <span>{formatCurrency(sale.taxblAmtA)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type B (18%):</span>
                  <span>{formatCurrency(sale.taxblAmtB)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type C (0%):</span>
                  <span>{formatCurrency(sale.taxblAmtC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type D (0%):</span>
                  <span>{formatCurrency(sale.taxblAmtD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type E (16%):</span>
                  <span>{formatCurrency(sale.taxblAmtE)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Tax Amounts by Type</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type A:</span>
                  <span>{formatCurrency(sale.taxAmtA)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type B:</span>
                  <span>{formatCurrency(sale.taxAmtB)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type C:</span>
                  <span>{formatCurrency(sale.taxAmtC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type D:</span>
                  <span>{formatCurrency(sale.taxAmtD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type E:</span>
                  <span>{formatCurrency(sale.taxAmtE)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-4">Sale Items</h3>
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
                    <TableHead>Discount</TableHead>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Taxable Amount</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.itemList.map((item, index) => (
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
                          <div className="text-xs text-muted-foreground">
                            {item.pkg} {item.pkgUnitCd}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.prc)}</TableCell>
                      <TableCell>{formatCurrency(item.splyAmt)}</TableCell>
                      <TableCell>
                        {item.dcRt > 0 ? (
                          <div className="space-y-1">
                            <div>{item.dcRt}%</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(item.dcAmt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getTaxTypeBadge(item.taxTyCd)}</TableCell>
                      <TableCell>{formatCurrency(item.taxblAmt)}</TableCell>
                      <TableCell>{formatCurrency(item.taxAmt)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.totAmt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Remarks */}
          {sale.remark && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Remarks</h3>
              <p className="text-sm text-muted-foreground">{sale.remark}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 