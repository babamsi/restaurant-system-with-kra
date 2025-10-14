"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  History,
  Settings,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  FileText,
  CheckCircle,
  QrCode,
  Pencil,
  XCircle,
  RefreshCw,
  Smartphone,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore, useCompletePOSStore as usePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import type { MenuItem, CartItem } from "@/types/unified-system"
import { supabase } from "@/lib/supabase"
import { tableOrdersService } from "@/lib/database"
import Image from "next/image"
import { QRCode } from "@/components/ui/qr-code"
import { Label } from "@/components/ui/label"
import { generateAndDownloadReceipt, generatePDFReceipt, downloadReceiptAsPDF, type ReceiptRequest } from '@/lib/receipt-utils'
import { io } from "socket.io-client"

interface TableState {
  id: number
  number: string
  status: "available" | "occupied" | "needs-cleaning"
  orderId?: string
  pax: number
  currentOrder?: any // TableOrder from database
}

interface Recipe {
  id: string
  name: string
  description?: string
  restaurant: 'Omel Dunia' | 'Mamma Mia'
  price?: number
  category?: string
  components: RecipeComponent[]
  available: boolean
  image_url?: string
}

interface RecipeComponent {
  component_id: string
  component_type: 'ingredient' | 'batch'
  quantity: number
  unit: string
  name: string
}

interface ExtendedMenuItem extends MenuItem {
  restaurant?: 'Omel Dunia' | 'Mamma Mia'
}

