"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ApplyModal } from "@/components/apply-modal"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BetaAccessForm } from "@/components/beta-access-form"
import { Inter } from "next/font/google"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import Dashboard from "@/components/dashboard"
import { Toaster } from "sonner"
import { MobileMenu } from "@/components/mobile-menu"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
  e.preventDefault()
  const targetElement = document.getElementById(targetId)
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

const sentences = [
  "Streamline your business operations",
  "Manage inventory with ease",
  "Process payments seamlessly",
  "Gain valuable insights with analytics",
]

const SentenceAnimation = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sentences.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-24 relative overflow-hidden">
      <AnimatePresence initial={false}>
        {sentences.map((sentence, index) => (
          <motion.p
            key={sentence}
            className="absolute w-full text-center text-lg text-muted-foreground"
            initial={{ y: 50, opacity: 0 }}
            animate={{
              y: index === currentIndex ? 0 : -50,
              opacity: index === currentIndex ? 1 : 0,
            }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {sentence}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const { theme } = useTheme()
  const [showBetaForm, setShowBetaForm] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.classList.add("transition-colors", "duration-300")
    return () => {
      document.body.classList.remove("transition-colors", "duration-300")
    }
  }, [])

  return (
    <div className={`flex flex-col min-h-screen ${inter.variable} font-sans`}>
      <header
        className={`bg-background/80 dark:bg-gray-900/80 sticky top-0 z-50 border-b dark:border-gray-800 transition-all duration-300 backdrop-blur-sm ${isScrolled ? "shadow-md" : ""}`}
      >
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="#" className="flex items-center">
            <span className="font-bold text-lg font-sans text-[#392A17] dark:text-primary">Maamul</span>
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link
              href="#introduction"
              className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors duration-200"
              onClick={(e) => smoothScroll(e, "introduction")}
            >
              Introduction
            </Link>
            <Link
              href="#book-consultation"
              className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors duration-200"
              onClick={(e) => smoothScroll(e, "book-consultation")}
            >
              Free Consultation
            </Link>
            <Link
              href="/partner"
              className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Partner
            </Link>
            <Link
              href="/careers"
              className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Careers
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={() => setShowBetaForm(true)}>Apply Access</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <div className="md:hidden">
        <MobileMenu />
      </div>
      <main className="flex-1 dark:bg-gray-900 dark:text-white transition-colors duration-300">
        <h1 className="sr-only">Maamul - All-in-One Management Solution for East African Businesses</h1>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-b from-background to-muted dark:from-gray-900 dark:to-gray-800 py-20 md:py-32 transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center gap-8 px-4 md:px-6">
            <div className="max-w-3xl text-center">
              <motion.h1
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                Streamline your business with <span className="text-primary italic">Maamul</span>
              </motion.h1>
              <div className="space-y-4 mt-8">
                <SentenceAnimation />
              </div>
            </div>
            <Dashboard />
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          id="introduction"
          className="bg-muted dark:bg-gray-800 py-20 md:py-32 transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Introduction
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
                Streamline Your Business Operations with Maamul
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 md:text-xl">
                Maamul is a stress-free, all-in-one management platform to help you work smarter, not harder. Customized
                solutions tailored to your business needs
              </p>
            </div>
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          id="consultation"
          className="bg-gradient-to-br from-background to-primary/10 dark:from-gray-900 dark:to-primary/5 py-20 md:py-32 overflow-hidden relative transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto text-center px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Ready to Streamline Your Business?
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
                Start Your Journey with Maamul
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 md:text-xl">
                Begin your path towards efficient business management and take the first step to transform your
                operations.
              </p>
              <div className="mt-8">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowBetaForm(true)}
                >
                  Apply for Beta Access
                </Button>
              </div>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-gray-700/[0.02] bg-[size:40px_40px] opacity-20"></div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-muted dark:bg-gray-800 py-20 md:py-32 transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-6">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Why We're Good at What We Do
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
                Expertise Tailored for East Africa
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 md:text-xl">
                Our deep understanding of the East African business landscape, combined with our technical expertise,
                allows us to provide unparalleled solutions for your business needs.
              </p>
            </div>
            <div className="grid gap-8">
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Our Experience</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Deep understanding of East African business landscape</li>
                  <li>Combined decades of industry experience</li>
                  <li>Track record of successful implementations</li>
                  <li>Strong technical and business consulting background</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Our Approach</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Local solutions for local challenges</li>
                  <li>Hands-on support and training</li>
                  <li>Regular client check-ins and feedback sessions</li>
                  <li>Data-driven improvement processes</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Our Values</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Client success is our success</li>
                  <li>Continuous innovation and improvement</li>
                  <li>Transparency and reliability</li>
                  <li>Long-term partnership focus</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-background dark:bg-gray-800 py-20 md:py-32 transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-6">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Key Differentiators
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
                What Sets Maamul Apart
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 md:text-xl">
                Our unique approach to streamlining East African business operations
              </p>
            </div>
            <div className="grid gap-8">
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Regional Specialization</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Built for East African business needs</li>
                  <li>Understanding of local market dynamics</li>
                  <li>Support for local payment systems</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Customization Capabilities</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Tailored solutions for each business</li>
                  <li>Flexible feature sets</li>
                  <li>Scalable as your business grows</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Technical Excellence</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Robust and reliable platform</li>
                  <li>Regular updates and improvements</li>
                  <li>Strong security measures</li>
                  <li>Seamless integration capabilities</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-bold dark:text-white">Customer Support</h3>
                <ul className="list-disc list-inside text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>Local support team</li>
                  <li>Multiple language support</li>
                  <li>24/7 technical assistance</li>
                  <li>Regular training sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          id="book-consultation"
          className="bg-muted dark:bg-gray-800 py-20 md:py-32 transition-colors duration-300"
        >
          <div className="container max-w-6xl mx-auto text-center px-4">
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Book Free Consultation
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
                Get a Personalized Solution
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 md:text-xl">
                Book a free consultation with our experts to discuss your specific business needs and get a tailored
                solution. Let's transform your business together.
              </p>
              <div className="mt-8">
                <ApplyModal />
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      <footer className="bg-muted dark:bg-gray-900 py-6 text-sm text-muted-foreground dark:text-gray-400 transition-colors duration-300">
        <div className="container max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="flex items-center">
            <span className="mr-2 text-lg">𐒑</span>© 2025 Maamul. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy-policy" className="hover:underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/partner" className="hover:underline underline-offset-4">
              Partner with Us
            </Link>
          </nav>
        </div>
      </footer>
      {showBetaForm && <BetaAccessForm onClose={() => setShowBetaForm(false)} />}
      <Toaster />
    </div>
  )
}
