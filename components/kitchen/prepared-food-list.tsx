"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Check, Clock, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/toast-context"
import { motion } from "framer-motion"

interface PreparedItem {
  id: number
  name: string
  quantity: number
  unit: string
  preparedAt: string
  expiresAt: string
  status: "Fresh" | "Expiring Soon" | "Expired"
}

export function PreparedFoodList() {
  const { addToast } = useToast()
  const [preparedItems, setPreparedItems] = useState<PreparedItem[]>([
    {
      id: 1,
      name: "Grilled Chicken Salad",
      quantity: 15,
      unit: "servings",
      preparedAt: "10:30 AM",
      expiresAt: "2:30 PM",
      status: "Fresh",
    },
    {
      id: 2,
      name: "Vegetable Stir Fry",
      quantity: 12,
      unit: "servings",
      preparedAt: "11:15 AM",
      expiresAt: "3:15 PM",
      status: "Fresh",
    },
    {
      id: 3,
      name: "Beef Lasagna",
      quantity: 8,
      unit: "servings",
      preparedAt: "9:45 AM",
      expiresAt: "1:45 PM",
      status: "Expiring Soon",
    },
    {
      id: 4,
      name: "Fresh Fruit Smoothie",
      quantity: 10,
      unit: "glasses",
      preparedAt: "11:30 AM",
      expiresAt: "1:30 PM",
      status: "Expiring Soon",
    },
  ])

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "servings",
  })

  const handleAddItem = () => {
    if (newItem.name && newItem.quantity > 0) {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      const preparedAt = `${formattedHours}:${formattedMinutes} ${ampm}`

      // Expiry time (4 hours later)
      const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000)
      const expiryHours = expiryTime.getHours()
      const expiryMinutes = expiryTime.getMinutes()
      const expiryAmpm = expiryHours >= 12 ? "PM" : "AM"
      const formattedExpiryHours = expiryHours % 12 || 12
      const formattedExpiryMinutes = expiryMinutes < 10 ? `0${expiryMinutes}` : expiryMinutes
      const expiresAt = `${formattedExpiryHours}:${formattedExpiryMinutes} ${expiryAmpm}`

      const newPreparedItem: PreparedItem = {
        id: Date.now(),
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        preparedAt,
        expiresAt,
        status: "Fresh",
      }

      setPreparedItems([newPreparedItem, ...preparedItems])
      setNewItem({
        name: "",
        quantity: 1,
        unit: "servings",
      })

      addToast({
        title: "Item Added to Menu",
        description: `${newItem.quantity} ${newItem.unit} of ${newItem.name} added to the menu`,
        type: "success",
        duration: 3000,
      })
    }
  }

  const handleUpdateQuantity = (id: number, change: number) => {
    setPreparedItems(
      (items) =>
        items
          .map((item) => {
            if (item.id === id) {
              const newQuantity = Math.max(0, item.quantity + change)
              return { ...item, quantity: newQuantity }
            }
            return item
          })
          .filter((item) => item.quantity > 0), // Remove items with 0 quantity
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Fresh":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            <Check className="h-3 w-3 mr-1" /> Fresh
          </Badge>
        )
      case "Expiring Soon":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          >
            <Clock className="h-3 w-3 mr-1" /> Expiring Soon
          </Badge>
        )
      case "Expired":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            <AlertTriangle className="h-3 w-3 mr-1" /> Expired
          </Badge>
        )
      default:
        return null
    }
  }

  // Calculate time remaining and progress
  const getTimeProgress = (preparedAt: string, expiresAt: string) => {
    const now = new Date()
    const prepared = new Date(now.toDateString() + " " + preparedAt)
    const expires = new Date(now.toDateString() + " " + expiresAt)

    // If expires time is earlier than prepared time, it means it expires the next day
    if (expires < prepared) {
      expires.setDate(expires.getDate() + 1)
    }

    const totalDuration = expires.getTime() - prepared.getTime()
    const elapsed = now.getTime() - prepared.getTime()
    const remaining = expires.getTime() - now.getTime()

    // Calculate percentage remaining (inverted)
    const percentElapsed = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

    // Format remaining time
    const remainingHours = Math.floor(remaining / (1000 * 60 * 60))
    const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const formattedRemaining = remainingHours > 0 ? `${remainingHours}h ${remainingMinutes}m` : `${remainingMinutes}m`

    return {
      percentElapsed,
      formattedRemaining,
      isExpiringSoon: percentElapsed > 75,
      isExpired: percentElapsed >= 100,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prepared Food</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4">
            {preparedItems.map((item) => {
              const timeInfo = getTimeProgress(item.preparedAt, item.expiresAt)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} available
                        </p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Prepared: {item.preparedAt}</span>
                      <span className="text-muted-foreground">
                        {timeInfo.isExpired ? "Expired" : `${timeInfo.formattedRemaining} remaining`}
                      </span>
                    </div>
                    <Progress
                      value={timeInfo.percentElapsed}
                      className={`h-1.5 ${
                        timeInfo.isExpired ? "bg-red-200" : timeInfo.isExpiringSoon ? "bg-amber-200" : "bg-green-200"
                      }`}
                    />
                  </div>
                  <Separator className="my-3" />
                </motion.div>
              )
            })}
          </div>

          <div className="pt-4">
            <p className="font-medium mb-3">Add New Prepared Item</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Chicken Curry"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., servings"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleAddItem} disabled={!newItem.name || newItem.quantity < 1}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Menu
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
