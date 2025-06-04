import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import { CozeChat } from "@/components/CozeChat"
import { DialogProvider } from "@/contexts/dialog-context"
import StructuredData from "@/components/StructuredData"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Maamul",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: "All-in-One Management Solution for East African Businesses",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1024",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-light.svg" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/icon-dark.svg" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Maamul" />
        <StructuredData data={structuredData} />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DialogProvider>
            {children}
            <CozeChat />
          </DialogProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
