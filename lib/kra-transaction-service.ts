import { supabase } from './supabase'

export interface KRATransaction {
  id?: string
  transaction_type: 'purchase' | 'sale' | 'stock_in' | 'stock_out' | 'item_registration'
  transaction_date?: string
  kra_invoice_no?: number
  kra_sar_no?: number
  kra_result_code?: string
  kra_result_message?: string
  kra_receipt_data?: any
  supplier_id?: string
  supplier_order_id?: string
  sales_invoice_id?: string
  ingredient_id?: string
  items_data?: any
  total_amount?: number
  vat_amount?: number
  status?: 'pending' | 'success' | 'failed' | 'retry'
  retry_count?: number
  last_retry_at?: string
  error_message?: string
  error_details?: any
  created_at?: string
  updated_at?: string
}

export const kraTransactionService = {
  // Create a new KRA transaction record
  async create(transaction: Omit<KRATransaction, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: KRATransaction | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .insert(transaction)
        .select()
        .single()

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to create KRA transaction' }
    }
  },

  // Update KRA transaction status
  async updateStatus(id: string, status: KRATransaction['status'], resultCode?: string, resultMessage?: string, receiptData?: any): Promise<{ error: string | null }> {
    try {
      const updateData: any = { status }
      
      if (resultCode) updateData.kra_result_code = resultCode
      if (resultMessage) updateData.kra_result_message = resultMessage
      if (receiptData) updateData.kra_receipt_data = receiptData
      
      const { error } = await supabase
        .from('kra_transactions')
        .update(updateData)
        .eq('id', id)

      return { error: error?.message || null }
    } catch (error: any) {
      return { error: error.message || 'Failed to update KRA transaction' }
    }
  },

  // Update KRA transaction with error
  async updateError(id: string, errorMessage: string, errorDetails?: any): Promise<{ error: string | null }> {
    try {
      const updateData: any = { 
        status: 'failed',
        error_message: errorMessage
      }
      
      if (errorDetails) updateData.error_details = errorDetails
      
      const { error } = await supabase
        .from('kra_transactions')
        .update(updateData)
        .eq('id', id)

      return { error: error?.message || null }
    } catch (error: any) {
      return { error: error.message || 'Failed to update KRA transaction error' }
    }
  },

  // Get failed transactions for retry
  async getFailedTransactions(transactionType?: string): Promise<{ data: KRATransaction[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('kra_transactions')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })

      if (transactionType) {
        query = query.eq('transaction_type', transactionType)
      }

      const { data, error } = await query

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch failed transactions' }
    }
  },

  // Get transaction by ID
  async getById(id: string): Promise<{ data: KRATransaction | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch KRA transaction' }
    }
  },

  // Get transactions by supplier order
  async getBySupplierOrder(supplierOrderId: string): Promise<{ data: KRATransaction[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .select('*')
        .eq('supplier_order_id', supplierOrderId)
        .order('created_at', { ascending: false })

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch supplier order transactions' }
    }
  },

  // Get transactions by sales invoice
  async getBySalesInvoice(salesInvoiceId: string): Promise<{ data: KRATransaction[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .select('*')
        .eq('sales_invoice_id', salesInvoiceId)
        .order('created_at', { ascending: false })

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch sales invoice transactions' }
    }
  },

  // Get recent transactions
  async getRecent(limit: number = 50): Promise<{ data: KRATransaction[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data, error: error?.message || null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch recent transactions' }
    }
  },

  // Get transaction statistics
  async getStatistics(): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kra_transactions')
        .select('transaction_type, status, kra_result_code')

      if (error) throw error

      const stats = {
        total: data.length,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byResultCode: {} as Record<string, number>,
        successRate: 0
      }

      data.forEach(transaction => {
        // Count by type
        stats.byType[transaction.transaction_type] = (stats.byType[transaction.transaction_type] || 0) + 1
        
        // Count by status
        stats.byStatus[transaction.status] = (stats.byStatus[transaction.status] || 0) + 1
        
        // Count by result code
        if (transaction.kra_result_code) {
          stats.byResultCode[transaction.kra_result_code] = (stats.byResultCode[transaction.kra_result_code] || 0) + 1
        }
      })

      // Calculate success rate
      const successCount = stats.byStatus['success'] || 0
      stats.successRate = stats.total > 0 ? (successCount / stats.total) * 100 : 0

      return { data: stats, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch transaction statistics' }
    }
  }
} 