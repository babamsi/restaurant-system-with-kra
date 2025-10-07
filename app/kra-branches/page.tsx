'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { 
  Building2, 
  Smartphone, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy,
  Trash2,
  RefreshCw,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Home,
  LogOut,
  ArrowRightCircle
} from "lucide-react"
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { kraRegistrationsService, KRARegistration } from '@/lib/kra-registrations-service'
import { useKRABranches, KRABranch } from '@/hooks/use-kra-branches'

export default function KRARegistrationsPage() {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<KRARegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRegistration, setActiveRegistration] = useState<KRARegistration | null>(null)
  const [showBranches, setShowBranches] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // KRA branches hook
  const { branches, loading: loadingBranches, loadBranches, error: branchesError } = useKRABranches()

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const result = await kraRegistrationsService.getRegistrations()
      
      if (result.success) {
        setRegistrations(result.data || [])
        
        // Get active registration (latest successful)
        const activeResult = await kraRegistrationsService.getActiveRegistration()
        if (activeResult.success && activeResult.data) {
          setActiveRegistration(activeResult.data)
        }
      } else {
        toast({
          title: "Error Loading Registrations",
          description: result.error || "Failed to load registrations",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Registrations",
        description: "Failed to load registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [])

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: `${label} copied successfully`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Delete registration
  const handleDeleteRegistration = async (id: string) => {
    try {
      const result = await kraRegistrationsService.deleteRegistration(id)
      if (result.success) {
        toast({
          title: "Registration Deleted",
          description: "Registration has been deleted successfully",
        })
        loadRegistrations() // Reload the list
      } else {
        toast({
          title: "Error Deleting Registration",
          description: result.error || "Failed to delete registration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Deleting Registration",
        description: "Failed to delete registration",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRegistrationTypeIcon = (type: string) => {
    return type === 'device_init' ? <Smartphone className="h-4 w-4" /> : <Building2 className="h-4 w-4" />
  }

  const getRegistrationTypeLabel = (type: string) => {
    return type === 'device_init' ? 'Device Initialization' : 'Branch Registration'
  }

  const getBranchStatusBadge = (status: string) => {
    switch (status) {
      case '01':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case '02':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getHQBadge = (hqYn: string) => {
    return hqYn === 'Y' ? (
      <Badge className="bg-blue-100 text-blue-800">
        <Home className="h-3 w-3 mr-1" />
        Headquarters
      </Badge>
    ) : (
      <Badge variant="outline">Branch</Badge>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading KRA registrations...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">KRA Registrations</h1>
            <p className="text-muted-foreground mt-2">
              Manage device initializations and branch registrations with KRA
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive"
              onClick={async () => {
                try {
                  setLoggingOut(true)
                  const res = await fetch('/api/kra/logout-credentials', { method: 'POST' })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Logout failed')
                  toast({ title: 'KRA Logged Out', description: 'Device credentials cleared for this environment.' })
                  await loadRegistrations()
                } catch (e: any) {
                  toast({ title: 'Error', description: e?.message || 'Failed to logout KRA', variant: 'destructive' })
                } finally {
                  setLoggingOut(false)
                }
              }}
              disabled={loggingOut}
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
              Logout KRA
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                loadRegistrations()
                loadBranches()
              }}
              disabled={loading || loadingBranches}
            >
              {loading || loadingBranches ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowBranches(!showBranches)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {showBranches ? 'Hide' : 'Show'} Branches
            </Button>
            <Button onClick={() => window.location.href = '/branch-registration'}>
              <Database className="h-4 w-4 mr-2" />
              New Registration
            </Button>
          </div>
        </div>

        {/* Active Registration Card */}
        {activeRegistration && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Active Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Device ID</p>
                  <p className="text-lg font-mono">{activeRegistration.dvc_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">SDC ID</p>
                  <p className="text-lg font-mono">{activeRegistration.sdc_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">MRC No</p>
                  <p className="text-lg font-mono">{activeRegistration.mrc_no}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Note:</strong> This registration is currently active and will be used for KRA API calls.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branches Section */}
        {showBranches && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                KRA Branches ({branches.length})
                {loadingBranches && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBranches ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p>Loading branches from KRA...</p>
                </div>
              ) : branchesError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <p className="text-lg font-semibold">Failed to Load Branches</p>
                    <p className="text-sm">{branchesError}</p>
                  </div>
                  <Button onClick={loadBranches} disabled={loadingBranches}>
                    {loadingBranches ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No branches found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch ID</TableHead>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((branch) => (
                        <TableRow key={`${branch.tin}-${branch.bhfId}`}>
                          <TableCell className="font-mono text-sm">{branch.bhfId}</TableCell>
                          <TableCell>
                            <div className="font-medium">{branch.bhfNm}</div>
                            <div className="text-sm text-muted-foreground">TIN: {branch.tin}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <div>
                                <div>{branch.prvncNm}, {branch.dstrtNm}</div>
                                <div className="text-muted-foreground">{branch.sctrNm}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{branch.mgrNm}</div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {branch.mgrTelNo}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {branch.mgrEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getBranchStatusBadge(branch.bhfSttsCd)}
                          </TableCell>
                          <TableCell>
                            {getHQBadge(branch.hqYn)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(branch.bhfId, 'Branch ID')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    setSwitching(branch.bhfId)
                                    const res = await fetch('/api/kra/set-active-branch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ tin: branch.tin, bhfId: branch.bhfId })
                                    })
                                    const data = await res.json()
                                    if (!res.ok) throw new Error(data.error || 'Failed to switch branch')
                                    toast({ title: 'Branch Switched', description: `Active KRA set to Branch ${branch.bhfId}` })
                                    await loadRegistrations()
                                  } catch (e: any) {
                                    toast({ title: 'Error', description: e?.message || 'Failed to switch branch', variant: 'destructive' })
                                  } finally {
                                    setSwitching(null)
                                  }
                                }}
                                disabled={switching === branch.bhfId}
                              >
                                {switching === branch.bhfId ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Switching...
                                  </>
                                ) : (
                                  <>
                                    <ArrowRightCircle className="h-4 w-4 mr-2" />
                                    Make Active
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              All Registrations ({registrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No registrations found</p>
                <p className="text-sm">Create your first registration to get started</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>TIN</TableHead>
                      <TableHead>Branch ID</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRegistrationTypeIcon(registration.registration_type)}
                            <span className="text-sm">{getRegistrationTypeLabel(registration.registration_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{registration.tin}</TableCell>
                        <TableCell className="font-mono text-sm">{registration.bhf_id}</TableCell>
                        <TableCell>
                          {registration.dvc_id ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{registration.dvc_id}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(registration.dvc_id!, 'Device ID')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(registration.kra_status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(registration.created_at).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {new Date(registration.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (registration.kra_response) {
                                  copyToClipboard(JSON.stringify(registration.kra_response, null, 2), 'KRA Response')
                                }
                              }}
                              disabled={!registration.kra_response}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRegistration(registration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 