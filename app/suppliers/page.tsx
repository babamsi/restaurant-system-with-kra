"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useSupplierStore, type SupplierOrder } from "@/stores/supplier-store"
import { useToast } from "@/hooks/use-toast"
import { Building2, Package, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ChevronRight, Receipt, CreditCard, Wallet, Banknote } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function SuppliersPage() {
  const { suppliers, getUnpaidOrders, updateOrderStatus } = useSupplierStore()
  const { toast } = useToast()
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [orderToPay, setOrderToPay] = useState<{ order: SupplierOrder; supplierId: string } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer")

  const unpaidOrders = getUnpaidOrders()

  const handleMarkAsPaid = (order: SupplierOrder, supplierId: string) => {
    setOrderToPay({ order, supplierId })
    setPaymentAmount(order.total.toString())
    setShowPaymentDialog(true)
  }

  const confirmPayment = () => {
    if (orderToPay) {
      const amount = parseFloat(paymentAmount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid payment amount.",
          variant: "destructive",
        })
        return
      }

      if (amount < orderToPay.order.total) {
        toast({
          title: "Insufficient Payment",
          description: "Payment amount cannot be less than the order total.",
          variant: "destructive",
        })
        return
      }

      updateOrderStatus(orderToPay.supplierId, orderToPay.order.id, "paid", new Date(), paymentMethod)
      toast({
        title: "Payment Confirmed",
        description: `Order ${orderToPay.order.invoiceNumber} has been marked as paid via ${paymentMethod.replace('_', ' ')}.`,
      })
      setShowPaymentDialog(false)
      setOrderToPay(null)
      setPaymentAmount("")
      setPaymentMethod("bank_transfer")
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-amber-500">{unpaidOrders.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-500">
                  ${unpaidOrders.reduce((sum, { order }) => sum + order.total, 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers & Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="border rounded-lg">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedSupplier(expandedSupplier === supplier.id ? null : supplier.id)}
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{supplier.name}</h3>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {supplier.orders.length} Orders
                    </Badge>
                    <Badge variant="outline" className="text-amber-500">
                      {supplier.orders.filter(o => o.status === 'pending').length} Pending
                    </Badge>
                    <Link href={`/suppliers/${supplier.id}`}>
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    {expandedSupplier === supplier.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {expandedSupplier === supplier.id && (
                  <div className="border-t p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplier.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {order.items.length} items
                            </TableCell>
                            <TableCell>
                              ${order.total}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={order.status === 'paid' ? 'default' : 'outline'}
                                className={order.status === 'paid' ? 'bg-green-500' : 'text-amber-500 border-amber-500'}
                              >
                                {order.status === 'paid' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {order.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(order, supplier.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
          </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Process Payment
            </DialogTitle>
          </DialogHeader>
          {orderToPay && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="font-medium">{orderToPay.order.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">${orderToPay.order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(orderToPay.order.date), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="payment-amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-8"
                      placeholder="0.00"
                      min={orderToPay.order.total}
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="bank_transfer"
                        id="bank_transfer"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="bank_transfer"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Banknote className="mb-3 h-6 w-6" />
                        Bank Transfer
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="credit_card"
                        id="credit_card"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="credit_card"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <CreditCard className="mb-3 h-6 w-6" />
                        Credit Card
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="cash"
                        id="cash"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="cash"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Wallet className="mb-3 h-6 w-6" />
                        Cash
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="check"
                        id="check"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="check"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Receipt className="mb-3 h-6 w-6" />
                        Check
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
        </div>
      </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPayment}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
