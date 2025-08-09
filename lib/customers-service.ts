import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Customer {
  id: string
  name: string
  kra_pin: string
  phone: string | null
  email: string | null
  created_at: string
  kra_status?: string
  kra_submission_date?: string
  kra_customer_no?: string
}

export interface CreateCustomerData {
  name: string
  kra_pin: string
  phone?: string
  email?: string
}

export interface UpdateCustomerData {
  name?: string
  kra_pin?: string
  phone?: string
  email?: string
}

export interface CustomerFilters {
  search?: string
  page?: number
  limit?: number
}

export const customersService = {
  // Get all customers with optional filtering and pagination
  async getCustomers(filters: CustomerFilters = {}): Promise<{ success: boolean; data?: Customer[]; pagination?: any; error?: string }> {
    try {
      const { search = '', page = 1, limit = 50 } = filters
      const offset = (page - 1) * limit

      // Build the query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })

      // Add search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,kra_pin.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Add pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: customers, error, count } = await query

      if (error) {
        console.error('Error fetching customers:', error)
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        data: customers || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      console.error('Error in getCustomers:', error)
      return { success: false, error: 'Failed to fetch customers' }
    }
  },

  // Get a single customer by ID
  async getCustomer(id: string): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching customer:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: customer }
    } catch (error) {
      console.error('Error in getCustomer:', error)
      return { success: false, error: 'Failed to fetch customer' }
    }
  },

  // Get customer by KRA PIN
  async getCustomerByKRAPIN(kraPin: string): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('kra_pin', kraPin)
        .single()

      if (error) {
        console.error('Error fetching customer by KRA PIN:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: customer }
    } catch (error) {
      console.error('Error in getCustomerByKRAPIN:', error)
      return { success: false, error: 'Failed to fetch customer by KRA PIN' }
    }
  },

  // Create a new customer
  async createCustomer(customerData: CreateCustomerData): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      // Check if customer with same KRA PIN already exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id, name, kra_pin')
        .eq('kra_pin', customerData.kra_pin)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing customer:', checkError)
        return { success: false, error: 'Failed to check existing customer' }
      }

      if (existingCustomer) {
        return { success: false, error: `Customer with KRA PIN ${customerData.kra_pin} already exists` }
      }

      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name.trim(),
          kra_pin: customerData.kra_pin.trim(),
          phone: customerData.phone?.trim() || null,
          email: customerData.email?.trim() || null
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return { success: false, error: createError.message }
      }

      return { success: true, data: newCustomer }
    } catch (error) {
      console.error('Error in createCustomer:', error)
      return { success: false, error: 'Failed to create customer' }
    }
  },

  // Update an existing customer
  async updateCustomer(id: string, updateData: UpdateCustomerData): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      // If KRA PIN is being updated, check for duplicates
      if (updateData.kra_pin) {
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id, name, kra_pin')
          .eq('kra_pin', updateData.kra_pin)
          .neq('id', id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing customer:', checkError)
          return { success: false, error: 'Failed to check existing customer' }
        }

        if (existingCustomer) {
          return { success: false, error: `Customer with KRA PIN ${updateData.kra_pin} already exists` }
        }
      }

      // Update customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          ...(updateData.name && { name: updateData.name.trim() }),
          ...(updateData.kra_pin && { kra_pin: updateData.kra_pin.trim() }),
          ...(updateData.phone !== undefined && { phone: updateData.phone?.trim() || null }),
          ...(updateData.email !== undefined && { email: updateData.email?.trim() || null })
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating customer:', updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, data: updatedCustomer }
    } catch (error) {
      console.error('Error in updateCustomer:', error)
      return { success: false, error: 'Failed to update customer' }
    }
  },

  // Delete a customer
  async deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting customer:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteCustomer:', error)
      return { success: false, error: 'Failed to delete customer' }
    }
  },

  // Search customers
  async searchCustomers(searchTerm: string): Promise<{ success: boolean; data?: Customer[]; error?: string }> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,kra_pin.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching customers:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: customers || [] }
    } catch (error) {
      console.error('Error in searchCustomers:', error)
      return { success: false, error: 'Failed to search customers' }
    }
  },

  // Send customer to KRA
  async sendCustomerToKRA(customerId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch('/api/kra/save-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send customer to KRA' }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('Error in sendCustomerToKRA:', error)
      return { success: false, error: 'Failed to send customer to KRA' }
    }
  }
} 