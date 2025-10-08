'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Download, RefreshCw, Search, Filter, Package, Send, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { ImportedItemDetailsDialog } from "@/components/kra/imported-item-details-dialog"
import { supabase } from '@/lib/supabase'
import { useKRAClassifications } from '@/hooks/use-kra-classifications'

interface KRAImportedItem {
  taskCd: string
  dclDe: string
  itemSeq: number
  dclNo: string
  hsCd: string
  itemNm: string
  imptItemsttsCd: string
  orgnNatCd: string
  exptNatCd: string
  pkg: number
  pkgUnitCd: string | null
  qty: number
  qtyUnitCd: string
  totWt: number
  netWt: number
  spplrNm: string
  agntNm: string
  invcFcurAmt: number
  invcFcurCd: string
  invcFcurExcrt: number
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
  const [sendingItems, setSendingItems] = useState<Set<string>>(new Set())
  const { classifications } = useKRAClassifications()

  // Convert dialog state
  const [isConvertOpen, setIsConvertOpen] = useState(false)
  const [convertItem, setConvertItem] = useState<KRAImportedItem | null>(null)
  const [selectedCls, setSelectedCls] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [remark, setRemark] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Format date for KRA API (YYYYMMDDHHMMSS)
  const formatDateForKRA = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}000000`
  }

  // Parse declaration date to YYYYMMDD
  const normalizeDclDe = (raw: string): string => {
    const digits = (raw || '').replace(/[^0-9]/g, '')
    if (digits.length === 8) {
      const dd = digits.slice(0, 2)
      const mm = digits.slice(2, 4)
      const yyyy = digits.slice(4)
      // if looks like DDMMYYYY, convert
      if (parseInt(dd) <= 31 && parseInt(mm) <= 12) {
        return `${yyyy}${mm}${dd}`
      }
      return digits
    }
    // Fallback to today
    const d = new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  }

  // Generate next item code by scanning DB (defaults to unit code U)
  const getNextItemCd = async (unitCode: string = 'U'): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('item_cd')
        .like('item_cd', `KE2NT${unitCode}%`)
        .order('item_cd', { ascending: false })
        .limit(25)
      if (error) throw error
      let max = 0 as number
      (data || []).forEach((row: any) => {
        const code = (row as any).item_cd as string | null
        if (code) {
          const m = code.match(new RegExp(`KE2NT${unitCode}(\\d{7})`))
          if (m) {
            const n = Number.parseInt(m[1], 10)
            if (!Number.isNaN(n)) max = Math.max(max, n)
          }
        }
      })
      const next = (max + 1).toString().padStart(7, '0')
      return `KE2NT${unitCode}${next}`
    } catch (e) {
      return `KE2NTU0000001`
    }
  }

  const openConvertDialog = async (item: KRAImportedItem) => {
    setConvertItem(item)
    setIsConvertOpen(true)
    setRemark(`Converted from import ${item.dclNo}`)
    setIsGenerating(true)
    try {
      // Best-effort unit code guess: use qtyUnitCd if single letter, else default to U
      const unitCode = (item.qtyUnitCd && item.qtyUnitCd.length === 1) ? item.qtyUnitCd : 'U'
      const code = await getNextItemCd(unitCode)
      setGeneratedCode(code)
    } finally {
      setIsGenerating(false)
    }
  }

  const submitConvert = async () => {
    if (!convertItem || !selectedCls || !generatedCode) {
      toast({ title: 'Missing data', description: 'Select classification and ensure code is generated.' , variant: 'destructive'})
      return
    }
    setIsConverting(true)
    try {
      const payload = {
        taskCd: convertItem.taskCd,
        dclDe: normalizeDclDe(convertItem.dclDe),
        itemSeq: convertItem.itemSeq,
        hsCd: convertItem.hsCd,
        itemClsCd: selectedCls,
        itemCd: generatedCode,
        imptItemSttsCd: convertItem.imptItemsttsCd,
        remark: remark || `Converted from import ${convertItem.dclNo}`,
        modrNm: 'Admin',
        modrId: 'Admin'
      }
      const res = await fetch('/api/kra/update-import-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || data.resultCd && data.resultCd !== '000' || data.success === false) {
        throw new Error(data.error || data.resultMsg || 'Failed to update import item')
      }
      toast({ title: 'Converted', description: `Item ${convertItem.itemNm} converted successfully.` })
      setIsConvertOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to convert item', variant: 'destructive' })
    } finally {
      setIsConverting(false)
    }
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

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch imported items')
      }

      setImportedItems(data.items || [])
    } catch (error: any) {
      console.error('Error fetching imported items:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch imported items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Send imported item to KRA
  const sendItemToKRA = async (item: KRAImportedItem) => {
    // Placeholder: adjust to your update-import flow if needed
    toast({ title: "Coming soon", description: "Send to KRA not configured for this data shape yet." })
  }

  // Filter items based on search and payment type
  const filteredItems = importedItems.filter(item => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      item.itemNm?.toLowerCase().includes(term) ||
      item.dclNo?.toLowerCase().includes(term) ||
      item.hsCd?.toLowerCase().includes(term) ||
      item.spplrNm?.toLowerCase().includes(term) ||
      item.agntNm?.toLowerCase().includes(term)
    return matchesSearch
  })

  // Load items on component mount
  useEffect(() => {
    fetchKRAImportedItems()
  }, [])

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case '01': return <Badge variant="default" className="bg-green-100 text-green-800">Cash</Badge>
      case '02': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Card</Badge>
      case '03': return <Badge variant="outline" className="bg-purple-100 text-purple-800">Mobile Money</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  const getReceiptTypeBadge = (type: string) => {
    switch (type) {
      case 'S': return <Badge variant="outline">Standard</Badge>
      case 'Z': return <Badge variant="outline">Zero Rated</Badge>
      case 'E': return <Badge variant="outline">Exempt</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy')
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
                      <TableHead>Declaration No</TableHead>
                      <TableHead>HS Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Net/Gross Wt</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origin/Export</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow key={`${item.dclNo}-${item.itemSeq}-${index}`}>
                        <TableCell className="font-medium whitespace-nowrap">{item.dclNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.hsCd}</TableCell>
                        <TableCell className="max-w-[320px] truncate" title={item.itemNm}>{item.itemNm}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{item.qty} {item.qtyUnitCd}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.pkg} {item.pkgUnitCd || ''}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Net: {item.netWt}</div>
                            <div className="text-sm text-muted-foreground">Gross: {item.totWt}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate" title={item.spplrNm}>{item.spplrNm}</TableCell>
                        <TableCell className="max-w-[220px] truncate" title={item.agntNm}>{item.agntNm}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: item.invcFcurCd || 'USD' }).format(item.invcFcurAmt)}</div>
                            <div className="text-sm text-muted-foreground">FX: {item.invcFcurExcrt}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.imptItemsttsCd}</Badge>
                        </TableCell>
                        <TableCell>{item.orgnNatCd}/{item.exptNatCd}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button size="sm" variant="outline" onClick={() => openConvertDialog(item)}>Convert</Button>
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
      {/* Convert Dialog */}
      {isConvertOpen && convertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background w-full max-w-lg rounded-md shadow-lg p-5">
            <div className="text-lg font-semibold mb-2">Convert Imported Item</div>
            <div className="text-sm text-muted-foreground mb-4">{convertItem.itemNm}</div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Item Classification (itemClsCd)</label>
                <select
                  value={selectedCls}
                  onChange={(e) => setSelectedCls(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background mt-1"
                >
                  <option value="">Select classification…</option>
                  {classifications?.map((c: any) => (
                    <option key={c.itemClsCd} value={c.itemClsCd}>{c.itemClsCd} - {c.itemClsNm}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Generated Item Code (itemCd)</label>
                <div className="flex gap-2 mt-1">
                  <Input value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value)} />
                  <Button variant="outline" onClick={() => openConvertDialog(convertItem!)} disabled={isGenerating}>{isGenerating ? 'Generating…' : 'Regenerate'}</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Remark</label>
                <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional remark" className="mt-1" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
              <Button onClick={submitConvert} disabled={isConverting || !selectedCls || !generatedCode}>
                {isConverting ? 'Converting…' : 'Convert & Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
} 