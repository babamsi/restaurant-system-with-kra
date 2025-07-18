
'use client'
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Users, Package, AlertTriangle, ChefHat, ClipboardList, Clock, ActivitySquare } from "lucide-react"
import { useUserSession } from '@/context/UserSessionContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { inventoryService } from '@/lib/inventory-service';

interface DashboardMetricsProps {
  date: string;
  setDate: (date: string) => void;
}

export function DashboardMetrics({ date, setDate }: DashboardMetricsProps) {
  const { user } = useUserSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchData = async () => {
      const day = new Date(date);
      day.setHours(0,0,0,0);
      const dayISO = day.toISOString();
      // Revenue & Meals
      let salesQuery = supabase
        .from('sales_invoices')
        .select('gross_amount, created_at, user_id')
        .gte('created_at', dayISO)
        .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString())
        .eq('kra_status', 'ok');
      if (user.role === 'staff') {
        salesQuery = salesQuery.eq('user_id', user.id);
      }
      const { data: sales } = await salesQuery;
      const revenue = sales?.reduce((sum, s) => sum + (s.gross_amount || 0), 0) || 0;
      const mealsServed = sales?.length || 0;
      // Low Stock & Out of Stock (use inventoryService for consistency)
      const lowStockRes = await inventoryService.getLowStockItems();
      const outOfStockRes = await inventoryService.getOutOfStockItems();
      const lowStock = lowStockRes.success ? lowStockRes.data : [];
      const outOfStock = outOfStockRes.success ? outOfStockRes.data : [];
      // Staff Performance (for owner/manager)
      let staffPerf: { name: string, total: number, count: number }[] = [];
      if (user.role === 'owner' || user.role === 'manager') {
        const { data: staffSales } = await supabase
          .from('sales_invoices')
          .select('user_id, gross_amount')
          .gte('created_at', dayISO)
          .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString())
          .eq('kra_status', 'ok');
        const { data: users } = await supabase.from('users').select('id, name');
        const perfMap: Record<string, { name: string, total: number, count: number }> = {};
        staffSales?.forEach(s => {
          if (!perfMap[s.user_id]) {
            const u = users?.find(u => u.id === s.user_id);
            perfMap[s.user_id] = { name: u?.name || 'Unknown', total: 0, count: 0 };
          }
          perfMap[s.user_id].total += s.gross_amount || 0;
          perfMap[s.user_id].count += 1;
        });
        staffPerf = Object.values(perfMap).sort((a, b) => b.total - a.total);
      }
      // Failed KRA pushes (for owner/manager)
      let failedKRA: any[] = [];
      if (user.role === 'owner' || user.role === 'manager') {
        const { data: failed } = await supabase
          .from('sales_invoices')
          .select('id, order_id, gross_amount, kra_error, created_at')
          .eq('kra_status', 'error')
          .gte('created_at', dayISO)
          .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString());
        failedKRA = failed || [];
      }
      // Kitchen: Orders to prepare, completed, urgent
      let kitchenOrders: any[] = [];
      let kitchenCompleted: number = 0;
      let kitchenUrgent: number = 0;
      if (user.role === 'kitchen' || user.role === 'owner' || user.role === 'manager') {
        const { data: orders } = await supabase
          .from('table_orders')
          .select('id, status, created_at, updated_at')
          .gte('created_at', dayISO)
          .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString());
        kitchenOrders = (orders || []).filter((o: any) => o.status === 'preparing');
        kitchenCompleted = (orders || []).filter((o: any) => o.status === 'completed').length;
        // Urgent: preparing for > 30min
        const now = Date.now();
        kitchenUrgent = kitchenOrders.filter((o: any) => now - new Date(o.created_at).getTime() > 30*60*1000).length;
      }
      // Staff: their own orders
      let staffOrders: any[] = [];
      let staffCompleted: number = 0;
      if (user.role === 'staff') {
        const { data: orders } = await supabase
          .from('table_orders')
          .select('id, status, created_at, updated_at, staff_id')
          .gte('created_at', dayISO)
          .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString())
          .eq('staff_id', user.id);
        staffOrders = (orders || []).filter((o: any) => o.status !== 'completed');
        staffCompleted = (orders || []).filter((o: any) => o.status === 'completed').length;
      }
      // All: total orders today
      const { data: allOrders } = await supabase
        .from('table_orders')
        .select('id, status, created_at')
        .gte('created_at', dayISO)
        .lt('created_at', new Date(day.getTime() + 24*60*60*1000).toISOString());
      const totalOrders = allOrders?.length || 0;
      // Recent system activity (last 5 actions)
      const { data: recentLogs } = await supabase
        .from('system_logs')
        .select('id, user_name, action, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      setMetrics({ revenue, mealsServed, lowStock, outOfStock, staffPerf, failedKRA, kitchenOrders, kitchenCompleted, kitchenUrgent, staffOrders, staffCompleted, totalOrders, recentLogs });
      setLoading(false);
    };
    fetchData();
  }, [user, date]);

  if (loading || !user) {
    return <div className="h-32 flex items-center justify-center">Loading metrics...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-2">
        <div className="font-semibold text-lg">Dashboard Metrics</div>
        <input
          type="date"
          className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={date}
          max={new Date().toISOString().slice(0,10)}
          onChange={e => setDate(e.target.value)}
        />
      </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Revenue */}
      <Card className="overflow-hidden border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Today's Revenue</div>
              <div className="text-3xl font-bold tracking-tight">Ksh {metrics.revenue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/20">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Meals Served */}
      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Meals Served</div>
              <div className="text-3xl font-bold tracking-tight">{metrics.mealsServed}</div>
            </div>
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Low Stock (now Out of Stock only, no names) */}
      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Out of Stock Items</div>
              <div className="text-3xl font-bold tracking-tight">{metrics.outOfStock.length}</div>
              <div className="text-xs text-muted-foreground mt-2">Number of ingredients currently out of stock.</div>
            </div>
            <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Staff Performance (owner/manager) */}
      {(user.role === 'owner' || user.role === 'manager') && (
        <Card className="overflow-hidden border-l-4 border-l-purple-500 col-span-1 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Staff Performance</div>
            <ul className="text-sm mt-2 space-y-1 max-h-32 overflow-y-auto">
              {metrics.staffPerf.length === 0 && <li className="text-muted-foreground">No sales yet today</li>}
              {metrics.staffPerf.map((s: any) => (
                <li key={s.name} className="flex justify-between"><span>{s.name}</span><span>Ksh {s.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({s.count})</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {/* Failed KRA Pushes (owner/manager) */}
      {(user.role === 'owner' || user.role === 'manager') && (
        <Card className="overflow-hidden border-l-4 border-l-red-500 col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Failed KRA Pushes</div>
                <div className="text-3xl font-bold tracking-tight">{metrics.failedKRA.length}</div>
                {metrics.failedKRA.length > 0 && (
                  <ul className="text-xs text-red-500 mt-2 space-y-1 max-h-16 overflow-y-auto">
                    {metrics.failedKRA.slice(0, 4).map((item: any) => (
                      <li key={item.id}>Order {item.order_id?.slice(-6)}: {item.kra_error?.slice(0, 30)}...</li>
                    ))}
                    {metrics.failedKRA.length > 4 && <li>+{metrics.failedKRA.length - 4} more...</li>}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Kitchen Orders (kitchen/manager/owner) */}
      {(user.role === 'kitchen' || user.role === 'owner' || user.role === 'manager') && (
        <Card className="overflow-hidden border-l-4 border-l-cyan-500 col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start gap-2">
              <ChefHat className="h-5 w-5 text-cyan-500 mt-1" />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Orders to Prepare</div>
                <div className="text-3xl font-bold tracking-tight">{metrics.kitchenOrders.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Completed today: {metrics.kitchenCompleted}</div>
                <div className="text-xs text-red-500 mt-1">Urgent: {metrics.kitchenUrgent}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Staff Orders (staff) */}
      {user.role === 'staff' && (
        <Card className="overflow-hidden border-l-4 border-l-pink-500 col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start gap-2">
              <ClipboardList className="h-5 w-5 text-pink-500 mt-1" />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Your Active Orders</div>
                <div className="text-3xl font-bold tracking-tight">{metrics.staffOrders.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Completed today: {metrics.staffCompleted}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Total Orders (all) */}
      <Card className="overflow-hidden border-l-4 border-l-gray-500 col-span-1">
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-gray-500 mt-1" />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Orders Today</div>
              <div className="text-3xl font-bold tracking-tight">{metrics.totalOrders}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity (all) */}
      <Card className="overflow-hidden border-l-4 border-l-indigo-500 col-span-1 sm:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <ActivitySquare className="h-5 w-5 text-indigo-500 mt-1" />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Recent Activity</div>
              <ul className="text-xs mt-2 space-y-1 max-h-24 overflow-y-auto">
                {metrics.recentLogs?.length === 0 && <li className="text-muted-foreground">No recent activity</li>}
                {metrics.recentLogs?.map((log: any) => (
                  <li key={log.id}><span className="font-semibold">{log.user_name}</span> {log.action} {log.entity_type} {log.entity_id && <span className="text-muted-foreground">[{log.entity_id}]</span>} <span className="text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
