import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import { FormSection } from "./form-section"
import { PartnerFormValues } from "./types"

interface CompanySectionProps {
  form: UseFormReturn<PartnerFormValues>
  completion: string
}

export function CompanySection({ form, completion }: CompanySectionProps) {
  return (
    <FormSection 
      value="company-info"
      title="Company Information"
      subtitle="Tell us about your organization"
      completion={completion}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                {form.formState.touchedFields[field.name] && <FormMessage />}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.example.com" {...field} />
                </FormControl>
                {form.formState.touchedFields[field.name] && <FormMessage />}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="consulting">Consulting Firm</SelectItem>
                    <SelectItem value="technology">Technology Provider</SelectItem>
                    <SelectItem value="reseller">Value Added Reseller</SelectItem>
                    <SelectItem value="integration">System Integrator</SelectItem>
                    <SelectItem value="agency">Digital Agency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.touchedFields[field.name] && <FormMessage />}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearsInBusiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years in Business</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select years in business" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11+">11+ years</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.touchedFields[field.name] && <FormMessage />}
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="somalia">Somalia</SelectItem>
                  <SelectItem value="kenya">Kenya</SelectItem>
                  <SelectItem value="ethiopia">Ethiopia</SelectItem>
                  <SelectItem value="djibouti">Djibouti</SelectItem>
                  <SelectItem value="tanzania">Tanzania</SelectItem>
                  <SelectItem value="uganda">Uganda</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Social Media Links (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="socialLinks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/company/..." {...field} />
                  </FormControl>
                  <FormDescription>Company LinkedIn profile</FormDescription>
                  {form.formState.touchedFields[field.name] && <FormMessage />}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/..." {...field} />
                  </FormControl>
                  <FormDescription>Company Twitter profile</FormDescription>
                  {form.formState.touchedFields[field.name] && <FormMessage />}
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </FormSection>
  )
}
