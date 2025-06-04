"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"

interface InventoryItem {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  cost: number
  price: number
  status: string
  lastUpdated: string
}

interface InventoryTableProps {
  searchTerm?: string
  stockFilter?: "all" | "low" | "out"
}

export function InventoryTable({ searchTerm = "", stockFilter = "all" }: InventoryTableProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 1,
      name: "Fresh Tomatoes",
      category: "Vegetables",
      quantity: 0,
      unit: "kg",
      cost: 2.5,
      price: 3.5,
      status: "Out of Stock",
      lastUpdated: "Today",
    },
    {
      id: 2,
      name: "Olive Oil",
      category: "Oils",
      quantity: 2,
      unit: "bottles",
      cost: 8.0,
      price: 12.0,
      status: "Low Stock",
      lastUpdated: "Yesterday",
    },
    {
      id: 3,
      name: "Chicken Breast",
      category: "Meat",
      quantity: 3,
      unit: "kg",
      cost: 7.5,
      price: 10.0,
      status: "Low Stock",
      lastUpdated: "Yesterday",
    },
    {
      id: 4,
      name: "Brown Rice",
      category: "Grains",
      quantity: 5,
      unit: "kg",
      cost: 3.0,
      price: 4.5,
      status: "Low Stock",
      lastUpdated: "2 days ago",
    },
    {
      id: 5,
      name: "Onions",
      category: "Vegetables",
      quantity: 15,
      unit: "kg",
      cost: 1.5,
      price: 2.5,
      status: "In Stock",
      lastUpdated: "Today",
    },
    {
      id: 6,
      name: "Bell Peppers",
      category: "Vegetables",
      quantity: 10,
      unit: "kg",
      cost: 3.0,
      price: 4.5,
      status: "In Stock",
      lastUpdated: "Today",
    },
    {
      id: 7,
      name: "Garlic",
      category: "Vegetables",
      quantity: 8,
      unit: "kg",
      cost: 4.0,
      price: 6.0,
      status: "In Stock",
      lastUpdated: "3 days ago",
    },
    {
      id: 8,
      name: "Pasta",
      category: "Grains",
      quantity: 20,
      unit: "kg",
      cost: 2.0,
      price: 3.0,
      status: "In Stock",
      lastUpdated: "1 week ago",
    },
    {
      id: 9,
      name: "Milk",
      category: "Dairy",
      quantity: 12,
      unit: "liters",
      cost: 1.2,
      price: 1.8,
      status: "In Stock",
      lastUpdated: "Today",
    },
    {
      id: 10,
      name: "Eggs",
      category: "Dairy",
      quantity: 60,
      unit: "pieces",
      cost: 0.2,
      price: 0.3,
      status: "In Stock",
      lastUpdated: "Yesterday",
    },
    {
      id: 11,
      name: "Beef",
      category: "Meat",
      quantity: 7,
      unit: "kg",
      cost: 9.0,
      price: 12.0,
      status: "In Stock",
      lastUpdated: "2 days ago",
    },
    {
      id: 12,
      name: "Potatoes",
      category: "Vegetables",
      quantity: 25,
      unit: "kg",
      cost: 1.0,
      price: 1.5,
      status: "In Stock",
      lastUpdated: "Today",
    },
  ])

  const [sortColumn, setSortColumn] = useState<keyof InventoryItem>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(inventory)
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  // Handle sorting
  const handleSort = (column: keyof InventoryItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Filter and sort inventory
  useEffect(() => {
    let filtered = [...inventory]

    // Apply stock filter
    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.status === "Low Stock")
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.status === "Out of Stock")
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const valueA = a[sortColumn]
      const valueB = b[sortColumn]

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      } else {
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
      }
    })

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, sortColumn, sortDirection, stockFilter])

  // Toggle expanded item
  const toggleExpand = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Out of Stock":
        return "destructive"
      case "Low Stock":
        return "outline"
      default:
        return "default"
    }
  }

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Low Stock":
        return "text-amber-500 border-amber-500"
      default:
        return ""
    }
  }

  return (
    <Card className="overflow-hidden border rounded-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                <div className="flex items-center">
                  Item Name
                  {sortColumn === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("category")} className="cursor-pointer">
                <div className="flex items-center">
                  Category
                  {sortColumn === "category" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("quantity")} className="cursor-pointer">
                <div className="flex items-center">
                  Quantity
                  {sortColumn === "quantity" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead onClick={() => handleSort("cost")} className="cursor-pointer">
                <div className="flex items-center">
                  Cost
                  {sortColumn === "cost" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                <div className="flex items-center">
                  Price
                  {sortColumn === "price" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredInventory.map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow
                      className={`${expandedItem === item.id ? "bg-muted/50" : ""} hover:bg-muted/30 transition-colors`}
                    >
                      <TableCell className="p-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(item.id)}>
                          {expandedItem === item.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>${item.cost.toFixed(2)}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)} className={getStatusClass(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {expandedItem === item.id && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Item Details</p>
                                  <p className="text-sm text-muted-foreground">
                                    SKU: INV-{item.id.toString().padStart(4, "0")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Last Updated: {item.lastUpdated}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Stock Information</p>
                                  <p className="text-sm text-muted-foreground">Reorder Level: 5 {item.unit}</p>
                                  <p className="text-sm text-muted-foreground">Optimal Stock: 20 {item.unit}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Quick Actions</p>
                                  <div className="flex gap-2 mt-1">
                                    <Button size="sm" variant="outline">
                                      Adjust Stock
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Order More
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
