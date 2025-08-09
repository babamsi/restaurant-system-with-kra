'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { Customer, CreateCustomerData, UpdateCustomerData } from '@/lib/customers-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Mail, 
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
// import ProtectedRoute from '@/components/protected-route'

export default function CustomersPage() {
  const { toast } = useToast()
  const { 
    customers, 
    loading, 
    error, 
    pagination, 
    loadCustomers, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    sendCustomerToKRA
  } = useCustomers()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendingToKRA, setSendingToKRA] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    kra_pin: '',
    phone: '',
    email: ''
  })

  const [editFormData, setEditFormData] = useState<UpdateCustomerData>({
    name: '',
    kra_pin: '',
    phone: '',
    email: ''
  })

  const handleSearch = async () => {
    await loadCustomers({ search: searchTerm, page: 1, limit: 50 })
    setCurrentPage(1)
  }

  const handlePageChange = async (page: number) => {
    await loadCustomers({ search: searchTerm, page, limit: 50 })
    setCurrentPage(page)
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createCustomer(formData)
      if (result.success) {
        setIsAddDialogOpen(false)
        setFormData({ name: '', kra_pin: '', phone: '', email: '' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return

    setIsSubmitting(true)

    try {
      const result = await updateCustomer(editingCustomer.id, editFormData)
      if (result.success) {
        setIsEditDialogOpen(false)
        setEditingCustomer(null)
        setEditFormData({ name: '', kra_pin: '', phone: '', email: '' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return

    const result = await deleteCustomer(customer.id)
    if (result.success) {
      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted successfully`,
      })
    }
  }

  const handleSendToKRA = async (customer: Customer) => {
    if (customer.kra_status === 'submitted') {
      toast({
        title: "Already Sent",
        description: `${customer.name} has already been sent to KRA`,
        variant: "default",
      })
      return
    }

    setSendingToKRA(customer.id)
    
    try {
      const result = await sendCustomerToKRA(customer.id)
      if (result.success) {
        toast({
          title: "Sent to KRA",
          description: `${customer.name} has been sent to KRA successfully`,
        })
      }
    } finally {
      setSendingToKRA(null)
    }
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditFormData({
      name: customer.name,
      kra_pin: customer.kra_pin,
      phone: customer.phone || '',
      email: customer.email || ''
    })
    setIsEditDialogOpen(true)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getKRAStatusBadge = (customer: Customer) => {
    if (customer.kra_status === 'submitted') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sent to KRA
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }

  return (
    // <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Customer Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your customers and their information
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kra_pin">KRA PIN *</Label>
                  <Input
                    id="kra_pin"
                    value={formData.kra_pin}
                    onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value })}
                    placeholder="Enter KRA PIN"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Customer'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search customers by name, KRA PIN, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customers ({pagination?.total || 0})</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => loadCustomers()} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No customers found</p>
                {searchTerm && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('')
                      loadCustomers({ page: 1, limit: 50 })
                    }}
                    variant="outline"
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>KRA PIN</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>KRA Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">ID: {customer.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {customer.kra_pin}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(customer.kra_pin, 'KRA PIN')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{customer.phone}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(customer.phone!, 'Phone')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span>{customer.email}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(customer.email!, 'Email')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {!customer.phone && !customer.email && (
                                <span className="text-muted-foreground text-sm">No contact info</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getKRAStatusBadge(customer)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(customer.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendToKRA(customer)}
                                disabled={sendingToKRA === customer.id || customer.kra_status === 'submitted'}
                              >
                                {sendingToKRA === customer.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} customers
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-kra_pin">KRA PIN *</Label>
                <Input
                  id="edit-kra_pin"
                  value={editFormData.kra_pin}
                  onChange={(e) => setEditFormData({ ...editFormData, kra_pin: e.target.value })}
                  placeholder="Enter KRA PIN"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Customer'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    // </ProtectedRoute>
  )
} 