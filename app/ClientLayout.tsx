"use client"

import type React from "react"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useCompleteInventoryStore } from "@/stores/complete-inventory-store"
import { useCompleteKitchenStore } from "@/stores/complete-kitchen-store"
import { useCompletePOSStore } from "@/stores/complete-pos-store"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get store actions for initialization
  const inventoryStore = useCompleteInventoryStore()
  const kitchenStore = useCompleteKitchenStore()
  const posStore = useCompletePOSStore()

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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
