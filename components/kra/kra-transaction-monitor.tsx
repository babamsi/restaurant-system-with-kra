"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { kraTransactionService, type KRATransaction } from "@/lib/kra-transaction-service"
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

interface KRATransactionMonitorProps {
  className?: string
}

export function KRATransactionMonitor({ className }: KRATransactionMonitorProps) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<KRATransaction[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>("all")

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const [transactionsResult, statsResult] = await Promise.all([
        kraTransactionService.getRecent(20),
        kraTransactionService.getStatistics()
      ])

      if (transactionsResult.error) {
        toast({
          title: "Error Loading Transactions",
          description: transactionsResult.error,
          variant: "destructive",
        })
      } else {
        setTransactions(transactionsResult.data || [])
      }

      if (statsResult.error) {
        console.error("Failed to load statistics:", statsResult.error)
      } else {
        setStatistics(statsResult.data)
      }
    } catch (error) {
      console.error("Error loading KRA transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load KRA transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'retry':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      pending: "secondary",
      retry: "outline"
    }

    return (
      <Badge variant={variants[status] || "outline"}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0)
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true
    return transaction.status === filter
  })

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>KRA Transaction Monitor</span>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="retry">Retry</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTransactions}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.total}</div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statistics.byStatus.failed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statistics.byStatus.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {loading ? "Loading..." : "No transactions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.transaction_type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status || 'pending')}
                      </TableCell>
                      <TableCell>
                        {formatAmount(transaction.total_amount || 0)}
                      </TableCell>
                      <TableCell>
                        {transaction.created_at ? formatDate(transaction.created_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.kra_result_code && (
                            <div className="font-mono text-xs">
                              {transaction.kra_result_code}
                            </div>
                          )}
                          {transaction.kra_result_message && (
                            <div className="text-muted-foreground truncate max-w-32">
                              {transaction.kra_result_message}
                            </div>
                          )}
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
    </div>
  )
} 