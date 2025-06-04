"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function InventoryUsage() {
  const data = [
    { name: "Tomatoes", used: 25, restocked: 30 },
    { name: "Onions", used: 18, restocked: 20 },
    { name: "Chicken", used: 15, restocked: 15 },
    { name: "Rice", used: 20, restocked: 25 },
    { name: "Peppers", used: 12, restocked: 15 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Usage vs. Restocking</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            used: {
              label: "Used",
              color: "hsl(var(--chart-1))",
            },
            restocked: {
              label: "Restocked",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="used" fill="var(--color-used)" />
              <Bar dataKey="restocked" fill="var(--color-restocked)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
