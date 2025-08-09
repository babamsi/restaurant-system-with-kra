import { supabase } from './supabase'

export interface User {
  id: string
  name: string
  role: string
  active: boolean
  kra_status?: string
  kra_submission_date?: string
  created_at?: string
  updated_at?: string
}

export interface SendUserToKRAData {
  userId: string // UUID with hyphens removed, truncated to 0-20 characters for KRA
  userNm: string
  pwd: string // Should be the actual password_hash from user
  adrs?: string | null
  cntc?: string | null
  authCd?: string | null
  remark?: string | null
  useYn?: string
  regrNm?: string
  regrId?: string
  modrNm?: string
  modrId?: string
  originalUserId?: string // Original full UUID for database updates
}

class BranchUsersService {
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, active, kra_status, kra_submission_date, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      return { success: false, error: error.message }
    }
  }

  async getUser(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, active, kra_status, kra_submission_date, created_at, updated_at')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching user:', error)
      return { success: false, error: error.message }
    }
  }

  async sendUserToKRA(userData: SendUserToKRAData) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendToKRA: true,
          branchUserData: userData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send user to KRA')
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Error sending user to KRA:', error)
      return { success: false, error: error.message }
    }
  }

  async updateUserKRAStatus(userId: string, kraStatus: string, submissionDate?: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          kra_status: kraStatus, 
          kra_submission_date: submissionDate || new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error updating user KRA status:', error)
      return { success: false, error: error.message }
    }
  }
}

export const branchUsersService = new BranchUsersService() 