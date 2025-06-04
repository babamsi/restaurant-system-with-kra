"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, Share2, Copy } from "lucide-react"

export function POSReceipts() {
  const [receipt] = useState({
    id: "RCP-001",
    date: "May 18, 2025",
    time: "10:45 AM",
    customer: "Table 5",
    cashier: "Chef Johnson",
    items: [
      { name: "Grilled Chicken Salad", quantity: 1, price: 8.99 },
      { name: "Roasted Vegetables", quantity: 1, price: 3.99 },
      { name: "Fresh Fruit Smoothie", quantity: 2, price: 4.99 },
    ],
    subtotal: 22.96,
    tax: 3.67,
    total: 26.63,
    paymentMethod: "Card",
    cardNumber: "**** **** **** 1234",
  })

  const subtotal = receipt.items.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.16 // 16% VAT
  const total = subtotal + tax

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Input type="search" placeholder="Search receipt by ID..." className="w-full" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-bold text-lg">Digital Cafeteria</h3>
                <p className="text-sm text-muted-foreground">123 Main Street, Nairobi, Kenya</p>
                <p className="text-sm text-muted-foreground">Tel: +254 712 345 678</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Receipt #:</span>
                  <span>{receipt.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Date:</span>
                  <span>{receipt.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Time:</span>
                  <span>{receipt.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Customer:</span>
                  <span>{receipt.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Cashier:</span>
                  <span>{receipt.cashier}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Item</span>
                  <div className="flex gap-8">
                    <span>Qty</span>
                    <span>Price</span>
                  </div>
                </div>

                {receipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <div className="flex gap-8">
                      <span className="w-8 text-center">{item.quantity}</span>
                      <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Payment Method:</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
                {receipt.cardNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Card Number:</span>
                    <span>{receipt.cardNumber}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Thank you for dining with us!</p>
                <p>Please come again.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Receipt Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receipt Number</p>
                    <p className="font-medium">{receipt.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {receipt.date}, {receipt.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{receipt.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cashier</p>
                    <p className="font-medium">{receipt.cashier}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Order Summary</h3>
                <div className="space-y-2">
                  {receipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-medium">${subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax (16%)</p>
                    <p className="font-medium">${tax.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">${total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{receipt.paymentMethod}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
