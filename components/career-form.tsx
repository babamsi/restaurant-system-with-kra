"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, CheckCircle, X, FileText, ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MAX_FILE_SIZE = 5000000
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  position: z.string().min(1, "Please select a position"),
  department: z.string().min(1, "Please select a department"),
  location: z.string().min(1, "Please select a location"),
  experience: z.string().min(1, "Please select your experience level"),
  languages: z.array(z.string()).min(1, "Please select at least one language"),
  internetSpeed: z.string().min(1, "Please enter your internet speed"),
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters"),
  files: z
    .array(
      z.custom<File>((file) => file instanceof File, {
        message: "Must be a valid file",
      }),
    )
    .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), {
      message: "Each file must be less than 5MB.",
    })
    .refine((files) => files.every((file) => ACCEPTED_FILE_TYPES.includes(file.type)), {
      message: "Only PDF, DOC, DOCX, JPEG, or PNG files are accepted.",
    })
    .refine((files) => files.length <= 5, {
      message: "You can upload a maximum of 5 files.",
    })
    .optional(),
})

type CareerFormValues = z.infer<typeof formSchema>

const positions = [
  "Sales Representative",
  "Software Engineer",
  "Product Manager",
  "UX/UI Designer",
  "Data Analyst",
  "Customer Support Specialist",
  "Digital Marketing Manager",
  "Quality Assurance Engineer",
  "Content Writer",
  "Financial Analyst",
  "HR Coordinator",
  "Project Manager",
  "DevOps Engineer",
  "Information Security Analyst",
  "Legal Counsel",
  "HR Manager",
  "Operations Manager",
  "Finance Manager",
  "Sales Manager",
  "Marketing Director",
  "IT Support Specialist",
  "Customer Success Manager",
]

const departments = [
  "Sales",
  "Engineering",
  "Product",
  "Design",
  "Analytics",
  "Customer Service",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "IT",
  "Legal",
]

const locations = ["Virtual", "Nairobi, Kenya (HQ)"]

const experienceLevels = ["Entry Level", "1-3 years", "3-5 years", "5-10 years", "10+ years"]

const languages = [
  { label: "English", value: "english" },
  { label: "Swahili", value: "swahili" },
  { label: "Somali", value: "somali" },
  { label: "Amharic", value: "amharic" },
  { label: "Arabic", value: "arabic" },
]

export function CareerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      location: "",
      experience: "",
      languages: [],
      internetSpeed: "",
      coverLetter: "",
      files: [],
    },
  })

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(event.target.files || [])
      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5) // Limit to 5 files
      setSelectedFiles(updatedFiles)
      form.setValue("files", updatedFiles)
      form.trigger("files") // Trigger validation
    },
    [selectedFiles, form],
  )

  const removeFile = useCallback(
    (index: number) => {
      setSelectedFiles((prevFiles) => {
        const newFiles = [...prevFiles]
        newFiles.splice(index, 1)
        form.setValue("files", newFiles)
        return newFiles
      })
    },
    [form],
  )

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  async function onSubmit(values: CareerFormValues) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (key === "files") {
            value.forEach((file, index) => {
              formData.append(`file${index}`, file)
            })
          } else {
            formData.append(key, value.join(", "))
          }
        } else if (value instanceof File) {
          formData.append(key, value)
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      console.log("Submitting form data:", Object.fromEntries(formData))

      const response = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit application")
      }

      const result = await response.json()
      console.log("Form submission result:", result)
      toast.success(result.message || "Application submitted successfully!")
      setIsSuccess(true)
      form.reset()
      setSelectedFiles([])
    } catch (error) {
      console.error("Submission error:", error)
      toast.error(error.message || "Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Yusef Adam" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="adam@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Languages</FormLabel>
              <div className="space-y-2">
                {languages.map((language) => (
                  <div key={language.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={language.value}
                      checked={field.value.includes(language.value)}
                      onChange={(e) => {
                        const updatedValues = e.target.checked
                          ? [...field.value, language.value]
                          : field.value.filter((val: string) => val !== language.value)
                        field.onChange(updatedValues)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={language.value} className="text-sm font-medium">
                      {language.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="internetSpeed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internet Speed (Mbps)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume and Additional Documents</FormLabel>
              <FormControl>
                <div className="flex flex-col items-start space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                  />
                  <Button type="button" onClick={openFileDialog}>
                    Select Files
                  </Button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {selectedFiles.map((file, index) => (
                      <FilePreview key={index} file={file} onRemove={() => removeFile(index)} />
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverLetter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you're interested in this position and what you can bring to the team."
                  className="min-h-[150px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting application...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Application Submitted!
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </Form>
  )
}

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.onerror = () => {
        console.error("Error reading file:", file.name)
        setPreview(null)
      }
      reader.readAsDataURL(file)
    }
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [file, preview])

  return (
    <div className="relative bg-muted p-2 rounded-md">
      <div className="flex items-center space-x-2">
        {preview ? (
          <img src={preview || "/placeholder.svg"} alt={file.name} className="w-10 h-10 object-cover rounded" />
        ) : file.type.includes("pdf") ? (
          <FileText className="w-10 h-10 text-primary" />
        ) : (
          <ImageIcon className="w-10 h-10 text-primary" />
        )}
        <span className="text-sm truncate">{file.name}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
