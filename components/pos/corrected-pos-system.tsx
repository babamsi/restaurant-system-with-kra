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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore, useCompletePOSStore as usePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import type { MenuItem, CartItem } from "@/types/unified-system"
import { supabase } from "@/lib/supabase"
import { tableOrdersService } from "@/lib/database"
import Image from "next/image"
import { QRCode } from "@/components/ui/qr-code"

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

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionClosing, setSessionClosing] = useState(false)

  const [showQRDialog, setShowQRDialog] = useState(false)
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({})

  // Add state for editing an existing item
  const [editingExistingItem, setEditingExistingItem] = useState<null | { item: CartItem; index: number }>(null)
  const [editItemQuantity, setEditItemQuantity] = useState(1)
  const [editItemCustomization, setEditItemCustomization] = useState("")
  const [editItemPortionSize, setEditItemPortionSize] = useState<string | undefined>(undefined)

  // Add state for replacing an existing item
  const [replacingExistingItem, setReplacingExistingItem] = useState<null | { item: CartItem; index: number }>(null)
  const [replaceSelectedMenuItem, setReplaceSelectedMenuItem] = useState<ExtendedMenuItem | null>(null)

  // KRA eTIMS: Print/display KRA receipt info
  const [kraReceipt, setKraReceipt] = useState<any>(null)

  // Add these helpers inside the component, after your useState hooks:
  const TAX_RATE = 0.16;
  const TAX_FACTOR = TAX_RATE / (1 + TAX_RATE);

  function calcCartSubtotal() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity) / (1 + TAX_RATE), 0);
  }
  function calcCartTax() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity) * TAX_RATE / (1 + TAX_RATE), 0);
  }
  function calcCartTotal() {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
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
    loadOrderHistory()
  }, [])

  const loadTableOrders = async () => {
    try {
      const { data: pendingOrders } = await tableOrdersService.getPendingOrders()
      if (pendingOrders) {
        const ordersMap: Record<number, any> = {}
        pendingOrders.forEach((order: any) => {
          ordersMap[order.table_id] = order
        })
        setTableOrders(ordersMap)
        setPendingOrders(pendingOrders)
        
        // Update table statuses based on orders
        setTables(prevTables => prevTables.map(table => ({
          ...table,
          status: ordersMap[table.id] ? "occupied" : "available",
          orderId: ordersMap[table.id]?.id,
          currentOrder: ordersMap[table.id]
        })))
      }
    } catch (error) {
      console.error("Error loading table orders:", error)
    }
  }

  const loadOrderHistory = async () => {
    try {
      // Load completed and paid orders for history
      const { data: completedOrders } = await supabase
        .from('table_orders')
        .select(`
          *,
          items:table_order_items(*)
        `)
        .in('status', ['completed', 'paid'])
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

    const cartItemId = `${menuItem.id}${portionSize ? `-${portionSize}` : ""}${
      customizationNotes ? `-${customizationNotes}` : ""
    }`

    addToCart(menuItem, 1, {
      id: cartItemId,
      portionSize,
      customization: customizationNotes,
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
      toast({ title: 'No Open Session', description: 'Please open the day before placing orders.', variant: 'destructive' })
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
      const cartItems = cart.map(item => ({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        portion_size: item.portionSize,
        customization_notes: item.customization
      }))
      const subtotal = calcCartTotal()
      const taxRate = 0 // Tax is included in price
      const taxAmount = 0 // No extra tax
      const totalAmount = subtotal // No extra tax added
    if (editingOrderId) {
        const { data, error } = await tableOrdersService.addItemsToOrder(editingOrderId, cartItems)
        if (error) {
          throw new Error(error)
        }
        toast({
          title: "Order Updated",
          description: `Added items to ${selectedTable.number}`,
          duration: 2000,
        })
    } else {
        const { data, error } = await tableOrdersService.createOrderWithItems({
          table_number: selectedTable.number,
          table_id: selectedTable.id,
          customer_name: "",
          order_type: "dine-in",
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          items: cartItems,
          session_id: sessionId
        })
        if (error) {
          throw new Error(error)
        }
        setTables(prevTables => prevTables.map(table =>
          table.id === selectedTable.id
            ? { ...table, status: "occupied", orderId: data?.id, currentOrder: data }
            : table
        ))
        setEditingOrderId(data?.id || null)
        toast({
          title: "Order Placed",
          description: `Order placed for ${selectedTable.number}`,
          duration: 2000,
        })
      }
      await loadTableOrders()
      clearCart()
      setExistingOrderItems([])
      setSelectedTable(null)
      setEditingOrderId(null)
    } catch (error: any) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleTableSelect = (table: TableState) => {
    if (table.status === "occupied") {
      // Show table options for occupied tables
      setShowTableOptions(table)
      return
    }
    
      setSelectedTable(table)
    clearCart()
    setEditingOrderId(null)
    setExistingOrderItems([])

    // If table has an active order, load it
    if (table.currentOrder) {
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

  const handleAddMoreOrders = () => {
    if (!showTableOptions) return
    
      const table = showTableOptions
    const currentOrder = tableOrders[table.id] || table.currentOrder
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

  const handleProceedToPayment = () => {
    if (!showTableOptions) return
    
    const table = showTableOptions
    const currentOrder = tableOrders[table.id] || table.currentOrder
    if (!currentOrder) {
      toast({
        title: "No Order Found",
        description: "No active order found for this table",
        variant: "destructive",
      })
      return
    }
    
    setShowPayment({ table: table, orderId: currentOrder.id })
      setShowTableOptions(null)
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
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < order.total_amount) {
        setSplitError('Amount received must be at least the total amount.')
        setPaymentLoading(false)
        return
      }
      paymentDetails = { received, change: received - order.total_amount }
    }
    if (paymentMethod === 'mpesa') {
      if (!mpesaNumber || mpesaNumber.length < 8) {
        setSplitError('Please enter a valid mobile number.')
        setPaymentLoading(false)
        return
      }
      paymentDetails = { mpesaNumber }
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
      const { data, error } = await tableOrdersService.markOrderAsPaid(
        showPayment.orderId,
        paymentMethod === 'cash' || paymentMethod === 'mpesa' ? paymentDetails : paymentMethod === 'split' ? paymentDetails : paymentMethod
      )
      if (error) {
        throw new Error(error)
      }
      // 2. KRA eTIMS: Transmit sale to KRA
      // Gather all items (from order.items)
      // --- KRA CODE PATCH START ---
      const TAX_RATE = 0.16;
      const TAX_FACTOR = TAX_RATE / (1 + TAX_RATE); // 0.16 / 1.16
      let items = order.items.map((item: any): any => ({
        id: item.menu_item_id,
        name: item.menu_item_name,
        price: item.unit_price, // tax-inclusive
        qty: item.quantity,
        itemCd: item.itemCd, // KRA item code from recipes table
        itemClsCd: item.itemClsCd, // from recipes table
      }))
      // Ensure all items have itemCd and itemClsCd
      for (let i = 0; i < items.length; i++) {
        if (!items[i].itemCd || !items[i].itemClsCd) {
          const { data: recipe, error } = await supabase
            .from('recipes')
            .select('itemCd, itemClsCd')
            .eq('id', items[i].id)
            .single();
          if (recipe) {
            items[i].itemCd = recipe.itemCd;
            items[i].itemClsCd = recipe.itemClsCd;
          }
        }
      }
      if (items.some((i: any) => !i.itemCd)) {
        console.error('KRA Compliance Error: Items missing itemCd:', items.filter((i: any) => !i.itemCd));
        toast({ title: 'KRA Compliance Error', description: 'One or more items are not KRA registered. Sale blocked.', variant: 'destructive' });
        setPaymentLoading(false);
        // return;
      }
      // Calculate tax-inclusive breakdown for each item
      items = items.map((item: any): any => {
        const total = item.price * item.qty;
        const taxAmount = total * TAX_FACTOR;
        const netAmount = total - taxAmount;
        return { ...item, total, taxAmount, netAmount };
      });
      // Calculate order-level totals
      const orderTotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
      const orderTax = items.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
      const orderNet = items.reduce((sum: number, item: any) => sum + item.netAmount, 0);
      // --- KRA CODE PATCH END ---
      // Payment method mapping
      const kraPaymentMethod = paymentMethod
      // Customer info (optional, can be extended)
      const customer = { tin: '', name: '' }
      // Call KRA API
      const kraRes = await fetch('/api/kra/save-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          payment: { method: kraPaymentMethod },
          customer,
          saleId: order.id,
          orderTotal,
          orderTax,
          orderNet,
        }),
      })
      const kraData = await kraRes.json()
      if (!kraData.success) {
        // Save to sales_invoices with status 'error' and error message, but DO NOT block order completion
        await supabase.from('sales_invoices').insert({
          trdInvcNo: kraData.invcNo,
          order_id: order.id,
          payment_method: paymentMethod,
          total_items: order.items.length,
          gross_amount: orderTotal,
          net_amount: orderNet,
          tax_amount: orderTax,
          kra_status: 'error',
          kra_error: kraData.error || kraData.kraData?.resultMsg || 'KRA push failed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        toast({ title: 'KRA Sale Error', description: kraData.error || 'Failed to transmit sale to KRA. Order completed, but not sent to KRA.', variant: 'warning' })
        // DO NOT return or block order completion!
      } else if (kraData.kraData) {
        // console.log("checking.. KRAData: ", kraData.kra)
        const { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime } = kraData.kraData.data
        await supabase.from('sales_invoices').insert({
          trdInvcNo: kraData.invcNo,
          order_id: order.id,
          payment_method: paymentMethod,
          total_items: order.items.length,
          gross_amount: orderTotal,
          net_amount: orderNet,
          tax_amount: orderTax,
          kra_curRcptNo: curRcptNo,
          kra_totRcptNo: totRcptNo,
          kra_intrlData: intrlData,
          kra_rcptSign: rcptSign,
          kra_sdcDateTime: sdcDateTime,
          kra_status: 'ok',
          kra_error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        setKraReceipt(kraData.kraData)
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
      // Fetch the latest order data for the receipt
      const { data: latestOrder } = await supabase
        .from('table_orders')
        .select('*, items:table_order_items(*)')
        .eq('id', showPayment.orderId)
        .single()
      if (latestOrder) {
        handlePrintReceipt(latestOrder, kraData.kraData)
      } else {
        handlePrintReceipt(order, kraData.kraData)
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

  // Print receipt with KRA info
  const handlePrintReceipt = (order: any, kraData?: any) => {
    const receiptContent = `
      <div style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; width: 100%; max-width: 300px; margin: 0; padding: 8px 0 8px 8px; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: bold; letter-spacing: 1px;">RESTAURANT NAME</h2>
          <p style="margin: 6px 0; font-size: 11px; font-weight: 500;">123 Main Street, City</p>
          <p style="margin: 6px 0; font-size: 11px; font-weight: 500;">Phone: (123) 456-7890</p>
        </div>
        <div style="border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 12px 0; margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-weight: 500;">
            <span style="font-weight: bold;">Order #:</span>
            <span style="font-weight: 600;">${order.id.slice(-6)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-weight: 500;">
            <span style="font-weight: bold;">Table:</span>
            <span style="font-weight: 600;">${order.table_number}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-weight: 500;">
            <span style="font-weight: bold;">Date:</span>
            <span style="font-weight: 600;">${new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-weight: 500;">
            <span style="font-weight: bold;">Time:</span>
            <span style="font-weight: 600;">${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 500;">
            <span style="font-weight: bold;">Status:</span>
            <span style="text-transform: uppercase; font-weight: bold; font-size: 13px;">${order.status}</span>
          </div>
        </div>
        <div style="margin: 15px 0;">
          <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
              <span style="width: 40%;">ITEM</span>
              <span style="width: 12%; text-align: center;">QTY</span>
              <span style="width: 18%; text-align: right;">PRICE</span>
              <span style="width: 30%; text-align: right;">TOTAL</span>
            </div>
          </div>
          ${order.items?.map((item: any) => `
            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dotted #999;">
              <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; line-height: 1.3;">
                ${item.menu_item_name}${item.portion_size ? ` (${item.portion_size})` : ''}
              </div>
              ${item.customization_notes ? `
                <div style="font-size: 11px; color: #555; margin-bottom: 4px; font-style: italic; padding-left: 10px; font-weight: 500;">
                  Note: ${item.customization_notes}
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 12px; align-items: center; font-weight: 500;">
                <span style="width: 40%;"></span>
                <span style="width: 12%; text-align: center; font-weight: bold; font-size: 13px;">${item.quantity}</span>
                <span style="width: 18%; text-align: right; font-weight: 600;">${item.unit_price.toFixed(2)}</span>
                <span style="width: 30%; text-align: right; font-weight: bold; font-size: 13px;">${item.total_price.toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="border-top: 2px dashed #000; padding-top: 15px; margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; font-weight: 500;">
            <span style="font-weight: bold;">Total:</span>
            <span style="font-weight: 600;">Ksh ${order.total_amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-top: 2px;">
            <span>Subtotal (before tax):</span>
            <span>Ksh ${calcOrderSubtotal(order.items).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-top: 2px;">
            <span>Tax (16% VAT):</span>
            <span>Ksh ${calcOrderTax(order.items).toFixed(2)}</span>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0; padding: 15px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000;">
          <p style="margin: 8px 0; font-size: 14px; font-weight: bold;">Thank you for dining with us!</p>
          <p style="margin: 8px 0; font-size: 13px; font-weight: 500;">Please come again</p>
          <p style="margin: 8px 0; font-size: 12px; font-weight: 500;">www.restaurant.com</p>
        </div>
        ${kraData ? `
        <div style="text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px;">
          <div style="font-size: 12px; font-weight: bold; color: #222;">KRA eTIMS Receipt</div>
          <div style="font-size: 12px;">Invoice No: <b>${kraData.curRcptNo || ''}</b></div>
          <div style="font-size: 12px;">Signature: <b>${kraData.rcptSign || ''}</b></div>
          ${kraData.qrCodeUrl ? `<img src="${kraData.qrCodeUrl}" alt="KRA QR Code" style="margin: 10px auto; display: block; width: 120px; height: 120px;" />` : ''}
        </div>
        ` : ''}
        <div style="text-align: center; margin-top: 20px;">
          <div style="font-size: 10px; color: #777; border-top: 1px solid #ccc; padding-top: 10px; font-weight: 500;">
            Receipt printed on: ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `
    const printWindow = window.open('', '_blank', 'width=450,height=700')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - Order ${order.id.slice(-6)}</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  max-width: 300px;
                }
                .receipt-container {
                  width: 100%;
                  max-width: 300px;
                  margin: 0;
                  padding: 8px 0 8px 8px;
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  line-height: 1.4;
                  box-sizing: border-box;
                }
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
                padding: 8px 0 8px 8px;
                background: white;
                width: 100%;
                max-width: 300px;
                box-sizing: border-box;
              }
              .receipt-container {
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
                background: white;
                box-shadow: none;
                border-radius: 0;
                padding: 8px 0 8px 8px;
                box-sizing: border-box;
              }
              .print-button {
                display: none;
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${receiptContent}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 800);
              };
              window.onafterprint = function() {
                // Optional: close window after printing
                // window.close();
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
    }
  }

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

  // On mount, check for open session
  useEffect(() => {
    const checkSession = async () => {
      setSessionLoading(true)
      setSessionError(null)
      // Always check DB for open session
      const { data, error } = await supabase.from('sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).single()
      if (data && !error) {
        setSessionId(data.id)
        localStorage.setItem('current_session_id', data.id)
        setSessionLoading(false)
      } else {
        setSessionId(null)
        localStorage.removeItem('current_session_id')
        setShowSessionDialog(true)
        setSessionLoading(false)
      }
    }
    checkSession()
  }, [])

  // Open new session
  const handleOpenSession = async () => {
    setSessionLoading(true)
    setSessionError(null)
    // Check again for open session before creating
    const { data: openSession, error: openError } = await supabase.from('sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).single()
    if (openSession && !openError) {
      setSessionId(openSession.id)
      localStorage.setItem('current_session_id', openSession.id)
      setShowSessionDialog(false)
      setSessionLoading(false)
      return
    }
    // No open session, create one
    // Fix: do not use .select().single() on insert, just await insert and check for error
    const { error: sessionInsertError } = await supabase.from('sessions').insert({ opened_by: 'POS' })
    if (!sessionInsertError) {
      // Refetch the open session to get its ID
      const { data: newSession, error: fetchSessionError } = await supabase.from('sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).single()
      if (newSession && !fetchSessionError) {
        setSessionId(newSession.id)
        localStorage.setItem('current_session_id', newSession.id)
        setShowSessionDialog(false)
      } else {
        setSessionError('Session created but could not fetch session ID')
      }
    } else {
      setSessionError('Failed to open session')
    }
    setSessionLoading(false)
  }

  // Close session
  const handleCloseSession = async () => {
    if (!sessionId) return
    setSessionClosing(true)
    // Check for any pending/processing orders in this session
    const { data: openOrders, error: openOrdersError } = await supabase
      .from('table_orders')
      .select('id, status')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'preparing', 'ready'])
    if (openOrdersError) {
      setSessionError('Failed to check open orders')
      setSessionClosing(false)
      return
    }
    if (openOrders && openOrders.length > 0) {
      setSessionError('Cannot close day: There are still orders in progress or unpaid. Please complete or pay all orders before closing the day.')
      setSessionClosing(false)
      return
    }
    const { error } = await supabase.from('sessions').update({ closed_at: new Date().toISOString(), closed_by: 'POS' }).eq('id', sessionId)
    if (!error) {
      setSessionId(null)
      localStorage.removeItem('current_session_id')
      setShowSessionDialog(true)
    } else {
      setSessionError('Failed to close session')
    }
    setSessionClosing(false)
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
            <Button variant="outline" size="sm" onClick={generateQRCodes} disabled={!sessionId}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Codes
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
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{currentOrder ? `Order #${currentOrder.id.slice(-4)}` : "In Progress..."}</span>
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
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPayment({ table, orderId: currentOrder.id })
                          }}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Proceed to Payment
                        </Button>
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
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">Ksh {order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal (before tax):</span>
                      <span>Ksh {calcCartSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tax (16% VAT):</span>
                      <span>Ksh {calcCartTax().toFixed(2)}</span>
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
                    <span>Ksh {calcCartSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tax (16% VAT):</span>
                    <span>Ksh {calcCartTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                    <span>Ksh {(calcCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)).toFixed(2)}</span>
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Order History ({orderHistory.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">No order history</p>
                <p className="text-sm">Completed orders will appear here</p>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">Order #{order.id.slice(-6)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        Status: <Badge variant={order.status === "paid" ? "default" : "secondary"} className="ml-1">{order.status}</Badge>
                        {order.payment_method && (
                          <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-semibold">
                            {(() => {
                              let pm = order.payment_method;
                              if (typeof pm === 'string' && pm.startsWith('{') && pm.endsWith('}')) {
                                try {
                                  pm = JSON.parse(pm);
                                } catch {}
                              }
                              return formatPaymentMethod(pm);
                            })()}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintReceipt(order)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Print Receipt
                    </Button>
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
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">Ksh {calcOrderTotal(order.items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal (before tax):</span>
                      <span>Ksh {calcOrderSubtotal(order.items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tax (16% VAT):</span>
                      <span>Ksh {calcOrderTax(order.items).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setSelectedPaymentMethod('cash'); setSplitError(null); }}
              >
                Cash
              </Button>
              <Button
                variant={selectedPaymentMethod === 'mpesa' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setSelectedPaymentMethod('mpesa'); setSplitError(null); }}
              >
                Mpesa
              </Button>
              <Button
                variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setSelectedPaymentMethod('card'); setSplitError(null); }}
              >
                Card
              </Button>
              <Button
                variant={selectedPaymentMethod === 'split' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setSelectedPaymentMethod('split'); setSplitError(null); }}
              >
                Split
              </Button>
            </div>
            {selectedPaymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-32">Amount Received</span>
                  <Input
                    type="number"
                    min="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32">Change to Give</span>
                  <span className="font-bold">
                    {(() => {
                      const order = showPayment ? (tableOrders[showPayment.table.id] || showPayment.table.currentOrder) : null;
                      const received = parseFloat(cashReceived) || 0;
                      return order ? (received >= order.total_amount ? (received - order.total_amount).toFixed(2) : '0.00') : '0.00';
                    })()}
                  </span>
                </div>
              </div>
            )}
            {selectedPaymentMethod === 'mpesa' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-32">Mobile Number</span>
                  <Input
                    type="tel"
                    value={mpesaNumber}
                    onChange={e => setMpesaNumber(e.target.value)}
                    className="flex-1"
                    placeholder="e.g. 0712345678"
                  />
                </div>
              </div>
            )}
            {selectedPaymentMethod === 'split' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-16">Cash</span>
                  <Input
                    type="number"
                    min="0"
                    value={splitAmounts.cash}
                    onChange={e => setSplitAmounts(a => ({ ...a, cash: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">Mpesa</span>
                  <Input
                    type="number"
                    min="0"
                    value={splitAmounts.mpesa}
                    onChange={e => setSplitAmounts(a => ({ ...a, mpesa: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">Card</span>
                  <Input
                    type="number"
                    min="0"
                    value={splitAmounts.card}
                    onChange={e => setSplitAmounts(a => ({ ...a, card: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                {parseFloat(splitAmounts.cash) > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-32">Cash Received</span>
                    <Input
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
                {parseFloat(splitAmounts.cash) > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-32">Change to Give</span>
                    <span className="font-bold">
                      {(() => {
                        const cash = parseFloat(splitAmounts.cash) || 0;
                        const received = parseFloat(cashReceived) || 0;
                        return received >= cash ? (received - cash).toFixed(2) : '0.00';
                      })()}
                    </span>
                  </div>
                )}
                {parseFloat(splitAmounts.mpesa) > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-32">Mpesa Number</span>
                    <Input
                      type="tel"
                      value={mpesaNumber}
                      onChange={e => setMpesaNumber(e.target.value)}
                      className="flex-1"
                      placeholder="e.g. 0712345678"
                    />
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Total must equal order total: <span className="font-bold">Ksh {(() => {
                    const order = showPayment ? (tableOrders[showPayment.table.id] || showPayment.table.currentOrder) : null;
                    return order ? order.total_amount.toFixed(2) : '0.00';
                  })()}</span>
                </div>
                {splitError && <div className="text-xs text-destructive mt-1">{splitError}</div>}
              </div>
            )}
            {selectedPaymentMethod && selectedPaymentMethod !== 'split' && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'mpesa' && (
              <div className="text-sm text-muted-foreground mt-2">
                Payment will be marked as <span className="font-bold capitalize">{selectedPaymentMethod}</span>.
              </div>
            )}
            {splitError && <div className="text-xs text-destructive mt-1">{splitError}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPaymentMethodDialog(false)} disabled={paymentLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPaymentMethod} disabled={paymentLoading}>
              {paymentLoading ? (
                <span className="flex items-center justify-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></span>Processing...</span>
              ) : (
                'Confirm Payment'
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
      </div>
  )
}
