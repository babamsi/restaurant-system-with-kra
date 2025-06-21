"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { suppliersService, supplierOrdersService } from '@/lib/database'

export default function SupplierDetailsPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [supplier, setSupplier] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [orderToPay, setOrderToPay] = useState<any | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supplierRes = await suppliersService.getById(params.id)
      if (!supplierRes.data) {
        setSupplier(null)
        setLoading(false)
        return
      }
      setSupplier(supplierRes.data)
      const ordersRes = await supplierOrdersService.getOrdersBySupplier(params.id)
      setOrders(ordersRes.data || [])
      // Fetch order items for each order
      const itemsMap: Record<string, any[]> = {}
      if (ordersRes.data) {
        for (const order of ordersRes.data) {
          const itemsRes = await supplierOrdersService.getOrderItems(order.id)
          itemsMap[order.id] = itemsRes.data || []
        }
      }
      setOrderItemsMap(itemsMap)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><p>Loading...</p></div>
  }
  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    )
  }

  const getIngredientName = (ingredientId: string) => ingredientId // Optionally fetch ingredient names if needed

  const totalOrders = orders.length
  const pendingOrders = orders.filter((order) => order.status !== "paid")
  const paidOrders = orders.filter((order) => order.status === "paid")
  const totalOutstanding = pendingOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

  const handleMarkAsPaid = (order: any) => {
    setOrderToPay(order)
    setPaymentAmount(order.total_amount.toString())
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

      if (amount < orderToPay.total_amount) {
        toast({
          title: "Insufficient Payment",
          description: "Payment amount cannot be less than the order total.",
          variant: "destructive",
        })
        return
      }

      // Implement the logic to mark the order as paid
      toast({
        title: "Payment Confirmed",
        description: `Order ${orderToPay.invoice_number} has been marked as paid via ${paymentMethod.replace('_', ' ')}.`,
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
                <span className="font-medium">{totalOrders}</span>
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
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoice_number}</TableCell>
                    <TableCell>{order.order_date ? format(new Date(order.order_date), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>{orderItemsMap[order.id]?.length || 0} items</TableCell>
                    <TableCell>${order.vat_amount?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell>${order.total_amount?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === "paid" ? "default" : "secondary"}
                        className={order.status === "paid" ? "bg-green-500" : "text-amber-500"}
                      >
                        {order.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
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
        <DialogContent className="max-w-2xl w-full sm:w-[90vw] md:w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{selectedOrder.invoice_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedOrder.order_date), "MMM d, yyyy")}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={selectedOrder.status === "paid" ? "default" : "outline"}
                    className={selectedOrder.status === "paid" ? "bg-green-500" : "text-amber-500 border-amber-500"}
                  >
                    {selectedOrder.status === "paid" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Paid</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Pending</>
                    )}
                  </Badge>
                </div>
                {selectedOrder.status === "paid" && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(selectedOrder.payment_method)}
                        <p className="font-medium">{formatPaymentMethod(selectedOrder.payment_method)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="font-medium">
                        {selectedOrder.payment_date
                          ? format(new Date(selectedOrder.payment_date), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-lg overflow-x-auto">
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
                    {orderItemsMap[selectedOrder.id]?.map((item: any) => {
                      const price = Number(item.cost_per_unit) || 0
                      const quantity = Number(item.quantity) || 0
                      return (
                        <TableRow key={item.ingredient_id}>
                          <TableCell className="font-medium">
                            {item.ingredient?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{quantity}</span>
                            <span className="text-muted-foreground ml-1">{item.unit || ''}</span>
                          </TableCell>
                          <TableCell>${price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(quantity * price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({Number(selectedOrder.total_amount) ? ((Number(selectedOrder.vat_amount) / Number(selectedOrder.total_amount)) * 100).toFixed(0) : '0'}%)</span>
                  <span className="font-medium">${Number(selectedOrder.vat_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder && selectedOrder.status !== 'paid' && (
                <div className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={async () => {
                      await supplierOrdersService.updateOrderStatus(selectedOrder.id, 'paid')
                      setSelectedOrder({ ...selectedOrder, status: 'paid' })
                      toast({ title: 'Order marked as paid!' })
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                </div>
              )}
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
                  <span className="font-medium">{orderToPay.invoice_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">${orderToPay.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(orderToPay.order_date), "MMM d, yyyy")}</span>
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
                      min={orderToPay.total_amount}
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