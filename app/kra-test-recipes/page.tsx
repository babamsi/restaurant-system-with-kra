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
import { Plus, Trash2, Edit, Search, Package, List, ChefHat, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import { getKRAHeaders } from "@/lib/kra-utils"

interface TestItem {
  id: string
  name: string
  description?: string
  category: string
  cost_per_unit: number
  unit: string
  item_cd: string
  item_cls_cd?: string
  tax_ty_cd?: string
  current_stock?: number
  kra_status?: string
  created_at: string
  updated_at: string
}

export default function KRATestRecipesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // Composition dialog states
  const [showCompositionDialog, setShowCompositionDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TestItem | null>(null)
  const [selectedCompositionItem, setSelectedCompositionItem] = useState<TestItem | null>(null)
  const [compositionQuantity, setCompositionQuantity] = useState("")
  const [savingComposition, setSavingComposition] = useState(false)

  // Load items on component mount
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('kra_test_items')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
      toast({
        title: "Error Loading Items",
        description: "Failed to load registered items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = Array.from(new Set(items.map(item => item.category)))

  const openCompositionDialog = (item: TestItem) => {
    setSelectedItem(item)
    setSelectedCompositionItem(null)
    setCompositionQuantity("")
    setShowCompositionDialog(true)
  }

  const addCompositionToItem = async () => {
    if (!selectedItem || !selectedCompositionItem || !compositionQuantity || parseFloat(compositionQuantity) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a composition item and enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    setSavingComposition(true)

    try {
      const quantity = parseFloat(compositionQuantity)

      // Call our API route to save item composition
      const response = await fetch('/api/kra/save-item-composition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemCd: selectedItem.item_cd,
          cpstItemCd: selectedCompositionItem.item_cd,
          cpstQty: quantity
        }),
      })
      
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send composition to KRA')
      }

      toast({
        title: "Composition Sent to KRA",
        description: `Successfully informed KRA that ${selectedItem.name} contains ${compositionQuantity} ${selectedCompositionItem.unit} of ${selectedCompositionItem.name}`,
      })

      setShowCompositionDialog(false)
    } catch (error: any) {
      console.error('Error adding composition:', error)
      toast({
        title: "Error Sending to KRA",
        description: error.message || "Failed to inform KRA about composition",
        variant: "destructive",
      })
    } finally {
      setSavingComposition(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KRA Test Recipes</h1>
              <p className="text-gray-600 dark:text-gray-400">Inform KRA about item compositions</p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search registered items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
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
            </CardContent>
          </Card>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading registered items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No registered items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCompositionDialog(item)}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Inform KRA
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{formatCurrency(item.cost_per_unit)}</span>
                        <Badge variant="outline">{item.unit}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Stock: {item.current_stock || 0} {item.unit}</p>
                        <p className="text-xs font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mt-1">
                          KRA: {item.item_cd}
                        </p>
                        {item.kra_status && (
                          <Badge 
                            variant={item.kra_status === 'success' ? 'default' : 
                                   item.kra_status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            KRA: {item.kra_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Composition Dialog */}
          <Dialog open={showCompositionDialog} onOpenChange={setShowCompositionDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Inform KRA about {selectedItem?.name} composition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Composition Item</Label>
                  <Select onValueChange={(value) => {
                    const item = items.find(i => i.id === value)
                    setSelectedCompositionItem(item || null)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a composition item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.filter(item => item.id !== selectedItem?.id).map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.category}) - {formatCurrency(item.cost_per_unit)}/{item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={compositionQuantity}
                    onChange={(e) => setCompositionQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                {selectedCompositionItem && compositionQuantity && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm">
                      <span className="font-semibold">Informing KRA:</span>
                    </p>
                    <p className="text-sm">
                      {selectedItem?.name} contains {compositionQuantity} {selectedCompositionItem.unit} of {selectedCompositionItem.name}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={addCompositionToItem} 
                    className="flex-1"
                    disabled={savingComposition}
                  >
                    {savingComposition ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending to KRA...
                      </>
                    ) : (
                      'Send to KRA'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCompositionDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
} 