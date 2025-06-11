"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSupplierStore, type SupplierOrder, type OrderItem } from "@/stores/supplier-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { useToast } from "@/hooks/use-toast"
import { FileText, CheckCircle, Building2, Receipt, DollarSign, Calendar, CreditCard, Wallet, Banknote, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SupplierDetailsPage({ params }: { params: { id: string } }) {
  const { suppliers, updateOrderStatus } = useSupplierStore()
  const { ingredients } = useSynchronizedInventoryStore()
  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [orderToPay, setOrderToPay] = useState<SupplierOrder | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer")

  const supplier = suppliers.find((s) => s.id === params.id)

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    )
  }

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    return ingredient?.name || "Unknown Item"
  }

  const pendingOrders = supplier.orders.filter((order) => order.status === "pending")
  const paidOrders = supplier.orders.filter((order) => order.status === "paid")
  const totalOutstanding = pendingOrders.reduce((sum, order) => sum + order.total, 0)

  const handleMarkAsPaid = (order: SupplierOrder) => {
    setOrderToPay(order)
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

      if (amount < orderToPay.total) {
        toast({
          title: "Insufficient Payment",
          description: "Payment amount cannot be less than the order total.",
          variant: "destructive",
        })
        return
      }

      updateOrderStatus(supplier.id, orderToPay.id, "paid", new Date())
      toast({
        title: "Payment Confirmed",
        description: `Order ${orderToPay.invoiceNumber} has been marked as paid via ${paymentMethod.replace('_', ' ')}.`,
      })
      setShowPaymentDialog(false)
      setOrderToPay(null)
      setPaymentAmount("")
      setPaymentMethod("bank_transfer")
    }
  }

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return <Banknote className="h-4 w-4" />
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />
      case 'cash':
        return <Wallet className="h-4 w-4" />
      case 'check':
        return <Receipt className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatPaymentMethod = (method?: string) => {
    if (!method) return ''
    return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Supplier Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{supplier.name}</p>
              <p className="text-sm text-muted-foreground">{supplier.email}</p>
              <p className="text-sm text-muted-foreground">{supplier.phone}</p>
              <p className="text-sm text-muted-foreground">{supplier.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders:</span>
                <span className="font-medium">{supplier.orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Orders:</span>
                <span className="font-medium text-amber-500">{pendingOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Orders:</span>
                <span className="font-medium text-green-500">{paidOrders.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Outstanding Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              ${totalOutstanding.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Total amount pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(order.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>${order.subtotal.toFixed(2)}</TableCell>
                    <TableCell>${order.vatAmount.toFixed(2)}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === "paid" ? "default" : "secondary"}
                        className={order.status === "paid" ? "bg-green-500" : "text-amber-500"}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        {order.status === "pending" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsPaid(order)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{selectedOrder.invoiceNumber}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedOrder.date), "MMM d, yyyy")}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={selectedOrder.status === "paid" ? "default" : "outline"}
                    className={selectedOrder.status === "paid" ? "bg-green-500" : "text-amber-500 border-amber-500"}
                  >
                    {selectedOrder.status === "paid" ? (
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
                </div>
                {selectedOrder.status === "paid" && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                        <p className="font-medium">{formatPaymentMethod(selectedOrder.paymentMethod)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="font-medium">
                        {selectedOrder.paymentDate
                          ? format(new Date(selectedOrder.paymentDate), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.ingredientId}>
                        <TableCell className="font-medium">
                          {getIngredientName(item.ingredientId)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-muted-foreground ml-1">{item.unit}</span>
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({((selectedOrder.vatAmount / selectedOrder.subtotal) * 100).toFixed(0)}%)</span>
                  <span className="font-medium">${selectedOrder.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <span className="font-medium">{orderToPay.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">${orderToPay.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(orderToPay.date), "MMM d, yyyy")}</span>
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
                      min={orderToPay.total}
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