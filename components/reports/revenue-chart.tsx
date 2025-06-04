"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function RevenueChart() {
  const dailyData = [
    { name: "Mon", revenue: 1200, cost: 800 },
    { name: "Tue", revenue: 1400, cost: 850 },
    { name: "Wed", revenue: 1300, cost: 900 },
    { name: "Thu", revenue: 1500, cost: 950 },
    { name: "Fri", revenue: 1800, cost: 1000 },
    { name: "Sat", revenue: 2100, cost: 1200 },
    { name: "Sun", revenue: 1700, cost: 950 },
  ]

  const weeklyData = [
    { name: "Week 1", revenue: 8500, cost: 5500 },
    { name: "Week 2", revenue: 9200, cost: 6000 },
    { name: "Week 3", revenue: 9800, cost: 6200 },
    { name: "Week 4", revenue: 10500, cost: 6500 },
  ]

  const monthlyData = [
    { name: "Jan", revenue: 35000, cost: 22000 },
    { name: "Feb", revenue: 32000, cost: 20000 },
    { name: "Mar", revenue: 38000, cost: 24000 },
    { name: "Apr", revenue: 40000, cost: 25000 },
    { name: "May", revenue: 42000, cost: 26000 },
    { name: "Jun", revenue: 45000, cost: 28000 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs. Cost</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="m-0">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                cost: {
                  label: "Cost",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="weekly" className="m-0">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                cost: {
                  label: "Cost",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="monthly" className="m-0">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                cost: {
                  label: "Cost",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
