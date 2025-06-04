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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function BetaAccessForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [totalSteps, setTotalSteps] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    businessSize: "",
    interests: [] as string[],
    message: "",
    additionalInfo: {} as Record<string, string>,
  })
  const [hasQuestionnaireData, setHasQuestionnaireData] = useState(false)

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

        if (questionnaireData.needs) {
          // Convert comma-separated string to array if needed
          const needsArray =
            typeof questionnaireData.needs === "string"
              ? questionnaireData.needs.split(",").map((item) => item.trim())
              : questionnaireData.needs

          // Map needs to interests
          newData.interests = mapNeeds(needsArray)
        }

        // Store all questionnaire data in additionalInfo
        newData.additionalInfo = questionnaireData

        return newData
      })

      setHasQuestionnaireData(true)

      // Skip to contact info if we already have business info
      if (questionnaireData.companySize && questionnaireData.needs) {
        setStep(1)
        setTotalSteps(2) // Reduce total steps
      }
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

  // Helper function to map needs from questionnaire to interests format
  const mapNeeds = (needs: string[]): string[] => {
    const needsMap: Record<string, string> = {
      inventory: "Inventory Management",
      pos: "Point of Sale",
      customers: "Customer Management",
      reporting: "Financial Reporting",
      multi: "Multi-location Support",
      expenses: "Financial Reporting",
      api: "Mobile Access",
      supply: "Supply Chain Management",
    }

    return needs.map((need) => needsMap[need] || need).filter(Boolean)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const isStepValid = () => {
    switch (step) {
      case 1:
        // If we have questionnaire data, we only need contact info
        if (hasQuestionnaireData) {
          return formData.businessName && formData.contactName && formData.email
        }
        return formData.businessName && formData.contactName && formData.email
      case 2:
        // Skip business size validation if we already have it
        if (hasQuestionnaireData && formData.businessSize && formData.interests.length > 0) {
          return true
        }
        return formData.businessSize && formData.interests.length > 0
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
      if (window.location.pathname === "/plans" && window.__questionnaire_data) {
        setFormData((prev) => ({
          ...prev,
          additionalInfo: {
            ...prev.additionalInfo,
            ...window.__questionnaire_data,
          },
        }))
      }

      const response = await fetch("/api/beta-access", {
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
      toast.success(data.message || "Your request has been submitted successfully!")

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
    // If we have questionnaire data, we only need contact info and message
    if (hasQuestionnaireData) {
      if (step === 1) {
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
      } else if (step === 2) {
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Additional Information</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us more about your business needs..."
                className="min-h-[100px]"
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Summary</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Business:</dt>
                  <dd>{formData.businessName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Contact:</dt>
                  <dd>{formData.contactName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Email:</dt>
                  <dd>{formData.email}</dd>
                </div>
                {formData.additionalInfo.recommendedPlan && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Selected Plan:</dt>
                    <dd>{formData.additionalInfo.recommendedPlan.replace("tier", "Enterprise ")}</dd>
                  </div>
                )}
              </dl>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Your request has been submitted successfully! We'll contact you shortly.</p>
              </div>
            )}
          </div>
        )
      }
    } else {
      // Regular form flow if no questionnaire data
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
              <div className="grid gap-2">
                <Label htmlFor="businessSize">
                  Business Size <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.businessSize}
                  onValueChange={(value) => handleSelectChange("businessSize", value)}
                  required
                >
                  <SelectTrigger id="businessSize">
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

              <div className="grid gap-2">
                <Label>
                  What are you interested in? <span className="text-red-500">*</span>
                </Label>
                <div className="grid gap-2">
                  {[
                    "Inventory Management",
                    "Point of Sale",
                    "Customer Management",
                    "Financial Reporting",
                    "Multi-location Support",
                    "Mobile Access",
                    "Payment Processing",
                  ].map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleCheckboxChange(interest)}
                      />
                      <Label htmlFor={`interest-${interest}`} className="font-normal">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        case 3:
          return (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="message">Additional Information</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us more about your business needs..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Summary</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Business:</dt>
                    <dd>{formData.businessName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Contact:</dt>
                    <dd>{formData.contactName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Email:</dt>
                    <dd>{formData.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Size:</dt>
                    <dd>{formData.businessSize}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Interests:</dt>
                    <dd>{formData.interests.join(", ")}</dd>
                  </div>
                </dl>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {isSuccess && (
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Your request has been submitted successfully! We'll contact you shortly.</p>
                </div>
              )}
            </div>
          )
        default:
          return null
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Started with Maamul</DialogTitle>
          <DialogDescription>
            {hasQuestionnaireData
              ? "Complete your information to get early access to our platform."
              : "Tell us about your business to get early access to our platform."}
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
              <Button type="submit" onClick={handleSubmit} disabled={isLoading || isSuccess}>
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
                  "Submit Request"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
