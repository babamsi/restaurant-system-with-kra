'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Download, RefreshCw, Search, Filter, Package, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface StockMovementItem {
  itemSeq: number
  itemCd: string
  itemClsCd: string
  itemNm: string
  bcd: string | null
  pkgUnitCd: string
  pkg: number
  qtyUnitCd: string
  qty: number
  itemExprDt: string | null
  prc: number
  splyAmt: number
  totDcAmt: number
  taxblAmt: number
  taxTyCd: string
  taxAmt: number
  totAmt: number
}

interface StockMovement {
  custTin: string
  custBhfId: string
  sarNo: number
  ocrnDt: string
  totItemCnt: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark: string | null
  itemList: StockMovementItem[]
}

export default function StockMovementPage() {
  const { toast } = useToast()
  const [stockMovement, setStockMovement] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterItemCode, setFilterItemCode] = useState<string>("all")
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Format date for KRA API (YYYYMMDDHHMMSS)
  const formatDateForKRA = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}000000`
  }

  const fetchStockMovement = async (date?: Date) => {
    setLoading(true)
    try {
      const requestDate = date || selectedDate
      const lastReqDt = formatDateForKRA(requestDate)

      console.log('Fetching stock movement for date:', lastReqDt)

      const response = await fetch('/api/kra/stock-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt })
      })

      const data = await response.json()

      if (data.success) {
        setStockMovement(data.stockMovement || [])
        toast({
          title: "Stock Movement Fetched",
          description: `Successfully fetched ${data.stockMovement?.length || 0} stock movements from KRA for ${format(requestDate, 'dd/MM/yyyy')}`,
        })
      } else {
        toast({
          title: "Error Fetching Stock Movement",
          description: data.error || "Failed to fetch stock movement from KRA",
          variant: "destructive"
        })
        setStockMovement([])
      }
    } catch (error: any) {
      console.error('Error fetching stock movement:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while fetching stock movement",
        variant: "destructive"
      })
      setStockMovement([])
    } finally {
      setLoading(false)
    }
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsCalendarOpen(false)
      // Automatically fetch data for the new date
      fetchStockMovement(date)
    }
  }

  // Load stock movement on component mount
  useEffect(() => {
    fetchStockMovement()
  }, [])

  // Filter stock movement based on search and item code
  const filteredStockMovement = stockMovement.filter(movement => {
    const matchesSearch = 
      movement.custTin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.sarNo.toString().includes(searchTerm.toLowerCase()) ||
      movement.custBhfId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.itemList.some(item => 
        item.itemNm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCd.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesItemCode = filterItemCode === "all" || 
      movement.itemList.some(item => item.itemCd === filterItemCode)
    
    return matchesSearch && matchesItemCode
  })

  // Get unique item codes for filter
  const uniqueItemCodes = Array.from(new Set(
    stockMovement.flatMap(movement => 
      movement.itemList.map(item => item.itemCd)
    )
  )).sort()

  // Get tax type badge
  const getTaxTypeBadge = (type: string) => {
    switch (type) {
      case 'A': return <Badge variant="outline" className="bg-green-100 text-green-800">Exempt</Badge>
      case 'B': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Standard (16%)</Badge>
      case 'C': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Zero Rated</Badge>
      case 'D': return <Badge variant="outline" className="bg-gray-100 text-gray-800">Non-VAT</Badge>
      case 'E': return <Badge variant="outline" className="bg-purple-100 text-purple-800">Reduced (8%)</Badge>
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
      // KRA date format: YYYYMMDD
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const date = new Date(`${year}-${month}-${day}`)
      return format(date, 'dd/MM/yyyy')
    } catch (error) {
      return dateString
    }
  }

  // Toggle expanded items
  const toggleExpanded = (sarNo: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(sarNo)) {
      newExpanded.delete(sarNo)
    } else {
      newExpanded.add(sarNo)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Stock Movement</h1>
              <p className="text-muted-foreground">
                View stock movement data from KRA for selected date
              </p>
            </div>
            <div className="flex gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => fetchStockMovement()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Date Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Showing stock movement data for: <strong>{format(selectedDate, 'EEEE, dd MMMM yyyy')}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search by TIN, SAR No, Item Name, Item Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium">Item Code</label>
                  <select
                    value={filterItemCode}
                    onChange={(e) => setFilterItemCode(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Items</option>
                    {uniqueItemCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Movement Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Movement Data
                {filteredStockMovement.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredStockMovement.length} movement{filteredStockMovement.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin h-8 w-8" />
                </div>
              ) : filteredStockMovement.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {stockMovement.length === 0 
                      ? `No stock movement data found for ${format(selectedDate, 'dd/MM/yyyy')}`
                      : 'No stock movements match your current filters'
                    }
                  </p>
                  {stockMovement.length === 0 && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => fetchStockMovement()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStockMovement.map((movement) => (
                    <div key={movement.sarNo} className="border rounded-lg">
                      {/* Movement Header */}
                      <div 
                        className="p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => toggleExpanded(movement.sarNo)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-semibold">SAR No: {movement.sarNo}</p>
                              <p className="text-sm text-muted-foreground">
                                Date: {formatDate(movement.ocrnDt)} | 
                                Items: {movement.totItemCnt} | 
                                Total: {formatCurrency(movement.totAmt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {formatCurrency(movement.totTaxAmt)} Tax
                            </Badge>
                            <Button variant="ghost" size="sm">
                              {expandedItems.has(movement.sarNo) ? 'Hide' : 'Show'} Details
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Movement Details */}
                      {expandedItems.has(movement.sarNo) && (
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item Code</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Supply Amount</TableHead>
                                <TableHead>Tax Type</TableHead>
                                <TableHead>Tax Amount</TableHead>
                                <TableHead>Total Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {movement.itemList.map((item) => (
                                <TableRow key={item.itemSeq}>
                                  <TableCell className="font-mono text-sm">{item.itemCd}</TableCell>
                                  <TableCell>{item.itemNm}</TableCell>
                                  <TableCell>
                                    {item.qty} {item.qtyUnitCd}
                                  </TableCell>
                                  <TableCell>{formatCurrency(item.prc)}</TableCell>
                                  <TableCell>{formatCurrency(item.splyAmt)}</TableCell>
                                  <TableCell>{getTaxTypeBadge(item.taxTyCd)}</TableCell>
                                  <TableCell>{formatCurrency(item.taxAmt)}</TableCell>
                                  <TableCell className="font-semibold">
                                    {formatCurrency(item.totAmt)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 