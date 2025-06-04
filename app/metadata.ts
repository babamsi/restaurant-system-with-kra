import type { Metadata } from "next"

// Export directly as a named export for Next.js to use
export const metadata: Metadata = {
  title: "Maamul - All-in-One Management Solution for East African Businesses",
  description:
    "Streamline your business operations with Maamul. Manage inventory, process payments, and gain valuable insights with our comprehensive management platform tailored for East African businesses.",
  keywords: [
    "Maamul",
    "business management",
    "East Africa",
    "inventory management",
    "payment processing",
    "business analytics",
    "POS system",
    "financial tracking",
  ],
  authors: [{ name: "Maamul Team" }],
  creator: "Maamul",
  publisher: "Maamul",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.maamul.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "sw-KE": "/sw-KE",
      "so-SO": "/so-SO",
    },
  },
  openGraph: {
    title: "Maamul - Streamline Your Business Operations",
    description: "All-in-One Management Solution for East African Businesses",
    url: "https://www.maamul.com",
    siteName: "Maamul",
    images: [
      {
        url: "https://www.maamul.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Maamul - All-in-One Management Solution",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maamul - Streamline Your Business Operations",
    description: "All-in-One Management Solution for East African Businesses",
    images: ["https://www.maamul.com/twitter-image.jpg"],
    creator: "@MaamulApp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: ["/icon-light.svg"],
    apple: [{ url: "/apple-icon.png" }, { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-icon-precomposed.png",
      },
    ],
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#392A17" },
    { media: "(prefers-color-scheme: dark)", color: "#D6B98F" },
  ],
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
    bing: "bing-verification-code",
  },
}
