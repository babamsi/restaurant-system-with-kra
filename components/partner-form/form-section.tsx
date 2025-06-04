import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface FormSectionProps {
  value: string
  title: string
  subtitle?: string
  completion: string
  children: React.ReactNode
  isRequired?: boolean
}

export function FormSection({
  value,
  title,
  subtitle,
  completion,
  children,
  isRequired = true,
}: FormSectionProps) {
  return (
    <AccordionItem value={value} className="border rounded-lg mb-4 overflow-hidden">
      <div className="bg-muted/40 dark:bg-muted/20">
        <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:bg-muted/60">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">{title}</span>
              {isRequired && <span className="text-destructive text-sm">*</span>}
            </div>
            <span className="text-xs text-muted-foreground">{completion}</span>
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent>
        <div className="p-4 space-y-4">
          {subtitle && (
            <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
          )}
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
