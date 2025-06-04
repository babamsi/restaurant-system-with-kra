"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Accordion } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"

import { ContactSection } from "./partner-form/contact-section"
import { CompanySection } from "./partner-form/company-section"
import { StrategicSection } from "./partner-form/strategic-section"
import { VisionSection } from "./partner-form/vision-section"
import { PartnerFormValues } from "./partner-form/types"

const formSchema = z.object({
  // Contact Information
  contactName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Company Information
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string()
  .min(1, "Website is required")
  .regex(/^(www\.|(?:http:\/\/|https:\/\/)?)[^\s]+/, "Please enter a valid website URL"),
  businessType: z.string({ required_error: "Please select a business type" }),
  yearsInBusiness: z.string({ required_error: "Please select years in business" }),
  country: z.string({ required_error: "Please select your country" }),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }),
  
  // Strategic Information
  primaryObjective: z.string({ required_error: "Please select your primary objective" }),
  targetMarkets: z.array(z.string()).min(1, "Please select at least one target market"),
  expertise: z.array(z.string()).min(1, "Please select at least one area of expertise"),
  existingClients: z.string().min(10, "Please provide information about your existing clients"),
  
  // Vision
  collaborationIdeas: z.string().min(50, "Please provide more detail about your collaboration ideas"),
  resourcesCommitment: z.string().min(50, "Please provide more detail about your resource commitment"),
  expectedOutcomes: z.string().min(50, "Please provide more detail about your expected outcomes"),
  meetingDate: z.string({ required_error: "Please select a meeting date" }),
  meetingTime: z.string({ required_error: "Please select a meeting time" }),
})

export function PartnerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Contact Information
      contactName: "",
      role: "",
      email: "",
      phone: "",
      
      // Company Information
      companyName: "",
      website: "",
      businessType: "",
      yearsInBusiness: "",
      country: "",
      socialLinks: {
        linkedin: "",
        twitter: "",
        instagram: "",
      },
      
      // Strategic Information
      primaryObjective: "",
      targetMarkets: [],
      expertise: [],
      existingClients: "",
      
      // Vision
      collaborationIdeas: "",
      resourcesCommitment: "",
      expectedOutcomes: "",
      meetingDate: "",
      meetingTime: "",
    },
    mode: "onTouched", // Only validate on blur after touch
    reValidateMode: "onSubmit", // Only revalidate on submit
    criteriaMode: "firstError", // Show only first error
    shouldFocusError: true
  })

  const getSectionCompletion = (section: string) => {
    const fields = {
      'contact-info': ['contactName', 'role', 'email', 'phone'],
      'company-info': ['companyName', 'website', 'businessType', 'yearsInBusiness', 'country'],
      'strategic-alignment': ['primaryObjective', 'targetMarkets', 'expertise', 'existingClients'],
      'partnership-vision': ['collaborationIdeas', 'resourcesCommitment', 'expectedOutcomes']
    }[section] || []

    const completed = fields.filter(field => {
      const value = form.getValues(field)
      return value && (Array.isArray(value) ? value.length > 0 : true)
    }).length

    return `${completed}/${fields.length}`
  }

  async function onSubmit(values: PartnerFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to submit")

      toast.success("Application submitted successfully!")
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
      }, 6000)
      form.reset()
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-background/60 backdrop-blur-sm border">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Partner Application</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Join our partner network and help transform East African businesses
          </p>
        </div>

        {form.formState.isSubmitted && form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
          <div className="bg-destructive/10 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-destructive">Please correct the following errors:</p>
            <ul className="mt-2 text-sm text-destructive space-y-1">
              {Object.entries(form.formState.errors).map(([key, error]) => (
                <li key={key}>• {error?.message as string}</li>
              ))}
            </ul>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" collapsible defaultValue="contact-info">
              <ContactSection form={form} completion={getSectionCompletion('contact-info')} />
              <CompanySection form={form} completion={getSectionCompletion('company-info')} />
              <StrategicSection form={form} completion={getSectionCompletion('strategic-alignment')} />
              <VisionSection form={form} completion={getSectionCompletion('partnership-vision')} />
            </Accordion>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isSuccess}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting application...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 animate-in fade-in-0" />
                  Successfully Submitted!
                </>
              ) : (
                "Submit Partner Application"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </Card>
  )
}
