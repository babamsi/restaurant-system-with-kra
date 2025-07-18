'use client'

import { useState } from 'react';
import { PageHeader } from "@/components/page-header"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { QuickAccess } from "@/components/quick-access"
import { MenuHighlights } from "@/components/menu-highlights"
import { InventoryAlerts } from "@/components/inventory-alerts"
import ProtectedRoute from '@/components/ui/ProtectedRoute';

export default function Dashboard() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  });
  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <PageHeader title="Welcome back, Chef Johnson" description="Here's an overview of your cafeteria today" />
        <DashboardMetrics date={date} setDate={setDate} />
        <h2 className="text-xl font-semibold tracking-tight pt-2">Quick Access</h2>
        <QuickAccess />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MenuHighlights date={date} />
          <InventoryAlerts />
        </div>
      </div>
    </ProtectedRoute>
  );
}
