"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Smartphone, Banknote, CheckCircle2, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/toast-context"
import { Separator } from "@/components/ui/separator"

interface POSPaymentProps {
  onClearCart: () => void
}

export function POSPayment({ onClearCart }: POSPaymentProps) {
  const { addToast } = useToast()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"method" | "confirm" | "processing" | "success">("method")

  const handlePayment = () => {
    if (!selectedMethod) return

    if (paymentStep === "method") {
      setPaymentStep("confirm")
      return
    }

    if (paymentStep === "confirm") {
      setPaymentStep("processing")

      // Simulate payment processing
      setTimeout(() => {
        setPaymentStep("success")

        // After showing success for a moment, reset
        setTimeout(() => {
          addToast({
            title: "Payment Successful",
            description: `Your meal has been paid for via ${selectedMethod}`,
            type: "success",
            duration: 3000,
          })

          setSelectedMethod(null)
          setPaymentStep("method")
          onClearCart()
        }, 1500)
      }, 2000)
    }
  }

  const paymentMethods = [
    {
      id: "edahab",
      name: "eDahab",
      icon: Smartphone,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    { id: "waafi", name: "WAAFI", icon: Smartphone, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
    { id: "mpesa", name: "Mpesa", icon: Smartphone, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
    {
      id: "card",
      name: "Card Payment",
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    { id: "cash", name: "Cash", icon: Banknote, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-900/20" },
  ]

  const getSelectedMethod = () => {
    return paymentMethods.find((method) => method.id === selectedMethod)
  }

  return (
    <Card>
      <CardHeader className="pb-3 pt-4">
        <CardTitle>
          {paymentStep === "method" && "Payment Method"}
          {paymentStep === "confirm" && "Confirm Payment"}
          {paymentStep === "processing" && "Processing Payment"}
          {paymentStep === "success" && "Payment Complete"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentStep === "method" && (
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className={`justify-start h-auto py-3 ${selectedMethod === method.id ? "border-primary" : ""}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className={`h-8 w-8 rounded-full ${method.bg} flex items-center justify-center mr-2`}>
                  <method.icon className={`h-5 w-5 ${method.color}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.id === "card" ? "Credit/Debit card" : "Mobile money payment"}
                  </p>
                </div>
                {selectedMethod === method.id && (
                  <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </Button>
            ))}

            <Button className="mt-2" disabled={!selectedMethod} onClick={handlePayment}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {paymentStep === "confirm" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
              {selectedMethod && (
                <>
                  <div className={`h-10 w-10 rounded-full ${getSelectedMethod()?.bg} flex items-center justify-center`}>
                    {getSelectedMethod()?.icon &&
                      React.createElement(getSelectedMethod()?.icon, {
                        className: `h-6 w-6 ${getSelectedMethod()?.color}`,
                      })}
                  </div>
                  <div>
                    <p className="font-medium">{getSelectedMethod()?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMethod === "card" ? "Credit/Debit card" : "Mobile money payment"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-medium">$24.50</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Payment Method</span>
                <span className="font-medium">{getSelectedMethod()?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction Fee</span>
                <span className="font-medium">$0.00</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("method")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handlePayment}>
                Pay Now
              </Button>
            </div>
          </div>
        )}

        {paymentStep === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="mb-4 h-12 w-12 text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.div>
            <p className="text-center mb-1">Processing your payment</p>
            <p className="text-sm text-muted-foreground text-center">Please wait while we process your payment...</p>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <p className="text-xl font-medium text-center mb-1">Payment Successful!</p>
            <p className="text-sm text-muted-foreground text-center">Your meal order has been confirmed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default POSPayment
