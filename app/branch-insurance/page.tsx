'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Shield, Send, Loader2, CheckCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface InsuranceFormData {
  isrccCd: string
  isrccNm: string
  isrcRt: number
  useYn: string
  regrId: string
  regrNm: string
  modrId: string
  modrNm: string
}

export default function BranchInsurancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<InsuranceFormData>({
    isrccCd: '',
    isrccNm: '',
    isrcRt: 0,
    useYn: 'Y',
    regrId: 'Admin',
    regrNm: 'Admin',
    modrId: 'Admin',
    modrNm: 'Admin'
  })

  const handleInputChange = (field: keyof InsuranceFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.isrccCd || !formData.isrccNm || !formData.isrcRt) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/kra/save-branch-insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insuranceData: formData })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Branch insurance information sent to KRA successfully",
        })
        setSuccess(true)
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            isrccCd: '',
            isrccNm: '',
            isrcRt: 0,
            useYn: 'Y',
            regrId: 'Admin',
            regrNm: 'Admin',
            modrId: 'Admin',
            modrNm: 'Admin'
          })
          setSuccess(false)
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send insurance information to KRA",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error sending insurance data:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending insurance data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Branch Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Insurance Code */}
                <div className="space-y-2">
                  <Label htmlFor="isrccCd">Insurance Code *</Label>
                  <Input
                    id="isrccCd"
                    value={formData.isrccCd}
                    onChange={(e) => handleInputChange('isrccCd', e.target.value)}
                    placeholder="e.g., ISRCC01"
                    required
                  />
                </div>

                {/* Insurance Name */}
                <div className="space-y-2">
                  <Label htmlFor="isrccNm">Insurance Name *</Label>
                  <Input
                    id="isrccNm"
                    value={formData.isrccNm}
                    onChange={(e) => handleInputChange('isrccNm', e.target.value)}
                    placeholder="e.g., ISRCC NAME"
                    required
                  />
                </div>

                {/* Insurance Rate */}
                <div className="space-y-2">
                  <Label htmlFor="isrcRt">Insurance Rate (%) *</Label>
                  <Input
                    id="isrcRt"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.isrcRt}
                    onChange={(e) => handleInputChange('isrcRt', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 20"
                    required
                  />
                </div>

                {/* Use Y/N */}
                <div className="space-y-2">
                  <Label htmlFor="useYn">Use Status</Label>
                  <Select
                    value={formData.useYn}
                    onValueChange={(value) => handleInputChange('useYn', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select use status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes (Active)</SelectItem>
                      <SelectItem value="N">No (Inactive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registrar ID */}
                <div className="space-y-2">
                  <Label htmlFor="regrId">Registrar ID</Label>
                  <Input
                    id="regrId"
                    value={formData.regrId}
                    onChange={(e) => handleInputChange('regrId', e.target.value)}
                    placeholder="e.g., Admin"
                  />
                </div>

                {/* Registrar Name */}
                <div className="space-y-2">
                  <Label htmlFor="regrNm">Registrar Name</Label>
                  <Input
                    id="regrNm"
                    value={formData.regrNm}
                    onChange={(e) => handleInputChange('regrNm', e.target.value)}
                    placeholder="e.g., Admin"
                  />
                </div>

                {/* Modifier ID */}
                <div className="space-y-2">
                  <Label htmlFor="modrId">Modifier ID</Label>
                  <Input
                    id="modrId"
                    value={formData.modrId}
                    onChange={(e) => handleInputChange('modrId', e.target.value)}
                    placeholder="e.g., Admin"
                  />
                </div>

                {/* Modifier Name */}
                <div className="space-y-2">
                  <Label htmlFor="modrNm">Modifier Name</Label>
                  <Input
                    id="modrNm"
                    value={formData.modrNm}
                    onChange={(e) => handleInputChange('modrNm', e.target.value)}
                    placeholder="e.g., Admin"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || success}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending to KRA...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Sent Successfully
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to KRA
                    </>
                  )}
                </Button>
              </form>

              {/* Information Section */}
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Information</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• This form sends branch insurance information to KRA</p>
                  <p>• All fields marked with * are required</p>
                  <p>• Insurance rate should be between 0-100%</p>
                  <p>• Use status determines if the insurance is active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 