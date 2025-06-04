"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus, Minus, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  available: number
  image: string
  status: "Available" | "Low Stock" | "Out of Stock"
}

export function KitchenMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 1,
      name: "Grilled Chicken Salad",
      category: "Salads",
      price: 8.99,
      available: 15,
      image: "/grilled-chicken-salad.png",
      status: "Available",
    },
    {
      id: 2,
      name: "Vegetable Stir Fry",
      category: "Main Course",
      price: 7.99,
      available: 12,
      image: "/vegetable-stir-fry.png",
      status: "Available",
    },
    {
      id: 3,
      name: "Beef Lasagna",
      category: "Main Course",
      price: 9.99,
      available: 8,
      image: "/beef-lasagna.png",
      status: "Available",
    },
    {
      id: 4,
      name: "Fresh Fruit Smoothie",
      category: "Beverages",
      price: 4.99,
      available: 10,
      image: "/fruit-smoothie.png",
      status: "Available",
    },
    {
      id: 5,
      name: "Steamed Rice",
      category: "Sides",
      price: 2.99,
      available: 20,
      image: "/steamed-rice.png",
      status: "Available",
    },
    {
      id: 6,
      name: "Roasted Vegetables",
      category: "Sides",
      price: 3.99,
      available: 15,
      image: "/roasted-vegetables.png",
      status: "Available",
    },
    {
      id: 7,
      name: "Iced Tea",
      category: "Beverages",
      price: 2.49,
      available: 3,
      image: "/iced-tea.png",
      status: "Low Stock",
    },
    {
      id: 8,
      name: "Tomato Pasta",
      category: "Main Course",
      price: 8.49,
      available: 0,
      image: "/diverse-food-spread.png",
      status: "Out of Stock",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpdateQuantity = (id: number, change: number) => {
    setMenuItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const newAvailable = Math.max(0, item.available + change)
          let newStatus = item.status

          if (newAvailable === 0) {
            newStatus = "Out of Stock"
          } else if (newAvailable <= 5) {
            newStatus = "Low Stock"
          } else {
            newStatus = "Available"
          }

          return { ...item, available: newAvailable, status: newStatus as any }
        }
        return item
      }),
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Available</Badge>
      case "Low Stock":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return null
    }
  }

  // Group items by category
  const categories = [...new Set(filteredItems.map((item) => item.category))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search menu items..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>Add Menu Item</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex h-full">
                  <div className="relative w-1/3">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <CardContent className="p-4 w-2/3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Item</DropdownMenuItem>
                          <DropdownMenuItem>View Recipe</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Remove from Menu</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-2">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            disabled={item.available === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm">{item.available}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex h-full">
                      <div className="relative w-1/3">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <CardContent className="p-4 w-2/3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Item</DropdownMenuItem>
                              <DropdownMenuItem>View Recipe</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Remove from Menu</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2">
                          <p className="font-semibold">${item.price.toFixed(2)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                disabled={item.available === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm">{item.available}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
