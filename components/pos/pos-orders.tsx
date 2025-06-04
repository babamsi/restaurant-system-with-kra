"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react"

interface Order {
  id: string
  customer: string
  items: number
  total: number
  time: string
  status: "Preparing" | "Ready" | "Completed" | "Cancelled"
  paymentMethod: string
}

export function POSOrders() {
  const [orders] = useState<Order[]>([
    {
      id: "ORD-001",
      customer: "Table 5",
      items: 3,
      total: 24.97,
      time: "10 mins ago",
      status: "Preparing",
      paymentMethod: "Card",
    },
    {
      id: "ORD-002",
      customer: "Takeaway",
      items: 2,
      total: 16.98,
      time: "15 mins ago",
      status: "Ready",
      paymentMethod: "eDahab",
    },
    {
      id: "ORD-003",
      customer: "Table 2",
      items: 4,
      total: 32.46,
      time: "20 mins ago",
      status: "Completed",
      paymentMethod: "Cash",
    },
    {
      id: "ORD-004",
      customer: "Takeaway",
      items: 1,
      total: 8.99,
      time: "25 mins ago",
      status: "Cancelled",
      paymentMethod: "WAAFI",
    },
    {
      id: "ORD-005",
      customer: "Table 8",
      items: 5,
      total: 42.95,
      time: "30 mins ago",
      status: "Completed",
      paymentMethod: "Mpesa",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Preparing":
        return (
          <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </Badge>
        )
      case "Ready":
        return (
          <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "Completed":
        return (
          <Badge className="bg-green-100 text-green-600 hover:bg-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return null
    }
  }

  const activeOrders = orders.filter((order) => order.status === "Preparing" || order.status === "Ready")
  const completedOrders = orders.filter((order) => order.status === "Completed")
  const cancelledOrders = orders.filter((order) => order.status === "Cancelled")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.customer}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Order {order.id}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{order.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{order.time}</span>
                    </div>

                    <div className="flex justify-between pt-2">
                      {order.status === "Preparing" ? (
                        <Button size="sm" variant="outline">
                          Mark as Ready
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          Mark as Completed
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="group">
                        Details
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.customer}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Order {order.id}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{order.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{order.time}</span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="ghost" className="group">
                        Details
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.customer}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Order {order.id}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{order.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{order.time}</span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="ghost" className="group">
                        Details
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
