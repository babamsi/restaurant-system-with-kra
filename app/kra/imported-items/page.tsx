'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Download, RefreshCw, Search, Filter, Package } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { ImportedItemDetailsDialog } from "@/components/kra/imported-item-details-dialog"

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

export default function KRAImportedItemsPage() {
  const { toast } = useToast()
  const [importedItems, setImportedItems] = useState<KRAImportedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPaymentType, setFilterPaymentType] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<KRAImportedItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Format date for KRA API (YYYYMMDDHHMMSS)
  const formatDateForKRA = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}000000`
  }

  // Fetch KRA imported items
  const fetchKRAImportedItems = async (date?: Date) => {
    setLoading(true)
    try {
      const requestDate = date || selectedDate
      const lastReqDt = formatDateForKRA(requestDate)

      console.log('Fetching KRA imported items for date:', lastReqDt)

      const response = await fetch('/api/kra/imported-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })

      const data = await response.json()

      if (data.success) {
        setImportedItems(data.importedItems || [])
        toast({
          title: "Imported Items Fetched",
          description: `Successfully fetched ${data.importedItems?.length || 0} imported items from KRA`,
        })
      } else {
        toast({
          title: "Error Fetching Imported Items",
          description: data.error || "Failed to fetch imported items from KRA",
          variant: "destructive"
        })
        setImportedItems([])
      }
    } catch (error: any) {
      console.error('Error fetching KRA imported items:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while fetching imported items",
        variant: "destructive"
      })
      setImportedItems([])
    } finally {
      setLoading(false)
    }
  }

  // Load imported items on component mount
  useEffect(() => {
    fetchKRAImportedItems()
  }, [])

  // Filter imported items based on search and payment type
  const filteredItems = importedItems.filter(item => {
    const matchesSearch = 
      item.itemNm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.importInvcNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.importSpplrNm.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPaymentType = filterPaymentType === "all" || item.importPmtTyCd === filterPaymentType
    
    return matchesSearch && matchesPaymentType
  })

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

  // Handle viewing item details
  const handleViewDetails = (item: KRAImportedItem) => {
    setSelectedItem(item)
    setShowDetails(true)
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">KRA Imported Items</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchKRAImportedItems()}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          fetchKRAImportedItems(date)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by item name, code, invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Payment Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Type</label>
                <select
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Payment Types</option>
                  <option value="01">Cash</option>
                  <option value="02">Card</option>
                  <option value="03">Mobile Money</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imported Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Imported Items ({filteredItems.length} of {importedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading imported items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {importedItems.length === 0 
                    ? "No imported items found for the selected date" 
                    : "No imported items match your search criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Import Invoice</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Import Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Tax Amount</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Tax Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow key={`${item.itemCd}-${index}`} onClick={() => handleViewDetails(item)} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{item.itemCd}</div>
                            <div className="text-sm text-muted-foreground">{item.itemClsCd}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.itemNm}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.importInvcNo}</div>
                            <div className="text-sm text-muted-foreground">
                              SDC: {item.importSpplrSdcId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.importSpplrNm}</div>
                            <div className="text-sm text-muted-foreground">
                              TIN: {item.importSpplrTin}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{formatDate(item.importCfmDt)}</div>
                            <div className="text-sm text-muted-foreground">
                              Import: {item.importDt}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{item.qty} {item.qtyUnitCd}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.pkg} {item.pkgUnitCd}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.prc)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.totAmt)}</TableCell>
                        <TableCell>{formatCurrency(item.taxAmt)}</TableCell>
                        <TableCell>
                          {getPaymentTypeBadge(item.importPmtTyCd)}
                        </TableCell>
                        <TableCell>
                          {getTaxTypeBadge(item.taxTyCd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ImportedItemDetailsDialog
        item={selectedItem}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </ProtectedRoute>
  )
} 