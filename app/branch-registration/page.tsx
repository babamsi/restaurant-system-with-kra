'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface BranchRegistrationForm {
  tin: string
  bhfId: string
  dvcSrlNo: string
}

export default function BranchRegistrationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<BranchRegistrationForm>({
    tin: '',
    bhfId: '',
    dvcSrlNo: ''
  })

  // Handle input changes
  const handleInputChange = (field: keyof BranchRegistrationForm, value: string) => {
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
      console.log('Submitting branch registration:', formData)

      const response = await fetch('/api/kra/register-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tin: formData.tin.trim(),
          bhfId: formData.bhfId.trim(),
          dvcSrlNo: formData.dvcSrlNo.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        toast({
          title: "Branch Registration Successful",
          description: "Your branch has been successfully registered with KRA",
        })
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to register branch with KRA",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error registering branch:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred during branch registration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      tin: '',
      bhfId: '',
      dvcSrlNo: ''
    })
    setSuccess(false)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Branch Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Register your business branch with KRA eTIMS
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
                  Your branch has been successfully registered with KRA eTIMS. You can now proceed with your business operations.
                </p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Register Another Branch
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Registration Form */
            <Card className="shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">
                  Enter Branch Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        Registering Branch...
                      </>
                    ) : (
                      'Register Branch'
                    )}
                  </Button>
                </form>

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