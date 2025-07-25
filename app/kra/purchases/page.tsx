'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Download, RefreshCw, Search, Filter, Receipt } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { SalesDetailsDialog } from "@/components/kra/sales-details-dialog"

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

export default function KRASalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<KRASale[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPaymentType, setFilterPaymentType] = useState<string>("all")
  const [selectedSale, setSelectedSale] = useState<KRASale | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Format date for KRA API (YYYYMMDDHHMMSS)
  const formatDateForKRA = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}000000`
  }

  // Fetch KRA sales
  const fetchKRASales = async (date?: Date) => {
    setLoading(true)
    try {
      const requestDate = date || selectedDate
      const lastReqDt = formatDateForKRA(requestDate)

      console.log('Fetching KRA sales for date:', lastReqDt)

      const response = await fetch('/api/kra/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })

      const data = await response.json()

      if (data.success) {
        setSales(data.sales || [])
        toast({
          title: "Sales Fetched",
          description: `Successfully fetched ${data.sales?.length || 0} sales from KRA`,
        })
      } else {
        toast({
          title: "Error Fetching Sales",
          description: data.error || "Failed to fetch sales from KRA",
          variant: "destructive"
        })
        setSales([])
      }
    } catch (error: any) {
      console.error('Error fetching KRA sales:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while fetching sales",
        variant: "destructive"
      })
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  // Load sales on component mount
  useEffect(() => {
    fetchKRASales()
  }, [])

  // Filter sales based on search and payment type
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.spplrNm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.spplrInvcNo.toString().includes(searchTerm.toLowerCase()) ||
      sale.spplrSdcId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPaymentType = filterPaymentType === "all" || sale.pmtTyCd === filterPaymentType
    
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

  // Handle viewing sale details
  const handleViewDetails = (sale: KRASale) => {
    setSelectedSale(sale)
    setShowDetails(true)
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">KRA Sales</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchKRASales()}
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
                          fetchKRASales(date)
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
                    placeholder="Search by supplier, invoice number..."
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

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Sales ({filteredSales.length} of {sales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading sales...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {sales.length === 0 
                    ? "No sales found for the selected date" 
                    : "No sales match your search criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Tax Amount</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Receipt Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale, index) => (
                      <TableRow key={`${sale.spplrInvcNo}-${index}`} onClick={() => handleViewDetails(sale)} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>Invoice: {sale.spplrInvcNo}</div>
                            <div className="text-sm text-muted-foreground">
                              SDC: {sale.spplrSdcId}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              MRC: {sale.spplrMrcNo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{sale.spplrNm}</div>
                            <div className="text-sm text-muted-foreground">
                              TIN: {sale.spplrTin}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              BHF: {sale.spplrBhfId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{formatDate(sale.cfmDt)}</div>
                            <div className="text-sm text-muted-foreground">
                              Sales: {sale.salesDt}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.totItemCnt} items</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(sale.totAmt)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sale.totTaxAmt)}
                        </TableCell>
                        <TableCell>
                          {getPaymentTypeBadge(sale.pmtTyCd)}
                        </TableCell>
                        <TableCell>
                          {getReceiptTypeBadge(sale.rcptTyCd)}
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
      <SalesDetailsDialog
        sale={selectedSale}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </ProtectedRoute>
  )
} 