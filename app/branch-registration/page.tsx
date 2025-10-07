'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Building2, Loader2, CheckCircle, AlertCircle, Smartphone, Database, KeyRound } from "lucide-react"
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface RegistrationForm {
  tin: string
  bhfId: string
  dvcSrlNo: string
  registrationType: 'device_init' | 'branch_reg'
}

interface ManualCredentialsForm {
  tin: string
  bhfId: string
  cmcKey: string
}

export default function BranchRegistrationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<RegistrationForm>({
    tin: '',
    bhfId: '',
    dvcSrlNo: '',
    registrationType: 'branch_reg'
  })
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState<ManualCredentialsForm>({ tin: '', bhfId: '', cmcKey: '' })

  // Handle input changes
  const handleInputChange = (field: keyof RegistrationForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.tin.trim()) {
      toast({
        title: "Validation Error",
        description: "PIN Number is required",
        variant: "destructive"
      })
      return false
    }

    if (!formData.bhfId.trim()) {
      toast({
        title: "Validation Error",
        description: "Branch ID is required",
        variant: "destructive"
      })
      return false
    }

    if (!formData.dvcSrlNo.trim()) {
      toast({
        title: "Validation Error",
        description: "Serial Number is required",
        variant: "destructive"
      })
      return false
    }

    // Validate PIN Number format (should be alphanumeric)
    if (!/^[A-Z0-9]+$/.test(formData.tin.trim())) {
      toast({
        title: "Validation Error",
        description: "PIN Number should contain only uppercase letters and numbers",
        variant: "destructive"
      })
      return false
    }

    // Validate Branch ID format (should be numeric)
    if (!/^\d+$/.test(formData.bhfId.trim())) {
      toast({
        title: "Validation Error",
        description: "Branch ID should contain only numbers",
        variant: "destructive"
      })
      return false
    }

    // Validate Serial Number format (should be alphanumeric)
    if (!/^[A-Z0-9]+$/.test(formData.dvcSrlNo.trim())) {
      toast({
        title: "Validation Error",
        description: "Serial Number should contain only uppercase letters and numbers",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      console.log('Submitting registration:', formData)

      const response = await fetch('/api/kra/register-device-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tin: formData.tin.trim(),
          bhfId: formData.bhfId.trim(),
          dvcSrlNo: formData.dvcSrlNo.trim(),
          registrationType: formData.registrationType
        })
      })

      const data = await response.json()
      console.log('Registration Response:', data)

      if (data.resultCd === "000") {
        setSuccess(true)
        toast({
          title: "Registration Successful",
          description: `Your ${formData.registrationType === 'device_init' ? 'device has been initialized' : 'branch has been registered'} with KRA successfully`,
        })
      } else {
        toast({
          title: "Registration Failed",
          description: data.resultMsg || "Failed to register with KRA",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error during registration:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Save manual credentials without initialization
  const handleSaveManual = async () => {
    if (!manual.tin.trim() || !manual.bhfId.trim() || !manual.cmcKey.trim()) {
      toast({ title: 'Missing fields', description: 'PIN, Branch and CMC Key are required', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/kra/save-device-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tin: manual.tin.trim(), bhfId: manual.bhfId.trim(), cmcKey: manual.cmcKey.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save credentials')
      }
      toast({ title: 'Credentials Saved', description: 'Device credentials saved for this environment.' })
      setManualOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save credentials', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      tin: '',
      bhfId: '',
      dvcSrlNo: '',
      registrationType: 'branch_reg'
    })
    setSuccess(false)
  }

  const getRegistrationTypeLabel = () => {
    return formData.registrationType === 'device_init' ? 'Device Initialization' : 'Branch Registration'
  }

  const getRegistrationTypeDescription = () => {
    return formData.registrationType === 'device_init' 
      ? 'Initialize your eTIMS device with KRA'
      : 'Register your business branch with KRA eTIMS'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                {formData.registrationType === 'device_init' ? (
                  <Smartphone className="h-8 w-8 text-primary" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getRegistrationTypeLabel()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getRegistrationTypeDescription()}
            </p>
          </div>

          {/* Success State */}
          {success ? (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                  Registration Successful!
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-6">
                  Your {formData.registrationType === 'device_init' ? 'device has been initialized' : 'branch has been registered'} with KRA eTIMS successfully. You can now proceed with your business operations.
                </p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Register Another
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Registration Form */
            <Card className="shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">
                  Enter Registration Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Registration Type */}
                  <div className="space-y-2">
                    <Label htmlFor="registrationType" className="text-sm font-medium">
                      Registration Type *
                    </Label>
                    <Select
                      value={formData.registrationType}
                      onValueChange={(value: 'device_init' | 'branch_reg') => 
                        handleInputChange('registrationType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select registration type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="device_init">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Device Initialization
                          </div>
                        </SelectItem>
                        <SelectItem value="branch_reg">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Branch Registration
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose whether to initialize a device or register a branch
                    </p>
                  </div>

                  {/* PIN Number */}
                  <div className="space-y-2">
                    <Label htmlFor="tin" className="text-sm font-medium">
                      PIN Number *
                    </Label>
                    <Input
                      id="tin"
                      type="text"
                      placeholder="e.g., P052380018M"
                      value={formData.tin}
                      onChange={(e) => handleInputChange('tin', e.target.value.toUpperCase())}
                      className="h-12 text-center text-lg font-mono tracking-wider"
                      maxLength={20}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter your KRA Tax Identification Number
                    </p>
                  </div>

                  {/* Branch ID */}
                  <div className="space-y-2">
                    <Label htmlFor="bhfId" className="text-sm font-medium">
                      Branch ID *
                    </Label>
                    <Input
                      id="bhfId"
                      type="text"
                      placeholder="e.g., 01"
                      value={formData.bhfId}
                      onChange={(e) => handleInputChange('bhfId', e.target.value)}
                      className="h-12 text-center text-lg font-mono tracking-wider"
                      maxLength={10}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter your KRA Business Hub Facility ID
                    </p>
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Label htmlFor="dvcSrlNo" className="text-sm font-medium">
                      Device Serial Number *
                    </Label>
                    <Input
                      id="dvcSrlNo"
                      type="text"
                      placeholder="e.g., ABCD1234"
                      value={formData.dvcSrlNo}
                      onChange={(e) => handleInputChange('dvcSrlNo', e.target.value.toUpperCase())}
                      className="h-12 text-center text-lg font-mono tracking-wider"
                      maxLength={20}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter your device serial number
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {formData.registrationType === 'device_init' ? 'Initializing Device...' : 'Registering Branch...'}
                      </>
                    ) : (
                      formData.registrationType === 'device_init' ? 'Initialize Device' : 'Register Branch'
                    )}
                  </Button>
                </form>

                {/* Manual Credentials Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>

                {/* Manual Credentials Form (no initialization) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <span>Use existing device credentials</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setManualOpen((v) => !v)}>
                      {manualOpen ? 'Hide' : 'Enter PIN/Branch/CMC Key'}
                    </Button>
                  </div>
                  {manualOpen && (
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>PIN Number</Label>
                        <Input value={manual.tin} onChange={(e) => setManual((p) => ({ ...p, tin: e.target.value.toUpperCase() }))} placeholder="e.g., P052380018M" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Branch ID</Label>
                        <Input value={manual.bhfId} onChange={(e) => setManual((p) => ({ ...p, bhfId: e.target.value }))} placeholder="e.g., 01" />
                      </div>
                      <div className="grid gap-2">
                        <Label>CMC Key</Label>
                        <Input value={manual.cmcKey} onChange={(e) => setManual((p) => ({ ...p, cmcKey: e.target.value }))} placeholder="your CMC Key" />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleSaveManual} disabled={loading} className="h-10">
                          Save Credentials
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Information Section */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Important Information:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• PIN Number should be your valid KRA Tax Identification Number</li>
                        <li>• Branch ID is your KRA Business Hub Facility ID</li>
                        <li>• Device Serial Number is unique to your eTIMS device</li>
                        <li>• All fields are required for successful registration</li>
                        <li>• Registration details will be stored in the database</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
} 