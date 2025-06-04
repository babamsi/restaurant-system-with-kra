"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, History, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KanbanBoard } from "./kanban-board"
import { useOrdersStore } from "@/stores/orders-store"
import type { OrderStatus } from "@/types/order"

export function ZustandOrdersDashboard() {
  const { orders, updateOrderStatus } = useOrdersStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus)
  }

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName || ""
    const tableNumber = order.tableNumber || ""

    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items &&
        order.items.some((item) => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getOrderStats = () => {
    const incoming = orders.filter((o) => o.status === "incoming").length
    const processing = orders.filter((o) => o.status === "processing").length
    const completed = orders.filter((o) => o.status === "completed").length
    const total = orders.length

    return { incoming, processing, completed, total }
  }

  const stats = getOrderStats()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage all incoming orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Order History
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incoming</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.incoming}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
              >
                New
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.processing}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                Done
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by customer, table, or item..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: OrderStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="processing">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <KanbanBoard orders={filteredOrders} onStatusChange={handleStatusChange} />
    </div>
  )
}
