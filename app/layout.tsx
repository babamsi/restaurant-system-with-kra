import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { OrdersProvider } from "@/contexts/orders-context"
import { Inter } from "next/font/google"
import ClientLayout from "./ClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maamul - All-in-One Management Solution",
  description: "Streamline operations for East African Businesses",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <OrdersProvider>
          <ClientLayout>{children}</ClientLayout>
        </OrdersProvider>
      </body>
    </html>
  )
}
