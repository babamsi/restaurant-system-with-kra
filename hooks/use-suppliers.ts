import { useState, useEffect } from 'react'

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

interface UseSuppliersReturn {
  suppliers: Supplier[]
  loading: boolean
  error: string | null
  refreshSuppliers: () => Promise<void>
  getSupplierById: (id: string) => Supplier | undefined
  getActiveSuppliers: () => Supplier[]
  getSuppliersByStatus: (status: string) => Supplier[]
}

export function useSuppliers(): UseSuppliersReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      
      if (data.success) {
        setSuppliers(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch suppliers')
      }
    } catch (err) {
      setError('Failed to fetch suppliers')
      console.error('Error fetching suppliers:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshSuppliers = async () => {
    await fetchSuppliers()
  }

  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.id === id)
  }

  const getActiveSuppliers = (): Supplier[] => {
    return suppliers.filter(supplier => supplier.status === 'active')
  }

  const getSuppliersByStatus = (status: string): Supplier[] => {
    return suppliers.filter(supplier => supplier.status === status)
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  return {
    suppliers,
    loading,
    error,
    refreshSuppliers,
    getSupplierById,
    getActiveSuppliers,
    getSuppliersByStatus
  }
} 