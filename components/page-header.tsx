import type React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PageHeaderProps {
  title: string
  description: string
  children?: React.ReactNode
  showSearch?: boolean
}

export function PageHeader({ title, description, children, showSearch = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {showSearch && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-8 w-full md:w-[200px]" />
          </div>
        )}
        {children}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
        <ModeToggle />
      </div>
    </div>
  )
}
