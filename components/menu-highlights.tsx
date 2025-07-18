'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MenuHighlightsProps {
  date?: string;
}

export function MenuHighlights({ date }: MenuHighlightsProps) {
  const [popularDishes, setPopularDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      // Use selected date or today
      const day = date ? new Date(date) : new Date();
      day.setHours(0,0,0,0);
      const dayISO = day.toISOString();
      const nextDayISO = new Date(day.getTime() + 24*60*60*1000).toISOString();
      // Get all completed orders for the date
      const { data: orders } = await supabase
        .from('table_orders')
        .select('id')
        .gte('created_at', dayISO)
        .lt('created_at', nextDayISO)
        .eq('status', 'completed');
      const orderIds = (orders || []).map((o: any) => o.id);
      if (orderIds.length === 0) {
        setPopularDishes([]);
        setLoading(false);
        return;
      }
      // Get all items for these orders
      const { data: items } = await supabase
        .from('table_order_items')
        .select('menu_item_name, quantity')
        .in('order_id', orderIds);
      // Group by menu_item_name
      const dishMap: Record<string, number> = {};
      (items || []).forEach((item: any) => {
        if (!dishMap[item.menu_item_name]) dishMap[item.menu_item_name] = 0;
        dishMap[item.menu_item_name] += item.quantity || 0;
      });
      const sorted = Object.entries(dishMap)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 4);
      setPopularDishes(sorted);
      setLoading(false);
    };
    fetchPopular();
  }, [date]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Highlights</CardTitle>
        <p className="text-sm text-muted-foreground">Most popular dishes for the selected day</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 text-center text-muted-foreground">Loading...</div>
        ) : popularDishes.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">No sales for this day</div>
        ) : (
          <div className="space-y-4">
            {popularDishes.map((dish) => (
              <div key={dish.name} className="flex justify-between items-center">
                <span className="font-medium">{dish.name}</span>
                <span className="text-sm text-muted-foreground">{dish.sold} sold</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
