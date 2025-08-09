import { kraRegistrationsService } from './kra-registrations-service'

export interface KRAHeaders {
  'Content-Type': string
  'cmcKey': string
  'tin': string
  'bhfId': string
  'dvcId'?: string
  'sdcId'?: string
  'mrcNo'?: string
}

export async function getKRAHeaders(): Promise<{ success: boolean; headers?: KRAHeaders; error?: string }> {
  try {
    const { success, data, error } = await kraRegistrationsService.getLatestDeviceCredentials()
    
    if (!success || !data) {
      return { 
        success: false, 
        error: error || 'No device credentials found. Please initialize your device first.' 
      }
    }

    const headers: KRAHeaders = {
      'Content-Type': 'application/json',
      'cmcKey': data.cmc_key,
      'tin': data.tin,
      'bhfId': data.bhf_id,
    }

    // Add optional fields if they exist
    if (data.dvc_id) headers.dvcId = data.dvc_id
    if (data.sdc_id) headers.sdcId = data.sdc_id
    if (data.mrc_no) headers.mrcNo = data.mrc_no

    return { success: true, headers }
  } catch (error) {
    console.error('Error getting KRA headers:', error)
    return { 
      success: false, 
      error: 'Failed to get KRA headers. Please ensure device is initialized.' 
    }
  }
}

export function validateKRAHeaders(headers: KRAHeaders): boolean {
  return !!(headers.cmcKey && headers.tin && headers.bhfId)
} 