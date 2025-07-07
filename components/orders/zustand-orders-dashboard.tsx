"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, History, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KanbanBoard } from "./kanban-board"
import { useOrdersStore } from "@/stores/orders-store"
import type { OrderStatus } from "@/types/order"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function ZustandOrdersDashboard() {
  const { orders, updateOrderStatus, addOrder, updateOrder, deleteOrder, clearOrders } = useOrdersStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionClosing, setSessionClosing] = useState(false)

  // On mount, always check DB for open session, sync localStorage
  useEffect(() => {
    const checkSession = async () => {
      setSessionLoading(true)
      setSessionError(null)
      // Always check DB for open session
      const { data, error } = await supabase.from('sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).single()
      if (data && !error) {
        setSessionId(data.id)
        localStorage.setItem('current_session_id', data.id)
        setSessionLoading(false)
      } else {
        setSessionId(null)
        localStorage.removeItem('current_session_id')
        setShowSessionDialog(true)
        setSessionLoading(false)
      }
    }
    checkSession()
  }, [])

  // Open new session
  const handleOpenSession = async () => {
    setSessionLoading(true)
    setSessionError(null)
    // Check again for open session before creating
    const { data: openSession, error: openError } = await supabase.from('sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).single()
    if (openSession && !openError) {
      setSessionId(openSession.id)
      localStorage.setItem('current_session_id', openSession.id)
      setShowSessionDialog(false)
      setSessionLoading(false)
      return
    }
    // No open session, create one
    const { data, error } = await supabase.from('sessions').insert({ opened_by: 'ORDERS' }).select().single()
    if (data && !error) {
      setSessionId(data.id)
      localStorage.setItem('current_session_id', data.id)
      setShowSessionDialog(false)
    } else {
      setSessionError('Failed to open session')
    }
    setSessionLoading(false)
  }

  // Close session
  const handleCloseSession = async () => {
    if (!sessionId) return
    setSessionClosing(true)
    // Check for any pending/processing orders in this session
    const { data: openOrders, error: openOrdersError } = await supabase
      .from('table_orders')
      .select('id, status')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'preparing', 'ready'])
    if (openOrdersError) {
      setSessionError('Failed to check open orders')
      toast({ title: 'Error', description: 'Failed to check open orders', variant: 'destructive' })
      setSessionClosing(false)
      return
    }
    if (openOrders && openOrders.length > 0) {
      setSessionError('Cannot close day: There are still orders in progress or unpaid. Please complete or pay all orders before closing the day.')
      toast({ title: 'Cannot Close Day', description: 'There are still orders in progress or unpaid. Please complete or pay all orders before closing the day.', variant: 'destructive' })
      setSessionClosing(false)
      return
    }
    const { error } = await supabase.from('sessions').update({ closed_at: new Date().toISOString(), closed_by: 'ORDERS' }).eq('id', sessionId)
    if (!error) {
      setSessionId(null)
      localStorage.removeItem('current_session_id')
      setShowSessionDialog(true)
    } else {
      setSessionError('Failed to close session')
      toast({ title: 'Error', description: 'Failed to close session', variant: 'destructive' })
    }
    setSessionClosing(false)
  }

  // Replace orders in Zustand store, deduplicated
  const setOrders = (ordersArr: any[]) => {
    clearOrders && clearOrders()
    // Only add unique orders by ID
    const seen = new Set()
    ordersArr.forEach((order) => {
      if (!seen.has(order.id)) {
        addOrder(order)
        seen.add(order.id)
      }
    })
  }

  // Load orders from DB for current session
  const loadOrdersFromDB = async () => {
    if (!sessionId) return
    setLoading(true)
    const { data, error } = await supabase
      .from("table_orders")
      .select(`*, items:table_order_items(*)`)
      .eq('session_id', sessionId)
      .in("status", ["pending", "preparing", "ready", "completed"])
      .order("created_at", { ascending: false })
    if (data) {
      // Map DB orders to Zustand store format
      const mapped = data.map((order: any) => ({
        id: order.id,
        tableNumber: order.table_number,
        customerName: order.customer_name || "Customer",
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: item.menu_item_name,
          quantity: item.quantity,
          portionSize: item.portion_size,
          price: item.unit_price,
          customization: item.customization_notes,
        })),
        status: order.status === "pending" ? "incoming" : order.status === "preparing" ? "processing" : order.status,
        total: order.total_amount,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at || order.created_at),
        specialInstructions: order.special_instructions,
      }))
      setOrders(mapped)
    }
    setLoading(false)
  }

  // Subscribe to realtime changes for current session
  useEffect(() => {
    if (!sessionId) return
    loadOrdersFromDB()
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_orders', filter: `session_id=eq.${sessionId}` }, (payload) => {
        console.log('Supabase realtime event:', payload)
        loadOrdersFromDB()
      })
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Update in DB
    let dbStatus = newStatus === "incoming" ? "pending" : newStatus === "processing" ? "preparing" : newStatus
    await supabase.from("table_orders").update({ status: dbStatus }).eq("id", orderId)
    updateOrderStatus(orderId, newStatus)
    loadOrdersFromDB()
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
          <Button variant="destructive" size="sm" onClick={handleCloseSession} disabled={sessionClosing || !sessionId} className="ml-2">
            {sessionClosing ? 'Closing...' : 'Close Day'}
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
      {loading ? (
        <div className="flex justify-center items-center h-64"><span className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></span></div>
      ) : (
        <KanbanBoard orders={filteredOrders} onStatusChange={handleStatusChange} />
      )}

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sessionId ? 'Session Closed' : 'Open Day'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {sessionId ? (
              <>
                <p className="mb-2">The day is now closed. Please open a new session to start tracking orders.</p>
                <Button onClick={handleOpenSession} disabled={sessionLoading}>Open New Day</Button>
              </>
            ) : (
              <>
                <p className="mb-2">Start a new day to begin tracking orders.</p>
                <Button onClick={handleOpenSession} disabled={sessionLoading}>Open Day</Button>
              </>
            )}
            {sessionError && <div className="text-destructive mt-2">{sessionError}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
