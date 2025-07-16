"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useSidebarState } from "@/hooks/use-responsive"

interface ResponsiveLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  className?: string
}

export function ResponsiveLayout({ children, showSidebar = true, className }: ResponsiveLayoutProps) {
  const { collapsed, isMobile } = useSidebarState()

  return (
    <div className={cn("app-layout", className)}>
      {/* Main Content */}
      <main 
        className={cn(
          "app-main transition-all duration-300 ease-in-out",
          showSidebar && !isMobile && collapsed && "md:ml-16", // Collapsed sidebar width
          showSidebar && !isMobile && !collapsed && "md:ml-64", // Full sidebar width
          showSidebar && isMobile && "ml-0", // No margin on mobile
          !showSidebar && "ml-0" // No margin when sidebar is hidden
        )}
      >
        {children}
      </main>
    </div>
  )
} 