export function CorrectedPOSSystem() {
  const { toast } = useToast()
  const {
    menuItems,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateOrder,
    getCartTotal,
    getCartItemCount,
    getAvailableMenuItems,
    loadCart,
    updateOrderStatus,
  } = useCompletePOSStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedRestaurant, setSelectedRestaurant] = useState<"all" | "Omel Dunia" | "Mamma Mia">("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showHistory, setShowHistory] = useState(false)
  const { orders: allOrders } = useOrdersStore()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["All"])

  const [tables, setTables] = useState<TableState[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      number: `T${i + 1}`,
      status: "available",
      pax: 0,
    })),
  )
  const [selectedTable, setSelectedTable] = useState<TableState | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [tableOrders, setTableOrders] = useState<Record<number, any>>({})

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<{ menuItem: ExtendedMenuItem; portionSize?: string } | null>(null)
  const [customizationNotes, setCustomizationNotes] = useState("")

  const [showTableOptions, setShowTableOptions] = useState<null | TableState>(null)
  const [showPayment, setShowPayment] = useState<null | { table: TableState; orderId: string }>(null)
  const [existingOrderItems, setExistingOrderItems] = useState<CartItem[]>([])
  const [showPendingOrders, setShowPendingOrders] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [orderHistory, setOrderHistory] = useState<any[]>([])

  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'split' | null>(null)
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', mpesa: '', card: '' })
  const [splitError, setSplitError] = useState<string | null>(null)

  const [placingOrder, setPlacingOrder] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [mpesaNumber, setMpesaNumber] = useState('')

  const [showTransferDialog, setShowTransferDialog] = useState<null | { orderId: string; fromTable: TableState }>(null)
  const [transferTargetTable, setTransferTargetTable] = useState<TableState | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [transferringOrder, setTransferringOrder] = useState(false)

  // M-Pesa Payment State
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('')
  const [transactionId, setTransactionId] = useState<string>('')
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('')
  const [mpesaProcessing, setMpesaProcessing] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionClosing, setSessionClosing] = useState(false)

  const [showQRDialog, setShowQRDialog] = useState(false)
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({})

  // Take Away State
  const [showTakeAwayDialog, setShowTakeAwayDialog] = useState(false)
  const [takeAwayOrders, setTakeAwayOrders] = useState<any[]>([])

  // Add state for editing an existing item
  const [editingExistingItem, setEditingExistingItem] = useState<null | { item: CartItem; index: number }>(null)
  const [editItemQuantity, setEditItemQuantity] = useState(1)
  const [editItemCustomization, setEditItemCustomization] = useState("")
  const [editItemPortionSize, setEditItemPortionSize] = useState<string | undefined>(undefined)

  // Add state for replacing an existing item
  const [replacingExistingItem, setReplacingExistingItem] = useState<null | { item: CartItem; index: number }>(null)
  const [replaceSelectedMenuItem, setReplaceSelectedMenuItem] = useState<ExtendedMenuItem | null>(null)

  // Refund state
  const [showRefundDialog, setShowRefundDialog] = useState<null | { order: any }>(null)
  const [refundMode, setRefundMode] = useState<'full' | 'partial'>('full')
  const [refundItems, setRefundItems] = useState<Array<{ id: any; menu_item_name: string; unit_price: number; max: number; quantity: number }>>([])

  const openRefundDialog = (order: any) => {
    setRefundMode('full')
    setRefundItems((order.items || []).map((it: any) => ({
      id: it.id,
      menu_item_name: it.menu_item_name,
      unit_price: it.unit_price || 0,
      max: it.quantity || 0,
      quantity: 0,
    })))
    setShowRefundDialog({ order })
  }

  const updateRefundItemQty = (id: any, qty: number) => {
    setRefundItems((prev) => prev.map(it => it.id === id ? { ...it, quantity: Math.max(0, Math.min(it.max, qty)) } : it))
  }

  const getRefundTotal = (): number => {
    if (!showRefundDialog) return 0
    if (refundMode === 'full') {
      return showRefundDialog.order.total_amount || 0
    }
    return refundItems.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0)
  }

  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false)

  const submitRefund = async () => {
    if (!showRefundDialog) return
    try {
      setIsSubmittingRefund(true)
      const orderId = showRefundDialog.order.id
      let body: any = { orderId }
      if (refundMode === 'partial') {
        const items = refundItems.filter(it => it.quantity > 0).map(it => ({
          menu_item_name: it.menu_item_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
        }))
        if (items.length === 0) {
          toast({ title: 'No Items Selected', description: 'Select at least one item to refund.', variant: 'destructive' })
          return
        }
        body.refundItems = items
      }

      const res = await fetch('/api/kra/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Refund failed')
      }

      // Generate PDF receipt on client side after successful refund
      try {
        if (showRefundDialog) {
          const order = showRefundDialog.order
          const selectedItems = refundMode === 'partial' 
            ? refundItems.filter(it => it.quantity > 0)
            : order.items || []

          // Fetch recipes to get correct tax codes
          const recipeIds = Array.from(new Set(selectedItems.map((item: any) => item.menu_item_id).filter((id: any) => Boolean(id))))
          const { data: recipesData } = await supabase
            .from('recipes')
            .select('id, name, itemCd, itemClsCd, taxTyCd')
            .in('id', recipeIds)

          const recipeById = new Map((recipesData || []).map(r => [r.id, r]))

          // Build receipt items with proper tax information from recipes
          const receiptItems = selectedItems.map((item: any) => {
            const recipe = recipeById.get(item.menu_item_id)
            // Use tax code from recipe, fallback to item, then default to 'B'
            console.log("item: _>> ", item)
            const taxType = recipe?.taxTyCd || item.taxTyCd
            
            console.log(`Refund PDF - Item: ${item.menu_item_name}, Recipe ID: ${item.menu_item_id}, Recipe Tax: ${recipe?.taxTyCd}, Item Tax: ${item.taxTyCd}, Final Tax: ${taxType}`)
            
            const itemTotal = item.unit_price * item.quantity
            const taxAmount = taxType === 'B' ? itemTotal * 0.16 : 
                             taxType === 'E' ? itemTotal * 0.08 : 0
            
            return {
              name: item.menu_item_name || item.name,
              unit_price: -item.unit_price, // Negative for refund
              quantity: item.quantity,
              total: -itemTotal, // Negative for refund
              tax_rate: taxType === 'B' ? 16 : taxType === 'E' ? 8 : 0,
              tax_amount: -taxAmount, // Negative for refund
              tax_type: taxType
            }
          })

          // Calculate totals (negative for refund)
          const totalAmount = receiptItems.reduce((sum: number, item: any) => sum + item.total, 0)
          const totalTaxAmount = receiptItems.reduce((sum: number, item: any) => sum + item.tax_amount, 0)
          const netAmount = totalAmount - totalTaxAmount

          const receiptData: ReceiptRequest = {
            kraData: {
              curRcptNo: data.kraData?.data?.curRcptNo || data.refundInvoiceNo?.toString() || '',
              totRcptNo: data.kraData?.data?.totRcptNo || data.refundInvoiceNo?.toString() || '',
              intrlData: data.kraData?.data?.intrlData || '',
              rcptSign: data.kraData?.data?.rcptSign || '',
              sdcDateTime: data.kraData?.data?.sdcDateTime || new Date().toISOString(),
              invcNo: data.refundInvoiceNo || 0,
              trdInvcNo: order.id
            },
            items: receiptItems,
            customer: {
              name: order.customer_name || null,
              pin: order.customer_tin || null
            },
            payment_method: (() => {
              try {
                const paymentData = typeof order.payment_method === 'string' 
                  ? JSON.parse(order.payment_method) 
                  : order.payment_method
                return paymentData?.method || 'Cash'
              } catch {
                return 'Cash'
              }
            })(),
            total_amount: totalAmount, // Negative for refund
            tax_amount: totalTaxAmount, // Negative for refund
            net_amount: netAmount, // Negative for refund
            order_id: order.id,
            discount_amount: 0,
            discount_percentage: 0,
            discount_narration: ''
          }

          // Generate and download refund receipt as PDF
          await generateAndDownloadReceipt(receiptData)
        }
      } catch (pdfErr) {
        console.error('Error generating refund PDF:', pdfErr)
        // Don't fail the refund if PDF generation fails
      }

      toast({ 
        title: 'Refund Successful', 
        description: data.message || 'Refund was processed and sent to KRA.' + (data.pdfGenerated ? ' PDF receipt downloaded.' : ''),
        variant: 'default'
      })
      
      setShowRefundDialog(null)
      await loadOrderHistory()
    } catch (e: any) {
      toast({ title: 'Refund Error', description: e.message || 'Failed to process refund', variant: 'destructive' })
    } finally {
      setIsSubmittingRefund(false)
    }
  }


  // Discount System State
  const [showDiscountDialog, setShowDiscountDialog] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'bogo' | 'custom'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [discountReason, setDiscountReason] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: 'percentage' | 'fixed' | 'bogo' | 'custom'
    value: number
    reason: string
    amount: number
  } | null>(null)
  const [bogoItems, setBogoItems] = useState<{ itemId: string; originalPrice: number; discountedPrice: number }[]>([])

  // Add these helpers inside the component, after your useState hooks:
  const TAX_RATE = 0; // No additional tax - prices already include tax
  const TAX_FACTOR = 0; // No tax factor needed

  // Utility functions for database storage (convert to/from integers for int2 column)
  const convertToInt = (amount: number): number => {
    return Math.floor(amount); // Store as integer, truncating decimal part
  };

  const convertFromInt = (intValue: number): number => {
    return intValue; // Return as is since we're storing integers
  };

  // Helper function to safely get discount amount from database
  const getDiscountAmountFromDB = (order: any): number => {
    if (!order.discount_amount) return 0;
    return order.discount_amount; // Return as is since column will be decimal
  };

  // Tax Calculation Functions - Updated to be responsive to discounts
  function calcCartSubtotal() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity) / (1 + TAX_RATE), 0);
  }
  
  function calcCartTax() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity) * TAX_RATE / (1 + TAX_RATE), 0);
  }
  
  function calcCartTotal() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }

  // New functions for discount-responsive tax calculations
  function getDiscountedSubtotal(): number {
    const subtotal = calcCartSubtotal();
    if (!appliedDiscount) return subtotal;
    
    const discountAmount = calculateDiscountAmount(subtotal, appliedDiscount.type, appliedDiscount.value);
    return Math.max(0, subtotal - discountAmount);
  }
  
  function getDiscountedTax(): number {
    const discountedSubtotal = getDiscountedSubtotal();
    return discountedSubtotal * TAX_RATE;
  }
  
  function getFinalTotal(): number {
    const discountedSubtotal = getDiscountedSubtotal();
    const discountedTax = getDiscountedTax();
    return discountedSubtotal + discountedTax;
  }

  function calcOrderSubtotal(items: any[]) {
    return items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity) / (1 + TAX_RATE), 0);
  }
  
  function calcOrderTax(items: any[]) {
    return items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity) * TAX_RATE / (1 + TAX_RATE), 0);
  }
  
  function calcOrderTotal(items: any[]) {
    return items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
  }

  // New functions for order items with discount-responsive tax
  function getDiscountedOrderSubtotal(items: any[]): number {
    const subtotal = calcOrderSubtotal(items);
    if (!appliedDiscount) return subtotal;
    
    const discountAmount = calculateDiscountAmount(subtotal, appliedDiscount.type, appliedDiscount.value);
    return Math.max(0, subtotal - discountAmount);
  }
  
  function getDiscountedOrderTax(items: any[]): number {
    const discountedSubtotal = getDiscountedOrderSubtotal(items);
    return discountedSubtotal * TAX_RATE;
  }
  
  function getDiscountedOrderTotal(items: any[]): number {
    const discountedSubtotal = getDiscountedOrderSubtotal(items);
    const discountedTax = getDiscountedOrderTax(items);
    return discountedSubtotal + discountedTax;
  }

  // Discount Calculation Functions
  function calculateDiscountAmount(subtotal: number, discountType: string, discountValue: number): number {
    switch (discountType) {
      case 'percentage':
        return (subtotal * discountValue) / 100
      case 'fixed':
        return Math.min(discountValue, subtotal) // Don't discount more than subtotal
      case 'bogo':
        return calculateBogoDiscount()
      case 'custom':
        return Math.min(discountValue, subtotal)
      default:
        return 0
    }
  }

  function calculateBogoDiscount(): number {
    if (bogoItems.length === 0) {
      // Calculate BOGO discount on the fly if not already calculated
      const itemGroups = cart.reduce((groups: Record<string, CartItem[]>, item) => {
        const key = item.name
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
        return groups
      }, {})

      let totalDiscount = 0
      Object.values(itemGroups).forEach(group => {
        const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0)
        const pairs = Math.floor(totalQuantity / 2)
        
        if (pairs > 0) {
          const item = group[0]
          const originalPrice = item.unit_price
          const discountedPrice = originalPrice / 2
          totalDiscount += (originalPrice - discountedPrice) * pairs * 2
        }
      })
      
      return totalDiscount
    }
    
    return bogoItems.reduce((total, bogoItem) => {
      return total + (bogoItem.originalPrice - bogoItem.discountedPrice)
    }, 0)
  }

  function applyBogoDiscount(): void {
    const newBogoItems: { itemId: string; originalPrice: number; discountedPrice: number }[] = []
    
    // Group items by name to find pairs for BOGO
    const itemGroups = cart.reduce((groups: Record<string, CartItem[]>, item) => {
      const key = item.name
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})

    // Apply BOGO to each group
    Object.values(itemGroups).forEach(group => {
      const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0)
      const pairs = Math.floor(totalQuantity / 2)
      
      if (pairs > 0) {
        const item = group[0]
        const originalPrice = item.unit_price
        const discountedPrice = originalPrice / 2 // Half price for BOGO
        
        newBogoItems.push({
          itemId: item.id,
          originalPrice: originalPrice * pairs * 2, // Full price for all items
          discountedPrice: discountedPrice * pairs * 2 // Half price for all items
        })
      }
    })

    setBogoItems(newBogoItems)
  }

  function getDiscountedCartTotal(): number {
    return getFinalTotal()
  }

  function getDiscountAmount(): number {
    if (!appliedDiscount) return 0
    const subtotal = calcCartSubtotal()
    return calculateDiscountAmount(subtotal, appliedDiscount.type, appliedDiscount.value)
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const { data: recipesData } = await supabase.from("recipes").select("*")
      if (!recipesData) {
        setRecipes([])
        setLoading(false)
        return
      }
      
      const allRecipes = await Promise.all(recipesData.map(async (recipe) => {
        const { data: components } = await supabase
          .from("recipe_components")
          .select("*")
          .eq("recipe_id", recipe.id)
        
        const resolvedComponents = await Promise.all((components || []).map(async (c) => {
          if (c.component_type === "ingredient") {
            const { data: ing } = await supabase.from("ingredients").select("name, unit").eq("id", c.component_id).single()
            return { ...c, name: ing?.name || "Unknown", unit: c.unit || ing?.unit, type: "ingredient", available: true }
          } else {
            const { data: batch } = await supabase.from("batches").select("name, yield_unit").eq("id", c.component_id).single()
            return { ...c, name: batch?.name || "Unknown", unit: c.unit || batch?.yield_unit, type: "batch", available: true }
          }
        }))
        
        return {
          ...recipe,
          components: resolvedComponents,
          available: true,
        }
      }))
      
      setRecipes(allRecipes)
      
      const uniqueCategories = ["All", ...Array.from(new Set(allRecipes.map(r => r.category).filter(Boolean)))]
      setCategories(uniqueCategories)
      
    } catch (error) {
      console.error("Error fetching recipes:", error)
      toast({
        title: "Error Loading Recipes",
        description: "Failed to load recipes from database",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  // Load table orders on component mount
  useEffect(() => {
    loadTableOrders()
    loadTakeAwayOrders()
    loadOrderHistory()
  }, [])

  const loadTableOrders = async () => {
    if (!sessionId) {
      console.log('POS: No session ID, skipping table orders load')
      return
    }
    
    try {
      // Load active orders for current session (including completed orders that haven't been paid)
      const { data: pendingOrders, error } = await tableOrdersService.getPendingOrdersBySession(sessionId)
      
      if (error) {
        console.error('POS: Error loading table orders:', error)
        return
      }
      
      if (pendingOrders) {
        const ordersMap: Record<number, any> = {}
        pendingOrders.forEach((order: any) => {
          ordersMap[order.table_id] = order
        })
        setTableOrders(ordersMap)
        setPendingOrders(pendingOrders)
        
        // Update table statuses based on orders
        // Tables remain occupied until payment (status becomes 'paid')
        setTables(prevTables => prevTables.map(table => ({
          ...table,
          status: ordersMap[table.id] ? "occupied" : "available",
          orderId: ordersMap[table.id]?.id,
          currentOrder: ordersMap[table.id]
        })))
        
        console.log(`POS: Loaded ${pendingOrders.length} active orders for session ${sessionId}`)
      } else {
        // Clear orders if none found
        setTableOrders({})
        setPendingOrders([])
        setTables(prevTables => prevTables.map(table => ({
          ...table,
          status: "available",
          orderId: undefined,
          currentOrder: undefined
        })))
        console.log('POS: No active orders found for session', sessionId)
      }
    } catch (error) {
      console.error("POS: Error loading table orders:", error)
    }
  }

  const loadTakeAwayOrders = async () => {
    if (!sessionId) return
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select('*, items:table_order_items(*)')
        .eq('session_id', sessionId)
        .eq('order_type', 'takeaway')
        .in('status', ['pending', 'preparing', 'ready', 'completed'])
      
      if (error) throw new Error(error.message)
      setTakeAwayOrders(data || [])
    } catch (error) {
      console.error('Error loading take away orders:', error)
    }
  }

  // Auto-refresh takeaway orders when modal is open
  useEffect(() => {
    if (!showTakeAwayDialog) return;
    loadTakeAwayOrders();
    const interval = setInterval(() => {
      loadTakeAwayOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [showTakeAwayDialog, sessionId]);

  const handleNewTakeAwayOrder = () => {
    setSelectedTable({ id: 0, number: 'Take Away', status: 'available', pax: 0 })
    clearCart()
    setEditingOrderId(null)
    setExistingOrderItems([])
    setShowTakeAwayDialog(false)
    toast({
      title: "New Take Away Order",
      description: "Ready to take a new take away order.",
    })
    loadTakeAwayOrders();
  }

  const handleAddMoreToTakeAway = (order: any) => {
    setSelectedTable({ id: 0, number: 'Take Away', status: 'occupied', pax: 0, orderId: order.id, currentOrder: order })
    setEditingOrderId(order.id)
    const cartItems: CartItem[] = order.items.map((item: any) => ({
      id: item.menu_item_id,
      name: item.menu_item_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      portionSize: item.portion_size,
      customization: item.customization_notes,
      type: "recipe" as const,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
      unit: "portion",
      available_quantity: 999,
      description: "",
      category: "",
      inventory_deduction: undefined,
      menu_item_id: item.menu_item_id,
      total_price: item.total_price,
      total_nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
    }))
    setExistingOrderItems(cartItems)
    setShowTakeAwayDialog(false)
    toast({
      title: "Loaded Take Away Order",
      description: `Loaded order #${order.id.slice(-6)} to add more items.`,
    })
    loadTakeAwayOrders();
  }

  const handleTakeAwayPayment = (order: any) => {
    setShowPayment({ table: { id: 0, number: 'Take Away', status: 'occupied', pax: 0, orderId: order.id, currentOrder: order }, orderId: order.id })
    setShowTakeAwayDialog(false)
    loadTakeAwayOrders();
  }

  const loadOrderHistory = async () => {
    try {
      // Load paid and refunded orders for history
      const { data: completedOrders } = await supabase
        .from('table_orders')
        .select(`
          *,
          items:table_order_items(*)
        `)
        .in('status', ['paid', 'refunded', 'partially_refunded'])
        .order('created_at', { ascending: false })
        .limit(50) // Limit to last 50 orders for performance
      
      if (completedOrders) {
        setOrderHistory(completedOrders)
      }
    } catch (error) {
      console.error("Error loading order history:", error)
    }
  }

  const recipesAsMenuItems: ExtendedMenuItem[] = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    price: recipe.price || 0,
    category: recipe.category || "Uncategorized",
    available_quantity: recipe.available ? 999 : 0,
    description: recipe.description || "",
    image: recipe.image_url || undefined,
    type: "recipe" as const,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
    unit: "portion",
    inventory_deduction: undefined,
    restaurant: recipe.restaurant,
  }))

  const filteredRecipes = recipesAsMenuItems.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory
    const matchesRestaurant = selectedRestaurant === "all" || recipe.restaurant === selectedRestaurant
    
    return matchesSearch && matchesCategory && matchesRestaurant
  })

  const groupedRecipes = filteredRecipes.reduce((acc, recipe) => {
    const category = recipe.category || "Uncategorized"
    if (!acc[category]) acc[category] = []
    acc[category].push(recipe)
    return acc
  }, {} as Record<string, ExtendedMenuItem[]>)

  const handleOpenCustomization = (menuItem: ExtendedMenuItem, portionSize?: string) => {
    setCustomizingItem({ menuItem, portionSize })
    setIsCustomizing(true)
  }

  const handleConfirmAddToCart = () => {
    if (!customizingItem) return

    const { menuItem, portionSize } = customizingItem
    let displayText = menuItem.name
    if (portionSize) displayText = `${portionSize} ${menuItem.name}`

    // Only declare cartItemId once
    const cartItemId = `${menuItem.id}${portionSize ? `-${portionSize}` : ""}${customizationNotes ? `-${customizationNotes}` : ""}`

    addToCart(menuItem, 1, {
      id: cartItemId,
      portionSize,
      customization: customizationNotes
    })

    toast({
      title: "Added to Order",
      description: displayText + (customizationNotes ? ` (${customizationNotes})` : ""),
      duration: 500,
    })

    setIsCustomizing(false)
    setCustomizingItem(null)
    setCustomizationNotes("")
  }

  const handlePlaceOrder = async () => {
    if (!sessionId) {
      setShowSessionDialog(true)
      toast({ 
        title: 'No Open Session', 
        description: 'Please open the day before placing orders.', 
        variant: 'destructive' 
      })
      return
    }

    if (!selectedTable || cart.length === 0) {
      toast({
        title: "Error",
        description: "Please select a table and add items to cart",
        variant: "destructive",
      })
      return
    }
    
    setPlacingOrder(true)
    
    try {
      // Validate session is still active before placing order
      const { data: sessionCheck, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .is('closed_at', null)
        .single()
      
      if (sessionError || !sessionCheck) {
        throw new Error('Session is no longer active. Please refresh and try again.')
      }
      
      const cartItems = cart.map(item => {
        // Find the recipe to get KRA codes
        const recipe = recipes.find(r => r.id === item.menu_item_id || r.id === item.id)
        return {
          menu_item_id: item.menu_item_id || (typeof item.id === 'string' ? item.id.split('-')[0] : item.id),
          menu_item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          portion_size: item.portionSize,
          customization_notes: item.customization,
          item_cd: (recipe as any)?.itemCd || 'KE2NTU0000001', // Default KRA item code
          item_cls_cd: (recipe as any)?.itemClsCd || '5059690800', // Default classification
          tax_ty_cd: (recipe as any)?.taxTyCd || 'B' // Default tax type
        }
      })
      
      const subtotal = calcCartTotal()
      const taxRate = 0 // Tax is included in price
      const taxAmount = 0 // No extra tax
      const totalAmount = subtotal // No extra tax added

      // Apply discount if present
      const finalTotalAmount = appliedDiscount ? getFinalTotal() : totalAmount
      const discountAmount = appliedDiscount ? getDiscountAmount() : 0

      const isTakeAway = selectedTable.id === 0
    if (editingOrderId) {
        // Adding items to existing order
        const { data, error } = await tableOrdersService.addItemsToOrder(editingOrderId, cartItems)
        if (error) {
          throw new Error(error)
        }
        
        console.log('POS: Added items to existing order:', editingOrderId)
        toast({
          title: "Order Updated",
          description: `Added items to ${selectedTable.number}`,
          duration: 2000,
        })
        if (isTakeAway) await loadTakeAwayOrders();
    } else {
        // Creating new order
        const { data, error } = await tableOrdersService.createOrderWithItems({
          table_number: selectedTable.number,
          table_id: selectedTable.id,
          customer_name: selectedCustomer?.name || "",
          customer_tin: selectedCustomer?.kra_pin || null,
          order_type: isTakeAway ? "takeaway" : "dine-in",
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: finalTotalAmount,
          discount_amount: Number(discountAmount.toFixed(2)),
          discount_type: appliedDiscount?.type || null,
          // discount_reason: appliedDiscount?.reason || null,
          items: cartItems,
          session_id: sessionId
        } as any)
        
        if (error) {
          throw new Error(error)
        }
        
        if (data) {
          if (isTakeAway) {
            await loadTakeAwayOrders()
          } else {
            setTables(prevTables => prevTables.map(table =>
              table.id === selectedTable.id
                ? { ...table, status: "occupied", orderId: data.id, currentOrder: data }
                : table
            ))
          }
          setEditingOrderId(data.id)
          
          console.log('POS: Created new order:', data.id, 'for session:', sessionId)
          toast({
            title: "Order Placed",
            description: `Order placed for ${selectedTable.number}`,
            duration: 2000,
          })
    } else {
          throw new Error('Order created but no data returned')
        }
      }
      
      // Reload table orders to ensure consistency
      await loadTableOrders()
      
      // Clear cart and reset state
      clearCart()
      setExistingOrderItems([])
      setSelectedTable(null)
      setEditingOrderId(null)
      
    } catch (error: any) {
      console.error("POS: Error placing order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setPlacingOrder(false)
    }
  }

  // Comprehensive session validation function
  const validateSession = async (): Promise<{ valid: boolean; error?: string }> => {
    if (!sessionId) {
      return { valid: false, error: 'No active session' }
    }
    
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, opened_at, closed_at')
        .eq('id', sessionId)
        .single()
      
      if (error || !session) {
        return { valid: false, error: 'Session not found' }
      }
      
      if (session.closed_at) {
        return { valid: false, error: 'Session is closed' }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Failed to validate session' }
    }
  }

  // Enhanced table selection with session validation
  const handleTableSelect = async (table: TableState) => {
    // Validate session first
    const sessionValidation = await validateSession()
    if (!sessionValidation.valid) {
      toast({
        title: 'Session Error',
        description: sessionValidation.error || 'Invalid session',
        variant: 'destructive',
      })
      setShowSessionDialog(true)
      return
    }
    
    if (table.status === "occupied") {
      // Show table options for occupied tables
      setShowTableOptions(table)
      return
    }
    
      setSelectedTable(table)
    clearCart()
    setEditingOrderId(null)
    setExistingOrderItems([])

    // If table has an active order in current session, load it
    if (table.currentOrder && table.currentOrder.session_id === sessionId) {
      setEditingOrderId(table.currentOrder.id)
      
      // Convert order items to cart items
      const cartItems: CartItem[] = table.currentOrder.items.map((item: any) => ({
        id: item.menu_item_id,
        name: item.menu_item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        portionSize: item.portion_size,
        customization: item.customization_notes,
        type: "recipe" as const,
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
        unit: "portion",
        available_quantity: 999,
        description: "",
        category: "",
        inventory_deduction: undefined,
        menu_item_id: item.menu_item_id,
        total_price: item.total_price,
        total_nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
      }))
      
      setExistingOrderItems(cartItems)
      
      toast({
        title: "Table Selected",
        description: `Loaded existing order for ${table.number}`,
        duration: 2000,
      })
    } else {
      toast({
        title: "Table Selected",
        description: `Ready to take orders for ${table.number}`,
        duration: 2000,
      })
    }
  }

  const handleAddMoreOrders = async () => {
    if (!showTableOptions) return
    
    // Validate session first
    const sessionValidation = await validateSession()
    if (!sessionValidation.valid) {
      toast({
        title: 'Session Error',
        description: sessionValidation.error || 'Invalid session',
        variant: 'destructive',
      })
      setShowSessionDialog(true)
      return
    }
    
      const table = showTableOptions
    const currentOrder = tableOrders[table.id] || table.currentOrder
    
    // Ensure the order belongs to current session
    if (currentOrder && currentOrder.session_id !== sessionId) {
      toast({
        title: "Session Mismatch",
        description: "This order belongs to a different session",
        variant: "destructive",
      })
      return
    }
    
    if (!currentOrder) {
      toast({
        title: "No Order Found",
        description: "No active order found for this table",
        variant: "destructive",
      })
      return
    }
    
    // Set the selected table
      setSelectedTable(table)
    
    // Load existing order items into cart
    const cartItems: CartItem[] = currentOrder.items.map((item: any) => ({
      id: item.menu_item_id,
      name: item.menu_item_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      portionSize: item.portion_size,
      customization: item.customization_notes,
      type: "recipe" as const,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
      unit: "portion",
      available_quantity: 999,
      description: "",
      category: "",
      inventory_deduction: undefined,
      menu_item_id: item.menu_item_id,
      total_price: item.total_price,
      total_nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
    }))
    
    setExistingOrderItems(cartItems)
    setEditingOrderId(currentOrder.id)
    
    // Close the table options dialog
      setShowTableOptions(null)
    
    toast({
      title: "Order Loaded",
      description: `Loaded existing order for ${table.number}`,
      duration: 2000,
    })
  }

  const handleProceedToPayment = async (table: TableState) => {
    if (!table) return

    // Validate session first
    const sessionValidation = await validateSession()
    if (!sessionValidation.valid) {
      toast({
        title: 'Session Error',
        description: sessionValidation.error || 'Invalid session',
        variant: 'destructive',
      })
      setShowSessionDialog(true)
      return
    }
    
    const currentOrder = tableOrders[table.id] || table.currentOrder
    
    // Ensure the order belongs to current session
    if (currentOrder && currentOrder.session_id !== sessionId) {
      toast({
        title: "Session Mismatch",
        description: "This order belongs to a different session",
        variant: "destructive",
      })
      return
    }
    
    if (!currentOrder) {
      toast({
        title: "No Order Found",
        description: "No active order found for this table",
        variant: "destructive",
      })
      return
    }
    
    // Only allow payment for completed orders
    if (currentOrder.status !== 'completed') {
      toast({
        title: "Order Not Ready for Payment",
        description: `Order status is "${currentOrder.status}". Please complete the order first before proceeding to payment.`,
        variant: "destructive",
      })
      return
    }
    
    setShowPayment({ table, orderId: currentOrder.id })
  }

  const handleMarkAsPaid = async () => {
    if (!showPayment) return
    setShowPaymentMethodDialog(true)
  }

  const handleConfirmPaymentMethod = async () => {
    if (!showPayment) return
    const order = tableOrders[showPayment.table.id] || showPayment.table.currentOrder
    if (!order) return
    let paymentMethod = selectedPaymentMethod
    let paymentDetails: any = {}
    setSplitError(null)
    setPaymentLoading(true)
    
    // Validation
    if (!paymentMethod) {
      setSplitError('Please select a payment method.')
      setPaymentLoading(false)
      return
    }
    
    // Handle M-Pesa payment differently
    if (paymentMethod === 'mpesa') {
      if (!mpesaPhoneNumber || !validateMpesaPhoneNumber(mpesaPhoneNumber)) {
        setSplitError('Please enter a valid M-Pesa phone number in format 7xxxxxxxx.')
        setPaymentLoading(false)
        return
      }
      
      // Initiate M-Pesa STK push
      const success = await initiateMpesaPayment(order)
      if (success) {
        // Keep the payment dialog open and show processing state
        setPaymentLoading(false)
        return
      } else {
        setPaymentLoading(false)
        return
      }
    }
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < order.total_amount) {
        setSplitError('Amount received must be at least the total amount.')
        setPaymentLoading(false)
        return
      }
      paymentDetails = { received, change: received - order.total_amount }
    }
    
    if (paymentMethod === 'split') {
      const cash = parseFloat(splitAmounts.cash) || 0
      const mpesa = parseFloat(splitAmounts.mpesa) || 0
      const card = parseFloat(splitAmounts.card) || 0
      const total = cash + mpesa + card
      if (total !== order.total_amount) {
        setSplitError('Split amounts must add up to the total.')
        setPaymentLoading(false)
        return
      }
      let splitDetail: any = { cash, mpesa, card }
      if (cash > 0) {
        const received = parseFloat(cashReceived)
        if (isNaN(received) || received < cash) {
          setSplitError('Cash received must be at least the cash split amount.')
          setPaymentLoading(false)
          return
        }
        splitDetail.cashReceived = received
        splitDetail.cashChange = received - cash
      }
      if (mpesa > 0) {
        if (!mpesaNumber || mpesaNumber.length < 8) {
          setSplitError('Please enter a valid mobile number for Mpesa.')
          setPaymentLoading(false)
          return
        }
        splitDetail.mpesaNumber = mpesaNumber
      }
      paymentDetails = splitDetail
    }
    
    try {
      // 1. Mark order as paid in your DB
      const paymentMethodString = paymentMethod === 'cash' || paymentMethod === 'split' 
        ? JSON.stringify(paymentDetails) 
        : paymentMethod
      
      const { data, error } = await tableOrdersService.markOrderAsPaid(
        showPayment.orderId,
        paymentMethodString
      )
      if (error) {
        throw new Error(error)
      }
      setTables(prevTables => prevTables.map(table =>
        table.id === showPayment.table.id
          ? { ...table, status: "available", orderId: undefined, currentOrder: undefined }
          : table
      ))
      setTableOrders(prev => {
        const updated = { ...prev }
        delete updated[showPayment.table.id]
        return updated
      })
      if (selectedTable?.id === showPayment.table.id) {
        setSelectedTable(null)
        setEditingOrderId(null)
        setExistingOrderItems([])
        clearCart()
      }
      await Promise.all([
        loadTableOrders(),
        loadOrderHistory()
      ])
      
      // Submit to KRA after successful payment
      try {
        toast({
          title: "Submitting to KRA...",
          description: "Processing tax submission",
        })
        
        // Build orderData expected by the save-sale route
        const { data: orderForKRA } = await supabase
          .from('table_orders')
          .select('*, items:table_order_items(*)')
          .eq('id', showPayment.orderId)
          .single()

        if (!orderForKRA) {
          throw new Error('Failed to load order for KRA submission')
        }

        // Map table_order_items to KRA items shape the API expects
        const kraItems = (orderForKRA.items || []).map((it: any) => {
          const recipe = (recipes as any[]).find((r: any) => r.id === it.menu_item_id)
          return {
            itemCd: (recipe as any)?.itemCd || 'KE2NTU0000001',
            itemClsCd: (recipe as any)?.itemClsCd || '5059690800',
            taxTyCd: (recipe as any)?.taxTyCd || 'B',
            name: it.menu_item_name,
            unit_price: it.unit_price || 0,
            quantity: it.quantity || 1,
            total_price: it.total_price || 0,
            // help API infer payment method (map mpesa -> mobile for API)
            payment_method: selectedPaymentMethod === 'card' ? 'card' : (selectedPaymentMethod === 'mpesa' ? 'mobile' : 'cash'),
            customer_tin: orderForKRA.customer_tin,
            customer_name: orderForKRA.customer_name,
          }
        })

        const orderData = {
          items: kraItems,
          totalAmount: orderForKRA.total_amount || (kraItems.reduce((s: number, i: any) => s + (i.total_price || 0), 0)),
          discount: orderForKRA.discount_amount ? { amount: orderForKRA.discount_amount } : 0,
        }

        const kraRes = await fetch('/api/kra/save-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderData }),
        })
        
        const kraData = await kraRes.json()
        
        if (kraRes.ok && kraData.success) {
          toast({
            title: "KRA Submission Successful",
            description: `Invoice #${kraData.invcNo} submitted to KRA`,
            duration: 3000,
          })
          const { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime } = kraData.kraData.data
          // Store the sale invoice in the database
          const { error: insertError } = await supabase
            .from('sales_invoices')
            .insert({
              trdInvcNo: kraData.saleId,
              orgInvcNo: curRcptNo,
              order_id: showPayment.orderId,
              payment_method: selectedPaymentMethod,
              total_items: orderForKRA.items.length,
              gross_amount: orderForKRA.total_amount,
              net_amount: orderForKRA.total_amount - orderForKRA.tax_amount,
              tax_amount: orderForKRA.tax_amount,
              kra_curRcptNo: kraData.kraData.data?.curRcptNo,
              kra_totRcptNo: kraData.kraData.data?.totRcptNo,
              kra_intrlData: kraData.kraData.data?.intrlData,
              kra_rcptSign: kraData.kraData.data?.rcptSign,
              kra_sdcDateTime: kraData.kraData.data?.sdcDateTime,
              kra_status: "success",
              kra_response: kraData.kraData,
              kra_error: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),

            })
          if (insertError) {
            console.error('Error storing sale invoice:', insertError)
          }
          // After KRA sale approval, send stock-out for direct inventory sales
          try {
            const orderItems = orderForKRA.items || []
            // Build candidate ingredient IDs and names
            const candidateIds = Array.from(new Set(orderItems
              .map((it: any) => String(it.menu_item_id || '').trim())
              .filter((id: string) => id.length > 0)))
            const candidateNames = Array.from(new Set(orderItems
              .map((it: any) => String(it.menu_item_name || '').trim())
              .filter((nm: string) => nm.length > 0)))

            const ingredientsById: Record<string, any> = {}
            const ingredientsByName: Record<string, any> = {}

            if (candidateIds.length > 0) {
              const { data: byId } = await supabase
                .from('ingredients')
                .select('id, name, item_cd, item_cls_cd, tax_ty_cd, unit')
                .in('id', candidateIds as any)
              if (byId) {
                for (const ing of byId) ingredientsById[ing.id] = ing
              }
            }
            if (candidateNames.length > 0) {
              const { data: byName } = await supabase
                .from('ingredients')
                .select('id, name, item_cd, item_cls_cd, tax_ty_cd, unit')
                .in('name', candidateNames as any)
              if (byName) {
                for (const ing of byName) ingredientsByName[String(ing.name).trim()] = ing
              }
            }

            // Keep only items that matched an ingredient by id or name
            const directInventoryItems = orderItems.filter((it: any) => {
              const idKey = String(it.menu_item_id || '').trim()
              const nameKey = String(it.menu_item_name || '').trim()
              return !!ingredientsById[idKey] || !!ingredientsByName[nameKey]
            })

            if (directInventoryItems.length === 0) {
              console.log('Stock-out: No direct inventory items found; skipping')
            } else {
              const stockOutItemList = directInventoryItems.map((it: any, idx: number) => {
                const idKey = String(it.menu_item_id || '').trim()
                const nameKey = String(it.menu_item_name || '').trim()
                const ing = ingredientsById[idKey] || ingredientsByName[nameKey]
                const itemCd = ing?.item_cd
                const itemClsCd = ing?.item_cls_cd
                const taxTyCd = ing?.tax_ty_cd
                const qtyUnitCd = ing?.unit || 'U'
                const itemNm = ing?.name || nameKey
                const qty = it.quantity || 1
                const prc = it.unit_price || 0
                const splyAmt = prc * qty
                const taxType = taxTyCd || 'B'
                let taxAmt = 0
                switch (taxType) {
                  case 'B':
                    taxAmt = splyAmt * 0.16
                    break
                  case 'E':
                    taxAmt = splyAmt * 0.08
                    break
                  case 'A':
                  case 'C':
                  case 'D':
                  default:
                    taxAmt = 0
                }
                const taxblAmt = splyAmt
                const totAmt = splyAmt
                return {
                  itemSeq: idx + 1,
                  itemCd,
                  itemClsCd,
                  itemNm,
                  bcd: null,
                  pkgUnitCd: 'NT',
                  pkg: 1,
                  qtyUnitCd,
                  qty,
                  itemExprDt: null,
                  prc,
                  splyAmt,
                  totDcAmt: 0,
                  taxblAmt,
                  taxTyCd,
                  taxAmt: Number(taxAmt.toFixed(2)),
                  totAmt: totAmt
                }
              })

              const ocrnDt = new Date().toISOString().slice(0,10).replace(/-/g, '')
              const stockOutPayload = {
                sarNo: kraData.saleId,
                orgSarNo: kraData.saleId,
                regTyCd: 'A',
                regrId: 'Inventory Manager',
                regrNm: 'Inventory Manager',
                modrNm: 'Inventory Manager',
                modrId: 'Inventory Manager',
                totItemCnt: stockOutItemList.length,
                ocrnDt,
                itemList: stockOutItemList,
                sarTyCd: '11',
                stockChange: -1,
                context: 'sale'
              }
              console.log('Stock-out: prepared payload', stockOutPayload)
              const stockOutRes = await fetch('/api/kra/stock-in-enhanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockOutPayload)
              })
              const stockOutJson = await stockOutRes.json()
              if (!stockOutRes.ok) {
                console.warn('Stock-out submission failed:', stockOutJson)
              } else {
                console.log('Stock-out submission successful:', stockOutJson)
              }
            }
          } catch (stockOutErr) {
            console.warn('Error during stock-out submission:', stockOutErr)
          }
          try {
            const receiptItems = orderData.items.map((item: any) => {
              // Determine tax type based on item category or default to 16% VAT
              let taxType = item.taxTyCd || 'B' // Default to 16% VAT
              
              // You can customize this logic based on your item categories
              // if (item.category?.toLowerCase().includes('exempt') || item.category?.toLowerCase().includes('basic')) {
              //   taxType = 'A' // Exempt
              // } else if (item.category?.toLowerCase().includes('zero') || item.category?.toLowerCase().includes('export')) {
              //   taxType = 'C' // Zero rated
              // } else if (item.category?.toLowerCase().includes('non-vat') || item.category?.toLowerCase().includes('service')) {
              //   taxType = 'D' // Non-VAT
              // } else if (item.category?.toLowerCase().includes('8%')) {
              //   taxType = 'E' // 8% VAT
              // }
              
              const itemTotal = item.unit_price * item.quantity
              const taxAmount = taxType === 'B' ? itemTotal * 0.16 : 
                               taxType === 'E' ? itemTotal * 0.08 : 0
              
              return {
                name: item.name,
                unit_price: item.unit_price,
                quantity: item.quantity,
                total: itemTotal,
                tax_rate: taxType === 'B' ? 16 : taxType === 'E' ? 8 : 0,
                tax_amount: taxAmount,
                tax_type: taxType
              }
            })
  
            const receiptData: ReceiptRequest = {
              kraData: {
                curRcptNo,
                totRcptNo,
                intrlData,
                rcptSign,
                sdcDateTime,
                invcNo: kraData.invcNo,
                trdInvcNo: order.id
              },
              items: receiptItems,
              customer: {
                name: selectedCustomer?.name || null,
                pin: selectedCustomer?.kra_pin || null
              },
              payment_method: paymentMethod,
              total_amount: orderForKRA.total_amount,
              tax_amount: orderForKRA.tax_amount,
              net_amount: orderForKRA.total_amount - orderForKRA.tax_amount,
              order_id: order.id,
              // Add discount information if applicable
              discount_amount: 0, // You can calculate this based on your discount logic
              discount_percentage: 0,
              discount_narration: ''
            }
  
            // Generate and download KRA receipt as PDF
            await generateAndDownloadReceipt(receiptData)
            
            toast({ 
              title: 'KRA Receipt Generated', 
              description: 'KRA receipt has been generated and downloaded as PDF successfully.',
              variant: 'default'
            })
          } catch (pdfErr) {
            console.error('Error generating/downloading PDF receipt:', pdfErr)
          }

          // Print receipt after successful KRA submission
          try {
            await handlePrintReceipt(orderForKRA, kraData)
          } catch (printErr) {
            console.error('Error printing receipt:', printErr)
          }
        } else {
          console.log('KRA submission failed--->:', kraData)
          toast({
            title: "KRA Submission Failed",
            description: kraData.error || "Failed to submit to KRA",
            variant: "destructive",
          })
          // Store the sale invoice in the database
          const { error: insertError } = await supabase
            .from('sales_invoices')
            .insert({
              trdInvcNo: kraData.invcNo,
              orgInvcNo: kraData.invcNo,
              payment_method: selectedPaymentMethod,
              order_id: showPayment.orderId,
              total_items: orderForKRA.items.length,
              gross_amount: orderForKRA.total_amount,
              net_amount: orderForKRA.total_amount - orderForKRA.tax_amount,
              tax_amount: orderForKRA.tax_amount,
              kra_status: 'error',
              kra_error: kraData.error,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),

            })
          if (insertError) {
            console.error('Error storing sale invoice:', insertError)
          }
        }
      } catch (kraError: any) {
        console.log('KRA submission error:', kraError)
        toast({
          title: "KRA Submission Error",
          description: kraError.message || "Failed to submit to KRA",
          variant: "destructive",
        })
      }
      
      // Fetch the latest order data for the receipt
      const { data: latestOrder } = await supabase
        .from('table_orders')
        .select('*, items:table_order_items(*)')
        .eq('id', showPayment.orderId)
        .single()
      if (latestOrder) {
        handlePrintReceipt(latestOrder)
      } else {
        handlePrintReceipt(order)
      }
      toast({
        title: "Payment Complete",
        description: `Table ${showPayment.table.number} has been cleared`,
        duration: 2000,
      })
      setShowPayment(null)
      setShowPaymentMethodDialog(false)
      setSelectedPaymentMethod(null)
      setSplitAmounts({ cash: '', mpesa: '', card: '' })
      setSplitError(null)
      setCashReceived('')
      setMpesaNumber('')
    } catch (error: any) {
      console.error("Error marking order as paid:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCloseOrderModal = () => {
    clearCart()
    setSelectedTable(null)
    setEditingOrderId(null)
    setExistingOrderItems([])
  }

  const handleClosePaymentDialog = () => {
    setShowPaymentMethodDialog(false)
    setSelectedPaymentMethod(null)
    setSplitAmounts({ cash: '', mpesa: '', card: '' })
    setSplitError(null)
    setCashReceived('')
    setMpesaNumber('')
    setMpesaPhoneNumber('')
    setMpesaStatus('idle')
    setMpesaProcessing(false)
    setCheckoutRequestId('')
    setTransactionId('')
  }

  // Print receipt
  const handlePrintReceipt = async (order: any, kraData?: any) => {
    try {
      const res = await fetch('/api/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          items: order.items,
          totals: {
            subtotal: calcOrderSubtotal(order.items),
            tax: calcOrderTax(order.items),
            total: calcOrderTotal(order.items),
          },
          restaurant: 'RESTAURANT NAME',
          table: order.table_number,
          date: new Date(order.created_at).toLocaleDateString(),
          time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          receiptId: order.id,
          kraData: kraData, // Pass KRA data for receipt formatting
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Printed to Thermal Printer', description: 'Receipt sent to printer.' });
      } else {
        toast({ title: 'Print Error', description: result.error || 'Failed to print receipt', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Print Error', description: err.message || 'Failed to print receipt', variant: 'destructive' });
    }
  };

  // Helper to format payment method for order history
  function formatPaymentMethod(payment_method: any): string {
    if (!payment_method) return '';
    if (typeof payment_method === 'string') {
      return `Paid via ${capitalize(payment_method)}`;
    }
    if (typeof payment_method === 'object') {
      // Cash only
      if ('received' in payment_method) {
        return `Paid via Cash (received: ${payment_method.received}, change: ${payment_method.change})`;
      }
      // Mpesa only
      if ('mpesaNumber' in payment_method && Object.keys(payment_method).length === 1) {
        return `Paid via Mpesa, Number: ${payment_method.mpesaNumber}`;
      }
      // Split
      const parts = [];
      if (payment_method.cash > 0) {
        if ('cashReceived' in payment_method) {
          parts.push(`Cash (received: ${payment_method.cashReceived}, change: ${payment_method.cashChange})`);
        } else {
          parts.push(`Cash (${payment_method.cash})`);
        }
      }
      if (payment_method.mpesa > 0) {
        if ('mpesaNumber' in payment_method) {
          parts.push(`Mpesa (Number: ${payment_method.mpesaNumber}, amount: ${payment_method.mpesa})`);
        } else {
          parts.push(`Mpesa (${payment_method.mpesa})`);
        }
      }
      if (payment_method.card > 0) {
        parts.push(`Card (${payment_method.card})`);
      }
      return `Paid via Split: ${parts.join(', ')}`;
    }
    return '';
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // M-Pesa Utility Functions
  const validateMpesaPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return /^[17]\d{8}$/.test(cleanPhone)
  }

  const formatMpesaPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length <= 9) {
      return cleanPhone
    }
    return cleanPhone.substring(0, 9)
  }

  const initiateMpesaPayment = async (order: any) => {
    if (!validateMpesaPhoneNumber(mpesaPhoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid M-Pesa phone number in format 7xxxxxxxx",
        variant: "destructive",
      })
      return false
    }

    setMpesaProcessing(true)
    setMpesaStatus("processing")

    try {
      const response = await fetch('/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mpesaPhoneNumber,
          amount: Math.round(order.total_amount)
        })
      })

      const data = await response.json()

      if (data.success) {
        setCheckoutRequestId(data.checkoutRequestId)
        toast({
          title: "M-Pesa Payment Initiated",
          description: "Please check your phone and enter your M-Pesa PIN to complete the payment",
        })
        return true
      } else {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment')
      }
    } catch (error: any) {
      console.error('M-Pesa payment error:', error)
      setMpesaStatus("failed")
      setMpesaProcessing(false)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate M-Pesa payment",
        variant: "destructive",
      })
      return false
    }
  }

  const processMpesaPayment = async (transId: string, order: any) => {
    try {
      // Mark order as paid in the database
      const { data, error } = await tableOrdersService.markOrderAsPaid(
        order.id,
        'mpesa'
      )
      
      if (error) {
        throw new Error(error)
      }

      // Update table status
      setTables(prevTables => prevTables.map(table =>
        table.id === order.table_id
          ? { ...table, status: "available", orderId: undefined, currentOrder: undefined }
          : table
      ))
      
      setTableOrders(prev => {
        const updated = { ...prev }
        delete updated[order.table_id]
        return updated
      })
      
      if (selectedTable?.id === order.table_id) {
        setSelectedTable(null)
        setEditingOrderId(null)
        setExistingOrderItems([])
        clearCart()
      }
      
      await Promise.all([
        loadTableOrders(),
        loadOrderHistory()
      ])
      
      // Print receipt
      const { data: latestOrder } = await supabase
        .from('table_orders')
        .select('*, items:table_order_items(*)')
        .eq('id', order.id)
        .single()
      
      if (latestOrder) {
        handlePrintReceipt(latestOrder)
      } else {
        handlePrintReceipt(order)
      }
      
      toast({
        title: "M-Pesa Payment Successful!",
        description: `Payment completed successfully. Transaction ID: ${transId}`,
        duration: 3000,
      })
      
      // Reset M-Pesa state
      setMpesaStatus("success")
      setMpesaProcessing(false)
      setCheckoutRequestId("")
      setTransactionId("")
      setMpesaPhoneNumber("")
      
      // Close payment dialogs
      setShowPayment(null)
      setShowPaymentMethodDialog(false)
      setSelectedPaymentMethod(null)
      
      return true
    } catch (error: any) {
      console.error("Error processing M-Pesa payment:", error)
      setMpesaStatus("failed")
      setMpesaProcessing(false)
      toast({
        title: "Payment Processing Error",
        description: error.message || "Failed to process M-Pesa payment",
        variant: "destructive",
      })
      return false
    }
  }

  const cancelMpesaPayment = () => {
    setMpesaStatus("idle")
    setMpesaProcessing(false)
    setCheckoutRequestId("")
    setMpesaPhoneNumber("")
    toast({
      title: "Payment Cancelled",
      description: "M-Pesa payment has been cancelled",
    })
  }

  // Cancel order logic
  const handleCancelOrder = async () => {
    if (!showTableOptions) return
    const table = showTableOptions
    const currentOrder = tableOrders[table.id] || table.currentOrder
    if (!currentOrder) return
    if (!window.confirm(`Are you sure you want to cancel the order for ${table.number}?`)) return
    setCancellingOrder(true)
    try {
      const { error } = await tableOrdersService.updateOrderStatus(currentOrder.id, 'cancelled')
      if (error) throw new Error(error)
      setTables(prevTables => prevTables.map(t => t.id === table.id ? { ...t, status: 'available', orderId: undefined, currentOrder: undefined } : t))
      setTableOrders(prev => { const updated = { ...prev }; delete updated[table.id]; return updated })
      if (selectedTable?.id === table.id) {
        setSelectedTable(null)
        setEditingOrderId(null)
        setExistingOrderItems([])
        clearCart()
      }
      await Promise.all([loadTableOrders(), loadOrderHistory()])
      toast({ title: 'Order Cancelled', description: `Order for ${table.number} has been cancelled.`, duration: 2000 })
      setShowTableOptions(null)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel order', variant: 'destructive' })
    } finally {
      setCancellingOrder(false)
    }
  }

  // Transfer order logic
  const handleTransferOrder = async () => {
    if (!showTransferDialog || !transferTargetTable) return
    setTransferringOrder(true)
    try {
      const { orderId, fromTable } = showTransferDialog
      // Update order in DB (table_id and table_number)
      const { data, error } = await supabase
        .from('table_orders')
        .update({ table_id: transferTargetTable.id, table_number: transferTargetTable.number })
        .eq('id', orderId)
        .select()
        .single()
      if (error) throw new Error(error.message || String(error))
      // Update tables state
      setTables(prevTables => prevTables.map(t => {
        if (t.id === fromTable.id) return { ...t, status: 'available', orderId: undefined, currentOrder: undefined }
        if (t.id === transferTargetTable.id) return { ...t, status: 'occupied', orderId, currentOrder: tableOrders[fromTable.id] }
        return t
      }))
      setTableOrders(prev => {
        const updated = { ...prev }
        updated[transferTargetTable.id] = updated[fromTable.id]
        delete updated[fromTable.id]
        return updated
      })
      if (selectedTable?.id === fromTable.id) {
        setSelectedTable(null)
        setEditingOrderId(null)
        setExistingOrderItems([])
        clearCart()
      }
      await Promise.all([loadTableOrders(), loadOrderHistory()])
      toast({ title: 'Order Transferred', description: `Order moved to ${transferTargetTable.number}.`, duration: 2000 })
      setShowTransferDialog(null)
      setTransferTargetTable(null)
      setShowTableOptions(null)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to transfer order', variant: 'destructive' })
    } finally {
      setTransferringOrder(false)
    }
  }

  // On mount, check for open session with enhanced synchronization
  useEffect(() => {
    const checkSession = async () => {
      setSessionLoading(true)
      setSessionError(null)
      
      try {
        // Use single session enforcement
        const singleSessionCheck = await ensureSingleSession()
        if (!singleSessionCheck.success) {
          throw new Error(singleSessionCheck.error || 'Failed to check sessions')
        }
        
        if (singleSessionCheck.sessionId) {
          setSessionId(singleSessionCheck.sessionId)
          localStorage.setItem('current_session_id', singleSessionCheck.sessionId)
          console.log('POS: Session loaded from DB:', singleSessionCheck.sessionId)
        } else {
          // No open session in DB, check localStorage for consistency
          const localSessionId = localStorage.getItem('current_session_id')
          if (localSessionId) {
            // Clear stale localStorage
            localStorage.removeItem('current_session_id')
            console.log('POS: Cleared stale localStorage session')
          }
          setSessionId(null)
          setShowSessionDialog(true)
        }
      } catch (error) {
        console.error('POS: Error checking session:', error)
        setSessionError('Failed to check session status')
        setSessionId(null)
        localStorage.removeItem('current_session_id')
        setShowSessionDialog(true)
      } finally {
        setSessionLoading(false)
      }
    }
    
    checkSession()
    
    // Set up real-time session monitoring
    const sessionChannel = supabase.channel('session-monitor')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions',
        filter: 'closed_at=is.null'
      }, (payload) => {
        console.log('POS: Session change detected:', payload)
        if (payload.eventType === 'INSERT') {
          // New session opened
          const newSession = payload.new
          setSessionId(newSession.id)
          localStorage.setItem('current_session_id', newSession.id)
          setShowSessionDialog(false)
          console.log('POS: New session detected and loaded:', newSession.id)
        } else if (payload.eventType === 'UPDATE' && payload.new.closed_at) {
          // Session was closed
          setSessionId(null)
          localStorage.removeItem('current_session_id')
          setShowSessionDialog(true)
          console.log('POS: Session closed by another user')
        }
      })
      .subscribe()
    
    return () => {
      sessionChannel.unsubscribe()
    }
  }, [])

  // Reload table orders when session changes
  useEffect(() => {
    if (sessionId) {
      console.log('POS: Session changed, reloading table orders for session:', sessionId)
      loadTableOrders()
    } else {
      // Clear orders when no session
      setTableOrders({})
      setPendingOrders([])
      setTables(prevTables => prevTables.map(table => ({
        ...table,
        status: "available",
        orderId: undefined,
        currentOrder: undefined
      })))
    }
  }, [sessionId])

  // Real-time order monitoring for current session
  useEffect(() => {
    if (!sessionId) return
    
    console.log('POS: Setting up real-time order monitoring for session:', sessionId)
    
    const orderChannel = supabase.channel(`pos-orders-realtime-${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'table_orders', 
        filter: `session_id=eq.${sessionId}` 
      }, (payload) => {
        console.log('POS: Order change detected:', payload)
        // Debounce rapid updates
        setTimeout(() => {
          loadTableOrders()
        }, 100)
      })
      .subscribe((status) => {
        console.log('POS: Order realtime subscription status:', status)
      })
    
    return () => {
      console.log('POS: Cleaning up order real-time subscription for session:', sessionId)
      orderChannel.unsubscribe()
    }
  }, [sessionId])

  // M-Pesa WebSocket for payment verification
  useEffect(() => {
    if (checkoutRequestId && mpesaStatus === "processing") {
      const socket = io('https://webhook-alqurashi.onrender.com', {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to M-Pesa WebSocket server');
      });

      socket.on('paymentStatus', (data) => {
        console.log('Received payment status:', data);
        if (data && data.CheckoutRequestID === checkoutRequestId) {
          const { ResultCode, ResultDesc, TransID, FirstName, CallbackMetadata } = data;
          if (ResultCode === 0) {
            setMpesaStatus('success');
            console.log('Callback Metadata:', CallbackMetadata);
            console.log('Customer:', FirstName);
            setTransactionId(TransID);
            toast({
              title: "Payment Received",
              description: `Got the payment from ${FirstName}`,
            });
            setMpesaProcessing(false);
            
            // Process the payment
            const order = showPayment ? (tableOrders[showPayment.table.id] || showPayment.table.currentOrder) : null;
            if (order) {
              processMpesaPayment(TransID, order);
            }
          } else {
            setMpesaStatus('failed');
            setMpesaProcessing(false);
            toast({
              title: "Payment Failed",
              description: ResultDesc || 'M-Pesa payment failed',
              variant: "destructive",
            });
          }
        }
      });

      // Add timeout to handle cases where payment doesn't come through
      const timeout = setTimeout(() => {
        if (mpesaStatus === "processing") {
          setMpesaStatus("failed");
          setMpesaProcessing(false);
          toast({
            title: "Payment Timeout",
            description: "M-Pesa payment timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 300000); // 5 minutes timeout

      return () => {
        clearTimeout(timeout);
        socket.disconnect();
      };
    }
  }, [checkoutRequestId, mpesaStatus, showPayment, tableOrders]);

  // Function to ensure only one session is open at a time
  const ensureSingleSession = async (): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    try {
      // Check for any open sessions
      const { data: openSessions, error } = await supabase
        .from('sessions')
        .select('id, opened_at, opened_by')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to check sessions: ${error.message}`)
      }
      
      if (openSessions && openSessions.length > 0) {
        // Return the most recent open session
        return { success: true, sessionId: openSessions[0].id }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Enhanced session opening with single session enforcement
  const handleOpenSession = async () => {
    setSessionLoading(true)
    setSessionError(null)
    
    try {
      // First, ensure we have a single session
      const singleSessionCheck = await ensureSingleSession()
      if (!singleSessionCheck.success) {
        throw new Error(singleSessionCheck.error || 'Failed to check sessions')
      }
      
      // If there's already an open session, use it
      if (singleSessionCheck.sessionId) {
        setSessionId(singleSessionCheck.sessionId)
        localStorage.setItem('current_session_id', singleSessionCheck.sessionId)
        setShowSessionDialog(false)
        console.log('POS: Using existing session:', singleSessionCheck.sessionId)
        return
      }
      
      // No open session exists, create one
      const { error: sessionInsertError } = await supabase
        .from('sessions')
        .insert({ opened_by: 'POS' })
      
      if (sessionInsertError) {
        throw new Error(`Failed to create session: ${sessionInsertError.message}`)
      }
      
      // Fetch the newly created session
      const { data: newSession, error: fetchSessionError } = await supabase
        .from('sessions')
        .select('*')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single()
      
      if (newSession && !fetchSessionError) {
        setSessionId(newSession.id)
        localStorage.setItem('current_session_id', newSession.id)
        setShowSessionDialog(false)
        console.log('POS: New session created:', newSession.id)
      } else {
        throw new Error('Session created but could not fetch session ID')
      }
    } catch (error: any) {
      console.error('POS: Error opening session:', error)
      setSessionError(error.message || 'Failed to open session')
    } finally {
      setSessionLoading(false)
    }
  }

  // Enhanced session closing with comprehensive checks
  const handleCloseSession = async () => {
    if (!sessionId) return
    
    setSessionClosing(true)
    setSessionError(null)
    
    try {
      // Check for any unpaid orders in this session (excluding completed orders that are ready for payment)
      const { data: unpaidOrders, error: unpaidOrdersError } = await supabase
        .from('table_orders')
        .select('id, status, table_number')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'preparing', 'ready'])
      
      if (unpaidOrdersError) {
        throw new Error(`Failed to check unpaid orders: ${unpaidOrdersError.message}`)
      }
      
      if (unpaidOrders && unpaidOrders.length > 0) {
        const tableNumbers = unpaidOrders.map(o => o.table_number).join(', ')
        const errorMsg = `Cannot close day: There are still orders in progress on tables ${tableNumbers}. Please complete all orders before closing the day.`
        setSessionError(errorMsg)
        toast({
          title: 'Cannot Close Day',
          description: errorMsg,
          variant: 'destructive',
        })
        return
      }
      
      // Close the session
      const { error } = await supabase
        .from('sessions')
        .update({ 
          closed_at: new Date().toISOString(), 
          closed_by: 'POS' 
        })
        .eq('id', sessionId)
      
      if (error) {
        throw new Error(`Failed to close session: ${error.message}`)
      }
      
      setSessionId(null)
      localStorage.removeItem('current_session_id')
      setShowSessionDialog(true)
      console.log('POS: Session closed successfully')
      
      toast({
        title: 'Day Closed',
        description: 'The day has been closed successfully',
      })
    } catch (error: any) {
      console.error('POS: Error closing session:', error)
      setSessionError(error.message || 'Failed to close session')
      toast({
        title: 'Error',
        description: error.message || 'Failed to close session',
        variant: 'destructive',
      })
    } finally {
      setSessionClosing(false)
    }
  }

  // Generate QR codes for all tables
  const generateQRCodes = () => {
    if (!sessionId) {
      toast({
        title: "No Open Session",
        description: "Please open the day before generating QR codes",
        variant: "destructive",
      })
      return
    }

    const baseUrl = window.location.origin
    const qrCodesData: Record<number, string> = {}
    
    tables.forEach(table => {
      const qrUrl = `${baseUrl}/customer-portal?table=${table.id}&session=${sessionId}`
      qrCodesData[table.id] = qrUrl
    })
    
    setQrCodes(qrCodesData)
    setShowQRDialog(true)
  }

  // Handler to start editing an existing item
  const handleEditExistingItem = (item: CartItem, index: number) => {
    setEditingExistingItem({ item, index })
    setEditItemQuantity(item.quantity)
    setEditItemCustomization(item.customization || "")
    setEditItemPortionSize(item.portionSize)
  }

  // Handler to save the edited item
  const handleSaveEditExistingItem = async () => {
    if (!editingExistingItem || !editingOrderId) return
    const item = editingExistingItem.item
    // Update the item in the database
    try {
      // Find the order item in the DB
      const { data: orderItem } = await supabase
        .from('table_order_items')
        .select('*')
        .eq('order_id', editingOrderId)
        .eq('menu_item_id', item.id)
        .single()
      if (!orderItem) throw new Error('Order item not found')
      // Update the item
      const { error } = await supabase
        .from('table_order_items')
        .update({
          quantity: editItemQuantity,
          customization_notes: editItemCustomization,
          portion_size: editItemPortionSize,
          total_price: item.unit_price * editItemQuantity,
        })
        .eq('id', orderItem.id)
      if (error) throw new Error(error.message)
      toast({ title: 'Item Updated', description: `${item.name} updated in order.` })
      setEditingExistingItem(null)
      await loadTableOrders()
      setExistingOrderItems((prev) => prev.map((ci, idx) => idx === editingExistingItem.index ? {
        ...ci,
        quantity: editItemQuantity,
        customization: editItemCustomization,
        portionSize: editItemPortionSize,
        total_price: item.unit_price * editItemQuantity,
      } : ci))
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Handler to remove an item from the order
  const handleRemoveExistingItem = async (item: CartItem, index: number) => {
    if (!editingOrderId) return
    if (!window.confirm(`Remove ${item.name} from the order?`)) return
    try {
      // Find the order item in the DB
      const { data: orderItem } = await supabase
        .from('table_order_items')
        .select('*')
        .eq('order_id', editingOrderId)
        .eq('menu_item_id', item.id)
        .single()
      if (!orderItem) throw new Error('Order item not found')
      // Delete the item
      const { error } = await supabase
        .from('table_order_items')
        .delete()
        .eq('id', orderItem.id)
      if (error) throw new Error(error.message)
      toast({ title: 'Item Removed', description: `${item.name} removed from order.` })
      setExistingOrderItems((prev) => prev.filter((_, idx) => idx !== index))
      await loadTableOrders()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Handler to start replacing an existing item
  const handleReplaceExistingItem = (item: CartItem, index: number) => {
    setReplacingExistingItem({ item, index })
    setReplaceSelectedMenuItem(null)
  }

  // Handler to save the replaced item
  const handleSaveReplaceExistingItem = async () => {
    if (!replacingExistingItem || !editingOrderId || !replaceSelectedMenuItem) return
    const oldItem = replacingExistingItem.item
    try {
      // Use backend helper to replace and recalculate totals
      const { data, error } = await tableOrdersService.replaceOrderItem(
        editingOrderId,
        oldItem.id,
        {
          menu_item_id: replaceSelectedMenuItem.id,
          menu_item_name: replaceSelectedMenuItem.name,
          unit_price: replaceSelectedMenuItem.price,
          quantity: 1,
          total_price: replaceSelectedMenuItem.price,
          portion_size: undefined,
          customization_notes: '',
        }
      )
      if (error) throw new Error(error)
      toast({ title: 'Item Replaced', description: `${oldItem.name} replaced with ${replaceSelectedMenuItem.name}.` })
      setReplacingExistingItem(null)
      // Always reload table orders to get updated totals
      await loadTableOrders()
      // Optionally, update local existingOrderItems for immediate UI feedback
      setExistingOrderItems((prev) => prev.map((ci, idx) => idx === replacingExistingItem.index ? {
        ...ci,
        id: replaceSelectedMenuItem.id,
        name: replaceSelectedMenuItem.name,
        unit_price: replaceSelectedMenuItem.price,
        quantity: 1,
        total_price: replaceSelectedMenuItem.price,
        portionSize: undefined,
        customization: '',
      } : ci))
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPin, setNewCustomerPin] = useState("")
  const [customerLoading, setCustomerLoading] = useState(false)

  // Fetch customers for search
  const searchCustomers = async (query: string) => {
    setCustomerLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,kra_pin.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10)
    setCustomerResults(data || [])
    setCustomerLoading(false)
  }

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPin.trim()) {
      toast({ title: 'Missing Info', description: 'Name and PIN are required', variant: 'destructive' })
      return
    }
    setCustomerLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .insert({ name: newCustomerName.trim(), kra_pin: newCustomerPin.trim().toUpperCase() })
      .select()
      .single()
    setCustomerLoading(false)
    if (error) {
      console.log(error)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setSelectedCustomer(data)
    setShowCustomerDialog(false)
    setNewCustomerName("")
    setNewCustomerPin("")
    toast({ title: 'Customer Added', description: `Added ${data.name}` })
  }

  // Handler to cancel a take-away order
  const handleCancelTakeAwayOrder = async (order: any) => {
    if (!window.confirm(`Are you sure you want to cancel take-away order #${order.id.slice(-6)}?`)) return;
    try {
      const { error } = await tableOrdersService.updateOrderStatus(order.id, 'cancelled');
      if (error) throw new Error(error);
      await loadTakeAwayOrders();
      toast({ title: 'Order Cancelled', description: `Take-away order #${order.id.slice(-6)} has been cancelled.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel take-away order', variant: 'destructive' });
    }
  }

  // Discount Application Handlers
  const handleApplyDiscount = () => {
    // For BOGO, we don't need to validate discountValue
    if (discountType !== 'bogo' && (!discountValue || parseFloat(discountValue) <= 0)) {
      toast({
        title: "Invalid Discount",
        description: "Please enter a valid discount value",
        variant: "destructive"
      })
      return
    }

    const value = discountType === 'bogo' ? 0 : parseFloat(discountValue)
    const subtotal = calcCartTotal()

    // Validate discount value for non-BOGO types
    if (discountType === 'percentage' && (value <= 0 || value > 100)) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 0 and 100",
        variant: "destructive"
      })
      return
    }

    if (discountType === 'fixed' && value > subtotal) {
      toast({
        title: "Invalid Fixed Amount",
        description: "Fixed discount cannot exceed order total",
        variant: "destructive"
      })
      return
    }

    // Apply BOGO discount logic
    if (discountType === 'bogo') {
      applyBogoDiscount()
    }

    const discountAmount = calculateDiscountAmount(subtotal, discountType, value)
    
    setAppliedDiscount({
      type: discountType,
      value: value,
      reason: discountReason || `${discountType === 'percentage' ? value + '%' : discountType === 'bogo' ? 'BOGO' : 'Ksh ' + value} discount`,
      amount: discountAmount
    })

    setShowDiscountDialog(false)
    setDiscountValue('')
    setDiscountReason('')

    toast({
      title: "Discount Applied",
      description: `${discountType === 'percentage' ? value + '%' : discountType === 'bogo' ? 'BOGO' : 'Ksh ' + value} discount applied`,
    })
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setBogoItems([])
    setDiscountValue('')
    setDiscountReason('')
    setDiscountType('percentage')
    toast({
      title: "Discount Removed",
      description: "Discount has been removed from the order",
    })
  }

  const handleClearDiscountForm = () => {
    setDiscountValue('')
    setDiscountReason('')
    setDiscountType('percentage')
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Restaurant POS</h1>
            </div>
            <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
            {currentTime.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTakeAwayDialog(true)} disabled={!sessionId} className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Take Away
              {takeAwayOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  {takeAwayOrders.length}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPendingOrders(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Pending Orders ({pendingOrders.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Order History
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCloseSession} disabled={sessionClosing || !sessionId} className="ml-2">
              {sessionClosing ? 'Closing...' : 'Close Day'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const currentOrder = table.currentOrder || tableOrders[table.id]
            
            return (
            <Card 
              key={table.id}
              onClick={() => table.status !== "occupied" && handleTableSelect(table)}
                className={`cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  table.status === "occupied"
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                    : "border-transparent bg-card"
                }`}
              >
                <CardContent className="p-4 flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-foreground">{table.number}</h3>
                <Badge 
                        variant={table.status === "occupied" ? "default" : "secondary"}
                        className={`capitalize transition-colors duration-300 ${
                          table.status === "occupied"
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                  }`}
                >
                  {table.status}
                </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {table.status === "occupied" ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>{currentOrder ? `Order #${currentOrder.id.slice(-4)}` : "In Progress..."}</span>
                          </div>
                          {currentOrder?.customer_name && (
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <Users className="h-3 w-3" />
                              <span className="text-xs font-medium">{currentOrder.customer_name}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {table.status === "occupied" && currentOrder ? (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Total Due</p>
                        <p className="text-2xl font-bold text-primary">Ksh {currentOrder.total_amount?.toFixed(2) || '0.00'}</p>
                        
                        {/* Order Status Badge */}
                        <div className="mt-2 mb-2">
                          <Badge 
                            variant={
                              currentOrder.status === 'completed' ? 'default' : 
                              currentOrder.status === 'ready' ? 'secondary' :
                              currentOrder.status === 'preparing' ? 'outline' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTableSelect(table)
                          }}
                        >
                          Manage Order
                        </Button>
                        
                        {/* Only show payment button for completed orders */}
                        {currentOrder.status === 'completed' && (
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProceedToPayment(table)
                            }}
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Proceed to Payment
                          </Button>
                        )}
                        
                        {/* Show status message for non-completed orders */}
                        {currentOrder.status !== 'completed' && (
                          <div className="mt-2 text-xs text-muted-foreground text-center">
                            {currentOrder.status === 'ready' ? 'Ready for pickup' :
                             currentOrder.status === 'preparing' ? 'Being prepared' :
                             'Order in progress'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm text-muted-foreground">Click to start order</p>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!showTableOptions} onOpenChange={(open) => !open && setShowTableOptions(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Table {showTableOptions?.number} Options</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Button size="lg" className="w-full" onClick={handleAddMoreOrders}>
              <Plus className="h-5 w-5 mr-2" /> Add More Orders
            </Button>
            {showTableOptions && (showTableOptions.status === 'occupied') && (
              <>
                {/* Show payment option for completed orders */}
                {(() => {
                  const currentOrder = tableOrders[showTableOptions.id] || showTableOptions.currentOrder
                  if (currentOrder && currentOrder.status === 'completed') {
                    return (
                      <Button 
                        size="lg" 
                        className="w-full" 
                        variant="default"
                        onClick={() => {
                          setShowTableOptions(null)
                          handleProceedToPayment(showTableOptions)
                        }}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" /> Proceed to Payment
                      </Button>
                    )
                  }
                  return null
                })()}
                
                <Button size="lg" className="w-full" variant="destructive" onClick={handleCancelOrder} disabled={cancellingOrder}>
                  {cancellingOrder ? (
                    <span className="flex items-center justify-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-destructive mr-2"></span>Cancelling...</span>
                  ) : (
                    <><Trash2 className="h-5 w-5 mr-2" /> Cancel Order</>
                  )}
            </Button>
                <Button size="lg" className="w-full" variant="outline" onClick={() => setShowTransferDialog({ orderId: (tableOrders[showTableOptions.id] || showTableOptions.currentOrder)?.id, fromTable: showTableOptions })}>
                  <Users className="h-5 w-5 mr-2" /> Transfer Order
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!showRefundDialog} onOpenChange={(open) => { if (!open) setShowRefundDialog(null) }}>
        <DialogContent className="max-w-lg w-full mx-4">
          <DialogHeader>
            <DialogTitle>Refund Order {showRefundDialog ? `#${showRefundDialog.order.id.slice(-6)}` : ''}</DialogTitle>
          </DialogHeader>
          {showRefundDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={refundMode === 'full' ? 'default' : 'outline'} onClick={() => setRefundMode('full')}>Full Refund</Button>
                <Button variant={refundMode === 'partial' ? 'default' : 'outline'} onClick={() => setRefundMode('partial')}>Partial Refund</Button>
              </div>
              {refundMode === 'partial' ? (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {(showRefundDialog.order.items || []).map((it: any) => {
                    const state = refundItems.find(ri => ri.id === it.id)
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-2 p-2 border rounded">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{it.menu_item_name}</div>
                          <div className="text-xs text-muted-foreground">Unit: Ksh {Number(it.unit_price || 0).toFixed(2)} • Max: {it.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRefundItemQty(it.id, (state?.quantity || 0) - 1)}>-</Button>
                          <span className="w-6 text-center text-sm">{state?.quantity || 0}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRefundItemQty(it.id, (state?.quantity || 0) + 1)}>+</Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">This will refund the entire order.</div>
              )}
              <div className="flex justify-between font-medium">
                <span>Refund Total:</span>
                <span>Ksh {getRefundTotal().toFixed(2)}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowRefundDialog(null)} disabled={isSubmittingRefund}>Cancel</Button>
                <Button onClick={submitRefund} disabled={isSubmittingRefund}>
                  {isSubmittingRefund ? 'Processing…' : 'Confirm Refund'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!showPayment} onOpenChange={(open) => !open && setShowPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment for Table {showPayment?.table.number}</DialogTitle>
          </DialogHeader>
          {showPayment && (
            <div className="space-y-4">
              {(() => {
                const order = tableOrders[showPayment.table.id] || showPayment.table.currentOrder
                if (!order) return <div>Order not found.</div>
                
                return (
                  <>
                    {/* Customer Information */}
                    {order.customer_name && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div className="text-sm">
                          <span className="font-medium text-blue-800 dark:text-blue-200">Customer:</span>
                          <span className="ml-1 text-blue-700 dark:text-blue-300">{order.customer_name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Order Total:</span>
                      <span>Ksh {order.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.menu_item_name}{item.portion_size && ` (${item.portion_size})`}</span>
                          <span>x{item.quantity}</span>
                          <span>Ksh {item.total_price?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const order = tableOrders[showPayment.table.id] || showPayment.table.currentOrder
                    if (order) {
                      handlePrintReceipt(order)
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button className="flex-1" onClick={handleMarkAsPaid}>
                <CheckCircle className="h-5 w-5 mr-2" /> Mark as Paid
              </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPendingOrders} onOpenChange={setShowPendingOrders}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pending Orders ({pendingOrders.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">No pending orders</p>
                <p className="text-sm">All tables are available</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">Order #{order.id.slice(-6)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
                      </p>
                      
                      {/* Customer Information */}
                      {order.customer_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Customer:</span>
                            <span>{order.customer_name}</span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant="outline" className="ml-1">{order.status}</Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintReceipt(order)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Print Receipt
                      </Button>
                      
                      {/* Show payment button for completed orders */}
                      {order.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setShowPendingOrders(false)
                            const table = tables.find(t => t.id === order.table_id)
                            if (table) {
                              handleProceedToPayment(table)
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Proceed to Payment
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowPendingOrders(false)
                          const table = tables.find(t => t.id === order.table_id)
                          if (table) {
                            handleTableSelect(table)
                          }
                        }}
                      >
                        Manage Order
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.menu_item_name}
                          {item.portion_size && <span className="text-muted-foreground"> ({item.portion_size})</span>}
                          {item.customization_notes && <span className="text-muted-foreground"> - {item.customization_notes}</span>}
                        </span>
                        <span>x{item.quantity}</span>
                        <span>Ksh {item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    {/* Original Total (before discount) */}
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Original Total:</span>
                      <span>Ksh {calcOrderTotal(order.items).toFixed(2)}</span>
                    </div>
                    
                    {/* Discount Information */}
                    {getDiscountAmountFromDB(order) > 0 && (
                      <div className="flex justify-between text-sm text-green-600 mb-2">
                        <span>Discount ({order.discount_type || 'fixed'}):</span>
                        <span>-Ksh {getDiscountAmountFromDB(order).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {/* Current Total Due */}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total Due:</span>
                      <span className="text-primary">Ksh {order.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Breakdown Details */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal (before tax):</span>
                        <span>Ksh {getDiscountedOrderSubtotal(order.items).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tax (included):</span>
                        <span>Ksh {getDiscountedOrderTax(order.items).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTable} onOpenChange={(isOpen) => !isOpen && handleCloseOrderModal()}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {editingOrderId ? `Editing Order for Table ${selectedTable?.number}` : `New Order for Table ${selectedTable?.number}`}
            </DialogTitle>
          </DialogHeader>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                    <Select value={selectedRestaurant} onValueChange={(value) => setSelectedRestaurant(value as "all" | "Omel Dunia" | "Mamma Mia")}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Restaurants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Restaurants</SelectItem>
                        <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                        <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
                      </SelectContent>
                    </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                        placeholder="Search menu items..."
                        className="pl-10 w-96"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
              </div>
            </div>
          </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-muted/20">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading recipes...</p>
                    </div>
                  </div>
                ) : (
                <div>
                    {Object.entries(groupedRecipes).map(([category, items]) => (
                    <div key={category} className="mb-8">
                      <h2 className="text-xl font-bold mb-2">{category}</h2>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {items.map(item => (
                              <Card
                                key={item.id}
                                className="overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:border-primary/70 border-2 border-transparent rounded-2xl bg-white dark:bg-card relative"
                              >
                                <CardContent className="p-0">
                                  <div className="aspect-[4/3] bg-muted relative rounded-t-2xl overflow-hidden">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-4xl text-muted-foreground/30">
                                        🍽️
                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    <h3 className="absolute bottom-2 left-3 font-bold text-white text-lg drop-shadow-lg">
                                      {item.name}
                                    </h3>
                                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                                    {item.restaurant}
                          </Badge>
                        </div>
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                    <span className="font-bold text-xl text-primary">Ksh {item.price}</span>
                                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[120px] text-right">{item.description}</p>
                          </div>
                          <Button
                            size="sm"
                                      className="w-full rounded-full"
                                      onClick={() => handleOpenCustomization(item)}
                            disabled={item.available_quantity === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                                      Add to Order
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    {Object.keys(groupedRecipes).length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg mb-2">No recipes found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                    )}
              </div>
                )}
          </div>
        </div>
            <div className="w-[380px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                  Current Order ({existingOrderItems.length > 0 ? `${existingOrderItems.length} previous items + ${getCartItemCount()} new` : getCartItemCount()})
              </h2>
                {editingOrderId && existingOrderItems.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Adding to existing orders for Table {selectedTable?.number}
                  </p>
                )}
          </div>
          <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 && existingOrderItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="font-medium">No items in order</p>
                    <p className="text-sm">Select items from the menu to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                    {existingOrderItems.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Previous Order Items
                        </h3>
                        {existingOrderItems.map((item: CartItem, idx) => (
                          <div key={`existing-${item.id}`} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                {item.portionSize && (
                                  <p className="text-xs text-muted-foreground capitalize">{item.portionSize}</p>
                                )}
                              </div>
                              <span className="font-medium text-sm">Ksh {item.total_price}</span>
                            </div>
                            {item.customization && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md my-2">
                                {item.customization}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                              <Badge variant="outline" className="text-xs">Previous</Badge>
                            </div>
                            {/* Action row: edit, remove, replace */}
                            <div className="flex gap-2 mt-3 justify-end">
                              <Button size="sm" variant="outline" className="h-7 px-2 py-1 text-xs flex items-center gap-1" onClick={() => handleEditExistingItem(item, idx)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 py-1 text-xs flex items-center gap-1 text-destructive" onClick={() => handleRemoveExistingItem(item, idx)}>
                                <XCircle className="h-4 w-4" /> Remove
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 py-1 text-xs flex items-center gap-1" onClick={() => handleReplaceExistingItem(item, idx)}>
                                <RefreshCw className="h-4 w-4" /> Replace
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {cart.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          New Items
                        </h3>
                    {cart.map((item: CartItem) => (
                      <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {item.portionSize && (
                              <p className="text-xs text-muted-foreground capitalize">{item.portionSize}</p>
                            )}
                        </div>
                              <span className="font-medium text-sm">Ksh {item.total_price}</span>
                        </div>
                        {item.customization && (
                          <p className="text-xs text-primary/80 bg-primary/10 p-1.5 rounded-md my-2">
                            {item.customization}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                ))}
              </div>
            )}
          </div>
                )}
              </div>
              {(cart.length > 0 || existingOrderItems.length > 0) && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                  {existingOrderItems.length > 0 && (
                    <div className="pb-2 border-b border-border">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Previous Order:</span>
                        <span>Ksh {existingOrderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                  </div>
                    </div>
                  )}
                  
                  {cart.length > 0 && (
                    <div className="pb-2 border-b border-border">
                  <div className="flex justify-between text-sm text-muted-foreground">
                        <span>New Items:</span>
                        <span>Ksh {calcCartTotal().toFixed(2)}</span>
                  </div>
                    </div>
                  )}
                  
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal (before tax):</span>
                    <span>Ksh {getDiscountedSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tax (16% VAT):</span>
                    <span>Ksh {getDiscountedTax().toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                      <span>Discount ({appliedDiscount.type === 'percentage' ? appliedDiscount.value + '%' : 'Fixed'}):</span>
                      <span>-Ksh {getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                    <span>Ksh {(getFinalTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)).toFixed(2)}</span>
                </div>
                <div className="mb-2">
  <Button variant="outline" onClick={() => setShowCustomerDialog(true)} className="w-full">
    {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Add Customer'}
  </Button>
</div>
{selectedCustomer && (
  <div className="text-xs text-muted-foreground mb-2">
    <span className="font-semibold">Customer:</span> {selectedCustomer.name}
  </div>
)}
                  {/* Discount Section */}
                  <div className="mb-2">
                    {appliedDiscount ? (
                      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Discount Applied
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            onClick={handleRemoveDiscount}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium capitalize">{appliedDiscount.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Value:</span>
                            <span className="font-medium">
                              {appliedDiscount.type === 'percentage' 
                                ? appliedDiscount.value + '%' 
                                : 'Ksh ' + appliedDiscount.value.toFixed(2)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-medium">-Ksh {appliedDiscount.amount.toFixed(2)}</span>
                          </div>
                          {appliedDiscount.reason && (
                            <div className="mt-1 text-xs italic">
                              Reason: {appliedDiscount.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDiscountDialog(true)} 
                        className="w-full"
                        disabled={cart.length === 0 && existingOrderItems.length === 0}
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Apply Discount
                      </Button>
                    )}
                  </div>
                  <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placingOrder}>
                    {placingOrder ? (
                      <span className="flex items-center justify-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></span>Placing...</span>
                    ) : (
                      <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                        {editingOrderId ? "Add to Order" : "Place Order"}
                      </>
                    )}
              </Button>
            </div>
          )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Item</DialogTitle>
          </DialogHeader>
          {customizingItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{customizingItem.menuItem.name}</h3>
                {customizingItem.portionSize && (
                  <p className="text-sm text-muted-foreground capitalize">{customizingItem.portionSize}</p>
                )}
              </div>
              <Textarea
                placeholder="e.g., No onions, extra spicy..."
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddToCart}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-5xl max-h-[85vh] w-full mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Order History ({orderHistory.length})
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              View all completed and paid orders
            </p>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-auto">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">No order history</p>
                <p className="text-sm">Paid orders will appear here</p>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.id.slice(-6)}</h3>
                        <Badge variant={
                          order.status === "paid" ? "default" : 
                          order.status === "refunded" ? "destructive" :
                          order.status === "partially_refunded" ? "secondary" : 
                          "secondary"
                        }>
                          {order.status === "refunded" ? "Refunded" : 
                           order.status === "partially_refunded" ? "Partially Refunded" :
                           order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
                      </p>
                      
                      {/* Customer Information */}
                      {order.customer_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Customer:</span>
                            <span>{order.customer_name}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Method */}
                      {order.payment_method && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                          {(() => {
                            let pm = order.payment_method;
                            if (typeof pm === 'string' && pm.startsWith('{') && pm.endsWith('}')) {
                              try {
                                pm = JSON.parse(pm);
                              } catch {}
                            }
                            return formatPaymentMethod(pm);
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintReceipt(order)}
                        className="flex-1 sm:flex-none"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openRefundDialog(order)}
                        className="flex-1 sm:flex-none"
                      >
                        Refund
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Items Ordered:</h4>
                    <div className="space-y-1">
                      {order.items?.map((item: any) => {
                        // Handle case where refunded_quantity field might not exist
                        const refundedQty = item.refunded_quantity || 0
                        const remainingQty = item.quantity - refundedQty
                        const isFullyRefunded = refundedQty >= item.quantity
                        const isPartiallyRefunded = refundedQty > 0 && refundedQty < item.quantity
                        
                        return (
                          <div key={item.id} className={`flex justify-between items-start text-sm bg-muted/30 rounded p-2 ${isFullyRefunded ? 'opacity-60' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium truncate ${isFullyRefunded ? 'line-through' : ''}`}>
                                {item.menu_item_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.portion_size && <span>({item.portion_size})</span>}
                                {item.customization_notes && <span> - {item.customization_notes}</span>}
                                {isPartiallyRefunded && (
                                  <span className="text-orange-600 ml-1">
                                    ({refundedQty} refunded, {remainingQty} remaining)
                                  </span>
                                )}
                                {isFullyRefunded && (
                                  <span className="text-red-600 ml-1">(fully refunded)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 text-right">
                              <span className={`text-muted-foreground ${isFullyRefunded ? 'line-through' : ''}`}>
                                x{item.quantity}
                              </span>
                              <span className={`font-medium ${isFullyRefunded ? 'line-through' : ''}`}>
                                Ksh {item.total_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    {/* Original Total (before discount) */}
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Original Total:</span>
                      <span>Ksh {calcOrderTotal(order.items).toFixed(2)}</span>
                    </div>
                    
                    {/* Discount Information */}
                    {getDiscountAmountFromDB(order) > 0 && (
                      <div className="flex justify-between text-sm text-green-600 mb-2">
                        <span>Discount ({order.discount_type || 'fixed'}):</span>
                        <span>-Ksh {getDiscountAmountFromDB(order).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {/* Actual Amount Paid */}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Amount Paid:</span>
                      <span className="text-primary">Ksh {order.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Breakdown Details */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal (before tax):</span>
                        <span>Ksh {calcOrderSubtotal(order.items).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tax (included):</span>
                        <span>Ksh {getDiscountedOrderTax(order.items).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentMethodDialog} onOpenChange={(open) => !open && handleClosePaymentDialog()}>
        <DialogContent className="max-w-lg w-full mx-4">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => { setSelectedPaymentMethod('cash'); setSplitError(null); }}
              >
                Cash
              </Button>
              <Button
                variant={selectedPaymentMethod === 'mpesa' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => { setSelectedPaymentMethod('mpesa'); setSplitError(null); }}
              >
                M-Pesa
              </Button>
              <Button
                variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => { setSelectedPaymentMethod('card'); setSplitError(null); }}
              >
                Card
              </Button>
              <Button
                variant={selectedPaymentMethod === 'split' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => { setSelectedPaymentMethod('split'); setSplitError(null); }}
              >
                Split
              </Button>
            </div>
            {selectedPaymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount Received</label>
                  <Input
                    type="number"
                    min="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className="w-full"
                    placeholder="Enter amount received"
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Change to Give:</span>
                    <span className="text-lg font-bold text-primary">
                      Ksh {(() => {
                        const order = showPayment ? (tableOrders[showPayment.table.id] || showPayment.table.currentOrder) : null;
                        const received = parseFloat(cashReceived) || 0;
                        return order ? (received >= order.total_amount ? (received - order.total_amount).toFixed(2) : '0.00') : '0.00';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {selectedPaymentMethod === 'mpesa' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mobile Number</label>
                  <Input
                    type="tel"
                    value={mpesaPhoneNumber}
                    onChange={e => setMpesaPhoneNumber(formatMpesaPhoneNumber(e.target.value))}
                    className="w-full"
                    placeholder="e.g. 712345678"
                    maxLength={9}
                    disabled={mpesaStatus === 'processing'}
                  />
                </div>
                
                {mpesaStatus === 'processing' && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Processing M-Pesa Payment
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Please check your phone and enter your M-Pesa PIN to complete the payment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {mpesaStatus === 'success' && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Payment Successful!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          M-Pesa payment has been received and processed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {mpesaStatus === 'failed' && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Payment Failed
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          M-Pesa payment could not be processed. Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedPaymentMethod === 'split' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Cash Amount</label>
                    <Input
                      type="number"
                      min="0"
                      value={splitAmounts.cash}
                      onChange={e => setSplitAmounts(a => ({ ...a, cash: e.target.value }))}
                      className="w-full"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">M-Pesa Amount</label>
                    <Input
                      type="number"
                      min="0"
                      value={splitAmounts.mpesa}
                      onChange={e => setSplitAmounts(a => ({ ...a, mpesa: e.target.value }))}
                      className="w-full"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Card Amount</label>
                    <Input
                      type="number"
                      min="0"
                      value={splitAmounts.card}
                      onChange={e => setSplitAmounts(a => ({ ...a, card: e.target.value }))}
                      className="w-full"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {parseFloat(splitAmounts.cash) > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cash Received</label>
                    <Input
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="w-full"
                      placeholder="Enter cash received"
                    />
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Change:</span>
                        <span className="font-bold text-primary">
                          Ksh {(() => {
                            const cash = parseFloat(splitAmounts.cash) || 0;
                            const received = parseFloat(cashReceived) || 0;
                            return received >= cash ? (received - cash).toFixed(2) : '0.00';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {parseFloat(splitAmounts.mpesa) > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">M-Pesa Number</label>
                    <Input
                      type="tel"
                      value={mpesaNumber}
                      onChange={e => setMpesaNumber(e.target.value)}
                      className="w-full"
                      placeholder="e.g. 0712345678"
                    />
                  </div>
                )}
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Split:</span>
                    <span className="font-bold">
                      Ksh {(parseFloat(splitAmounts.cash) + parseFloat(splitAmounts.mpesa) + parseFloat(splitAmounts.card)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Order Total:</span>
                    <span className="font-bold text-primary">
                      Ksh {(() => {
                        const order = showPayment ? (tableOrders[showPayment.table.id] || showPayment.table.currentOrder) : null;
                        return order ? order.total_amount.toFixed(2) : '0.00';
                      })()}
                    </span>
                  </div>
                </div>
                
                {splitError && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                    <p className="text-sm text-red-700 dark:text-red-300">{splitError}</p>
                  </div>
                )}
              </div>
            )}
            {selectedPaymentMethod && selectedPaymentMethod !== 'split' && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'mpesa' && (
              <div className="text-sm text-muted-foreground mt-2">
                Payment will be marked as <span className="font-bold capitalize">{selectedPaymentMethod}</span>.
              </div>
            )}
            {splitError && <div className="text-xs text-destructive mt-1">{splitError}</div>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                onClick={handleClosePaymentDialog} 
                disabled={paymentLoading || mpesaProcessing}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              {selectedPaymentMethod === 'mpesa' && mpesaStatus === 'processing' && (
                <Button 
                  variant="destructive" 
                  onClick={cancelMpesaPayment} 
                  disabled={mpesaProcessing}
                  className="flex-1 sm:flex-none"
                >
                  Cancel Payment
                </Button>
              )}
            </div>
            <Button 
              onClick={handleConfirmPaymentMethod} 
              disabled={paymentLoading || mpesaProcessing || (selectedPaymentMethod === 'mpesa' && mpesaStatus === 'processing')}
              className="w-full sm:w-auto"
            >
              {paymentLoading || mpesaProcessing ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></span>
                  {selectedPaymentMethod === 'mpesa' ? 'Processing...' : 'Processing...'}
                </span>
              ) : (
                selectedPaymentMethod === 'mpesa' ? 'Initiate M-Pesa Payment' : 'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showTransferDialog} onOpenChange={(open) => { if (!open) { setShowTransferDialog(null); setTransferTargetTable(null); }}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>Select a table to transfer the order to:</div>
            <div className="grid grid-cols-3 gap-2">
              {tables.filter(t => t.status === 'available').map(t => (
                <Button key={t.id} variant={transferTargetTable?.id === t.id ? 'default' : 'outline'} className="w-full" onClick={() => setTransferTargetTable(t)}>
                  {t.number}
                </Button>
              ))}
            </div>
            {transferTargetTable && (
              <div className="text-sm text-muted-foreground">Order will be moved to <span className="font-bold">{transferTargetTable.number}</span>.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowTransferDialog(null); setTransferTargetTable(null); }} disabled={transferringOrder}>Cancel</Button>
            <Button onClick={handleTransferOrder} disabled={!transferTargetTable || transferringOrder}>
              {transferringOrder ? (
                <span className="flex items-center justify-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></span>Transferring...</span>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sessionId ? 'Session Closed' : 'Open Day'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {sessionId ? (
              <>
                <p className="mb-2">The day is now closed. Please open a new session to start taking orders.</p>
                <Button onClick={handleOpenSession} disabled={sessionLoading}>Open New Day</Button>
              </>
            ) : (
              <>
                <p className="mb-2">Start a new day to begin taking orders.</p>
                <Button onClick={handleOpenSession} disabled={sessionLoading}>Open Day</Button>
              </>
            )}
            {sessionError && <div className="text-destructive mt-2">{sessionError}</div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Codes Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Table QR Codes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Customers can scan these QR codes to place orders directly from their table.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tables.map((table) => (
                <Card key={table.id} className="p-4 text-center">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg mb-1">{table.number}</h3>
                    <Badge variant={table.status === "occupied" ? "destructive" : "secondary"}>
                      {table.status}
                    </Badge>
                  </div>
                  <div className="flex justify-center mb-3">
                    <QRCode 
                      value={qrCodes[table.id] || ""} 
                      size={150}
                      className="border rounded-lg p-2 bg-white"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (qrCodes[table.id]) {
                        window.open(qrCodes[table.id], '_blank')
                      }
                    }}
                    disabled={!qrCodes[table.id]}
                  >
                    Test QR Code
                  </Button>
                </Card>
              ))}
            </div>
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Instructions for customers:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                <li>1. Scan the QR code at your table</li>
                <li>2. Browse the menu and add items to cart</li>
                <li>3. Place your order - it will be prepared and served to your table</li>
                <li>4. You can add more items to your existing order anytime</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing an existing item */}
      <Dialog open={!!editingExistingItem} onOpenChange={() => setEditingExistingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingExistingItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{editingExistingItem.item.name}</h3>
                {editingExistingItem.item.portionSize && (
                  <p className="text-sm text-muted-foreground capitalize">{editingExistingItem.item.portionSize}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Qty:</span>
                <Input
                  type="number"
                  min={1}
                  value={editItemQuantity}
                  onChange={e => setEditItemQuantity(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Customization notes"
                  value={editItemCustomization}
                  onChange={e => setEditItemCustomization(e.target.value)}
                  rows={3}
                />
              </div>
              {/* Optionally, add portion size selector if needed */}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingExistingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditExistingItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for replacing an existing item */}
      <Dialog open={!!replacingExistingItem} onOpenChange={() => setReplacingExistingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Item</DialogTitle>
          </DialogHeader>
          {replacingExistingItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Replace {replacingExistingItem.item.name}</h3>
              </div>
              <div>
                <Select value={replaceSelectedMenuItem?.id || ""} onValueChange={id => setReplaceSelectedMenuItem(recipesAsMenuItems.find(mi => mi.id === id) || null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new item" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipesAsMenuItems.map(mi => (
                      <SelectItem key={mi.id} value={mi.id}>{mi.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplacingExistingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReplaceExistingItem} disabled={!replaceSelectedMenuItem}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Take Away Dialog */}
      <Dialog open={showTakeAwayDialog} onOpenChange={setShowTakeAwayDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Away Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleNewTakeAwayOrder()}>
                <Plus className="h-4 w-4 mr-2" />
                New Take Away Order
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {takeAwayOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active take away orders.</p>
                </div>
              ) : (
                takeAwayOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items • Total: Ksh {order.total_amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-2 capitalize">{order.status}</Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMoreToTakeAway(order)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add More
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTakeAwayPayment(order)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelTakeAwayOrder(order)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select or Add Customer</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Input
              placeholder="Search by name or PIN"
              value={customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value)
                if (e.target.value.length > 1) searchCustomers(e.target.value)
              }}
              className="mb-2"
            />
            {customerLoading && <div className="text-xs text-muted-foreground">Searching...</div>}
            {customerResults.map(cust => (
              <div key={cust.id} className="flex justify-between items-center py-1">
                <div>
                  <div className="font-medium leading-tight">{cust.name}</div>
                  {cust.kra_pin ? (
                    <div className="text-xs text-muted-foreground">{cust.kra_pin}</div>
                  ) : null}
                </div>
                <Button size="sm" onClick={() => { setSelectedCustomer(cust); setShowCustomerDialog(false) }}>Select</Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-2">Register New Customer</h4>
            <Input placeholder="Name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="mb-2" />
            <Input placeholder="KRA PIN" value={newCustomerPin} onChange={e => setNewCustomerPin(e.target.value)} className="mb-2 uppercase" />
            <Button onClick={handleAddCustomer} disabled={customerLoading}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Discount Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Discount Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={discountType === 'percentage' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType('percentage')}
                  className="h-10"
                >
                  Percentage
                </Button>
                <Button
                  variant={discountType === 'fixed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType('fixed')}
                  className="h-10"
                >
                  Fixed Amount
                </Button>
                <Button
                  variant={discountType === 'bogo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType('bogo')}
                  className="h-10"
                >
                  BOGO
                </Button>
                <Button
                  variant={discountType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountType('custom')}
                  className="h-10"
                >
                  Custom
                </Button>
              </div>
            </div>

            {/* Discount Value Input */}
            {discountType !== 'bogo' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {discountType === 'percentage' ? 'Percentage (%)' : 
                   discountType === 'fixed' ? 'Fixed Amount (Ksh)' : 
                   'Custom Amount (Ksh)'}
                </Label>
                <Input
                  type="number"
                  placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0"
                  max={discountType === 'percentage' ? "100" : undefined}
                  step={discountType === 'percentage' ? "1" : "0.01"}
                />
              </div>
            )}

            {/* BOGO Information */}
            {discountType === 'bogo' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Buy One Get One Free</p>
                    <p className="text-xs">
                      Automatically applies 50% discount to pairs of identical items in your cart.
                      Items will be grouped and discounted accordingly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Preview */}
            {discountValue && discountType !== 'bogo' && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Ksh {calcCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-Ksh {calculateDiscountAmount(calcCartTotal(), discountType, parseFloat(discountValue)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>New Total:</span>
                    <span>Ksh {(calcCartTotal() - calculateDiscountAmount(calcCartTotal(), discountType, parseFloat(discountValue))).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BOGO Preview */}
            {discountType === 'bogo' && cart.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Ksh {calcCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>BOGO Savings:</span>
                    <span>-Ksh {calculateBogoDiscount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>New Total:</span>
                    <span>Ksh {(calcCartTotal() - calculateBogoDiscount()).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason (Optional)</Label>
              <Input
                placeholder="e.g., Loyalty discount, Special offer..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleClearDiscountForm}>
              Clear
            </Button>
            <Button variant="ghost" onClick={() => setShowDiscountDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyDiscount}
              disabled={discountType !== 'bogo' && !discountValue}
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
  )
}