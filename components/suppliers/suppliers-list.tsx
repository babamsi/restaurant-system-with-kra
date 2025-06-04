"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2 } from "lucide-react"

export function SuppliersList() {
  const [open, setOpen] = useState(false)
  const [suppliers] = useState([
    {
      id: 1,
      name: "Fresh Farms Ltd",
      contact: "John Doe",
      phone: "+254 712 345 678",
      email: "john@freshfarms.co.ke",
      lastOrder: "May 15, 2023",
    },
    {
      id: 2,
      name: "Quality Meats",
      contact: "Jane Smith",
      phone: "+254 723 456 789",
      email: "jane@qualitymeats.co.ke",
      lastOrder: "May 20, 2023",
    },
    {
      id: 3,
      name: "Organic Produce",
      contact: "David Kimani",
      phone: "+254 734 567 890",
      email: "david@organicproduce.co.ke",
      lastOrder: "May 22, 2023",
    },
    {
      id: 4,
      name: "Spice World",
      contact: "Sarah Omondi",
      phone: "+254 745 678 901",
      email: "sarah@spiceworld.co.ke",
      lastOrder: "May 25, 2023",
    },
  ])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Suppliers</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Enter the details of the new supplier.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Supplier Name</Label>
                <Input id="name" placeholder="e.g., Fresh Farms Ltd" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Person</Label>
                <Input id="contact" placeholder="e.g., John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="e.g., +254 712 345 678" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="e.g., john@example.com" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Supplier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Last Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell className="hidden md:table-cell">{supplier.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{supplier.email}</TableCell>
                <TableCell className="hidden md:table-cell">{supplier.lastOrder}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
