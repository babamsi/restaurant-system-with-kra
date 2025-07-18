'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from 'react';
import { inventoryService } from '@/lib/inventory-service';

export function InventoryAlerts() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [outOfStock, setOutOfStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      const lowRes = await inventoryService.getLowStockItems();
      const outRes = await inventoryService.getOutOfStockItems();
      setLowStock(lowRes.success ? lowRes.data : []);
      setOutOfStock(outRes.success ? outRes.data : []);
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">Items that need attention</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 text-center text-muted-foreground">Loading...</div>
        ) : lowStock.length === 0 && outOfStock.length === 0 ? (
          <div className="py-6 text-center text-green-600">All inventory levels are healthy!</div>
        ) : (
          <div className="space-y-4">
            {lowStock.length > 0 && (
              <div>
                <div className="font-semibold text-amber-600 mb-1">Low Stock ({lowStock.length})</div>
                {lowStock.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500">{item.current_stock} left</Badge>
                  </div>
                ))}
                {lowStock.length > 3 && (
                  <div className="text-xs text-amber-600 mt-1">+{lowStock.length - 3} more...</div>
                )}
              </div>
            )}
            {outOfStock.length > 0 && (
              <div>
                <div className="font-semibold text-destructive mb-1">Out of Stock ({outOfStock.length})</div>
                {outOfStock.slice(0, 2).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive"></span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="destructive">Out</Badge>
                  </div>
                ))}
                {outOfStock.length > 2 && (
                  <div className="text-xs text-destructive mt-1">+{outOfStock.length - 2} more...</div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
