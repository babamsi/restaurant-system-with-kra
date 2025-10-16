"use client"

import type React from "react"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { ResponsiveLayout } from "@/components/responsive-layout"
import { Toaster } from 'sonner'
import { useCompleteInventoryStore } from "@/stores/complete-inventory-store"
import { useCompleteKitchenStore } from "@/stores/complete-kitchen-store"
import { useCompletePOSStore } from "@/stores/complete-pos-store"
import { usePathname } from "next/navigation"
import { UserSessionProvider } from '@/context/UserSessionContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get store actions for initialization
  const inventoryStore = useCompleteInventoryStore()
  const kitchenStore = useCompleteKitchenStore()
  const posStore = useCompletePOSStore()
  const pathname = usePathname()

  useEffect(() => {
    // Set up cross-module event listeners for real-time sync
    const handleInventoryUpdate = (event: CustomEvent) => {
      // Kitchen and POS will automatically react to inventory changes
      console.log("Inventory updated:", event.detail)
    }

    const handleKitchenUpdate = (event: CustomEvent) => {
      // POS will automatically get updated menu items
      console.log("Kitchen menu updated:", event.detail)
    }

    const handleOrderCompleted = (event: CustomEvent) => {
      // Inventory will automatically deduct stock
      console.log("Order completed:", event.detail)
    }

    // Add event listeners
    window.addEventListener("inventory-updated", handleInventoryUpdate as EventListener)
    window.addEventListener("menu-updated", handleKitchenUpdate as EventListener)
    window.addEventListener("order-completed", handleOrderCompleted as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener("inventory-updated", handleInventoryUpdate as EventListener)
      window.removeEventListener("menu-updated", handleKitchenUpdate as EventListener)
      window.removeEventListener("order-completed", handleOrderCompleted as EventListener)
    }
  }, [])

  // Check if we should show the sidebar
  const shouldShowSidebar = !(
    pathname.startsWith("/customer-portal") ||
    pathname.startsWith("/qr-codes") ||
    pathname === "/login"
  );

  return (
    <UserSessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <ResponsiveLayout showSidebar={shouldShowSidebar}>
          {/* Responsive Sidebar */}
          {shouldShowSidebar && <Sidebar />}
          {/* Main Content */}
          {children}
        </ResponsiveLayout>
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </UserSessionProvider>
  )
}
