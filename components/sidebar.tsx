"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { BarChart3, ChefHat, Home, Package, ShoppingCart, Users, ClipboardList, Store, Menu, X, FileText, BadgeAlert, Receipt, Globe, Building2, Database, Calculator, Bell, Shield, TrendingUp } from "lucide-react"
import { ModeToggleSimple } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useSidebarState } from "@/hooks/use-responsive"
import { MobileMenuTrigger } from "@/components/mobile-menu-trigger"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Kitchen", href: "/kitchen", icon: ChefHat },
  { name: "Recipes", href: "/recipes", icon: Menu },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Orders", href: "/orders", icon: ClipboardList },
  // { name: "Customer Portal", href: "/customer-portal", icon: Store },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "System Logs", href: "/kitchen/logs", icon: FileText },
  { name: "KRA Failed", href: "/kra-failed-sales", icon: BadgeAlert},
  { name: "KRA Sales", href: "/kra/purchases", icon: Receipt},
  { name: "KRA Imported Items", href: "/kra/imported-items", icon: Globe},
  { name: "KRA Data Management", href: "/kra-data", icon: Database},
  { name: "KRA Test Items", href: "/kra-test-items", icon: Package},
  { name: "KRA Test Recipes", href: "/kra-test-recipes", icon: Menu},
  { name: "KRA Branches", href: "/kra-branches", icon: Database},
  { name: "KRA Test POS", href: "/kra-test-pos", icon: Calculator},
  { name: "Branch Registration", href: "/branch-registration", icon: Building2},
  { name: "Branch Users", href: "/branch-users", icon: Users},
  { name: "Branch Insurance", href: "/branch-insurance", icon: Shield},
  { name: "Stock Movement", href: "/stock-movement", icon: TrendingUp},
  { name: "KRA Notices", href: "/kra-notices", icon: Bell}
  // { name: "Test Responsive", href: "/test-responsive", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { collapsed, setCollapsed, isMobile, isTablet, isDesktop } = useSidebarState()

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary flex-shrink-0" />
          {!collapsed && <span className="text-xl font-bold text-foreground">Maamul</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)} 
              className="h-8 w-8"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          )}
          {!collapsed && <ModeToggleSimple className="lg:hidden" />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const linkContent = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center" : "",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )

          if (collapsed && !isMobile) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="z-50">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return linkContent
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", collapsed ? "justify-center" : "")}>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">AD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@cafeteria.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Mobile Sidebar (Sheet)
  if (isMobile) {
    return (
      <TooltipProvider>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <MobileMenuTrigger onClick={() => setIsOpen(true)} />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-r">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    )
  }

  // Desktop/Tablet Sidebar
  return (
    <TooltipProvider>
      <div
        className={cn(
          "app-sidebar flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          "hidden md:flex" // Hide on mobile, show on tablet and up
        )}
        data-collapsed={collapsed}
      >
        <SidebarContent />
      </div>
    </TooltipProvider>
  )
}
