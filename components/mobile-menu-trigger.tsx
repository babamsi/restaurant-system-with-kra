"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileMenuTriggerProps {
  onClick: () => void
  className?: string
}

export function MobileMenuTrigger({ onClick, className }: MobileMenuTriggerProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick}
      className={cn(
        "fixed top-4 left-4 z-50 h-10 w-10 bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background/90 transition-all duration-200",
        "md:hidden", // Only show on mobile
        className
      )}
      title="Open menu"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
} 