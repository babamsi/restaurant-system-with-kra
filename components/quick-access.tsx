import Link from "next/link"
import { BarChart3, ChefHat, Package, ShoppingCart, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function QuickAccess() {
  const modules = [
    {
      title: "Inventory Management",
      icon: Package,
      description: "Check stock levels, add new items, and manage supplies",
      href: "/inventory",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      title: "Kitchen Dashboard",
      icon: ChefHat,
      description: "Track meal preparation, usage of ingredients",
      href: "/kitchen",
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    },
    {
      title: "Point of Sale",
      icon: ShoppingCart,
      description: "Process orders and handle customer transactions",
      href: "/pos",
      color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    },
    {
      title: "Customer Portal",
      icon: Users,
      description: "View the menu from a customer perspective",
      href: "/customer-portal",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    },
    {
      title: "Supplier Management",
      icon: FileText,
      description: "Manage suppliers and handle restocking",
      href: "/suppliers",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    },
    {
      title: "Reports & Analytics",
      icon: BarChart3,
      description: "View sales, inventory, and other analytics",
      href: "/reports",
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module) => (
        <Card key={module.title} className="overflow-hidden hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-3 ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{module.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{module.description}</p>
                <Button asChild variant="outline" className="w-full group">
                  <Link href={module.href} className="flex items-center justify-center">
                    Access
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
