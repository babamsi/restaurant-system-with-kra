"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, AlertCircle, Building2, Users, Calendar, CreditCard } from 'lucide-react'
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function PlanAccessForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [totalSteps, setTotalSteps] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    businessSize: "",
    industry: "",
    implementationTimeline: "",
    paymentPreference: "",
    additionalRequirements: "",
    planData: {} as Record<string, any>,
  })

  // Check for existing questionnaire data on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.__questionnaire_data) {
      const questionnaireData = window.__questionnaire_data

      // Pre-fill form data from questionnaire
      setFormData((prev) => {
        const newData = { ...prev }

        // Map questionnaire data to form fields
        if (questionnaireData.companySize) {
          newData.businessSize = mapCompanySize(questionnaireData.companySize)
        }

        if (questionnaireData.industry) {
          newData.industry = questionnaireData.industry
        }

        if (questionnaireData.billingPreference) {
          newData.paymentPreference = questionnaireData.billingPreference
        }

        if (questionnaireData.implementationTimeline) {
          newData.implementationTimeline = questionnaireData.implementationTimeline
        }

        // Store all questionnaire data in planData
        newData.planData = questionnaireData

        return newData
      })
    }
  }, [])

  // Helper function to map company size from questionnaire to form format
  const mapCompanySize = (companySize: string): string => {
    const sizeMap: Record<string, string> = {
      small: "1-10",
      medium: "11-50",
      large: "51-200",
      enterprise: "201+",
    }

    return sizeMap[companySize] || companySize
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.businessName && formData.contactName && formData.email
      case 2:
        return true
      default:
        return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Add any additional information from the questionnaire if available
      if (typeof window !== "undefined" && window.__questionnaire_data) {
        setFormData((prev) => ({
          ...prev,
          planData: {
            ...prev.planData,
            ...window.__questionnaire_data,
          },
        }))
      }

      const response = await fetch("/api/plan-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.")
      }

      setIsSuccess(true)
      toast.success(data.message || "Your plan request has been submitted successfully!")

      // Close the form after a delay
      setTimeout(() => {
        onClose()
      }, 3000)
    } catch (error) {
      console.error("Submission error:", error)
      setError(error instanceof Error ? error.message : "Failed to submit request. Please try again.")
      toast.error(error instanceof Error ? error.message : "Failed to submit request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Your company name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Your phone number"
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.industry ? (
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="capitalize">
                      {formData.industry === "logistics" ? "Logistics & Distribution" : formData.industry}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                    <SelectTrigger id="industry" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="logistics">Logistics & Distribution</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="businessSize">Business Size</Label>
                <Select
                  value={formData.businessSize}
                  onValueChange={(value) => handleSelectChange("businessSize", value)}
                >
                  <SelectTrigger id="businessSize" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select business size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201+">201+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.implementationTimeline ? (
                <div className="grid gap-2">
                  <Label htmlFor="implementationTimeline">Implementation Timeline</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>
                      {formData.implementationTimeline === "immediate" && "Immediate (1-2 weeks)"}
                      {formData.implementationTimeline === "1-3months" && "1-3 months"}
                      {formData.implementationTimeline === "3-6months" && "3-6 months"}
                      {formData.implementationTimeline === "6+months" && "6+ months"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="implementationTimeline">Implementation Timeline</Label>
                  <Select
                    value={formData.implementationTimeline}
                    onValueChange={(value) => handleSelectChange("implementationTimeline", value)}
                  >
                    <SelectTrigger id="implementationTimeline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (1-2 weeks)</SelectItem>
                      <SelectItem value="1-3months">1-3 months</SelectItem>
                      <SelectItem value="3-6months">3-6 months</SelectItem>
                      <SelectItem value="6+months">6+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.paymentPreference ? (
                <div className="grid gap-2">
                  <Label htmlFor="paymentPreference">Payment Preference</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>
                      {formData.paymentPreference === "quarterly" && "Quarterly Billing"}
                      {formData.paymentPreference === "annual" && "Annual Billing (Save 15%)"}
                      {formData.paymentPreference === "quarterly" && "Quarterly Billing"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="paymentPreference">Payment Preference</Label>
                  <Select
                    value={formData.paymentPreference}
                    onValueChange={(value) => handleSelectChange("paymentPreference", value)}
                  >
                    <SelectTrigger id="paymentPreference" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select payment preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly Billing</SelectItem>
                      <SelectItem value="annual">Annual Billing (Save 15%)</SelectItem>
                      <SelectItem value="quarterly">Quarterly Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="additionalRequirements">Additional Requirements or Questions</Label>
              <Textarea
                id="additionalRequirements"
                name="additionalRequirements"
                value={formData.additionalRequirements}
                onChange={handleInputChange}
                placeholder="Tell us about any specific requirements or questions you have..."
                className="min-h-[100px]"
              />
            </div>

            {formData.planData && formData.planData.recommendedPlan && (
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-primary mr-2" />
                  Selected Plan
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {formData.planData.recommendedPlan.includes("tier") ? 
                      formData.planData.recommendedPlan.replace(/tier(\d)/, (match, num) => {
                        const tierNames = {
                          "1": "Starter",
                          "2": "Growth",
                          "3": "Professional",
                          "4": "Business",
                          "5": "Enterprise S",
                          "6": "Enterprise M",
                          "7": "Enterprise L",
                          "8": "Enterprise XL"
                        };
                        return tierNames[num] || match;
                      }) : 
                      formData.planData.recommendedPlan
                    }
                  </span>
                  <Badge variant="outline" className="bg-primary/10">
                    {formData.planData.billingPreference === "annual" ? "Annual" : "Monthly"}
                  </Badge>
                </div>
                {formData.planData.monthlyPrice && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formData.planData.billingPreference === "annual"
                      ? `$${Math.round(formData.planData.annualPrice / 12)}/month (billed annually)`
                      : `$${formData.planData.monthlyPrice}/month`}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Your plan request has been submitted successfully! Our team will contact you shortly to discuss next
                  steps.
                </p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Your Enterprise Plan</DialogTitle>
          <DialogDescription>
            Complete your information to get started with your selected enterprise plan.
          </DialogDescription>
          <Progress value={(step / totalSteps) * 100} className="h-2 mt-2" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {renderStepContent()}
        </form>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          {step < totalSteps ? (
            <>
              <Button type="button" variant="outline" onClick={step > 1 ? prevStep : onClose}>
                {step > 1 ? "Back" : "Cancel"}
              </Button>
              <Button type="button" onClick={nextStep} disabled={!isStepValid()}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading || isSuccess}>
                Back
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || isSuccess}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submitted!
                  </>
                ) : (
                  "Request Plan Access"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
