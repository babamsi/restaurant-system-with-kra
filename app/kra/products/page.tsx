'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, RefreshCw, Package } from 'lucide-react'

interface KRAItem {
  tin: string
  itemCd: string
  itemClsCd: string
  itemTyCd: string
  itemNm: string
  itemStdNm: string
  orgnNatCd: string
  pkgUnitCd: string
  qtyUnitCd: string
  taxTyCd: string
  regBhfId: string
  dftPrc: number
  useYn: string
}

export default function KRAProductsPage() {
  const { toast } = useToast()
  const [dateStr, setDateStr] = useState('20160523000000')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<KRAItem[]>([])
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q) return items
    const s = q.toLowerCase()
    return items.filter(i =>
      i.itemNm?.toLowerCase().includes(s) ||
      i.itemCd?.toLowerCase().includes(s) ||
      i.itemClsCd?.toLowerCase().includes(s)
    )
  }, [items, q])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kra/select-item-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReqDt: dateStr || '20160523000000' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch KRA products')

      const list = data?.kraData?.data?.itemList || []
      setItems(list)
      toast({ title: 'Loaded', description: `Fetched ${list.length} products from KRA` })
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to fetch', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" /> KRA Products
            </h1>
            <p className="text-muted-foreground mt-1">Search products registered on KRA</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-[280px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name/code/classification" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-[260px]">
              <span className="text-xs text-muted-foreground">lastReqDt</span>
              <Input placeholder="YYYYMMDDHHmmss" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <Button onClick={fetchItems} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Fetch
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Results <Badge variant="secondary">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class Code</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => (
                    <TableRow key={it.itemCd}>
                      <TableCell className="font-mono text-xs">{it.itemCd}</TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{it.itemNm}</div>
                        <div className="text-muted-foreground text-xs">{it.itemStdNm}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{it.itemClsCd}</TableCell>
                      <TableCell className="text-xs">{it.qtyUnitCd}</TableCell>
                      <TableCell className="text-xs">{it.taxTyCd}</TableCell>
                      <TableCell className="font-mono text-xs">{it.regBhfId}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{Number(it.dftPrc || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}



