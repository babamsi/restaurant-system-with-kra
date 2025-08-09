import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { customersService, Customer, CreateCustomerData, UpdateCustomerData, CustomerFilters } from '@/lib/customers-service'

export function useCustomers() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const loadCustomers = async (filters: CustomerFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await customersService.getCustomers(filters)
      
      if (result.success) {
        setCustomers(result.data || [])
        setPagination(result.pagination)
      } else {
        setError(result.error || 'Failed to load customers')
        toast({
          title: "Error Loading Customers",
          description: result.error || "Failed to load customers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setError("Failed to load customers")
      toast({
        title: "Error Loading Customers",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async (customerData: CreateCustomerData) => {
    try {
      const result = await customersService.createCustomer(customerData)
      
      if (result.success && result.data) {
        setCustomers(prev => [result.data!, ...prev])
        toast({
          title: "Customer Created",
          description: `${customerData.name} has been created successfully`,
        })
        return { success: true, data: result.data }
      } else {
        toast({
          title: "Error Creating Customer",
          description: result.error || "Failed to create customer",
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error Creating Customer",
        description: "Failed to create customer",
        variant: "destructive",
      })
      return { success: false, error: "Failed to create customer" }
    }
  }

  const updateCustomer = async (id: string, updateData: UpdateCustomerData) => {
    try {
      const result = await customersService.updateCustomer(id, updateData)
      
      if (result.success && result.data) {
        setCustomers(prev => prev.map(customer => 
          customer.id === id ? result.data! : customer
        ))
        toast({
          title: "Customer Updated",
          description: "Customer has been updated successfully",
        })
        return { success: true, data: result.data }
      } else {
        toast({
          title: "Error Updating Customer",
          description: result.error || "Failed to update customer",
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error Updating Customer",
        description: "Failed to update customer",
        variant: "destructive",
      })
      return { success: false, error: "Failed to update customer" }
    }
  }

  const deleteCustomer = async (id: string) => {
    try {
      const result = await customersService.deleteCustomer(id)
      
      if (result.success) {
        setCustomers(prev => prev.filter(customer => customer.id !== id))
        toast({
          title: "Customer Deleted",
          description: "Customer has been deleted successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error Deleting Customer",
          description: result.error || "Failed to delete customer",
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error Deleting Customer",
        description: "Failed to delete customer",
        variant: "destructive",
      })
      return { success: false, error: "Failed to delete customer" }
    }
  }

  const searchCustomers = async (searchTerm: string) => {
    try {
      const result = await customersService.searchCustomers(searchTerm)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error searching customers:', error)
      return { success: false, error: "Failed to search customers" }
    }
  }

  const getCustomer = async (id: string) => {
    try {
      const result = await customersService.getCustomer(id)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      return { success: false, error: "Failed to fetch customer" }
    }
  }

  const getCustomerByKRAPIN = async (kraPin: string) => {
    try {
      const result = await customersService.getCustomerByKRAPIN(kraPin)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error fetching customer by KRA PIN:', error)
      return { success: false, error: "Failed to fetch customer by KRA PIN" }
    }
  }

  const sendCustomerToKRA = async (customerId: string) => {
    try {
      const result = await customersService.sendCustomerToKRA(customerId)
      
      if (result.success) {
        // Update the customer in the local state
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, kra_status: 'submitted', kra_submission_date: new Date().toISOString() }
            : customer
        ))
        
        toast({
          title: "Customer Sent to KRA",
          description: "Customer has been successfully sent to KRA",
        })
        return { success: true, data: result.data }
      } else {
        toast({
          title: "Error Sending to KRA",
          description: result.error || "Failed to send customer to KRA",
          variant: "destructive",
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error sending customer to KRA:', error)
      toast({
        title: "Error Sending to KRA",
        description: "Failed to send customer to KRA",
        variant: "destructive",
      })
      return { success: false, error: "Failed to send customer to KRA" }
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  return {
    customers,
    loading,
    error,
    pagination,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    getCustomer,
    getCustomerByKRAPIN,
    sendCustomerToKRA
  }
} 