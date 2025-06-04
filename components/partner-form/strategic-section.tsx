import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { FormSection } from "./form-section"
import { PartnerFormValues } from "./types"

const targetMarketOptions = [
  { id: "retail", label: "Retail Businesses" },
  { id: "hospitality", label: "Hospitality" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "distribution", label: "Distribution" },
  { id: "services", label: "Professional Services" },
  { id: "education", label: "Education" },
]

const expertiseOptions = [
  { id: "tech", label: "Technology Implementation" },
  { id: "consulting", label: "Business Consulting" },
  { id: "training", label: "Training & Development" },
  { id: "integration", label: "System Integration" },
  { id: "support", label: "Customer Support" },
  { id: "sales", label: "Sales & Marketing" },
]

interface StrategicSectionProps {
  form: UseFormReturn<PartnerFormValues>
  completion: string
}

export function StrategicSection({ form, completion }: StrategicSectionProps) {
  return (
    <FormSection 
      value="strategic-alignment"
      title="Strategic Alignment"
      subtitle="Help us understand how we can work together"
      completion={completion}
    >
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="primaryObjective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Partnership Objective</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary objective" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="market-expansion">Market Expansion</SelectItem>
                  <SelectItem value="technology-integration">Technology Integration</SelectItem>
                  <SelectItem value="service-delivery">Service Delivery</SelectItem>
                  <SelectItem value="product-development">Product Development</SelectItem>
                  <SelectItem value="consulting">Consulting Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetMarkets"
          render={() => (
            <FormItem>
              <FormLabel>Target Markets</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targetMarketOptions.map((market) => (
                  <FormField
                    key={market.id}
                    control={form.control}
                    name="targetMarkets"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={market.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(market.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, market.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== market.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {market.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              {form.formState.touchedFields["targetMarkets"] && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expertise"
          render={() => (
            <FormItem>
              <FormLabel>Areas of Expertise</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expertiseOptions.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="expertise"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              {form.formState.touchedFields["expertise"] && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="existingClients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existing Clients & Market Presence</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your current client base and market presence in East Africa"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              {form.formState.touchedFields["existingClients"] && <FormMessage />}
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  )
}
