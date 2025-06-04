"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function SalesBreakdown() {
  const data = [
    { name: "Main Dishes", value: 55 },
    { name: "Side Dishes", value: 25 },
    { name: "Drinks", value: 20 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            main: {
              label: "Main Dishes",
              color: "hsl(var(--chart-1))",
            },
            sides: {
              label: "Side Dishes",
              color: "hsl(var(--chart-2))",
            },
            drinks: {
              label: "Drinks",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                <Cell key="cell-0" fill="var(--color-main)" />
                <Cell key="cell-1" fill="var(--color-sides)" />
                <Cell key="cell-2" fill="var(--color-drinks)" />
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
