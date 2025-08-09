import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface KRARegistration {
  id: string
  registration_type: 'device_init' | 'branch_reg'
  tin: string
  bhf_id: string
  dvc_srl_no?: string
  dvc_id?: string
  sdc_id?: string
  mrc_no?: string
  cmc_key?: string
  bhf_nm?: string
  bhf_open_dt?: string
  prvnc_nm?: string
  dstrt_nm?: string
  sctr_nm?: string
  loc_desc?: string
  hq_yn?: string
  mgr_nm?: string
  mgr_tel_no?: string
  mgr_email?: string
  taxpr_nm?: string
  bsns_actv?: string
  kra_status: 'pending' | 'success' | 'failed'
  kra_response?: any
  created_at: string
  updated_at: string
}

export interface CreateRegistrationData {
  registration_type: 'device_init' | 'branch_reg'
  tin: string
  bhf_id: string
  dvc_srl_no?: string
}

export interface UpdateRegistrationData {
  dvc_id?: string
  sdc_id?: string
  mrc_no?: string
  cmc_key?: string
  bhf_nm?: string
  bhf_open_dt?: string
  prvnc_nm?: string
  dstrt_nm?: string
  sctr_nm?: string
  loc_desc?: string
  hq_yn?: string
  mgr_nm?: string
  mgr_tel_no?: string
  mgr_email?: string
  taxpr_nm?: string
  bsns_actv?: string
  kra_status?: 'pending' | 'success' | 'failed'
  kra_response?: any
}

export const kraRegistrationsService = {
  // Get all registrations
  async getRegistrations(): Promise<{ success: boolean; data?: KRARegistration[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching registrations:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error in getRegistrations:', error)
      return { success: false, error: 'Failed to fetch registrations' }
    }
  },

  // Get registrations by type
  async getRegistrationsByType(type: 'device_init' | 'branch_reg'): Promise<{ success: boolean; data?: KRARegistration[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .select('*')
        .eq('registration_type', type)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching registrations by type:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error in getRegistrationsByType:', error)
      return { success: false, error: 'Failed to fetch registrations by type' }
    }
  },

  // Get active registration (latest successful)
  async getActiveRegistration(): Promise<{ success: boolean; data?: KRARegistration; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .select('*')
        .eq('kra_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching active registration:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in getActiveRegistration:', error)
      return { success: false, error: 'Failed to fetch active registration' }
    }
  },

  // Create a new registration
  async createRegistration(registrationData: CreateRegistrationData): Promise<{ success: boolean; data?: KRARegistration; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .insert([{
          registration_type: registrationData.registration_type,
          tin: registrationData.tin,
          bhf_id: registrationData.bhf_id,
          dvc_srl_no: registrationData.dvc_srl_no,
          kra_status: 'pending'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating registration:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in createRegistration:', error)
      return { success: false, error: 'Failed to create registration' }
    }
  },

  // Update registration with KRA response
  async updateRegistrationWithKRAResponse(id: string, kraResponse: any, status: 'success' | 'failed'): Promise<{ success: boolean; data?: KRARegistration; error?: string }> {
    try {
      const updateData: UpdateRegistrationData = {
        kra_status: status,
        kra_response: kraResponse
      }

      // Extract data from KRA response if successful
      if (status === 'success' && kraResponse.data?.info) {
        const info = kraResponse.data.info
        updateData.dvc_id = info.dvcId
        updateData.sdc_id = info.sdcId
        updateData.mrc_no = info.mrcNo
        updateData.cmc_key = info.cmcKey
        updateData.bhf_nm = info.bhfNm
        updateData.bhf_open_dt = info.bhfOpenDt
        updateData.prvnc_nm = info.prvncNm
        updateData.dstrt_nm = info.dstrtNm
        updateData.sctr_nm = info.sctrNm
        updateData.loc_desc = info.locDesc
        updateData.hq_yn = info.hqYn
        updateData.mgr_nm = info.mgrNm
        updateData.mgr_tel_no = info.mgrTelNo
        updateData.mgr_email = info.mgrEmail
        updateData.taxpr_nm = info.taxprNm
        updateData.bsns_actv = info.bsnsActv
      }

      const { data, error } = await supabase
        .from('kra_registrations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating registration:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in updateRegistrationWithKRAResponse:', error)
      return { success: false, error: 'Failed to update registration' }
    }
  },

  // Delete a registration
  async deleteRegistration(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('kra_registrations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting registration:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteRegistration:', error)
      return { success: false, error: 'Failed to delete registration' }
    }
  },

  // Get the latest successful device initialization credentials
  async getLatestDeviceCredentials(): Promise<{ success: boolean; data?: { tin: string; bhf_id: string; cmc_key: string; dvc_id?: string; sdc_id?: string; mrc_no?: string }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .select('tin, bhf_id, cmc_key, dvc_id, sdc_id, mrc_no')
        .eq('registration_type', 'device_init')
        .eq('kra_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching latest device credentials:', error)
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'No successful device initialization found' }
      }

      return { 
        success: true, 
        data: {
          tin: data.tin,
          bhf_id: data.bhf_id,
          cmc_key: data.cmc_key,
          dvc_id: data.dvc_id,
          sdc_id: data.sdc_id,
          mrc_no: data.mrc_no
        }
      }
    } catch (error) {
      console.error('Error in getLatestDeviceCredentials:', error)
      return { success: false, error: 'Failed to fetch device credentials' }
    }
  },

  // Get the latest successful branch registration
  async getLatestBranchRegistration(): Promise<{ success: boolean; data?: KRARegistration; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('kra_registrations')
        .select('*')
        .eq('registration_type', 'branch_reg')
        .eq('kra_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching latest branch registration:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || undefined }
    } catch (error) {
      console.error('Error in getLatestBranchRegistration:', error)
      return { success: false, error: 'Failed to fetch branch registration' }
    }
  }
} 