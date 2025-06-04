"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const faqs = [
  {
    question: "What is the application process like at Maamul?",
    answer:
      "Our application process typically involves submitting your application, a review by our hiring team, a phone screening, and one or more interviews. The exact steps may vary depending on the role.",
  },
  {
    question: "Do you offer remote work opportunities?",
    answer:
      "Yes, we offer remote work opportunities for many positions. Each job listing will specify whether the role is remote, on-site, or hybrid.",
  },
  {
    question: "What benefits does Maamul offer?",
    answer:
      "We offer a competitive benefits package that includes health insurance, paid time off, professional development opportunities, and more. Specific benefits may vary by location and position.",
  },
  {
    question: "How long does the hiring process usually take?",
    answer:
      "The hiring process duration can vary depending on the role and the number of applications received. Typically, it takes 2-4 weeks from application to offer for most positions.",
  },
  {
    question: "Does Maamul offer internships or entry-level positions?",
    answer:
      "Yes, we offer internships and entry-level positions in various departments. These opportunities are great for students and recent graduates looking to start their careers in the tech industry.",
  },
]

export function CareersFAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <motion.div
              initial={false}
              animate={{ backgroundColor: activeIndex === index ? "var(--muted)" : "var(--background)" }}
              className="border-b"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full p-4 text-left"
              >
                <span className="font-medium">{faq.question}</span>
                <motion.div animate={{ rotate: activeIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </button>
            </motion.div>
            <AnimatePresence initial={false}>
              {activeIndex === index && (
                <motion.div
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: "auto" },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="p-4 text-muted-foreground">{faq.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
