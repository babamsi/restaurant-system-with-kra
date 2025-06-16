"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Eye,
  Clock,
  Users,
  TrendingUp,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Zap,
  ChefHat,
  Package,
  Activity,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  X,
  Upload,
  Search,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompleteKitchenStore } from "@/stores/complete-kitchen-store"
import { useCompleteInventoryStore } from "@/stores/complete-inventory-store"
import { useKitchenStore, type Batch, type BatchIngredient, type KitchenStorage } from "@/stores/kitchen-store"
import { useSynchronizedInventoryStore } from "@/stores/synchronized-inventory-store"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Recipe } from "@/types/operational"
import type { BaseIngredient as OperationalIngredient } from "@/types/operational"
import type { BaseIngredient as UnifiedIngredient } from "@/types/unified-system"
import { predefinedBatches, type PredefinedBatch } from "@/stores/predefined-batches"
import type { Recipe, BatchPreparation } from "@/types/unified-system"

interface ExtendedIngredient extends UnifiedIngredient {
  available_quantity: number;
  is_sellable_individually: boolean;
  unit: string;
}

interface KitchenStorageItem {
  ingredientId: string;
  quantity: number;
  unit: string;
}

interface BatchIngredient {
  ingredientId: string;
  requiredQuantity: number;
  unit: string;
  status: "low" | "available" | "missing";
  isBatch?: boolean;
  batchName?: string;
}

interface Batch {
  id: string;
  name: string;
  ingredients: BatchIngredient[];
  status: "preparing" | "ready" | "completed" | "finished";
  notes?: string;
  startTime: string;
  endTime?: string;
  yield?: number;
  yieldUnit?: string;
  portions?: number;
}

interface SystemLog {
  id: string;
  timestamp: string;
  type: "storage" | "batch";
  action: string;
  details: string;
  status: "success" | "error" | "info";
}

