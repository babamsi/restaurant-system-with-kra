"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function CustomerAnalytics() {
  const data = [
    { time: "8 AM", customers: 5, avgSpend: 6.5 },
    { time: "9 AM", customers: 10, avgSpend: 7.2 },
    { time: "10 AM", customers: 15, avgSpend: 8.5 },
    { time: "11 AM", customers: 25, avgSpend: 9.8 },
    { time: "12 PM", customers: 40, avgSpend: 12.5 },
    { time: "1 PM", customers: 45, avgSpend: 12.8 },
    { time: "2 PM", customers: 30, avgSpend: 10.2 },
    { time: "3 PM", customers: 20, avgSpend: 8.5 },
    { time: "4 PM", customers: 15, avgSpend: 7.8 },
    { time: "5 PM", customers: 25, avgSpend: 9.5 },
    { time: "6 PM", customers: 35, avgSpend: 11.2 },
    { time: "7 PM", customers: 30, avgSpend: 10.8 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Traffic & Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            customers: {
              label: "Customer Count",
              color: "hsl(var(--chart-1))",
            },
            avgSpend: {
              label: "Avg. Spend ($)",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="customers"
                stroke="var(--color-customers)"
                activeDot={{ r: 8 }}
              />
              <Line yAxisId="right" type="monotone" dataKey="avgSpend" stroke="var(--color-avgSpend)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
