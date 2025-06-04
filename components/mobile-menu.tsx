"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BetaAccessForm } from "@/components/beta-access-form"

const menuItems = [
  { href: "#introduction", label: "Introduction" },
  { href: "#book-consultation", label: "Free Consultation" },
  { href: "/partner", label: "Partner" },
  { href: "/careers", label: "Careers" },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showBetaForm, setShowBetaForm] = useState(false)
  const { theme } = useTheme()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    document.body.style.overflow = isOpen ? "auto" : "hidden"
  }

  React.useEffect(() => {
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    closed: { opacity: 0, x: -10 },
    open: { opacity: 1, x: 0 },
  }

  return (
    <div className="relative z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={toggleMenu}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 z-50 w-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
              style={{ maxHeight: "calc(100vh - 6rem)" }}
            >
              <nav className="overflow-y-auto" role="menu" aria-labelledby="options-menu">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maamul</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Streamline Your Business</p>
                </div>
                {menuItems.map((item) => (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      className="group flex items-center px-6 py-4 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                      onClick={toggleMenu}
                    >
                      <span className="flex-grow font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-150" />
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={itemVariants} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={() => setShowBetaForm(true)} className="w-full">
                    Apply Access
                  </Button>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {showBetaForm && <BetaAccessForm onClose={() => setShowBetaForm(false)} />}
    </div>
  )
}
