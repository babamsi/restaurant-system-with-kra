'use client'

import React, { useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, UserCircle2 } from 'lucide-react'

interface Cust {
  tin: string
  taxprNm: string
  taxprSttsCd: string
  prvncNm: string
  dstrtNm: string
  sctrNm: string
  locDesc: string
}

export default function KRACustomersPage() {
  const { toast } = useToast()
  const [tin, setTin] = useState('P052454103Q')
  const [bhfId, setBhfId] = useState('00')
  const [custmTin, setCustmTin] = useState('P052454103Q')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Cust[]>([])
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q) return rows
    const s = q.toLowerCase()
    return rows.filter(r =>
      r.taxprNm?.toLowerCase().includes(s) ||
      r.tin?.toLowerCase().includes(s) ||
      r.dstrtNm?.toLowerCase().includes(s) ||
      r.prvncNm?.toLowerCase().includes(s)
    )
  }, [rows, q])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kra/select-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tin, bhfId, custmTin })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch customer')
      const custList: Cust[] = data?.kraData?.data?.custList || []
      setRows(custList)
      toast({ title: 'Loaded', description: `Found ${custList.length} customer(s)` })
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to fetch', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCircle2 className="h-6 w-6" /> KRA Customer Lookup
            </h1>
            <p className="text-muted-foreground mt-1">Search customer info from KRA by TIN and Branch</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Your PIN (tin)</label>
                <Input value={tin} onChange={(e) => setTin(e.target.value.toUpperCase())} placeholder="P052454103Q" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Branch ID (bhfId)</label>
                <Input value={bhfId} onChange={(e) => setBhfId(e.target.value)} placeholder="00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Customer PIN (custmTin)</label>
                <Input value={custmTin} onChange={(e) => setCustmTin(e.target.value.toUpperCase())} placeholder="Customer PIN" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <div className="flex items-center gap-2 sm:flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter results" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Button onClick={fetchCustomer} disabled={loading} className="sm:w-40">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer PIN</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.tin}>
                    <TableCell className="font-mono text-xs">{c.tin}</TableCell>
                    <TableCell className="text-sm">{c.taxprNm}</TableCell>
                    <TableCell className="text-xs">{c.taxprSttsCd}</TableCell>
                    <TableCell className="text-xs">{c.prvncNm}</TableCell>
                    <TableCell className="text-xs">{c.dstrtNm}</TableCell>
                    <TableCell className="text-xs">{c.sctrNm}</TableCell>
                    <TableCell className="text-xs">{c.locDesc}</TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}



