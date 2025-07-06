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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore, useCompletePOSStore as usePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import type { MenuItem, CartItem } from "@/types/unified-system"
import { supabase } from "@/lib/supabase"
import { tableOrdersService } from "@/lib/database"
import Image from "next/image"

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
    if (!selectedTable || cart.length === 0) {
      toast({
        title: "Error",
        description: "Please select a table and add items to cart",
        variant: "destructive",
      })
      return
    }

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

      const subtotal = getCartTotal()
      const taxRate = 16 // 16% tax rate
      const taxAmount = subtotal * (taxRate / 100)
      const totalAmount = subtotal + taxAmount

    if (editingOrderId) {
        // Add items to existing order
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
        // Create new order
        const { data, error } = await tableOrdersService.createOrderWithItems({
          table_number: selectedTable.number,
          table_id: selectedTable.id,
          customer_name: "",
          order_type: "dine-in",
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          items: cartItems
        })

        if (error) {
          throw new Error(error)
        }

        // Update table status
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

      // Update table orders state
      await loadTableOrders()
      
      // Clear cart and existing items
      clearCart()
      setExistingOrderItems([])
      
    } catch (error: any) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      })
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

    try {
      const { data, error } = await tableOrdersService.markOrderAsPaid(
        showPayment.orderId, 
        "cash" // You can make this dynamic based on payment method selection
      )

      if (error) {
        throw new Error(error)
      }

      // Update table status to available
      setTables(prevTables => prevTables.map(table => 
        table.id === showPayment.table.id 
          ? { ...table, status: "available", orderId: undefined, currentOrder: undefined }
          : table
      ))

      // Clear the order from table orders state
      setTableOrders(prev => {
        const updated = { ...prev }
        delete updated[showPayment.table.id]
        return updated
      })

      // Clear selected table if it's the same
      if (selectedTable?.id === showPayment.table.id) {
        setSelectedTable(null)
        setEditingOrderId(null)
        setExistingOrderItems([])
        clearCart()
      }

      // Refresh pending orders and order history
      await Promise.all([
        loadTableOrders(),
        loadOrderHistory()
      ])

      toast({
        title: "Payment Complete",
        description: `Table ${showPayment.table.number} has been cleared`,
        duration: 2000,
      })

      setShowPayment(null)
    } catch (error: any) {
      console.error("Error marking order as paid:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    }
  }

  const handleCloseOrderModal = () => {
    clearCart()
    setSelectedTable(null)
    setEditingOrderId(null)
    setExistingOrderItems([])
  }

  const handlePrintReceipt = (order: any) => {
    const receiptContent = `
      <div style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; width: 384px; max-width: 384px; padding: 15px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 1px;">RESTAURANT NAME</h2>
          <p style="margin: 8px 0; font-size: 12px; font-weight: 500;">123 Main Street, City</p>
          <p style="margin: 8px 0; font-size: 12px; font-weight: 500;">Phone: (123) 456-7890</p>
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
            <span style="font-weight: bold;">Subtotal:</span>
            <span style="font-weight: 600;">Ksh ${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; font-weight: 500;">
            <span style="font-weight: bold;">Tax (16%):</span>
            <span style="font-weight: 600;">Ksh ${order.tax_amount.toFixed(2)}</span>
          </div>
          <div style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
              <span>TOTAL:</span>
              <span>Ksh ${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 15px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000;">
          <p style="margin: 8px 0; font-size: 14px; font-weight: bold;">Thank you for dining with us!</p>
          <p style="margin: 8px 0; font-size: 13px; font-weight: 500;">Please come again</p>
          <p style="margin: 8px 0; font-size: 12px; font-weight: 500;">www.restaurant.com</p>
        </div>
        
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
                  width: 384px;
                  max-width: 384px;
                }
                .receipt-container {
                  width: 384px;
                  max-width: 384px;
                  margin: 0;
                  padding: 15px;
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  line-height: 1.4;
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
                padding: 15px;
                background: white;
              }
              .receipt-container {
                width: 384px;
                max-width: 384px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 15px rgba(0,0,0,0.15);
                border-radius: 10px;
              }
              .print-button {
                position: fixed;
                top: 15px;
                right: 15px;
                padding: 12px 24px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .print-button:hover {
                background: #0056b3;
                transform: translateY(-1px);
              }
              @media print {
                .print-button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
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
            <Button size="lg" className="w-full" variant="secondary" onClick={handleProceedToPayment}>
              <CheckCircle className="h-5 w-5 mr-2" /> Proceed to Payment
            </Button>
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
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>Ksh {order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (16%):</span>
                      <span>Ksh {order.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">Ksh {order.total_amount.toFixed(2)}</span>
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
                        {existingOrderItems.map((item: CartItem) => (
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
                        <span>Ksh {getCartTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal:</span>
                    <span>Ksh {(getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (16%):</span>
                    <span>Ksh {((getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)) * 0.16).toFixed(2)}</span>
                  </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                    <span>Ksh {((getCartTotal() + existingOrderItems.reduce((sum, item) => sum + item.total_price, 0)) * 1.16).toFixed(2)}</span>
                </div>
                  <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {editingOrderId ? "Add to Order" : "Place Order"}
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
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant={order.status === "paid" ? "default" : "secondary"} className="ml-1">{order.status}</Badge>
                        {order.payment_method && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            • Paid via {order.payment_method}
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
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>Ksh {order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (16%):</span>
                      <span>Ksh {order.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">Ksh {order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
  )
}
