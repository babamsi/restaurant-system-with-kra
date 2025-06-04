import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormSection } from "./form-section"
import { PartnerFormValues } from "./types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Clock } from 'lucide-react'
import { format, addDays, setHours, setMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ContactSectionProps {
  form: UseFormReturn<PartnerFormValues>
  completion: string
}

export function ContactSection({ form, completion }: ContactSectionProps) {
  const [selectedCountry, setSelectedCountry] = useState(form.getValues("country") || "")
  
  // Generate available time slots based on country/region
  const getTimeSlots = () => {
    let startHour = 9; // Default 9 AM
    let endHour = 17; // Default 5 PM
    
    // Adjust times based on region
    switch(selectedCountry) {
      case "somalia":
      case "ethiopia":
      case "djibouti":
        startHour = 8; // 8 AM EAT
        endHour = 16; // 4 PM EAT
        break;
      case "kenya":
      case "tanzania":
      case "uganda":
        startHour = 9; // 9 AM EAT
        endHour = 17; // 5 PM EAT
        break;
      default:
        startHour = 9;
        endHour = 17;
    }

    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute of [0, 30]) {
        slots.push(
          format(setMinutes(setHours(new Date(), hour), minute), "HH:mm")
        );
      }
    }
    return slots;
  };

  return (
    <FormSection 
      value="contact-info"
      title="Contact Information"
      subtitle="Tell us about the primary contact person"
      completion={completion}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input placeholder="Enter your role" {...field} />
              </FormControl>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" {...field} />
              </FormControl>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="meetingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Preferred Meeting Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      // Convert Date to ISO string when setting form value
                      field.onChange(date ? date.toISOString() : '');
                    }}
                    disabled={(date) => 
                      date < addDays(new Date(), 3) || // Minimum 3 days from today
                      date.getDay() === 0 || // Sunday
                      date.getDay() === 6    // Saturday
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="meetingTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Meeting Time</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.touchedFields[field.name] && <FormMessage />}
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  )
}
