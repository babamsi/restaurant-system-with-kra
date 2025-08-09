import { Badge } from "@/components/ui/badge"

interface TaxTypeBadgeProps {
  taxType: string | null | undefined
}

export function TaxTypeBadge({ taxType }: TaxTypeBadgeProps) {
  const taxTypeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    'A': { label: 'A-EX (Exempt)', variant: 'outline' },
    'B': { label: 'B-16% (Standard)', variant: 'default' },
    'C': { label: 'C (Zero-rated)', variant: 'secondary' },
    'D': { label: 'D (Non-VAT)', variant: 'outline' },
    'E': { label: 'E-8% (Reduced)', variant: 'destructive' },
  }

  const config = taxTypeMap[taxType || 'B'] || taxTypeMap['B']
  return <Badge variant={config.variant}>{config.label}</Badge>
} 