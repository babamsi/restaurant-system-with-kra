'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { Users, Send, CheckCircle, XCircle, Search } from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
  active: boolean
  kra_status?: string
  kra_submission_date?: string
}

export default function BranchUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSendingToKRA, setIsSendingToKRA] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const sendUserToKRA = async (user: User) => {
    setIsSendingToKRA(user.id)
    
    try {
      // Get the user's password hash from the database
      const userResponse = await fetch(`/api/users/${user.id}`)
      const userData = await userResponse.json()
      
      if (!userResponse.ok) {
        toast({
          title: "Error",
          description: "Failed to get user details",
          variant: "destructive",
        })
        return
      }

      // Create a proper userId (0-20 characters) using user's UUID without hyphens
      const kraUserId = user.id.replace(/-/g, '').substring(0, 20)
      
      const branchUserData = {
        userId: kraUserId,
        userNm: user.name,
        pwd: userData.user.passcode_hash, // Use the actual password hash
        adrs: null,
        cntc: null,
        authCd: null,
        remark: `Branch user for ${user.name} (${user.role})`,
        useYn: 'Y',
        regrNm: 'Admin',
        regrId: 'Admin',
        modrNm: 'Admin',
        modrId: 'Admin',
        originalUserId: user.id // Add the original full UUID for database update
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendToKRA: true,
          branchUserData
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the user's KRA status locally using the full UUID
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, kra_status: 'ok', kra_submission_date: new Date().toISOString() }
            : u
        ))
        
        toast({
          title: "User Sent to KRA",
          description: `${user.name} has been sent to KRA successfully`,
        })
      } else {
        toast({
          title: "KRA Error",
          description: data.error || "Failed to send user to KRA",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "KRA Error",
        description: "Failed to send user to KRA",
        variant: "destructive",
      })
    } finally {
      setIsSendingToKRA(null)
    }
  }

  const getKRAStatusBadge = (status: string | null | undefined) => {
    if (status === 'ok') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sent to KRA</Badge>
    } else {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Not Sent</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: 'bg-purple-500',
      manager: 'bg-blue-500',
      staff: 'bg-green-500',
      default: 'bg-gray-500'
    }
    
    return (
      <Badge variant="default" className={roleColors[role as keyof typeof roleColors] || roleColors.default}>
        {role}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    user.role.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-32 w-32 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-4">Error Loading Users</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={fetchUsers} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="mr-3" />
            Branch Users
          </h1>
          <p className="text-gray-600 mt-2">
            Send existing users to KRA as branch user accounts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>
                Select users to send to KRA as branch user accounts
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Create users in the Users section first.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KRA Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getKRAStatusBadge(user.kra_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.kra_status !== 'ok' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendUserToKRA(user)}
                            disabled={isSendingToKRA === user.id}
                          >
                            {isSendingToKRA === user.id ? (
                              'Sending...'
                            ) : (
                              <>
                                <Send className="w-3 h-3 mr-1" />
                                Send to KRA
                              </>
                            )}
                          </Button>
                        )}
                        {user.kra_status === 'ok' && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Already Sent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 