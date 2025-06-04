export interface PartnerFormValues {
  // Contact Information
  contactName: string
  role: string
  email: string
  phone: string
  meetingDate: string
  meetingTime: string

  // Company Information
  companyName: string
  website: string
  businessType: string
  yearsInBusiness: string
  country: string
  socialLinks: {
    linkedin?: string
    twitter?: string
    instagram?: string
  }

  // Strategic Information
  primaryObjective: string
  targetMarkets: string[]
  expertise: string[]
  existingClients: string

  // Vision
  collaborationIdeas: string
  resourcesCommitment: string
  expectedOutcomes: string
}
