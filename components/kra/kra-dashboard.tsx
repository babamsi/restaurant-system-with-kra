"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { kraService } from "@/lib/kra-service"
import { kraApiClient } from "@/lib/kra-api-client"
import { supabase } from "@/lib/supabase"
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  Truck, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Settings,
  BarChart3,
  Loader2
} from "lucide-react"

interface KRAStats {
  totalItems: number
  registeredItems: number
  pendingItems: number
  totalSales: number
  transmittedSales: number
  pendingSales: number
  totalPurchases: number
  transmittedPurchases: number
  pendingPurchases: number
  lastSync: string
}

export function KRADashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<KRAStats>({
    totalItems: 0,
    registeredItems: 0,
    pendingItems: 0,
    totalSales: 0,
    transmittedSales: 0,
    pendingSales: 0,
    totalPurchases: 0,
    transmittedPurchases: 0,
    pendingPurchases: 0,
    lastSync: 'Never'
  })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [notices, setNotices] = useState<any[]>([])

  // Load KRA statistics
  const loadKRAStats = async () => {
    setLoading(true)
    try {
      // Get items statistics
      const { data: ingredients } = await supabase.from('ingredients').select('itemCd, itemClsCd')
      const { data: sales } = await supabase.from('sales_invoices').select('kra_status')
      const { data: purchases } = await supabase.from('supplier_orders').select('kra_status')
      
      const totalItems = ingredients?.length || 0
      const registeredItems = ingredients?.filter(i => i.itemCd && i.itemClsCd).length || 0
      const pendingItems = totalItems - registeredItems
      
      const totalSales = sales?.length || 0
      const transmittedSales = sales?.filter(s => s.kra_status === 'ok').length || 0
      const pendingSales = totalSales - transmittedSales
      
      const totalPurchases = purchases?.length || 0
      const transmittedPurchases = purchases?.filter(p => p.kra_status === 'ok').length || 0
      const pendingPurchases = totalPurchases - transmittedPurchases
      
      setStats({
        totalItems,
        registeredItems,
        pendingItems,
        totalSales,
        transmittedSales,
        pendingSales,
        totalPurchases,
        transmittedPurchases,
        pendingPurchases,
        lastSync: new Date().toLocaleString()
      })
    } catch (error) {
      console.error('Error loading KRA stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load KRA notices
  const loadKRANotices = async () => {
    try {
      const result = await kraService.getKRANotices()
      if (result.success && result.notices) {
        setNotices(result.notices)
      }
    } catch (error) {
      console.error('Error loading KRA notices:', error)
    }
  }

  // Sync all items with KRA
  const syncAllItems = async () => {
    setSyncing(true)
    try {
      const result = await kraService.syncAllItemsWithKRA()
      if (result.success) {
        toast({
          title: "Items Synced Successfully",
          description: `${result.synced} items synchronized with KRA. ${result.errors.length} errors.`,
          variant: result.errors.length > 0 ? "warning" : "default"
        })
        if (result.errors.length > 0) {
          console.error('KRA sync errors:', result.errors)
        }
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to sync items with KRA",
          variant: "destructive"
        })
      }
      await loadKRAStats()
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message || "An error occurred during sync",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  // Retry failed transmissions
  const retryFailedTransmissions = async () => {
    setSyncing(true)
    try {
      // Retry failed sales
      const { data: failedSales } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('kra_status', 'error')
      
      let retriedSales = 0
      for (const sale of failedSales || []) {
        const { data: order } = await supabase
          .from('table_orders')
          .select('*, items:table_order_items(*)')
          .eq('id', sale.order_id)
          .single()
        
        if (order) {
          const result = await kraService.sendSalesToKRA(order)
          if (result.success) {
            await supabase
              .from('sales_invoices')
              .update({ kra_status: 'ok', kra_error: null })
              .eq('id', sale.id)
            retriedSales++
          }
        }
      }

      // Retry failed purchases
      const { data: failedPurchases } = await supabase
        .from('supplier_orders')
        .select('*')
        .eq('kra_status', 'error')
      
      let retriedPurchases = 0
      for (const purchase of failedPurchases || []) {
        const result = await kraService.sendPurchaseToKRA(purchase)
        if (result.success) {
          await supabase
            .from('supplier_orders')
            .update({ kra_status: 'ok', kra_error: null })
            .eq('id', purchase.id)
          retriedPurchases++
        }
      }

      toast({
        title: "Retry Complete",
        description: `Retried ${retriedSales} sales and ${retriedPurchases} purchases`,
        variant: "default"
      })
      
      await loadKRAStats()
    } catch (error: any) {
      toast({
        title: "Retry Error",
        description: error.message || "An error occurred during retry",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  // Test KRA connection
  const testKRAConnection = async () => {
    setSyncing(true)
    try {
      const result = await kraApiClient.getNotices()
      if (result.success) {
        toast({
          title: "KRA Connection Successful",
          description: "Successfully connected to KRA API",
          variant: "default"
        })
      } else {
        toast({
          title: "KRA Connection Failed",
          description: result.error || "Failed to connect to KRA API",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to test KRA connection",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadKRAStats()
    loadKRANotices()
  }, [])

  const itemCompliance = stats.totalItems > 0 ? (stats.registeredItems / stats.totalItems) * 100 : 0
  const salesCompliance = stats.totalSales > 0 ? (stats.transmittedSales / stats.totalSales) * 100 : 0
  const purchaseCompliance = stats.totalPurchases > 0 ? (stats.transmittedPurchases / stats.totalPurchases) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KRA eTIMS Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage KRA compliance for your restaurant
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testKRAConnection}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
          <Button
            variant="outline"
            onClick={retryFailedTransmissions}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Retry Failed
          </Button>
          <Button
            onClick={syncAllItems}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
            Sync All Items
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Compliance</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredItems}/{stats.totalItems}</div>
            <Progress value={itemCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingItems} items pending registration
            </p>
            <Badge variant={itemCompliance === 100 ? "default" : "secondary"} className="mt-2">
              {itemCompliance.toFixed(1)}% Compliant
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Compliance</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transmittedSales}/{stats.totalSales}</div>
            <Progress value={salesCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingSales} sales pending transmission
            </p>
            <Badge variant={salesCompliance === 100 ? "default" : "secondary"} className="mt-2">
              {salesCompliance.toFixed(1)}% Compliant
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Compliance</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transmittedPurchases}/{stats.totalPurchases}</div>
            <Progress value={purchaseCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingPurchases} purchases pending transmission
            </p>
            <Badge variant={purchaseCompliance === 100 ? "default" : "secondary"} className="mt-2">
              {purchaseCompliance.toFixed(1)}% Compliant
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              KRA Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Items</span>
              <Badge variant="outline">{stats.totalItems}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Registered Items</span>
              <Badge variant="default">{stats.registeredItems}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Pending Items</span>
              <Badge variant="secondary">{stats.pendingItems}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Sales</span>
              <Badge variant="outline">{stats.totalSales}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Transmitted Sales</span>
              <Badge variant="default">{stats.transmittedSales}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Pending Sales</span>
              <Badge variant="secondary">{stats.pendingSales}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Purchases</span>
              <Badge variant="outline">{stats.totalPurchases}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Transmitted Purchases</span>
              <Badge variant="default">{stats.transmittedPurchases}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Pending Purchases</span>
              <Badge variant="secondary">{stats.pendingPurchases}</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-sm">{stats.lastSync}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              KRA Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notices.length > 0 ? (
              <div className="space-y-2">
                {notices.slice(0, 5).map((notice, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{notice.title || 'Notice'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notice.message || notice.description || 'No description available'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No KRA notices available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => loadKRAStats()}
              disabled={loading}
              className="h-20 flex flex-col gap-2"
            >
              <RefreshCw className="h-6 w-6" />
              <span>Refresh Stats</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => loadKRANotices()}
              className="h-20 flex flex-col gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>Load Notices</span>
            </Button>
            <Button
              variant="outline"
              onClick={syncAllItems}
              disabled={syncing}
              className="h-20 flex flex-col gap-2"
            >
              <Database className="h-6 w-6" />
              <span>Sync Items</span>
            </Button>
            <Button
              variant="outline"
              onClick={retryFailedTransmissions}
              disabled={syncing}
              className="h-20 flex flex-col gap-2"
            >
              <RefreshCw className="h-6 w-6" />
              <span>Retry Failed</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 