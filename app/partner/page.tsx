"use client"

import { motion } from "framer-motion"
import { PartnerForm } from "@/components/partner-form"
import { Building2, Users, BarChart3, Globe, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Link>
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-6">
              Partner with <span className="text-primary italic">Maamul</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join our partner network and help East African businesses streamline their operations. Together, we can
              make a difference.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {[
            {
              icon: Building2,
              title: "Business Growth",
              description: "Expand your business reach and revenue streams through partnership",
            },
            {
              icon: Users,
              title: "Joint Success",
              description: "Work together to deliver exceptional solutions to clients",
            },
            {
              icon: BarChart3,
              title: "Market Insights",
              description: "Access valuable market data and business intelligence",
            },
            {
              icon: Globe,
              title: "Regional Impact",
              description: "Make a lasting impact on East African businesses",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 bg-card dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute top-6 left-6 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:pr-8"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Why Partner with Us?</h2>
            <p className="mt-4 text-lg text-muted-foreground">As a Maamul partner, you'll get access to:</p>
            <ul className="mt-8 space-y-6">
              {[
                "Comprehensive partner training and certification programs",
                "Marketing and sales support materials",
                "Dedicated partner success manager",
                "Regular business reviews and planning sessions",
                "Access to partner portal and resources",
                "Joint marketing opportunities",
                "Competitive commission structure",
                "Early access to new features and updates",
              ].map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-muted-foreground">{benefit}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:pl-8"
          >
            <PartnerForm />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
