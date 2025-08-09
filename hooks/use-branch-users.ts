import { useState, useEffect } from 'react'
import { branchUsersService, User, SendUserToKRAData } from '@/lib/branch-users-service'

export function useBranchUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await branchUsersService.getUsers()
      
      if (result.success) {
        setUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const sendUserToKRA = async (userData: SendUserToKRAData) => {
    try {
      setError(null)
      
      const result = await branchUsersService.sendUserToKRA(userData)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to send user to KRA')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send user to KRA'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const updateUserKRAStatus = async (userId: string, kraStatus: string, submissionDate?: string) => {
    try {
      setError(null)
      
      const result = await branchUsersService.updateUserKRAStatus(userId, kraStatus, submissionDate)
      
      if (result.success) {
        setUsers(prev => 
          prev.map(user => user.id === userId ? result.data : user)
        )
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to update user KRA status')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update user KRA status'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    sendUserToKRA,
    updateUserKRAStatus
  }
} 