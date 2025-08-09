import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface KRAPurchaseSubmission {
  id: string
  spplr_invc_no: number
  spplr_tin: string
  spplr_nm: string
  total_amount: number
  tax_amount: number
  payment_type: string
  receipt_type: string
  submission_status: 'pending' | 'success' | 'failed'
  kra_response?: any
  kra_error_message?: string
  submitted_at: string
  updated_at: string
}

export interface CreateSubmissionData {
  spplr_invc_no: number
  spplr_tin: string
  spplr_nm: string
  total_amount: number
  tax_amount: number
  payment_type: string
  receipt_type: string
}

export const kraPurchaseSubmissionsService = {
  // Get submission by invoice and TIN
  async getSubmission(invcNo: number, tin: string): Promise<{ success: boolean; data?: KRAPurchaseSubmission; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_purchase_submissions')
        .select('*')
        .eq('spplr_invc_no', invcNo)
        .eq('spplr_tin', tin)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching submission:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || null }
    } catch (error) {
      console.error('Error in getSubmission:', error)
      return { success: false, error: 'Failed to fetch submission' }
    }
  },

  // Get all successful submissions
  async getSuccessfulSubmissions(): Promise<{ success: boolean; data?: KRAPurchaseSubmission[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_purchase_submissions')
        .select('*')
        .eq('submission_status', 'success')
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching successful submissions:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error in getSuccessfulSubmissions:', error)
      return { success: false, error: 'Failed to fetch successful submissions' }
    }
  },

  // Create a new submission
  async createSubmission(submissionData: CreateSubmissionData): Promise<{ success: boolean; data?: KRAPurchaseSubmission; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_purchase_submissions')
        .insert([{
          spplr_invc_no: submissionData.spplr_invc_no,
          spplr_tin: submissionData.spplr_tin,
          spplr_nm: submissionData.spplr_nm,
          total_amount: submissionData.total_amount,
          tax_amount: submissionData.tax_amount,
          payment_type: submissionData.payment_type,
          receipt_type: submissionData.receipt_type,
          submission_status: 'pending'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating submission:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in createSubmission:', error)
      return { success: false, error: 'Failed to create submission' }
    }
  },

  // Update submission with KRA response
  async updateSubmissionWithKRAResponse(invcNo: number, tin: string, kraResponse: any, status: 'success' | 'failed', errorMessage?: string): Promise<{ success: boolean; data?: KRAPurchaseSubmission; error?: string }> {
    try {
      const updateData: any = {
        submission_status: status,
        kra_response: kraResponse
      }

      if (errorMessage) {
        updateData.kra_error_message = errorMessage
      }

      const { data, error } = await supabase
        .from('kra_purchase_submissions')
        .update(updateData)
        .eq('spplr_invc_no', invcNo)
        .eq('spplr_tin', tin)
        .select()
        .single()

      if (error) {
        console.error('Error updating submission:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in updateSubmissionWithKRAResponse:', error)
      return { success: false, error: 'Failed to update submission' }
    }
  },

  // Check if submission exists and is successful
  async isSubmissionSuccessful(invcNo: number, tin: string): Promise<{ success: boolean; isSuccessful: boolean; error?: string }> {
    try {
      const result = await this.getSubmission(invcNo, tin)
      
      if (!result.success) {
        return { success: false, isSuccessful: false, error: result.error }
      }

      return { 
        success: true, 
        isSuccessful: result.data?.submission_status === 'success' 
      }
    } catch (error) {
      console.error('Error in isSubmissionSuccessful:', error)
      return { success: false, isSuccessful: false, error: 'Failed to check submission status' }
    }
  }
} 