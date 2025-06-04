"use client"

import { useState } from "react"
import { InventoryActions } from "@/components/inventory/inventory-actions"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { InventoryHistory } from "@/components/inventory/inventory-history"
import { InventoryCategories } from "@/components/inventory/inventory-categories"

interface InventoryDashboardProps {
  filterByStock?: "all" | "low" | "out"
  groupByCategory?: boolean
  showHistory?: boolean
}

export function InventoryDashboard({
  filterByStock = "all",
  groupByCategory = false,
  showHistory = false,
}: InventoryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      <InventoryStats />
      <InventoryActions onSearch={setSearchTerm} />

      {showHistory ? (
        <InventoryHistory />
      ) : groupByCategory ? (
        <InventoryCategories />
      ) : (
        <InventoryTable searchTerm={searchTerm} stockFilter={filterByStock} />
      )}
    </div>
  )
}
