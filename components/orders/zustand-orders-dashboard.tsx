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

  // Function to ensure only one session is open at a time
  const ensureSingleSession = async (): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    try {
      // Check for any open sessions
      const { data: openSessions, error } = await supabase
        .from('sessions')
        .select('id, opened_at, opened_by')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to check sessions: ${error.message}`)
      }
      
      if (openSessions && openSessions.length > 0) {
        // Return the most recent open session
        return { success: true, sessionId: openSessions[0].id }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // On mount, always check DB for open session, sync localStorage with enhanced synchronization
  useEffect(() => {
    const checkSession = async () => {
      setSessionLoading(true)
      setSessionError(null)
      
      try {
        // Use single session enforcement
        const singleSessionCheck = await ensureSingleSession()
        if (!singleSessionCheck.success) {
          throw new Error(singleSessionCheck.error || 'Failed to check sessions')
        }
        
        if (singleSessionCheck.sessionId) {
          setSessionId(singleSessionCheck.sessionId)
          localStorage.setItem('current_session_id', singleSessionCheck.sessionId)
          console.log('Orders: Session loaded from DB:', singleSessionCheck.sessionId)
        } else {
          // No open session in DB, check localStorage for consistency
          const localSessionId = localStorage.getItem('current_session_id')
          if (localSessionId) {
            // Clear stale localStorage
            localStorage.removeItem('current_session_id')
            console.log('Orders: Cleared stale localStorage session')
          }
          setSessionId(null)
          setShowSessionDialog(true)
        }
      } catch (error) {
        console.error('Orders: Error checking session:', error)
        setSessionError('Failed to check session status')
        setSessionId(null)
        localStorage.removeItem('current_session_id')
        setShowSessionDialog(true)
      } finally {
        setSessionLoading(false)
      }
    }
    
    checkSession()
    
    // Set up real-time session monitoring
    const sessionChannel = supabase.channel('orders-session-monitor')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions',
        filter: 'closed_at=is.null'
      }, (payload) => {
        console.log('Orders: Session change detected:', payload)
        if (payload.eventType === 'INSERT') {
          // New session opened
          const newSession = payload.new
          setSessionId(newSession.id)
          localStorage.setItem('current_session_id', newSession.id)
          setShowSessionDialog(false)
          console.log('Orders: New session detected and loaded:', newSession.id)
        } else if (payload.eventType === 'UPDATE' && payload.new.closed_at) {
          // Session was closed
          setSessionId(null)
          localStorage.removeItem('current_session_id')
          setShowSessionDialog(true)
          console.log('Orders: Session closed by another user')
        }
      })
      .subscribe()
    
    return () => {
      sessionChannel.unsubscribe()
    }
  }, [])

  // Enhanced session opening with single session enforcement
  const handleOpenSession = async () => {
    setSessionLoading(true)
    setSessionError(null)
    
    try {
      // First, ensure we have a single session
      const singleSessionCheck = await ensureSingleSession()
      if (!singleSessionCheck.success) {
        throw new Error(singleSessionCheck.error || 'Failed to check sessions')
      }
      
      // If there's already an open session, use it
      if (singleSessionCheck.sessionId) {
        setSessionId(singleSessionCheck.sessionId)
        localStorage.setItem('current_session_id', singleSessionCheck.sessionId)
        setShowSessionDialog(false)
        console.log('Orders: Using existing session:', singleSessionCheck.sessionId)
        return
      }
      
      // No open session exists, create one
      const { error: sessionInsertError } = await supabase
        .from('sessions')
        .insert({ opened_by: 'ORDERS' })
      
      if (sessionInsertError) {
        throw new Error(`Failed to create session: ${sessionInsertError.message}`)
      }
      
      // Fetch the newly created session
      const { data: newSession, error: fetchSessionError } = await supabase
        .from('sessions')
        .select('*')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single()
      
      if (newSession && !fetchSessionError) {
        setSessionId(newSession.id)
        localStorage.setItem('current_session_id', newSession.id)
        setShowSessionDialog(false)
        console.log('Orders: New session created:', newSession.id)
      } else {
        throw new Error('Session created but could not fetch session ID')
      }
    } catch (error: any) {
      console.error('Orders: Error opening session:', error)
      setSessionError(error.message || 'Failed to open session')
    } finally {
      setSessionLoading(false)
    }
  }

  // Enhanced session closing with comprehensive checks
  const handleCloseSession = async () => {
    if (!sessionId) return
    
    setSessionClosing(true)
    setSessionError(null)
    
    try {
      // Check for any unpaid orders in this session (excluding completed orders that are ready for payment)
      const { data: unpaidOrders, error: unpaidOrdersError } = await supabase
        .from('table_orders')
        .select('id, status, table_number')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'preparing', 'ready'])
      
      if (unpaidOrdersError) {
        throw new Error(`Failed to check unpaid orders: ${unpaidOrdersError.message}`)
      }
      
      if (unpaidOrders && unpaidOrders.length > 0) {
        const tableNumbers = unpaidOrders.map(o => o.table_number).join(', ')
        const errorMsg = `Cannot close day: There are still orders in progress on tables ${tableNumbers}. Please complete all orders before closing the day.`
        setSessionError(errorMsg)
        toast({ 
          title: 'Cannot Close Day', 
          description: errorMsg, 
          variant: 'destructive' 
        })
        return
      }
      
      // Close the session
      const { error } = await supabase
        .from('sessions')
        .update({ 
          closed_at: new Date().toISOString(), 
          closed_by: 'ORDERS' 
        })
        .eq('id', sessionId)
      
      if (error) {
        throw new Error(`Failed to close session: ${error.message}`)
      }
      
      setSessionId(null)
      localStorage.removeItem('current_session_id')
      setShowSessionDialog(true)
      console.log('Orders: Session closed successfully')
      
      toast({
        title: 'Day Closed',
        description: 'The day has been closed successfully',
      })
    } catch (error: any) {
      console.error('Orders: Error closing session:', error)
      setSessionError(error.message || 'Failed to close session')
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to close session', 
        variant: 'destructive' 
      })
    } finally {
      setSessionClosing(false)
    }
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

  // Load orders from DB for current session with enhanced error handling
  const loadOrdersFromDB = async () => {
    if (!sessionId) {
      console.log('Orders: No session ID, skipping order load')
      return
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("table_orders")
        .select(`*, items:table_order_items(*)`)
        .eq('session_id', sessionId)
        .in("status", ["pending", "preparing", "ready", "completed"])
        .order("created_at", { ascending: false })
      
      if (error) {
        console.error('Orders: Error loading orders:', error)
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive',
        })
        return
      }
      
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
          status: order.status === "pending" ? "incoming" : 
                 order.status === "preparing" ? "processing" : 
                 order.status === "ready" ? "ready" : 
                 order.status === "completed" ? "completed" : order.status,
          total: order.total_amount,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at || order.created_at),
          specialInstructions: order.special_instructions,
        }))
        setOrders(mapped)
        console.log(`Orders: Loaded ${mapped.length} orders for session ${sessionId}`)
      } else {
        setOrders([])
        console.log('Orders: No orders found for session', sessionId)
      }
    } catch (error) {
      console.error('Orders: Unexpected error loading orders:', error)
      toast({
        title: 'Error',
        description: 'Unexpected error loading orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced real-time subscription with better session handling
  useEffect(() => {
    if (!sessionId) {
      console.log('Orders: No session ID, clearing orders and skipping subscription')
      setOrders([])
      return
    }
    
    console.log('Orders: Setting up real-time subscription for session:', sessionId)
    loadOrdersFromDB()
    
    const channel = supabase.channel(`orders-realtime-${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'table_orders', 
        filter: `session_id=eq.${sessionId}` 
      }, (payload) => {
        console.log('Orders: Realtime event received:', payload)
        // Debounce rapid updates
        setTimeout(() => {
          loadOrdersFromDB()
        }, 100)
      })
      .subscribe((status) => {
        console.log('Orders: Realtime subscription status:', status)
      })
    
    return () => {
      console.log('Orders: Cleaning up real-time subscription for session:', sessionId)
      channel.unsubscribe()
    }
  }, [sessionId])

  // Enhanced status change with better error handling and proper flow
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!sessionId) {
      toast({
        title: 'Error',
        description: 'No active session',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // Map UI status to DB status
      let dbStatus: string
      switch (newStatus) {
        case "incoming":
          dbStatus = "pending"
          break
        case "processing":
          dbStatus = "preparing"
          break
        case "ready":
          dbStatus = "ready"
          break
        case "completed":
          dbStatus = "completed"
          break
        default:
          dbStatus = newStatus
      }
      
      const { error } = await supabase
        .from("table_orders")
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .eq("session_id", sessionId) // Ensure we only update orders in current session
      
      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`)
      }
      
      // Update local state
      updateOrderStatus(orderId, newStatus)
      
      // Reload orders to ensure consistency
      await loadOrdersFromDB()
      
      console.log(`Orders: Updated order ${orderId} status to ${newStatus} (DB: ${dbStatus})`)
    } catch (error: any) {
      console.error('Orders: Error updating order status:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      })
    }
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
