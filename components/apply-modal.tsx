"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useDialog } from '@/contexts/dialog-context'

export function ApplyModal() {
  const { setDialogOpen } = useDialog()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    businessType: '',
    businessSize: '',
    location: '',
    currentOperations: '',
    challenges: '',
    features: [],
    timeline: '',
    name: '',
    email: '',
    phone: '',
    preferredContact: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (!formData.businessType) {
          toast.error('Please select a business type');
          return false;
        }
        if (!formData.businessSize) {
          toast.error('Please select a business size');
          return false;
        }
        if (!formData.location.trim()) {
          toast.error('Please enter your business location');
          return false;
        }
        return true;

      case 2:
        if (!formData.currentOperations.trim()) {
          toast.error('Please describe your current operations');
          return false;
        }
        if (!formData.challenges.trim()) {
          toast.error('Please describe your challenges');
          return false;
        }
        return true;

      case 3:
        if (formData.features.length === 0) {
          toast.error('Please select at least one feature');
          return false;
        }
        if (!formData.timeline) {
          toast.error('Please select an implementation timeline');
          return false;
        }
        return true;

      case 4:
        if (!formData.name.trim()) {
          toast.error('Please enter your full name');
          return false;
        }
        if (!formData.email.trim()) {
          toast.error('Please enter your email address');
          return false;
        }
        if (!isValidEmail(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        if (!formData.phone.trim()) {
          toast.error('Please enter your phone number');
          return false;
        }
        if (!formData.preferredContact) {
          toast.error('Please select your preferred contact method');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    field?: string
  ) => {
    if (typeof e === 'string' && field) {
      setFormData(prev => ({ ...prev, [field]: e }));
    } 
    // @ts-ignore
    else if ('target' in e) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (feature: string) => {
    // @ts-ignore
    setFormData(prev => ({
      ...prev,
      // @ts-ignore
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateStep(4) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      toast.success('Application submitted successfully!');
      setOpen(false);
      setStep(1);
      setFormData({
        businessType: '',
        businessSize: '',
        location: '',
        currentOperations: '',
        challenges: '',
        features: [],
        timeline: '',
        name: '',
        email: '',
        phone: '',
        preferredContact: '',
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  // Helper function to validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        setDialogOpen(isOpen)
      }}>
      <DialogTrigger asChild>
        <Button>Book Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-full sm:w-auto h-full sm:h-auto max-h-[100dvh] sm:max-h-[85vh] overflow-y-auto dark:bg-gray-800 dark:text-white transition-colors duration-300">
        <DialogHeader>
          <DialogTitle>Book Now</DialogTitle>
          <DialogDescription>
            Fill out our questionnaire to help us understand your business needs.
          </DialogDescription>
        </DialogHeader>
        <form id="applicationForm" onSubmit={handleSubmit} className="space-y-4 px-6 sm:px-6 pb-6">
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-medium">Step 1: Business Information</h3>
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-sm sm:text-base">Business Type <span className="text-red-500">*</span></Label>
                  <Select name="businessType" value={formData.businessType} onValueChange={
                    // @ts-ignore
                    (value) => handleInputChange(value, 'businessType')} required>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-white transition-colors duration-200">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessSize" className="text-sm sm:text-base">Business Size <span className="text-red-500">*</span></Label>
                  <Select name="businessSize" value={formData.businessSize} onValueChange={
                    // @ts-ignore
                    (value) => handleInputChange(value, 'businessSize')} required>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-white transition-colors duration-200">
                      <SelectValue placeholder="Select business size" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201+">201+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm sm:text-base">Business Location <span className="text-red-500">*</span></Label>
                <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country" required className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full h-12 sm:h-10 text-base sm:text-sm" />
              </div>
              <div className="hidden sm:flex sm:flex-row sm:justify-between sm:space-y-0">
                <Button type="button" onClick={nextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-medium">Step 2: Current Operations</h3>
              <div className="space-y-2">
                <Label htmlFor="currentOperations" className="text-sm sm:text-base">Describe your current business operations <span className="text-red-500">*</span></Label>
                <Textarea
                  id="currentOperations"
                  name="currentOperations"
                  value={formData.currentOperations}
                  onChange={handleInputChange}
                  placeholder="Tell us about your day-to-day operations, challenges, and goals"
                  rows={4}
                  required
                  className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full min-h-[100px] text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="challenges" className="text-sm sm:text-base">What are your biggest operational challenges? <span className="text-red-500">*</span></Label>
                <Textarea
                  id="challenges"
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleInputChange}
                  placeholder="Describe the main issues you face in managing your business"
                  rows={4}
                  required
                  className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full min-h-[100px] text-base sm:text-sm"
                />
              </div>
              <div className="hidden sm:flex sm:flex-row sm:justify-between sm:space-y-0">
                {
                  // @ts-ignore
                  <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Previous</Button>
                }
                <Button type="button" onClick={nextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-medium">Step 3: Maamul Features</h3>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Which features are most important to you? <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  {['Inventory Management', 'Financial Tracking', 'Customer Relations', 'Employee Management', 'Reporting & Analytics', 'Supply Chain Management'].map((feature, index) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <input type="checkbox" id={`feature-${index}`} name="features" value={feature} checked={
                        // @ts-ignore
                        formData.features.includes(feature)} onChange={() => handleCheckboxChange(feature)} className="rounded border-gray-300 text-primary focus:ring-primary h-10 sm:h-9" />
                      <Label htmlFor={`feature-${index}`} className="text-sm sm:text-base">{feature}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-sm sm:text-base">Implementation Timeline <span className="text-red-500">*</span></Label>
                <Select name="timeline" value={formData.timeline} onValueChange={
                  // @ts-ignore
                  (value) => handleInputChange(value, 'timeline')} required>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white transition-colors duration-200">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-white">
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1-3months">1-3 months</SelectItem>
                    <SelectItem value="3-6months">3-6 months</SelectItem>
                    <SelectItem value="6+months">6+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:flex sm:flex-row sm:justify-between sm:space-y-0">
                {
                  // @ts-ignore
                  <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Previous</Button>
                }
                <Button type="button" onClick={nextStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-medium">Step 4: Contact Information</h3>
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" required className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full h-12 sm:h-10 text-base sm:text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="Your email" required className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full h-12 sm:h-10 text-base sm:text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number <span className="text-red-500">*</span></Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Your phone number" required className="dark:bg-gray-700 dark:text-white transition-colors duration-200 w-full h-12 sm:h-10 text-base sm:text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Preferred Contact Method <span className="text-red-500">*</span></Label>
                <RadioGroup value={formData.preferredContact} onValueChange={
                  // @ts-ignore
                  (value) => handleInputChange(value, 'preferredContact')} className="dark:text-white" required>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email-contact" />
                    <Label htmlFor="email-contact" className="text-sm sm:text-base">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone-contact" />
                    <Label htmlFor="phone-contact" className="text-sm sm:text-base">Phone</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="hidden sm:flex sm:flex-row sm:justify-between sm:space-y-0">
                {
                  // @ts-ignore
                  <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Previous</Button>}
                <Button type="submit" className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">Submit Application</Button>
              </div>
            </div>
          )}
        </form>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background dark:bg-gray-800 border-t sm:hidden">
          <div className="flex justify-between space-x-4">
            {step > 1 && (
              // @ts-ignore
              <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                Previous
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={nextStep} className="flex-1">
                Next
              </Button>
            ) : (
              <Button type="submit" form="applicationForm" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
