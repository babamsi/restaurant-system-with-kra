import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { FormSection } from "./form-section"
import { PartnerFormValues } from "./types"

interface VisionSectionProps {
  form: UseFormReturn<PartnerFormValues>
  completion: string
}

export function VisionSection({ form, completion }: VisionSectionProps) {
  return (
    <FormSection 
      value="partnership-vision"
      title="Partnership Vision"
      subtitle="Share your vision for our partnership"
      completion={completion}
    >
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="collaborationIdeas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collaboration Ideas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your specific ideas for collaboration with Maamul"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                How do you envision working together? What unique value can you bring to the partnership?
              </FormDescription>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resourcesCommitment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resources & Commitment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resources you can commit to this partnership"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                What resources (team, technology, market access) can you dedicate to ensure partnership success?
              </FormDescription>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedOutcomes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Outcomes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What specific outcomes do you hope to achieve through this partnership?"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include both short-term and long-term goals for the partnership
              </FormDescription>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  )
}
