"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react"

export function InventoryHistory() {
  const [history] = useState([
    {
      id: 1,
      date: "Today, 10:45 AM",
      item: "Fresh Tomatoes",
      action: "Stock Adjustment",
      quantity: -5,
      unit: "kg",
      user: "Chef Johnson",
    },
    {
      id: 2,
      date: "Today, 9:30 AM",
      item: "Onions",
      action: "Stock Adjustment",
      quantity: -2,
      unit: "kg",
      user: "Chef Johnson",
    },
    {
      id: 3,
      date: "Today, 8:15 AM",
      item: "Milk",
      action: "Stock Received",
      quantity: 12,
      unit: "liters",
      user: "Store Manager",
    },
    {
      id: 4,
      date: "Yesterday, 4:20 PM",
      item: "Chicken Breast",
      action: "Stock Adjustment",
      quantity: -3,
      unit: "kg",
      user: "Chef Johnson",
    },
    {
      id: 5,
      date: "Yesterday, 2:45 PM",
      item: "Bell Peppers",
      action: "Stock Adjustment",
      quantity: -1,
      unit: "kg",
      user: "Chef Johnson",
    },
    {
      id: 6,
      date: "Yesterday, 10:30 AM",
      item: "Potatoes",
      action: "Stock Received",
      quantity: 25,
      unit: "kg",
      user: "Store Manager",
    },
    {
      id: 7,
      date: "2 days ago, 3:15 PM",
      item: "Olive Oil",
      action: "Stock Adjustment",
      quantity: -1,
      unit: "bottle",
      user: "Chef Johnson",
    },
    {
      id: 8,
      date: "2 days ago, 11:00 AM",
      item: "Beef",
      action: "Stock Received",
      quantity: 7,
      unit: "kg",
      user: "Store Manager",
    },
  ])

  // Get action icon
  const getActionIcon = (action: string, quantity: number) => {
    if (action === "Stock Received") return <ArrowUp className="h-4 w-4 text-green-500" />
    if (action === "Stock Adjustment" && quantity < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    if (action === "Stock Adjustment" && quantity > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    return <RefreshCw className="h-4 w-4 text-blue-500" />
  }

  // Get quantity class
  const getQuantityClass = (quantity: number) => {
    if (quantity > 0) return "text-green-500"
    if (quantity < 0) return "text-red-500"
    return ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                <TableCell className="font-medium">{entry.item}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getActionIcon(entry.action, entry.quantity)}
                    <span>{entry.action}</span>
                  </div>
                </TableCell>
                <TableCell className={getQuantityClass(entry.quantity)}>
                  {entry.quantity > 0 ? "+" : ""}
                  {entry.quantity} {entry.unit}
                </TableCell>
                <TableCell>{entry.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
