"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Transaction {
  id: string
  date: string
  time: string
  customer: string
  items: number
  total: number
  paymentMethod: string
  status: "Completed" | "Refunded" | "Partial Refund"
}

export function POSHistory() {
  const [transactions] = useState<Transaction[]>([
    {
      id: "TRX-001",
      date: "Today",
      time: "10:45 AM",
      customer: "Table 5",
      items: 3,
      total: 24.97,
      paymentMethod: "Card",
      status: "Completed",
    },
    {
      id: "TRX-002",
      date: "Today",
      time: "09:30 AM",
      customer: "Takeaway",
      items: 2,
      total: 16.98,
      paymentMethod: "eDahab",
      status: "Completed",
    },
    {
      id: "TRX-003",
      date: "Yesterday",
      time: "03:15 PM",
      customer: "Table 2",
      items: 4,
      total: 32.46,
      paymentMethod: "Cash",
      status: "Completed",
    },
    {
      id: "TRX-004",
      date: "Yesterday",
      time: "01:20 PM",
      customer: "Takeaway",
      items: 1,
      total: 8.99,
      paymentMethod: "WAAFI",
      status: "Refunded",
    },
    {
      id: "TRX-005",
      date: "2 days ago",
      time: "11:45 AM",
      customer: "Table 8",
      items: 5,
      total: 42.95,
      paymentMethod: "Mpesa",
      status: "Partial Refund",
    },
    {
      id: "TRX-006",
      date: "2 days ago",
      time: "10:30 AM",
      customer: "Table 3",
      items: 3,
      total: 28.47,
      paymentMethod: "Card",
      status: "Completed",
    },
    {
      id: "TRX-007",
      date: "3 days ago",
      time: "02:15 PM",
      customer: "Takeaway",
      items: 2,
      total: 15.98,
      paymentMethod: "Cash",
      status: "Completed",
    },
    {
      id: "TRX-008",
      date: "3 days ago",
      time: "12:45 PM",
      customer: "Table 6",
      items: 4,
      total: 36.96,
      paymentMethod: "eDahab",
      status: "Completed",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Completed</Badge>
      case "Refunded":
        return <Badge variant="destructive">Refunded</Badge>
      case "Partial Refund":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Partial Refund
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search transactions..." className="pl-8 w-full" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{transaction.date}</span>
                      <span className="text-xs text-muted-foreground">{transaction.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell>{transaction.items}</TableCell>
                  <TableCell>${transaction.total.toFixed(2)}</TableCell>
                  <TableCell>{transaction.paymentMethod}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
