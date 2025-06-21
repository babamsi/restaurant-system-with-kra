"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, Edit, Trash2, Search, X, Building2, Phone, Mail, MapPin, CreditCard, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'

// Supplier type
interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  tax_id: string | null
  payment_terms: string | null
  credit_limit: number | null
  current_balance: number | null
  status: string
  created_at: string
  updated_at: string
}

// Supplier service functions
const supplierService = {
  async getAll() {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      return { data: data.data || [], success: true }
    } catch (error) {
      return { data: [], success: false, error: 'Failed to fetch suppliers' }
    }
  },

  async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      })
      const data = await response.json()
      return { data: data.data, success: true }
    } catch (error) {
      return { data: null, success: false, error: 'Failed to create supplier' }
    }
  },

  async update(id: string, supplier: Partial<Supplier>) {
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      })
      const data = await response.json()
      return { data: data.data, success: true }
    } catch (error) {
      return { data: null, success: false, error: 'Failed to update supplier' }
    }
  },

  async delete(id: string) {
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE'
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete supplier' }
    }
  }
}

export function SupplierManager() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const router = useRouter()

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    tax_id: "",
    payment_terms: "",
    credit_limit: null,
    current_balance: 0,
    status: "active"
  })

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const result = await supplierService.getAll()
      if (result.success) {
        setSuppliers(result.data)
      } else {
        toast({
          title: "Error Loading Suppliers",
          description: result.error || "Failed to load suppliers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Suppliers",
        description: "Failed to load suppliers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || supplier.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      toast({
        title: "Missing Information",
        description: "Please enter a supplier name.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await supplierService.create({
        name: newSupplier.name,
        contact_person: newSupplier.contact_person || null,
        email: newSupplier.email || null,
        phone: newSupplier.phone || null,
        address: newSupplier.address || null,
        city: newSupplier.city || null,
        state: newSupplier.state || null,
        country: newSupplier.country || null,
        postal_code: newSupplier.postal_code || null,
        tax_id: newSupplier.tax_id || null,
        payment_terms: newSupplier.payment_terms || null,
        credit_limit: newSupplier.credit_limit,
        current_balance: newSupplier.current_balance || 0,
        status: newSupplier.status || "active"
      })

      if (result.success) {
        toast({
          title: "Supplier Added",
          description: `${newSupplier.name} has been added successfully.`,
        })
        
        // Reset form
        setIsAddingSupplier(false)
        setNewSupplier({
          name: "",
          contact_person: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          country: "",
          postal_code: "",
          tax_id: "",
          payment_terms: "",
          credit_limit: null,
          current_balance: 0,
          status: "active"
        })
        
        // Reload suppliers
        await loadSuppliers()
      } else {
        toast({
          title: "Error Adding Supplier",
          description: result.error || "Failed to add supplier",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Adding Supplier",
        description: "Failed to add supplier",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return

    try {
      const result = await supplierService.update(editingSupplier.id, {
        name: editingSupplier.name,
        contact_person: editingSupplier.contact_person,
        email: editingSupplier.email,
        phone: editingSupplier.phone,
        address: editingSupplier.address,
        city: editingSupplier.city,
        state: editingSupplier.state,
        country: editingSupplier.country,
        postal_code: editingSupplier.postal_code,
        tax_id: editingSupplier.tax_id,
        payment_terms: editingSupplier.payment_terms,
        credit_limit: editingSupplier.credit_limit,
        current_balance: editingSupplier.current_balance,
        status: editingSupplier.status
      })

      if (result.success) {
        toast({
          title: "Supplier Updated",
          description: `${editingSupplier.name} has been updated successfully.`,
        })
        setEditingSupplier(null)
        await loadSuppliers()
      } else {
        toast({
          title: "Error Updating Supplier",
          description: result.error || "Failed to update supplier",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Updating Supplier",
        description: "Failed to update supplier",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return

    try {
      const result = await supplierService.delete(supplierToDelete.id)
      if (result.success) {
        toast({
          title: "Supplier Deleted",
          description: `${supplierToDelete.name} has been removed successfully.`,
        })
        setShowDeleteDialog(false)
        setSupplierToDelete(null)
        await loadSuppliers()
      } else {
        toast({
          title: "Error Deleting Supplier",
          description: result.error || "Failed to delete supplier",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Deleting Supplier",
        description: "Failed to delete supplier",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-600">
                  {suppliers.filter(s => s.status === "active").length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Suppliers</p>
                <p className="text-2xl font-bold text-gray-600">
                  {suppliers.filter(s => s.status === "inactive").length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {suppliers.filter(s => s.status === "suspended").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedStatus !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedStatus !== "all") && (
          <div className="flex flex-wrap gap-2 text-sm">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedStatus("all")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Add Supplier Dialog */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Supplier Management</h3>
        <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-name">Supplier Name *</Label>
                    <Input
                      id="supplier-name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-status">Status</Label>
                    <Select
                      value={newSupplier.status}
                      onValueChange={(value) => setNewSupplier({ ...newSupplier, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-contact">Contact Person</Label>
                    <Input
                      id="supplier-contact"
                      value={newSupplier.contact_person || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-email">Email</Label>
                    <Input
                      id="supplier-email"
                      type="email"
                      value={newSupplier.email || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input
                      id="supplier-phone"
                      value={newSupplier.phone || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-tax">Tax ID</Label>
                    <Input
                      id="supplier-tax"
                      value={newSupplier.tax_id || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, tax_id: e.target.value })}
                      placeholder="Enter tax ID"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div>
                  <Label htmlFor="supplier-address">Address</Label>
                  <Input
                    id="supplier-address"
                    value={newSupplier.address || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-city">City</Label>
                    <Input
                      id="supplier-city"
                      value={newSupplier.city || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-state">State/Province</Label>
                    <Input
                      id="supplier-state"
                      value={newSupplier.state || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, state: e.target.value })}
                      placeholder="Enter state or province"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-country">Country</Label>
                    <Input
                      id="supplier-country"
                      value={newSupplier.country || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-postal">Postal Code</Label>
                    <Input
                      id="supplier-postal"
                      value={newSupplier.postal_code || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, postal_code: e.target.value })}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-payment">Payment Terms</Label>
                    <Input
                      id="supplier-payment"
                      value={newSupplier.payment_terms || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })}
                      placeholder="e.g., Net 30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-credit">Credit Limit</Label>
                    <Input
                      id="supplier-credit"
                      type="number"
                      value={newSupplier.credit_limit || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, credit_limit: parseFloat(e.target.value) || null })}
                      placeholder="Enter credit limit"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingSupplier(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier}>
                <Save className="h-4 w-4 mr-2" />
                Save Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Supplier Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={editingSupplier?.name || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingSupplier?.status || "active"}
                    onValueChange={(value) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, status: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={editingSupplier?.contact_person || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, contact_person: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingSupplier?.email || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, email: e.target.value } : null))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingSupplier?.phone || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input
                    value={editingSupplier?.tax_id || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, tax_id: e.target.value } : null))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div>
                <Label>Address</Label>
                <Input
                  value={editingSupplier?.address || ""}
                  onChange={(e) =>
                    setEditingSupplier((prev) => (prev ? { ...prev, address: e.target.value } : null))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={editingSupplier?.city || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, city: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <Input
                    value={editingSupplier?.state || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, state: e.target.value } : null))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Input
                    value={editingSupplier?.country || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, country: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={editingSupplier?.postal_code || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, postal_code: e.target.value } : null))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Input
                    value={editingSupplier?.payment_terms || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, payment_terms: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Credit Limit</Label>
                  <Input
                    type="number"
                    value={editingSupplier?.credit_limit || ""}
                    onChange={(e) =>
                      setEditingSupplier((prev) => (prev ? { ...prev, credit_limit: parseFloat(e.target.value) || null } : null))
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingSupplier(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => router.push(`/suppliers/${supplier.id}`)}
                  >
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || "-"}</TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                          {supplier.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                          {supplier.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.city && supplier.state ? (
                        `${supplier.city}, ${supplier.state}`
                      ) : supplier.city || supplier.state || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>
                      {supplier.credit_limit !== null && supplier.credit_limit !== undefined
                        ? `$${supplier.credit_limit.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSupplier(supplier)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(supplier)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{supplierToDelete?.name}</span> from the
              suppliers list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 