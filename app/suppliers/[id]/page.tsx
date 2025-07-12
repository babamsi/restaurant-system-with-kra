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
import { FileText, CheckCircle, Building2, Receipt, DollarSign, Calendar, CreditCard, Wallet, Banknote, AlertCircle, ArrowLeft } from "lucide-react"
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
import Link from "next/link"

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
  const [paymentLoading, setPaymentLoading] = useState(false)

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
  const pendingOrders = orders.filter((order) => order.status === "pending")
  const partiallyPaidOrders = orders.filter((order) => order.status === "partially_paid")
  const paidOrders = orders.filter((order) => order.status === "paid")
  
  // Calculate outstanding amounts including partially paid orders
  const totalOutstanding = orders.reduce((sum, order) => {
    if (order.status === 'paid') return sum
    if (order.status === 'partially_paid') {
      // Parse payment info from notes
      try {
        const parsed = JSON.parse(order.notes || '{}')
        const remainingAmount = parsed.remaining_amount || order.total_amount
        return sum + remainingAmount
      } catch (e) {
        return sum + order.total_amount
      }
    }
    return sum + order.total_amount
  }, 0)

  const handleMarkAsPaid = (order: any) => {
    setOrderToPay(order)
    
    // Calculate remaining amount for partially paid orders
    let remainingAmount = order.total_amount
    if (order.status === 'partially_paid' && order.notes) {
      try {
        const parsed = JSON.parse(order.notes)
        remainingAmount = parsed.remaining_amount || order.total_amount
      } catch (e) {
        remainingAmount = order.total_amount
      }
    }
    
    setPaymentAmount(remainingAmount.toString())
    setShowPaymentDialog(true)
    setSelectedOrder(null) // Close the order details dialog
  }

  const confirmPayment = async () => {
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

      setPaymentLoading(true)
      try {
        // Update the order in the database with payment details
        const { data, error } = await supplierOrdersService.markOrderAsPaid(
          orderToPay.id,
          paymentMethod,
          amount
        )

        if (error) {
          throw new Error(error)
        }

        // Parse payment info from the updated order
        let paymentInfo = null
        if (data?.notes) {
          try {
            const parsed = JSON.parse(data.notes)
            if (parsed.payments && Array.isArray(parsed.payments)) {
              paymentInfo = parsed
            }
          } catch (e) {
            // Handle non-JSON notes
          }
        }

        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderToPay.id 
              ? { 
                  ...order, 
                  status: data?.status || 'pending',
                  notes: data?.notes || order.notes
                }
              : order
          )
        )

        // Show appropriate success message
        const totalPaid = paymentInfo?.total_paid || amount
        const remainingAmount = paymentInfo?.remaining_amount || 0
        
        if (data?.status === 'paid') {
          toast({
            title: "Payment Complete",
            description: `Order ${orderToPay.invoice_number} has been fully paid via ${formatPaymentMethod(paymentMethod)}.`,
          })
        } else if (data?.status === 'partially_paid') {
          toast({
            title: "Partial Payment Processed",
            description: `Payment of Ksh ${amount.toFixed(2)} processed. Remaining: Ksh ${remainingAmount.toFixed(2)}`,
          })
        } else {
          toast({
            title: "Payment Processed",
            description: `Payment of Ksh ${amount.toFixed(2)} has been recorded.`,
          })
        }
        
        setShowPaymentDialog(false)
        setOrderToPay(null)
        setPaymentAmount("")
        setPaymentMethod("bank_transfer")
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to process payment",
          variant: "destructive",
        })
      } finally {
        setPaymentLoading(false)
      }
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

  const getPaymentHistory = (order: any) => {
    if (!order.notes) return []
    try {
      const parsed = JSON.parse(order.notes)
      if (parsed.payments && Array.isArray(parsed.payments)) {
        return parsed.payments.map((payment: any, index: number) => ({
          id: index,
          method: payment.method,
          amount: payment.amount,
          date: payment.date,
          formattedMethod: formatPaymentMethod(payment.method)
        }))
      }
    } catch (e) {
      // Handle non-JSON notes
    }
    return []
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/suppliers">
          <Button variant="outline" className="flex items-center gap-2 hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Suppliers</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">Supplier Details</p>
        </div>
      </div>

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
                <span className="text-muted-foreground">Partially Paid:</span>
                <span className="font-medium text-orange-500">{partiallyPaidOrders.length}</span>
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
              Ksh {totalOutstanding.toFixed(2)}
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
                    <TableCell>Ksh {order.vat_amount?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell>Ksh {order.total_amount?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === "paid" ? "default" : order.status === "partially_paid" ? "secondary" : "outline"}
                        className={order.status === "paid" ? "bg-green-500" : order.status === "partially_paid" ? "text-orange-500 border-orange-500" : "text-amber-500 border-amber-500"}
                      >
                        {order.status === "paid" ? "Paid" : order.status === "partially_paid" ? "Partially Paid" : order.status || 'pending'}
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
        <DialogContent className="max-w-2xl w-full sm:w-[90vw] md:w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
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
                    variant={selectedOrder.status === "paid" ? "default" : selectedOrder.status === "partially_paid" ? "secondary" : "outline"}
                    className={selectedOrder.status === "paid" ? "bg-green-500" : selectedOrder.status === "partially_paid" ? "text-orange-500 border-orange-500" : "text-amber-500 border-amber-500"}
                  >
                    {selectedOrder.status === "paid" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Paid</>
                    ) : selectedOrder.status === "partially_paid" ? (
                      <><AlertCircle className="h-3 w-3 mr-1" />Partially Paid</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Pending</>
                    )}
                  </Badge>
                </div>
                {(selectedOrder.status === "paid" || selectedOrder.status === "partially_paid") && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Payment Progress</p>
                    <div className="space-y-1">
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedOrder.notes || '{}')
                          const totalPaid = parsed.total_paid || 0
                          const remainingAmount = parsed.remaining_amount || 0
                          const progressPercentage = (totalPaid / selectedOrder.total_amount) * 100
                          
                          return (
                            <>
                              <div className="flex justify-between text-xs">
                                <span>Paid: Ksh {totalPaid.toFixed(2)}</span>
                                <span>{progressPercentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                ></div>
                              </div>
                              {remainingAmount > 0 && (
                                <p className="text-xs text-orange-600 font-medium">
                                  Remaining: Ksh {remainingAmount.toFixed(2)}
                                </p>
                              )}
                            </>
                          )
                        } catch (e) {
                          return <p className="text-xs text-muted-foreground">Payment info unavailable</p>
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Payment Methods Summary */}
                {(selectedOrder.status === "paid" || selectedOrder.status === "partially_paid") && (() => {
                  const paymentHistory = getPaymentHistory(selectedOrder)
                  if (paymentHistory.length === 0) return null
                  
                  const uniqueMethods = [...new Set(paymentHistory.map((p: any) => p.method))] as string[]
                  
                  return (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payment Methods Used</p>
                      <div className="flex flex-wrap gap-2">
                        {uniqueMethods.map((method: string) => (
                          <Badge key={method} variant="outline" className="flex items-center gap-1">
                            {getPaymentMethodIcon(method)}
                            <span className="text-xs">{formatPaymentMethod(method)}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Payment History Section */}
              {(selectedOrder.status === "paid" || selectedOrder.status === "partially_paid") && (() => {
                const paymentHistory = getPaymentHistory(selectedOrder)
                if (paymentHistory.length === 0) return null
                
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Payment History</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {paymentHistory.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              {getPaymentMethodIcon(payment.method)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{payment.formattedMethod}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.date), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              Ksh {payment.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

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
                          <TableCell>Ksh {price.toFixed(2)}</TableCell>
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
                  <span className="font-medium">Ksh {Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({Number(selectedOrder.total_amount) ? ((Number(selectedOrder.vat_amount) / Number(selectedOrder.total_amount)) * 100).toFixed(0) : '0'}%)</span>
                  <span className="font-medium">Ksh {Number(selectedOrder.vat_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>Ksh {Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder && selectedOrder.status !== 'paid' && (
                <div className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleMarkAsPaid(selectedOrder)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedOrder.status === 'partially_paid' ? 'Add Payment' : 'Mark as Paid'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Process Payment
            </DialogTitle>
          </DialogHeader>
          {orderToPay && (
            <div className="space-y-6 py-4">
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="font-medium">{orderToPay.invoice_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">Ksh {orderToPay.total_amount.toFixed(2)}</span>
                </div>
                {orderToPay.status === 'partially_paid' && (() => {
                  try {
                    const parsed = JSON.parse(orderToPay.notes || '{}')
                    const totalPaid = parsed.total_paid || 0
                    const remainingAmount = parsed.remaining_amount || 0
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Already Paid:</span>
                          <span className="font-medium text-green-600">Ksh {totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining Amount:</span>
                          <span className="font-medium text-orange-600">Ksh {remainingAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )
                  } catch (e) {
                    return null
                  }
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(orderToPay.order_date), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="payment-amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-8"
                      placeholder={orderToPay.status === 'partially_paid' ? "Enter payment amount" : "0.00"}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {orderToPay.status === 'partially_paid' && (() => {
                    try {
                      const parsed = JSON.parse(orderToPay.notes || '{}')
                      const remainingAmount = parsed.remaining_amount || 0
                      return (
                        <p className="text-xs text-muted-foreground">
                          Enter any amount up to Ksh {remainingAmount.toFixed(2)} remaining
                        </p>
                      )
                    } catch (e) {
                      return null
                    }
                  })()}
                </div>

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem
                        value="bank_transfer"
                        id="bank_transfer"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="bank_transfer"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                      >
                        <Banknote className="mb-2 h-5 w-5" />
                        <span className="text-xs text-center">Bank Transfer</span>
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
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                      >
                        <CreditCard className="mb-2 h-5 w-5" />
                        <span className="text-xs text-center">Credit Card</span>
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
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                      >
                        <Wallet className="mb-2 h-5 w-5" />
                        <span className="text-xs text-center">Cash</span>
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
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                      >
                        <Receipt className="mb-2 h-5 w-5" />
                        <span className="text-xs text-center">Check</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={confirmPayment} className="w-full sm:w-auto" disabled={paymentLoading}>
              {paymentLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 