export function CorrectedKitchenManager() {
  const { toast } = useToast()
  const { ingredients: inventoryIngredients, updateStock } = useSynchronizedInventoryStore()
  
  // Kitchen store
  const {
    storage,
    batches,
    addToStorage,
    removeFromStorage,
    createBatch,
    checkStorageLevels,
    requestIngredients,
    updateBatchStatus,
  } = useKitchenStore()

  // Complete kitchen store
  const {
    recipes,
    addRecipe,
    publishRecipe,
    unpublishRecipe,
    prepareBatch,
    getPublishedRecipes,
    canMakeBatch,
    calculateNutritionForRecipe,
  } = useCompleteKitchenStore()

  // ✅ FIXED: Direct subscription to live Zustand state - NO destructuring
  const ingredients = useCompleteInventoryStore((state) => state.ingredients)
  const lastUpdated = useCompleteInventoryStore((state) => state.lastUpdated)
  const markAsCooked = useCompleteInventoryStore((state) => state.markAsCooked)

  // State declarations
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [showBatchIngredientsDialog, setShowBatchIngredientsDialog] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<BatchIngredient[]>([])
  const [newBatch, setNewBatch] = useState<{
    name: string;
    yield: string;
    yieldUnit: string;
    portions: string;
    ingredients: BatchIngredient[];
  }>({
    name: "",
    yield: "",
    yieldUnit: "g",
    portions: "",
    ingredients: []
  })
  const [requestedIngredient, setRequestedIngredient] = useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  } | null>(null)
  const [requestQuantity, setRequestQuantity] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false)
  const [selectedRecipeForBatch, setSelectedRecipeForBatch] = useState<any>(null)
  const [batchCount, setBatchCount] = useState(1)
  const [preparedBy, setPreparedBy] = useState("")
  const [showNewBatchDialog, setShowNewBatchDialog] = useState(false)
  const [newBatchName, setNewBatchName] = useState("")
  const [batchNotes, setBatchNotes] = useState("")
  const [showBatchDetailsDialog, setShowBatchDetailsDialog] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [showPredefinedBatches, setShowPredefinedBatches] = useState(false)

  // Get unique categories for filters
  const categories = Array.from(new Set(inventoryIngredients.map(i => i.category)))

  // Filter ingredients based on search and category
  const filteredIngredients = inventoryIngredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || ingredient.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Filter batches based on status
  const filteredBatches = batches.filter((batch: Batch) => {
    if (selectedStatus === "all") return true
    return batch.status === selectedStatus
  })

  // Calculate real-time stats from current ingredients
  const availableIngredients = ingredients.filter((ing) => (ing as ExtendedIngredient).available_quantity > 0)
  const sellableIngredients = ingredients.filter((ing) => (ing as ExtendedIngredient).is_sellable_individually)

  // Add function to create log entries
  const addSystemLog = (type: "storage" | "batch", action: string, details: string, status: "success" | "error" | "info" = "info") => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      action,
      details,
      status
    }
    setSystemLogs(prev => [newLog, ...prev])
  }

  // Update handleImportIngredients to include logging
  const handleImportIngredients = () => {
    if (selectedIngredients.length === 0) {
      addSystemLog("storage", "Import Failed", "No ingredients selected", "error")
      toast({
        title: "No Ingredients Selected",
        description: "Please select at least one ingredient to import.",
        variant: "destructive",
      })
      return
    }

    // Validate all quantities before proceeding
    const invalidImports = selectedIngredients.filter(ingredient => {
      const syncedIngredient = inventoryIngredients.find(i => i.id.toString() === ingredient.ingredientId)
      return !syncedIngredient || 
             syncedIngredient.available_quantity <= 0 || 
             ingredient.requiredQuantity <= 0 ||
             ingredient.requiredQuantity > syncedIngredient.available_quantity
    })

    if (invalidImports.length > 0) {
      const invalidNames = invalidImports.map(ing => {
        const syncedIngredient = inventoryIngredients.find(i => i.id.toString() === ing.ingredientId)
        return syncedIngredient?.name
      }).filter(Boolean).join(", ")

      toast({
        title: "Invalid Import",
        description: `Cannot import: ${invalidNames}. Please check stock availability.`,
        variant: "destructive",
      })
      return
    }

    // Process all valid imports
    selectedIngredients.forEach(ingredient => {
      const syncedIngredient = inventoryIngredients.find(i => i.id.toString() === ingredient.ingredientId)
      if (syncedIngredient) {
        addToStorage(ingredient.ingredientId, ingredient.requiredQuantity, syncedIngredient.unit)
        updateStock(ingredient.ingredientId, ingredient.requiredQuantity, "subtract", "kitchen-import")
        addSystemLog(
          "storage",
          "Import Success",
          `Imported ${ingredient.requiredQuantity} ${syncedIngredient.unit} of ${syncedIngredient.name}`,
          "success"
        )
      }
    })

    setShowImportDialog(false)
    setSelectedIngredients([])

    toast({
      title: "Ingredients Imported",
      description: "Selected ingredients have been imported to kitchen storage.",
    })
  }

  // ✅ DEBUG: Log when Kitchen component receives new data
  useEffect(() => {
    console.log("🍳 KITCHEN: Received", ingredients.length, "ingredients from Zustand")
    console.log(
      "🍳 KITCHEN: Ingredients list:",
      ingredients.map((i) => ({ id: i.id, name: i.name })),
    )
  }, [ingredients]) // ✅ CRITICAL: ingredients as dependency

  // ✅ DEBUG: Log lastUpdated changes
  useEffect(() => {
    console.log("🍳 KITCHEN: Last updated timestamp:", lastUpdated)
  }, [lastUpdated])

  // ✅ ADDED: useEffect to validate inventory sync on mount and updates
  // useEffect(() => {
  //   console.log(`🔄 Kitchen: Inventory updated - ${ingredients.length} ingredients available`)
  // }, [ingredients.length, lastUpdated])

  // Real-time sync state
  // const [syncStatus, setSyncStatus] = useState<"synced" | "syncing">("synced")

  // ✅ ADDED: Effect to monitor real-time changes
  // useEffect(() => {
  //   setSyncStatus("syncing")
  //   const timer = setTimeout(() => setSyncStatus("synced"), 300)
  //   return () => clearTimeout(timer)
  // }, [ingredients])

  const [newRecipe, setNewRecipe] = useState({
    name: "",
    category: "",
    description: "",
    yield_per_batch: 10,
    markup_percentage: 50,
    prep_time_minutes: 15,
    selling_price: 0,
  })

  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([])

  const addIngredientToRecipe = () => {
    const newIngredient = {
      ingredient_id: 0,
      ingredient_name: "",
      quantity_needed: 0,
      unit: "",
      cost_per_unit: 0,
      total_cost: 0,
    }
    setRecipeIngredients([...recipeIngredients, newIngredient])
  }

  const updateRecipeIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeIngredients]

    if (field === "ingredient_id") {
      const selectedIngredient = ingredients.find((ing) => ing.id === Number.parseInt(value))
      if (selectedIngredient) {
        updated[index] = {
          ...updated[index],
          ingredient_id: selectedIngredient.id,
          ingredient_name: selectedIngredient.name,
          unit: selectedIngredient.unit,
          cost_per_unit: selectedIngredient.cost_per_unit,
          total_cost: (updated[index].quantity_needed || 0) * selectedIngredient.cost_per_unit,
        }
      }
    } else if (field === "quantity_needed") {
      const quantity = Number.parseFloat(value) || 0
      updated[index] = {
        ...updated[index],
        [field]: quantity,
        total_cost: quantity * (updated[index].cost_per_unit || 0),
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    setRecipeIngredients(updated)
  }

  const removeIngredientFromRecipe = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  const calculateRecipeCosts = () => {
    const totalRawCost = recipeIngredients.reduce((sum, ing) => sum + ing.total_cost, 0)
    const costPerPortion = totalRawCost / newRecipe.yield_per_batch
    const sellingPrice = newRecipe.selling_price || costPerPortion * (1 + newRecipe.markup_percentage / 100)

    return {
      totalRawCost,
      costPerPortion,
      sellingPrice,
    }
  }

  const saveRecipe = () => {
    if (!newRecipe.name || !newRecipe.category || recipeIngredients.length === 0) {
      toast({
        title: "Incomplete Recipe",
        description: "Please fill in all required fields and add at least one ingredient",
        variant: "destructive",
      })
      return
    }

    const costs = calculateRecipeCosts()
    const nutrition = calculateNutritionForRecipe(
      recipeIngredients.map((ing) => {
        const ingredient = ingredients.find((i) => i.id === ing.ingredient_id)
        return {
          ...ing,
          nutrition_per_unit: ingredient?.nutrition_per_unit || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sodium: 0,
          },
        }
      }),
    )

    const recipe = {
      name: newRecipe.name,
      category: newRecipe.category,
      description: newRecipe.description,
      yield_per_batch: newRecipe.yield_per_batch,
      prep_time_minutes: newRecipe.prep_time_minutes,
      ingredients: recipeIngredients,
      total_raw_cost: costs.totalRawCost,
      selling_price: newRecipe.selling_price,
      markup_percentage: newRecipe.markup_percentage,
      is_published: false,
      nutrition_per_portion: nutrition,
      available_portions: newRecipe.yield_per_batch,
    }

    const savedRecipe = addRecipe(recipe)

    // Reset form
    setNewRecipe({
      name: "",
      category: "",
      description: "",
      yield_per_batch: 10,
      markup_percentage: 50,
      prep_time_minutes: 15,
      selling_price: 0,
    })
    setRecipeIngredients([])
    setIsCreatingRecipe(false)

    toast({
      title: "Recipe Created Successfully!",
      description: `${savedRecipe.name} has been saved. Prepare a batch to make it available for sale.`,
    })
  }

  const handlePublishRecipe = (recipeId: number) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    if (recipe.available_portions === 0) {
      toast({
        title: "Cannot Publish Recipe",
        description: "Please prepare at least one batch before publishing to POS.",
        variant: "destructive",
      })
      return
    }

    publishRecipe(recipeId)

    toast({
      title: "Recipe Published!",
      description: "Recipe is now available in the POS system for ordering.",
    })
  }

  const handleUnpublishRecipe = (recipeId: number) => {
    unpublishRecipe(recipeId)

    toast({
      title: "Recipe Unpublished",
      description: "Recipe has been removed from the POS system.",
    })
  }

  const handlePrepareBatch = () => {
    if (!selectedRecipeForBatch || !preparedBy.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a recipe and enter who prepared the batch.",
        variant: "destructive",
      })
      return
    }

    if (!canMakeBatch(selectedRecipeForBatch.id, batchCount)) {
      toast({
        title: "Insufficient Ingredients",
        description: "Not enough ingredients in stock to prepare this batch.",
        variant: "destructive",
      })
      return
    }

    prepareBatch(selectedRecipeForBatch.id, batchCount, preparedBy)

    toast({
      title: "Batch Prepared Successfully!",
      description: `${batchCount} batch(es) of ${selectedRecipeForBatch.name} prepared. ${
        selectedRecipeForBatch.yield_per_batch * batchCount
      } portions now available.`,
    })

    setShowBatchDialog(false)
    setSelectedRecipeForBatch(null)
    setBatchCount(1)
    setPreparedBy("")
  }

  const handleMarkAsCooked = (ingredientId: number, isCooked: boolean) => {
    markAsCooked(ingredientId, isCooked)

    const ingredient = ingredients.find((ing) => ing.id === ingredientId)
    toast({
      title: isCooked ? "Marked as Cooked" : "Marked as Raw",
      description: `${ingredient?.name} is now ${isCooked ? "available for individual sale" : "not available for sale"}.`,
    })
  }

  const getRecipeStatus = (recipe: any) => {
    if (!recipe.is_published && recipe.available_portions === 0) {
      return { status: "Draft", variant: "secondary" as const, icon: AlertCircle }
    } else if (!recipe.is_published && recipe.available_portions > 0) {
      return { status: "Ready to Publish", variant: "outline" as const, icon: CheckCircle }
    } else if (recipe.is_published && recipe.available_portions === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: AlertCircle }
    } else if (recipe.is_published && recipe.available_portions <= 5) {
      return {
        status: "Low Stock",
        variant: "outline" as const,
        className: "text-amber-500 border-amber-500",
        icon: AlertCircle,
      }
    } else {
      return { status: "Published", variant: "default" as const, icon: CheckCircle }
    }
  }

  const costs = calculateRecipeCosts()

  // Add localStorage persistence
  useEffect(() => {
    // Load data from localStorage on component mount
    const savedStorage = localStorage.getItem('kitchenStorage')
    const savedBatches = localStorage.getItem('kitchenBatches')
    
    if (savedStorage) {
      const parsedStorage = JSON.parse(savedStorage)
      parsedStorage.forEach((item: any) => {
        if (!storage.find(s => s.ingredientId === item.ingredientId)) {
          addToStorage(item.ingredientId, item.quantity, item.unit)
        }
      })
    }
    
    if (savedBatches) {
      const parsedBatches = JSON.parse(savedBatches)
      parsedBatches.forEach((batch: any) => {
        if (!batches.find(b => b.id === batch.id)) {
          createBatch(batch.name, batch.ingredients, batch.notes)
        }
      })
    }
  }, []) // Empty dependency array means this runs once on mount

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kitchenStorage', JSON.stringify(storage))
  }, [storage])

  useEffect(() => {
    localStorage.setItem('kitchenBatches', JSON.stringify(batches))
  }, [batches])

  const getIngredientName = (ingredientId: string, isBatch?: boolean) => {
    if (isBatch) {
      // For batch ingredients, find the batch name
      const batch = batches.find(b => b.id === ingredientId)
      return batch ? `${batch.name} (Batch)` : "Unknown Batch"
    }

    // For regular ingredients, try to find in inventory ingredients
    const inventoryIngredient = inventoryIngredients.find(i => i.id.toString() === ingredientId)
    if (inventoryIngredient) return inventoryIngredient.name

    // If not found in inventory, try in complete ingredients
    const completeIngredient = ingredients.find(i => i.id.toString() === ingredientId)
    if (completeIngredient) return completeIngredient.name

    return "Unknown Ingredient"
  }

  const handleRequestMore = (item: KitchenStorage) => {
    const { ingredients: syncedIngredients } = useSynchronizedInventoryStore.getState()
    const syncedIngredient = syncedIngredients.find(i => i.id.toString() === item.ingredientId)

    if (!syncedIngredient) return

    if (syncedIngredient.available_quantity <= 0) {
      addSystemLog(
        "storage",
        "Request Failed",
        `Failed to request more ${syncedIngredient.name}:
        - Current stock: ${syncedIngredient.available_quantity} ${syncedIngredient.unit}
        - Status: Out of stock`,
        "error"
      )
      toast({
        title: "No Stock Available",
        description: "This ingredient is out of stock in the main inventory.",
        variant: "destructive",
      })
      return
    }

    // Log the request initiation
    addSystemLog(
      "storage",
      "Request Initiated",
      `Initiating request for ${syncedIngredient.name}:
      - Current kitchen stock: ${item.quantity} ${item.unit}
      - Available in main inventory: ${syncedIngredient.available_quantity} ${syncedIngredient.unit}`,
      "info"
    )

    setSelectedIngredients([{
      ingredientId: item.ingredientId,
      requiredQuantity: 1,
      unit: item.unit,
      status: "available"
    }])
    setRequestQuantity("")
    setShowRequestDialog(true)
  }

  const handleConfirmRequest = () => {
    if (selectedIngredients.length === 0) {
      addSystemLog(
        "storage",
        "Request Failed",
        "No ingredients selected for request",
        "error"
      )
      toast({
        title: "Missing Information",
        description: "Please select at least one ingredient to request.",
        variant: "destructive",
      })
      return
    }

    // Get the synchronized inventory store state
    const { ingredients: syncedIngredients, updateStock } = useSynchronizedInventoryStore.getState()

    // Validate all quantities before proceeding
    const invalidImports = selectedIngredients.filter(ingredient => {
      const syncedIngredient = syncedIngredients.find(i => i.id.toString() === ingredient.ingredientId)
      return !syncedIngredient || 
             syncedIngredient.available_quantity <= 0 || 
             !requestQuantity ||
             parseFloat(requestQuantity) <= 0 ||
             parseFloat(requestQuantity) > syncedIngredient.available_quantity
    })

    if (invalidImports.length > 0) {
      const invalidNames = invalidImports.map(ing => {
        const syncedIngredient = syncedIngredients.find(i => i.id.toString() === ing.ingredientId)
        return syncedIngredient?.name
      }).filter(Boolean).join(", ")

      toast({
        title: "Invalid Import",
        description: `Cannot import: ${invalidNames}. Please check stock availability.`,
        variant: "destructive",
      })
      return
    }

    // Log the request details
    selectedIngredients.forEach(ingredient => {
      const syncedIngredient = syncedIngredients.find(i => i.id.toString() === ingredient.ingredientId)
      if (syncedIngredient) {
        const storageItem = storage.find(s => s.ingredientId === ingredient.ingredientId)
        addSystemLog(
          "storage",
          "Request Processed",
          `Requested ${requestQuantity} ${syncedIngredient.unit} of ${syncedIngredient.name}:
          - Previous kitchen stock: ${storageItem?.quantity || 0} ${storageItem?.unit}
          - New kitchen stock: ${(storageItem?.quantity || 0) + parseFloat(requestQuantity)} ${storageItem?.unit}
          - Previous main inventory: ${syncedIngredient.available_quantity} ${syncedIngredient.unit}
          - New main inventory: ${syncedIngredient.available_quantity - parseFloat(requestQuantity)} ${syncedIngredient.unit}`,
          "success"
        )
      }
    })

    // Process all valid imports
    selectedIngredients.forEach(ingredient => {
      const syncedIngredient = syncedIngredients.find(i => i.id.toString() === ingredient.ingredientId)
      if (syncedIngredient) {
        // Add to kitchen storage with the requested quantity
        addToStorage(ingredient.ingredientId, parseFloat(requestQuantity), syncedIngredient.unit)
        
        // Update main inventory
        updateStock(ingredient.ingredientId, parseFloat(requestQuantity), "subtract", "kitchen-request")
      }
    })

    setShowRequestDialog(false)
    setSelectedIngredients([])
    setRequestQuantity("")

    toast({
      title: "Request Processed",
      description: `Successfully requested ${requestQuantity} ${selectedIngredients[0]?.unit || "units"} of ${selectedIngredients.map(ing => {
        const syncedIngredient = syncedIngredients.find(i => i.id.toString() === ing.ingredientId)
        return syncedIngredient?.name
      }).filter(Boolean).join(", ")}`,
    })
  }

  const handleAddIngredientToBatch = (ingredientId: string, requiredQuantity: number, unit: string) => {
    const newIngredient: Batch["ingredients"][0] = {
      ingredientId,
      requiredQuantity,
      unit,
      status: "available"
    }
    setSelectedIngredients([...selectedIngredients, newIngredient])
  }

  // Update the handleCreateBatch function to handle predefined batches
  const handleCreateBatch = () => {
    if (!newBatchName || 
        selectedIngredients.length === 0 || 
        !newBatch.portions || !newBatch.yield ||
        parseFloat(newBatch.portions) < 1 || parseFloat(newBatch.yield) < 1) {
      addSystemLog(
        "batch",
        "Batch Creation Failed",
        `Failed to create batch "${newBatchName}" due to missing information:
        - Name: ${newBatchName || 'missing'}
        - Yield: ${newBatch.yield || 'missing'}
        - Portions: ${newBatch.portions || 'missing'}
        - Ingredients: ${selectedIngredients.length === 0 ? 'none selected' : selectedIngredients.length + ' selected'}`,
        "error"
      )
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one ingredient.",
        variant: "destructive",
      })
      return
    }

    // Validate all ingredients are available in sufficient quantities
    const invalidIngredients = selectedIngredients.filter(ing => {
      if (ing.isBatch) {
        // For batch ingredients, check if the batch exists and has enough portions
        const batch = batches.find(b => b.id === ing.ingredientId)
        return !batch || !batch.portions || batch.portions < ing.requiredQuantity
      } else {
        // For regular ingredients, check kitchen storage
        const kitchenItem = storage.find(item => item.ingredientId === ing.ingredientId)
        return !kitchenItem || ing.requiredQuantity > kitchenItem.quantity
      }
    })

    if (invalidIngredients.length > 0) {
      const invalidNames = invalidIngredients.map(ing => {
        if (ing.isBatch) {
          const batch = batches.find(b => b.id === ing.ingredientId)
          return batch?.name
        } else {
          const ingredient = inventoryIngredients.find(i => i.id.toString() === ing.ingredientId)
          return ingredient?.name
        }
      }).filter(Boolean).join(", ")

      toast({
        title: "Insufficient Ingredients",
        description: `Not enough quantity available for: ${invalidNames}`,
        variant: "destructive",
      })
      return
    }

    // First, deduct portions from source batches and update their status
    selectedIngredients.forEach(ing => {
      if (ing.isBatch) {
        const sourceBatch = batches.find(b => b.id === ing.ingredientId)
        if (sourceBatch && sourceBatch.portions) {
          // Calculate new portions
          const newPortions = sourceBatch.portions - ing.requiredQuantity
          
          // Update the source batch in the store
          const updatedBatch: Batch = {
            ...sourceBatch,
            portions: newPortions,
            // If no portions left, mark as completed
            status: newPortions <= 0 ? "completed" : sourceBatch.status
          }

          // Update the batch in the store
          const updatedBatches = batches.map(b => 
            b.id === sourceBatch.id ? updatedBatch : b
          )

          // Update localStorage
          localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches))

          // Update the store state
          useKitchenStore.setState({ batches: updatedBatches })

          // Log the batch update
          addSystemLog(
            "batch",
            "Batch Updated",
            `Updated batch "${sourceBatch.name}":
            - Previous portions: ${sourceBatch.portions}
            - New portions: ${newPortions}
            - Status: ${updatedBatch.status}`,
            "info"
          )
        }
      }
    })

    // Create the new batch
    createBatch(newBatchName, selectedIngredients, batchNotes, {
      yield: parseFloat(newBatch.yield),
      yieldUnit: newBatch.yieldUnit,
      portions: parseFloat(newBatch.portions)
    })

    // Deduct regular ingredients from storage
    selectedIngredients.forEach(ing => {
      if (!ing.isBatch) {
        removeFromStorage(ing.ingredientId, ing.requiredQuantity)
        
        // Log the storage deduction
        const ingredient = inventoryIngredients.find(i => i.id.toString() === ing.ingredientId)
        if (ingredient) {
          const storageItem = storage.find(s => s.ingredientId === ing.ingredientId)
          addSystemLog(
            "storage",
            "Storage Deducted",
            `Deducted ${ing.requiredQuantity} ${ing.unit} of ${ingredient.name}
            - Previous quantity: ${storageItem?.quantity || 0}
            - New quantity: ${(storageItem?.quantity || 0) - ing.requiredQuantity}
            - Unit: ${ing.unit}`,
            "info"
          )
        }
      }
    })

    // Reset form
    setNewBatchName("")
    setSelectedIngredients([])
    setBatchNotes("")
    setShowNewBatchDialog(false)

    // Log successful creation
    addSystemLog(
      "batch",
      "Batch Created",
      `Successfully created batch "${newBatchName}" with:
      - Yield: ${newBatch.yield} ${newBatch.yieldUnit}
      - Portions: ${newBatch.portions}
      - Ingredients: ${selectedIngredients.map(ing => 
        `${getIngredientName(ing.ingredientId, ing.isBatch)} (${ing.requiredQuantity} ${ing.isBatch ? 'portions' : ing.unit})`
      ).join(', ')}
      - Notes: ${batchNotes || 'none'}`,
      "success"
    )

    toast({
      title: "Batch Created",
      description: "New batch has been created and ingredients have been deducted.",
    })
  }

  const getBatchStatusBadge = (batch: Batch) => {
    switch (batch.status) {
      case "preparing":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "finished":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Finished
          </Badge>
        )
      default:
        return null
    }
  }

  const getIngredientStatusBadge = (status: "available" | "low" | "missing") => {
    switch (status) {
      case "available":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low Stock
          </Badge>
        )
      case "missing":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Missing
          </Badge>
        )
    }
  }

  const getStorageStatusBadge = (item: KitchenStorage) => {
    // First try to find in inventory ingredients
    const inventoryIngredient = inventoryIngredients.find(i => i.id.toString() === item.ingredientId)
    if (!inventoryIngredient) return null

    // Get the threshold from the inventory ingredient
    const threshold = inventoryIngredient.threshold || 5 // Default threshold of 5 if not specified

    if (item.quantity <= 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Missing
        </Badge>
      )
    } else if (item.quantity <= threshold) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Available
        </Badge>
      )
    }
  }

  // Add a function to check if any items are low in stock
  const hasLowStockItems = () => {
    return storage.some(item => {
      const inventoryIngredient = inventoryIngredients.find(i => i.id.toString() === item.ingredientId)
      if (!inventoryIngredient) return false
      const threshold = inventoryIngredient.threshold || 5
      return item.quantity > 0 && item.quantity <= threshold
    })
  }

  // Add a function to get low stock items
  const getLowStockItems = () => {
    return storage.filter(item => {
      const inventoryIngredient = inventoryIngredients.find(i => i.id.toString() === item.ingredientId)
      if (!inventoryIngredient) return false
      const threshold = inventoryIngredient.threshold || 5
      return item.quantity > 0 && item.quantity <= threshold
    })
  }

  // Update the handleCheckStorageLevels function to include low stock check
  const handleCheckStorageLevels = () => {
    checkStorageLevels()
    const lowStockItems = getLowStockItems()
    
    if (lowStockItems.length > 0) {
      const lowStockNames = lowStockItems.map(item => {
        const ingredient = inventoryIngredients.find(i => i.id.toString() === item.ingredientId)
        return `${ingredient?.name} (${item.quantity} ${item.unit})`
      }).join(", ")

      toast({
        title: "Low Stock Alert",
        description: `The following items are running low: ${lowStockNames}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Storage Levels Checked",
        description: "All items are well stocked.",
      })
    }
  }

  // Update handleUpdateBatchStatus to include more detailed logging
  const handleUpdateBatchStatus = (batchId: string, newStatus: Batch["status"]) => {
    const batch = batches.find(b => b.id === batchId)
    if (batch) {
      // Log the status change with detailed information
      addSystemLog(
        "batch",
        "Status Update",
        `Batch "${batch.name}" status changed from ${batch.status} to ${newStatus}
        - Current yield: ${batch.yield || 0} ${batch.yieldUnit || 'g'}
        - Current portions: ${batch.portions || 0}
        - Start time: ${format(new Date(batch.startTime), "MMM d, yyyy HH:mm")}
        ${batch.endTime ? `- End time: ${format(new Date(batch.endTime), "MMM d, yyyy HH:mm")}` : ''}`,
        "info"
      )
    }
    updateBatchStatus(batchId, newStatus)
    setShowBatchDetailsDialog(false)
    toast({
      title: "Batch Status Updated",
      description: `Batch has been marked as ${newStatus}.`,
    })
  }

  // Add new function to handle batch restock
  const handleRestockBatch = (batch: Batch) => {
    // Log the restock initiation
    addSystemLog(
      "batch",
      "Batch Restock Initiated",
      `Restocking batch "${batch.name}":
      - Current portions: ${batch.portions || 0}
      - Target portions: ${(batch.portions || 0) + (batch.portions || 0)}
      - Current yield: ${batch.yield || 0} ${batch.yieldUnit || 'g'}`,
      "info"
    )

    // Update the batch with doubled portions
    const updatedBatch = {
      ...batch,
      portions: (batch.portions || 0) + (batch.portions || 0),
      status: "preparing"
    }

    // Update the batch in the store
    const updatedBatches = batches.map(b => 
      b.id === batch.id ? updatedBatch : b
    )

    // Update localStorage
    localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches))

    // Update the store state
    useKitchenStore.setState({ batches: updatedBatches })

    // Log successful restock
    addSystemLog(
      "batch",
      "Batch Restocked",
      `Successfully restocked batch "${batch.name}":
      - New portions: ${updatedBatch.portions}
      - Status: ${updatedBatch.status}`,
      "success"
    )

    toast({
      title: "Batch Restocked",
      description: `${batch.name} has been restocked with ${batch.portions} additional portions.`,
    })
  }

  // Update the batch details dialog content
  const renderBatchDetails = (batch: Batch) => {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Batch Name</Label>
            <p className="font-medium">{batch.name}</p>
            </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div>{getBatchStatusBadge(batch)}</div>
          </div>
          <div className="space-y-2">
            <Label>Yield</Label>
            <p>{batch.yield || 0} {batch.yieldUnit || 'g'}</p>
        </div>
          <div className="space-y-2">
            <Label>Portions</Label>
            <p>{batch.portions || 0}</p>
                    </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <p>{format(new Date(batch.startTime), "MMM d, yyyy HH:mm")}</p>
                    </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <p>{batch.endTime ? format(new Date(batch.endTime), "MMM d, yyyy HH:mm") : "-"}</p>
                    </div>
                    </div>

        <div className="space-y-4">
          <Label>Ingredients</Label>
          <div className="space-y-2">
            {batch.ingredients.map((ingredient) => (
              <div 
                key={ingredient.ingredientId}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                    <div>
                  <p className="font-medium">
                    {getIngredientName(ingredient.ingredientId, ingredient.isBatch)}
                    {ingredient.isBatch && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Batch
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ingredient.requiredQuantity} {ingredient.isBatch ? 'portions' : ingredient.unit}
                  </p>
                    </div>
                    </div>
            ))}
                    </div>
                  </div>

        {batch.notes && (
          <div className="space-y-2">
            <Label>Notes</Label>
            <p className="text-sm text-muted-foreground">{batch.notes}</p>
                  </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBatchDetailsDialog(false)}>
            Close
          </Button>
          {batch.status === "preparing" && (
            <Button
              onClick={() => handleUpdateBatchStatus(batch.id, "ready")}
              className="bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Ready
            </Button>
          )}
          {batch.status === "ready" && (
            <Button 
              onClick={() => handleUpdateBatchStatus(batch.id, "completed")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          )}
          {batch.status === "completed" && (
            <Button
              onClick={() => handleRestockBatch(batch)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restock Batch
            </Button>
          )}
        </DialogFooter>
                      </div>
    )
  }

  const handleDeleteBatch = (batch: Batch) => {
    setBatchToDelete(batch)
    setShowDeleteConfirmDialog(true)
  }

  const confirmDeleteBatch = () => {
    if (!batchToDelete) return

    // Log the batch details before deletion
    addSystemLog(
      "batch",
      "Batch Deletion",
      `Deleting batch "${batchToDelete.name}" with:
      - Status: ${batchToDelete.status}
      - Yield: ${batchToDelete.yield || 0} ${batchToDelete.yieldUnit || 'g'}
      - Portions: ${batchToDelete.portions || 0}
      - Ingredients: ${batchToDelete.ingredients.map(ing => 
        `${getIngredientName(ing.ingredientId, ing.isBatch)} (${ing.requiredQuantity} ${ing.isBatch ? 'portions' : ing.unit})`
      ).join(', ')}`,
      "info"
    )

    // Remove the batch from localStorage
    const updatedBatches = batches.filter(b => b.id !== batchToDelete.id)
    localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches))

    // Update the batches state using the store's method
    const { batches: currentBatches } = useKitchenStore.getState()
    const updatedBatchesList = currentBatches.filter(b => b.id !== batchToDelete.id)
    useKitchenStore.setState({ batches: updatedBatchesList })

    setShowDeleteConfirmDialog(false)
    setBatchToDelete(null)

    // Log successful deletion
    addSystemLog(
      "batch",
      "Batch Deleted",
      `Successfully deleted batch "${batchToDelete.name}"`,
      "success"
    )

    toast({
      title: "Batch Deleted",
      description: `${batchToDelete.name} has been deleted successfully.`,
    })
  }

  // Add function to handle starting a new batch from a completed one
  const handleStartNewBatch = (batch: Batch) => {
    // Create a new batch with the same ingredients
    createBatch(`${batch.name} (New)`, batch.ingredients, batch.notes, {
      yield: batch.yield || 0,
      yieldUnit: batch.yieldUnit || 'g',
      portions: batch.portions || 0
    })

    // Mark the original batch as finished
    updateBatchStatus(batch.id, "finished")

    toast({
      title: "New Batch Started",
      description: `Started preparing a new batch based on ${batch.name}`,
    })
  }

  // Add function to initialize predefined batches
  const initializePredefinedBatches = () => {
    const initialized = localStorage.getItem('predefinedBatchesInitialized')
    if (!initialized) {
      predefinedBatches.forEach(batch => {
        const ingredients: BatchIngredient[] = batch.ingredients.map(ing => ({
          ingredientId: ing.id,
          requiredQuantity: ing.quantity,
          unit: ing.unit,
          status: "available",
          isBatch: false
        }))

        createBatch(batch.name, ingredients, undefined, {
          yield: batch.yield,
          yieldUnit: batch.yieldUnit,
          portions: batch.portions
        })
      })

      localStorage.setItem('predefinedBatchesInitialized', 'true')
    }
  }

  // Add useEffect to initialize predefined batches
  useEffect(() => {
    initializePredefinedBatches()
  }, [])

  // Add function to render predefined batches
  const renderPredefinedBatches = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predefinedBatches.map((batch) => (
          <div
            key={batch.name}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setNewBatchName(batch.name)
              setSelectedIngredients(
                batch.ingredients.map(ing => ({
                  ingredientId: ing.id,
                  requiredQuantity: ing.quantity,
                  unit: ing.unit,
                  status: "available",
                  isBatch: false
                }))
              )
              setNewBatch({
                yield: batch.yield.toString(),
                yieldUnit: batch.yieldUnit,
                portions: batch.portions.toString()
              })
              setShowPredefinedBatches(false)
            }}
          >
            <h3 className="font-semibold">{batch.name}</h3>
            <p className="text-sm text-gray-600">
              Yield: {batch.yield} {batch.yieldUnit}
            </p>
            <p className="text-sm text-gray-600">
              Portions: {batch.portions}
            </p>
            <div className="mt-2">
              <h4 className="text-sm font-medium">Ingredients:</h4>
              <ul className="text-sm text-gray-600">
                {batch.ingredients.map((ing) => (
                  <li key={ing.id}>
                    {ing.name}: {ing.quantity} {ing.unit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Update the new batch dialog to include predefined batches
  const renderNewBatchDialog = () => {
    return (
      <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showPredefinedBatches ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Select a Predefined Batch</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowPredefinedBatches(false)}
                  >
                    Create Custom Batch
                  </Button>
                </div>
                {renderPredefinedBatches()}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Create Custom Batch</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowPredefinedBatches(true)}
                  >
                    Use Predefined Batch
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-name">Batch Name</Label>
                    <Input
                      id="batch-name"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      placeholder="Enter batch name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-yield">Yield</Label>
                    <div className="flex gap-2">
                      <Input
                        id="batch-yield"
                        type="number"
                        min="1"
                        value={newBatch.yield}
                        onChange={(e) => {
                          const value = e.target.value
                          setNewBatch({ ...newBatch, yield: value })
                        }}
                        placeholder="Total yield"
                        className="flex-1"
                      />
                      <Select
                        value={newBatch.yieldUnit}
                        onValueChange={(value) => setNewBatch({ ...newBatch, yieldUnit: value })}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Grams</SelectItem>
                          <SelectItem value="L">Liters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-portions">Portions</Label>
                    <Input
                      id="batch-portions"
                      type="number"
                      min="1"
                      value={newBatch.portions}
                      onChange={(e) => {
                        const value = e.target.value
                        setNewBatch({ ...newBatch, portions: value })
                      }}
                      placeholder="Number of portions"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Required Ingredients</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBatchIngredientsDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredients
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {selectedIngredients.map((ingredient) => {
                        const isBatch = ingredient.isBatch
                        const batch = isBatch ? batches.find(b => b.id === ingredient.ingredientId) : null
                        const kitchenItem = !isBatch ? storage.find(item => item.ingredientId === ingredient.ingredientId) : null
                        const availableQuantity = isBatch ? (batch?.portions || 0) : (kitchenItem?.quantity || 0)
                        
                        return (
                          <div 
                            key={`${isBatch ? 'batch-' : 'ingredient-'}${ingredient.ingredientId}`} 
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {isBatch ? batch?.name : getIngredientName(ingredient.ingredientId)}
                                {isBatch && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Batch
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Required: {ingredient.requiredQuantity} {isBatch ? 'portions' : ingredient.unit}
                                <span className="ml-2">
                                  (Available: {availableQuantity} {isBatch ? 'portions' : ingredient.unit})
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={ingredient.requiredQuantity || ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const newQuantity = value === "" ? 0 : parseFloat(value)
                                  if (newQuantity <= availableQuantity) {
                                    setSelectedIngredients(
                                      selectedIngredients.map((i) =>
                                        i.ingredientId === ingredient.ingredientId && i.isBatch === isBatch
                                          ? { ...i, requiredQuantity: newQuantity }
                                          : i
                                      )
                                    )
                                  }
                                }}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">
                                {isBatch ? 'portions' : ingredient.unit}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedIngredients(
                                    selectedIngredients.filter(
                                      (i) => i.ingredientId !== ingredient.ingredientId || i.isBatch !== isBatch
                                    )
                                  )
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                      {selectedIngredients.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2" />
                          <p>No ingredients selected</p>
                          <p className="text-sm">Click "Add Ingredients" to start</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-notes">Notes</Label>
                  <Textarea
                    id="batch-notes"
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="Add any special instructions or notes for this batch"
                    className="h-24"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBatchDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBatch}
              disabled={
                !newBatchName || 
                selectedIngredients.length === 0 || 
                !newBatch.portions || !newBatch.yield ||
                parseFloat(newBatch.portions) < 1 || parseFloat(newBatch.yield) < 1 ||
                selectedIngredients.some(ing => {
                  if (ing.isBatch) {
                    const batch = batches.find(b => b.id === ing.ingredientId)
                    return !batch || !batch.portions || batch.portions < ing.requiredQuantity
                  } else {
                    const kitchenItem = storage.find(item => item.ingredientId === ing.ingredientId)
                    return !kitchenItem || ing.requiredQuantity > kitchenItem.quantity
                  }
                })
              }
            >
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kitchen Management</h2>
          <p className="text-sm text-muted-foreground">
            Import ingredients from main inventory and manage batch preparation
                      </p>
                    </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Import Ingredients
          </Button>
          <Button onClick={() => setShowNewBatchDialog(true)}>
            <ChefHat className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>

      <Tabs defaultValue="storage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="storage">Kitchen Storage</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={handleCheckStorageLevels}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Levels
                </Button>
              </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                  {storage.map((item) => (
                    <TableRow key={item.ingredientId}>
                      <TableCell>{getIngredientName(item.ingredientId)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{getStorageStatusBadge(item)}</TableCell>
                            <TableCell>
                        {format(new Date(item.lastUpdated), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestMore(item)}
                        >
                          Request More
                        </Button>
                            </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Active Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {renderPredefinedBatches()}
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Yield</TableHead>
                      <TableHead>Portions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow 
                        key={batch.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedBatch(batch)
                          setShowBatchDetailsDialog(true)
                        }}
                      >
                        <TableCell className="font-medium">{batch.name}</TableCell>
                        <TableCell>{getBatchStatusBadge(batch)}</TableCell>
                            <TableCell>
                          {format(new Date(batch.startTime), "MMM d, yyyy HH:mm")}
                            </TableCell>
                        <TableCell>{batch.yield || 0} {batch.yieldUnit || 'g'}</TableCell>
                        <TableCell>{batch.portions || 0}</TableCell>
                            <TableCell>
                          <div className="flex items-center gap-2">
                            {batch.status === "preparing" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateBatchStatus(batch.id, "ready")
                                }}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {batch.status === "ready" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateBatchStatus(batch.id, "completed")
                                }}
                              >
                                Complete
                              </Button>
                            )}
                            {batch.status === "completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRestockBatch(batch)
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Restock
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteBatch(batch)
                              }}
                            >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
                </TabsContent>

        <TabsContent value="logs">
                  <Card>
                    <CardHeader>
              <CardTitle>System Logs</CardTitle>
                    </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSystemLogs([])}
                    >
                      Clear Logs
                    </Button>
                        </div>
                        </div>
                <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-2">
                    {systemLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          log.status === "error"
                            ? "border-red-200 bg-red-50"
                            : log.status === "success"
                            ? "border-green-200 bg-green-50"
                            : "border-blue-200 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={log.type === "storage" ? "outline" : "default"}
                              className={
                                log.type === "storage"
                                  ? "text-blue-600 border-blue-600"
                                  : "bg-purple-600"
                              }
                            >
                              {log.type === "storage" ? "Storage" : "Batch"}
                            </Badge>
                            <span className="font-medium">{log.action}</span>
                        </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {log.details}
                        </p>
                      </div>
                    ))}
                    {systemLogs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2" />
                        <p>No system logs yet</p>
                        <p className="text-sm">Actions will be logged here</p>
                        </div>
                    )}
                  </div>
                </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

      {/* New Batch Dialog */}
      {renderNewBatchDialog()}

      {/* Import Ingredients Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Ingredients</DialogTitle>
            <DialogDescription>
              Select ingredients to import from the main inventory to kitchen storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                {inventoryIngredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center space-x-4">
                    <Checkbox
                      id={`ingredient-${ingredient.id}`}
                      checked={selectedIngredients.some(
                        (i) => i.ingredientId === ingredient.id.toString()
                      )}
                      disabled={ingredient.available_quantity <= 0}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedIngredients([
                            ...selectedIngredients,
                            {
                              ingredientId: ingredient.id.toString(),
                              requiredQuantity: 1,
                              unit: ingredient.unit,
                              status: "available"
                            },
                          ])
                        } else {
                          setSelectedIngredients(
                            selectedIngredients.filter(
                              (i) => i.ingredientId !== ingredient.id.toString()
                            )
                          )
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`ingredient-${ingredient.id}`}
                        className={ingredient.available_quantity <= 0 ? "text-muted-foreground" : ""}
                      >
                        {ingredient.name}
                      </Label>
                      <p className={`text-sm ${ingredient.available_quantity <= 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {ingredient.available_quantity <= 0 
                          ? "Out of stock" 
                          : `Available: ${ingredient.available_quantity} ${ingredient.unit}`}
                      </p>
        </div>
                    {selectedIngredients.some(i => i.ingredientId === ingredient.id.toString()) && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={selectedIngredients.find(i => i.ingredientId === ingredient.id.toString())?.requiredQuantity || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "" || (parseFloat(value) > 0 && parseFloat(value) <= ingredient.available_quantity)) {
                              setSelectedIngredients(
                                selectedIngredients.map(i =>
                                  i.ingredientId === ingredient.id.toString()
                                    ? { ...i, requiredQuantity: value === "" ? 0 : parseFloat(value) }
                                    : i
                                )
                              )
                            }
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{ingredient.unit}</span>
      </div>
                    )}
              </div>
                ))}
            </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportIngredients}
              disabled={selectedIngredients.length === 0}
            >
              Import Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request More Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Ingredients</DialogTitle>
            <DialogDescription>
              Specify the quantity you want to request from the main inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedIngredients.length > 0 && (
              <>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                    <p className="font-medium">Selected Ingredients</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {selectedIngredients.map((ingredient) => {
                        const syncedIngredient = inventoryIngredients.find(i => i.id.toString() === ingredient.ingredientId)
                        return (
                          <p key={ingredient.ingredientId}>
                            {syncedIngredient?.name} - Available: {syncedIngredient?.available_quantity || 0} {ingredient.unit}
                          </p>
                        )
                      })}
              </div>
            </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Quantity to Request</Label>
                    <span className="text-sm text-muted-foreground">
                      Available in main inventory: {selectedIngredients.reduce((sum, i) => {
                        const syncedIngredient = inventoryIngredients.find(ing => ing.id.toString() === i.ingredientId)
                        return sum + (syncedIngredient?.available_quantity || 0)
                      }, 0)} {selectedIngredients[0]?.unit || "unit"}
                    </span>
              </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={requestQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        const maxAvailable = selectedIngredients.reduce((sum, i) => {
                          const syncedIngredient = inventoryIngredients.find(ing => ing.id.toString() === i.ingredientId)
                          return sum + (syncedIngredient?.available_quantity || 0)
                        }, 0)
                        
                        // Allow any input but validate against max available
                        if (value === "" || parseFloat(value) <= maxAvailable) {
                          setRequestQuantity(value)
                        }
                      }}
                      placeholder={`Enter quantity in ${selectedIngredients[0]?.unit || "unit"}`}
                      className={requestQuantity && parseFloat(requestQuantity) > selectedIngredients.reduce((sum, i) => {
                        const syncedIngredient = inventoryIngredients.find(ing => ing.id.toString() === i.ingredientId)
                        return sum + (syncedIngredient?.available_quantity || 0)
                      }, 0) ? "border-red-500" : ""}
                    />
                    {requestQuantity && parseFloat(requestQuantity) > selectedIngredients.reduce((sum, i) => {
                      const syncedIngredient = inventoryIngredients.find(ing => ing.id.toString() === i.ingredientId)
                      return sum + (syncedIngredient?.available_quantity || 0)
                    }, 0) && (
                      <p className="text-sm text-red-500 mt-1">
                        Cannot request more than available in main inventory
                      </p>
                    )}
              </div>
            </div>
              </>
            )}
      </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
                      <Button
              onClick={handleConfirmRequest}
              disabled={
                !requestQuantity || 
                parseFloat(requestQuantity) <= 0 || 
                parseFloat(requestQuantity) > selectedIngredients.reduce((sum, i) => {
                  const syncedIngredient = inventoryIngredients.find(ing => ing.id.toString() === i.ingredientId)
                  return sum + (syncedIngredient?.available_quantity || 0)
                }, 0)
              }
            >
              Request
                      </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Ingredients Selection Dialog */}
      <Dialog open={showBatchIngredientsDialog} onOpenChange={setShowBatchIngredientsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
            <DialogTitle>Select Ingredients and Batches</DialogTitle>
            <DialogDescription>
              Select ingredients from kitchen storage or existing batches to use in this batch.
            </DialogDescription>
                            </DialogHeader>
          <div className="space-y-6">
            {/* Ingredients Section */}
                              <div className="space-y-4">
              <h3 className="font-medium">Kitchen Storage Ingredients</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-4">
                  {storage.map((item) => {
                    const inventoryIngredient = inventoryIngredients.find(i => i.id.toString() === item.ingredientId)
                    if (!inventoryIngredient) return null

                    return (
                      <div key={`storage-${item.ingredientId}`} className="flex items-center space-x-4">
                        <Checkbox
                          id={`ingredient-${item.ingredientId}`}
                          checked={selectedIngredients.some(
                            (i) => i.ingredientId === item.ingredientId && !i.isBatch
                          )}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedIngredients([
                                ...selectedIngredients,
                                {
                                  ingredientId: item.ingredientId,
                                  requiredQuantity: 1,
                                  unit: item.unit,
                                  status: "available",
                                  isBatch: false
                                },
                              ])
                            } else {
                              setSelectedIngredients(
                                selectedIngredients.filter(
                                  (i) => i.ingredientId !== item.ingredientId || i.isBatch
                                )
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`ingredient-${item.ingredientId}`}
                          >
                            {inventoryIngredient.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Available: {item.quantity} {item.unit}
                                      </p>
                                    </div>
                        {selectedIngredients.some(i => i.ingredientId === item.ingredientId && !i.isBatch) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={selectedIngredients.find(i => i.ingredientId === item.ingredientId && !i.isBatch)?.requiredQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                const newQuantity = value === "" ? 0 : parseFloat(value)
                                if (newQuantity <= item.quantity) {
                                  setSelectedIngredients(
                                    selectedIngredients.map(i =>
                                      i.ingredientId === item.ingredientId && !i.isBatch
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  )
                                }
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">{item.unit}</span>
                                  </div>
                        )}
                                    </div>
                    )
                  })}
                                  </div>
              </ScrollArea>
                                </div>

            {/* Existing Batches Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Available Batches</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-4">
                  {batches
                    .filter(batch => batch.status === "ready" && batch.portions && batch.portions > 0)
                    .map((batch) => (
                      <div key={`batch-${batch.id}`} className="flex items-center space-x-4">
                        <Checkbox
                          id={`batch-${batch.id}`}
                          checked={selectedIngredients.some(
                            (i) => i.ingredientId === batch.id && i.isBatch
                          )}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedIngredients([
                                ...selectedIngredients,
                                {
                                  ingredientId: batch.id,
                                  requiredQuantity: 1,
                                  unit: "batch",
                                  status: "available",
                                  isBatch: true,
                                  batchName: batch.name
                                },
                              ])
                            } else {
                              setSelectedIngredients(
                                selectedIngredients.filter(
                                  (i) => i.ingredientId !== batch.id || !i.isBatch
                                )
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`batch-${batch.id}`}
                            className="flex items-center gap-2"
                          >
                            <span>{batch.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {batch.portions || 0} portions
                            </Badge>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Yield: {batch.yield || 0} {batch.yieldUnit || 'g'}
                          </p>
                                </div>
                        {selectedIngredients.some(i => i.ingredientId === batch.id && i.isBatch) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={selectedIngredients.find(i => i.ingredientId === batch.id && i.isBatch)?.requiredQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                const newQuantity = value === "" ? 0 : parseInt(value)
                                if (newQuantity <= (batch.portions || 0)) {
                                  setSelectedIngredients(
                                    selectedIngredients.map(i =>
                                      i.ingredientId === batch.id && i.isBatch
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  )
                                }
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">portions</span>
                              </div>
                            )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchIngredientsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowBatchIngredientsDialog(false)}>
              Add Selected
            </Button>
          </DialogFooter>
                          </DialogContent>
                        </Dialog>

      {/* Add Batch Details Dialog */}
      <Dialog open={showBatchDetailsDialog} onOpenChange={setShowBatchDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              View and manage batch details
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && renderBatchDetails(selectedBatch)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {batchToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
              Cancel
                          </Button>
                          <Button
              variant="destructive" 
              onClick={confirmDeleteBatch}
            >
              Delete Batch
                          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
