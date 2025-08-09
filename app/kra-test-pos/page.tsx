'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Plus, Minus, Trash2, Receipt, CreditCard, DollarSign, Smartphone, CheckCircle, Users, Percent, X, UtensilsCrossed, History } from "lucide-react"
import { kraTestItemsService, TestKRAItem } from "@/lib/kra-test-items-service"
import { TaxTypeBadge } from "@/components/kra-test-items/tax-type-badge"
import { generateAndDownloadReceipt } from "@/lib/receipt-utils"
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface CartItem {
  item: TestKRAItem
  quantity: number
  price: number
}

interface Customer {
  id: string
  name: string
  kra_pin: string
  phone: string | null
  email: string | null
}

interface Order {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  customer?: Customer | null
  discountAmount: number
  discountType?: string
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  createdAt: string
  stockOutProcessed?: boolean
  stockOutResults?: any[]
  stockOutTimestamp?: string
  refundTrdInvcNo?: string
}

export default function KRATestPOSPage() {
  const { toast } = useToast()
  const [testItems, setTestItems] = useState<TestKRAItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPin, setNewCustomerPin] = useState("")
  const [customerLoading, setCustomerLoading] = useState(false)

  // Discount state
  const [showDiscountDialog, setShowDiscountDialog] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: 'percentage' | 'fixed'
    value: number
  } | null>(null)

  // Refund state
  const [processingRefund, setProcessingRefund] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null)
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundPercentage, setRefundPercentage] = useState('')

  // Load test items on component mount
  useEffect(() => {
    loadTestItems()
    loadOrders()
  }, [])

  const loadTestItems = async () => {
    try {
      setLoading(true)
      const result = await kraTestItemsService.getTestItems()
      
      if (result.success) {
        setTestItems(result.data || [])
      } else {
        toast({
          title: "Error Loading Items",
          description: result.error || "Failed to load test items",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Loading Items",
        description: "Failed to load test items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/test-pos-orders')
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders || [])
      } else {
        console.error('Failed to load orders:', data.error)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  // Filter items based on search and category
  const filteredItems = testItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = Array.from(new Set(testItems.map(item => item.category)))

  // Add item to cart
  const addToCart = (item: TestKRAItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id)
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prevCart, { item, quantity: 1, price: item.cost_per_unit }]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.item.id === itemId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setAppliedDiscount(null)
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Calculate tax dynamically based on each item's tax type
  const calculateDynamicTax = () => {
    let totalTax = 0
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity
      const taxType = item.item.tax_ty_cd || 'B'
      
      switch (taxType) {
        case 'A': // Exempt
          totalTax += 0
          break
        case 'B': // Standard VAT (16%)
          totalTax += itemTotal * 0.16
          break
        case 'C': // Zero-rated
          totalTax += 0
          break
        case 'D': // Non-VAT
          totalTax += 0
          break
        case 'E': // Reduced rate (8%)
          totalTax += itemTotal * 0.08
          break
        default: // Default to standard VAT
          totalTax += itemTotal * 0.16
      }
    })
    return totalTax
  }
  
  const tax = calculateDynamicTax()
  const total = subtotal + tax

  // Discount calculations
  const calculateDiscountAmount = (subtotal: number, discountType: string, discountValue: number): number => {
    switch (discountType) {
      case 'percentage':
        return (subtotal * discountValue) / 100
      case 'fixed':
        return Math.min(discountValue, subtotal) // Don't discount more than subtotal
      default:
        return 0
    }
  }

  const getDiscountedSubtotal = (): number => {
    if (!appliedDiscount) return subtotal
    const discountAmount = calculateDiscountAmount(subtotal, appliedDiscount.type, appliedDiscount.value)
    return Math.max(0, subtotal - discountAmount)
  }

  const getDiscountedTax = (): number => {
    if (!appliedDiscount) return tax
    
    // Calculate tax on discounted amounts for each item
    let discountedTax = 0
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity
      const taxType = item.item.tax_ty_cd || 'B'
      
      // Calculate proportional discount for this item
      const totalOrderAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      const itemDiscountAmount = totalOrderAmount > 0 ? (itemTotal / totalOrderAmount) * getDiscountAmount() : 0
      const discountedItemTotal = itemTotal - itemDiscountAmount
      
      // Calculate tax on discounted amount
      switch (taxType) {
        case 'A': // Exempt
          discountedTax += 0
          break
        case 'B': // Standard VAT (16%)
          discountedTax += discountedItemTotal * 0.16
          break
        case 'C': // Zero-rated
          discountedTax += 0
          break
        case 'D': // Non-VAT
          discountedTax += 0
          break
        case 'E': // Reduced rate (8%)
          discountedTax += discountedItemTotal * 0.08
          break
        default: // Default to standard VAT
          discountedTax += discountedItemTotal * 0.16
      }
    })
    return discountedTax
  }

  const getFinalTotal = (): number => {
    const discountedSubtotal = getDiscountedSubtotal()
    const discountedTax = getDiscountedTax()
    return discountedSubtotal + discountedTax
  }

  const getDiscountAmount = (): number => {
    if (!appliedDiscount) return 0
    return calculateDiscountAmount(subtotal, appliedDiscount.type, appliedDiscount.value)
  }

  // Customer functions
  const searchCustomers = async (query: string) => {
    setCustomerLoading(true)
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setCustomerResults(data.customers || [])
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    } finally {
      setCustomerLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and KRA PIN",
        variant: "destructive",
      })
      return
    }

    setCustomerLoading(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          kra_pin: newCustomerPin.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedCustomer(data.customer)
        setShowCustomerDialog(false)
        setNewCustomerName("")
        setNewCustomerPin("")
        toast({ title: 'Customer Added', description: `Added ${data.customer.name}` })
      } else {
        toast({
          title: "Error Adding Customer",
          description: data.error || "Failed to add customer",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Adding Customer",
        description: "Failed to add customer",
        variant: "destructive",
      })
    } finally {
      setCustomerLoading(false)
    }
  }

  // Discount functions
  const handleApplyDiscount = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast({
        title: "Invalid Discount",
        description: "Please enter a valid discount value",
        variant: "destructive",
      })
      return
    }

    const value = parseFloat(discountValue)
    if (discountType === 'percentage' && value > 100) {
      toast({
        title: "Invalid Discount",
        description: "Percentage discount cannot exceed 100%",
        variant: "destructive",
      })
      return
    }

    setAppliedDiscount({
      type: discountType,
      value: value
    })
    setShowDiscountDialog(false)
    setDiscountValue('')
    toast({
      title: "Discount Applied",
      description: `${discountType === 'percentage' ? value + '%' : formatCurrency(value)} discount applied`,
    })
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    toast({
      title: "Discount Removed",
      description: "Discount has been removed from the order.",
    })
  }

  const processRefund = async (orderId: string) => {
    try {
      setProcessingRefund(orderId)
      
      const response = await fetch('/api/kra/test-pos-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Refund Successful",
          description: `Order #${orderId} has been refunded successfully. Refund Invoice: ${data.refundTrdInvcNo}`,
        })
        
        // Reload orders to show updated status
        loadOrders()
      } else {
        toast({
          title: "Refund Failed",
          description: data.error || "Failed to process refund",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Refund error:', error)
      toast({
        title: "Refund Error",
        description: "An error occurred while processing the refund",
        variant: "destructive",
      })
    } finally {
      setProcessingRefund(null)
    }
  }

  const openRefundDialog = (order: Order) => {
    setSelectedOrderForRefund(order)
    setRefundType('full')
    setRefundAmount('')
    setRefundPercentage('')
    setShowRefundDialog(true)
  }

  const processRefundWithDetails = async () => {
    if (!selectedOrderForRefund) return

    try {
      setProcessingRefund(selectedOrderForRefund.id)
      
      let refundDetails: { refundPercentage?: number; refundAmount?: number } = {}
      
      if (refundType === 'partial') {
        if (refundPercentage && parseFloat(refundPercentage) > 0) {
          const percentage = parseFloat(refundPercentage)
          if (percentage > 100) {
            toast({
              title: "Invalid Percentage",
              description: "Refund percentage cannot exceed 100%",
              variant: "destructive",
            })
            return
          }
          refundDetails = { refundPercentage: percentage }
        } else if (refundAmount && parseFloat(refundAmount) > 0) {
          const amount = parseFloat(refundAmount)
          // if (amount > selectedOrderForRefund.total) {
          //   toast({
          //     title: "Invalid Amount",
          //     description: "Refund amount cannot exceed order total",
          //     variant: "destructive",
          //   })
          //   return
          // }
          refundDetails = { refundAmount: amount }
        } else {
          toast({
            title: "Invalid Refund Details",
            description: "Please enter a valid refund amount or percentage",
            variant: "destructive",
          })
          return
        }
      }

      const response = await fetch('/api/kra/test-pos-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: selectedOrderForRefund.id,
          refundType,
          ...refundDetails
        }),
      })

      const data = await response.json()

      if (data.success) {
        const refundText = refundType === 'full' 
          ? 'full amount' 
          : refundDetails.refundPercentage 
            ? `${refundDetails.refundPercentage}%` 
            : `${formatCurrency(refundDetails.refundAmount || 0)}`
        
        toast({
          title: "Refund Successful",
          description: `Order #${selectedOrderForRefund.id} has been refunded ${refundText}. Refund Invoice: ${data.refundTrdInvcNo}`,
        })
        
        setShowRefundDialog(false)
        setSelectedOrderForRefund(null)
        loadOrders()
      } else {
        toast({
          title: "Refund Failed",
          description: data.error || "Failed to process refund",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Refund error:', error)
      toast({
        title: "Refund Error",
        description: "An error occurred while processing the refund",
        variant: "destructive",
      })
    } finally {
      setProcessingRefund(null)
    }
  }

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      // Create order with customer and discount info
      const order: Order = {
        id: `order-${Date.now()}`,
        items: cart,
        subtotal: getDiscountedSubtotal(),
        tax: getDiscountedTax(),
        total: getFinalTotal(),
        paymentMethod,
        customer: selectedCustomer,
        discountAmount: getDiscountAmount(),
        discountType: appliedDiscount?.type,
        status: 'completed',
        createdAt: new Date().toISOString()
      }

      // Send to KRA
      const kraResponse = await fetch('/api/kra/test-pos-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      })

      const kraData = await kraResponse.json()

      if (kraData.success) {
        // Clear cart and reload orders
        setCart([])
        setSelectedCustomer(null)
        setAppliedDiscount(null)
        loadOrders()

        // Generate PDF receipt on client side
        if (kraData.receiptData) {
          try {
            await generateAndDownloadReceipt(kraData.receiptData)
            toast({
              title: "Payment Successful",
              description: `Order completed for ${formatCurrency(getFinalTotal())} and sent to KRA. Stock levels updated. PDF receipt has been automatically downloaded.`,
            })
          } catch (receiptError) {
            console.error('Error generating PDF receipt:', receiptError)
            toast({
              title: "Payment Successful",
              description: `Order completed for ${formatCurrency(getFinalTotal())} and sent to KRA. PDF receipt generation failed.`,
            })
          }
        } else {
          toast({
            title: "Payment Successful",
            description: `Order completed for ${formatCurrency(getFinalTotal())} and sent to KRA. Stock levels updated.`,
          })
        }

        console.log('KRA Test POS Order:', order)
        console.log('KRA Response:', kraData)
      } else {
        toast({
          title: "KRA Submission Failed",
          description: kraData.error || "Failed to send sale to KRA",
          variant: "destructive",
        })
      }

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4" />
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'mobile': return <Smartphone className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KRA Test POS</h1>
              <p className="text-gray-600 dark:text-gray-400">Sell KRA test items with tax compliance</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOrderHistory(!showOrderHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                {showOrderHistory ? 'Hide' : 'Show'} History
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Menu Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Test Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Items Grid */}
                  <ScrollArea className="h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {loading ? (
                        <div className="col-span-full text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p>Loading items...</p>
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <p className="text-muted-foreground">No items found</p>
                        </div>
                      ) : (
                        filteredItems.map(item => (
                          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm">{item.name}</h3>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                </div>
                                <TaxTypeBadge taxType={item.tax_ty_cd} />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{formatCurrency(item.cost_per_unit)}</span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="ml-2"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Cart and Payment */}
            <div className="space-y-6">
              {/* Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart ({cart.length} items)
                    </div>
                    {cart.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearCart}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.item.name}</h4>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Customer Selection */}
                      <div className="border-t pt-4">
                        <Button variant="outline" onClick={() => setShowCustomerDialog(true)} className="w-full">
                          {selectedCustomer ? `Customer: ${selectedCustomer.name} (${selectedCustomer.kra_pin})` : 'Add Customer'}
                        </Button>
                        {selectedCustomer && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                            <span className="font-semibold">Customer:</span> {selectedCustomer.name} (<span className="font-mono">{selectedCustomer.kra_pin}</span>)
                          </div>
                        )}
                      </div>

                      {/* Discount Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Discount</span>
                          {appliedDiscount ? (
                            <Button variant="outline" size="sm" onClick={handleRemoveDiscount}>
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setShowDiscountDialog(true)}>
                              <Percent className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                        {appliedDiscount && (
                          <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                            <span className="font-semibold">Applied:</span> {appliedDiscount.type === 'percentage' ? appliedDiscount.value + '%' : formatCurrency(appliedDiscount.value)} discount
                          </div>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {appliedDiscount && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-{formatCurrency(getDiscountAmount())}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(appliedDiscount ? getDiscountedTax() : tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(getFinalTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: <DollarSign className="h-4 w-4" /> },
                      { value: 'card', label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
                      { value: 'mobile', label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> }
                    ].map((method) => (
                      <Button
                        key={method.value}
                        variant={paymentMethod === method.value ? "default" : "outline"}
                        onClick={() => setPaymentMethod(method.value)}
                        className="flex flex-col items-center gap-1 h-auto py-3"
                      >
                        {method.icon}
                        <span className="text-xs">{method.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Process Payment */}
              <Button
                onClick={processPayment}
                disabled={cart.length === 0 || isProcessingPayment}
                className="w-full"
                size="lg"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Process Payment ({formatCurrency(total)})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Order History */}
          {showOrderHistory && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Order History</span>
                  <Button variant="outline" size="sm" onClick={loadOrders}>
                    <History className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">Order #{order.id}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>Items: {order.items.length}</p>
                            <p>Total: {formatCurrency(order.total)}</p>
                            {order.customer && (
                              <p>Customer: {order.customer.name} ({order.customer.kra_pin})</p>
                            )}
                            {order.discountAmount > 0 && (
                              <p className="text-green-600">Discount: -{formatCurrency(order.discountAmount)}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                KRA: {order.status === 'completed' ? 'Success' : order.status === 'refunded' ? 'Refunded' : 'Pending'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Stock: {order.stockOutProcessed ? 'Updated' : 'Pending'}
                              </Badge>
                              {order.status === 'refunded' && order.refundTrdInvcNo && (
                                <Badge variant="secondary" className="text-xs">
                                  Refund: {order.refundTrdInvcNo}
                                </Badge>
                              )}
                            </div>
                            {order.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRefundDialog(order)}
                                disabled={processingRefund === order.id}
                                className="mt-2"
                              >
                                {processingRefund === order.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                {processingRefund === order.id ? 'Refunding...' : 'Refund'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Customer Dialog */}
          <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select or Add Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      if (e.target.value.length > 1) searchCustomers(e.target.value)
                    }}
                  />
                  {customerLoading && <div className="text-xs text-muted-foreground">Searching...</div>}
                  {customerResults.map(cust => (
                    <div key={cust.id} className="flex justify-between items-center p-2 border rounded mt-2">
                      <div>
                        <div className="font-medium">{cust.name}</div>
                        <div className="text-sm text-muted-foreground">{cust.kra_pin}</div>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedCustomer(cust); setShowCustomerDialog(false) }}>Select</Button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Register New Customer</h4>
                  <Input placeholder="Name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="mb-2" />
                  <Input placeholder="KRA PIN" value={newCustomerPin} onChange={e => setNewCustomerPin(e.target.value)} className="mb-2" />
                  <Button onClick={handleAddCustomer} disabled={customerLoading}>Add Customer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Discount Dialog */}
          <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Discount</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyDiscount} className="flex-1">Apply Discount</Button>
                  <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Refund Dialog */}
          <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Refund</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedOrderForRefund && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Order Details</h4>
                    <div className="text-sm space-y-1">
                      <p>Order #: {selectedOrderForRefund.id}</p>
                      <p>Total: {formatCurrency(selectedOrderForRefund.total)}</p>
                      <p>Items: {selectedOrderForRefund.items.length}</p>
                      {selectedOrderForRefund.customer && (
                        <p>Customer: {selectedOrderForRefund.customer.name}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Refund Type</Label>
                  <Select value={refundType} onValueChange={(value: 'full' | 'partial') => setRefundType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {refundType === 'partial' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Refund by Percentage</Label>
                      <Input
                        type="number"
                        placeholder="Enter percentage (e.g., 50 for 50%)"
                        value={refundPercentage}
                        onChange={(e) => {
                          setRefundPercentage(e.target.value)
                          setRefundAmount('')
                        }}
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">OR</div>
                    <div>
                      <Label>Refund by Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount in KES"
                        value={refundAmount}
                        onChange={(e) => {
                          setRefundAmount(e.target.value)
                          setRefundPercentage('')
                        }}
                      />
                    </div>
                    {selectedOrderForRefund && (
                      <div className="text-sm text-muted-foreground">
                        {refundPercentage && parseFloat(refundPercentage) > 0 && (
                          <p>Refund Amount: {formatCurrency((selectedOrderForRefund.total * parseFloat(refundPercentage)) / 100)}</p>
                        )}
                        {refundAmount && parseFloat(refundAmount) > 0 && (
                          <p>Refund Percentage: {((parseFloat(refundAmount) / selectedOrderForRefund.total) * 100).toFixed(1)}%</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={processRefundWithDetails} 
                    className="flex-1"
                    disabled={processingRefund === selectedOrderForRefund?.id}
                  >
                    {processingRefund === selectedOrderForRefund?.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Process Refund
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
} 