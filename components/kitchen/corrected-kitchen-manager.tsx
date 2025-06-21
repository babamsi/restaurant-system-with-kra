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
import type { Recipe as UnifiedRecipe, BatchPreparation } from "@/types/unified-system"
import {
  fetchKitchenStorage,
  upsertKitchenStorage,
  deleteKitchenStorage,
  fetchBatches,
  upsertBatch,
  deleteBatch,
  fetchBatchIngredients,
  upsertBatchIngredient,
  deleteBatchIngredient,
  fetchSystemLogs,
  insertSystemLog,
  fetchIngredients,
} from "@/lib/kitchenSupabase"
import { supabase } from "@/lib/supabase"

interface ExtendedIngredient extends UnifiedIngredient {
  available_quantity: number;
  is_sellable_individually: boolean;
  unit: string;
}

interface KitchenStorageItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  used_grams?: number;
  used_liters?: number;
  last_updated?: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  type: "storage" | "batch";
  action: string;
  details: string;
  status: "success" | "error" | "info";
}

// Add a type guard for Batch
function isValidBatch(obj: any): obj is Batch {
  return obj && typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.ingredients) &&
    ["preparing", "ready", "completed", "finished"].includes(obj.status)
}

// Add these utility functions after the SystemLog interface and before the CorrectedKitchenManager component
interface IngredientMatch {
  matchedIngredient: any;
  confidence: number;
}

// Update the normalizeIngredientName function to be more flexible
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\b(boneless|unsalted|fresh|dried|ground|powdered|whole|sliced|chopped|minced)\b/g, '') // Remove common modifiers
    .replace(/\b(breast|thigh|leg|wing)\b/g, '') // Remove common meat cuts
    .trim();
}

// Update the findMatchingIngredient function to be more flexible
function findMatchingIngredient(ingredientName: string, ingredients: Ingredient[]): IngredientMatch | null {
  const normalizedSearchName = normalizeIngredientName(ingredientName);
  
  // First try exact match
  const exactMatch = ingredients.find(ing => 
    normalizeIngredientName(ing.name) === normalizedSearchName
  );
  if (exactMatch) {
    return { matchedIngredient: exactMatch, confidence: 1 };
  }

  // Then try partial match with word-based comparison
  const partialMatches = ingredients
    .map(ing => {
      const normalizedIngName = normalizeIngredientName(ing.name);
      const searchWords = normalizedSearchName.split(' ');
      const ingWords = normalizedIngName.split(' ');
      
      // Calculate how many words match
      const matchingWords = searchWords.filter(word => 
        ingWords.some(ingWord => 
          ingWord.includes(word) || 
          word.includes(ingWord) ||
          // Add common variations
          (word === 'breast' && ingWord === 'chicken') ||
          (word === 'chicken' && ingWord === 'breast') ||
          (word === 'butter' && ingWord === 'unsalted') ||
          (word === 'unsalted' && ingWord === 'butter') ||
          (word === 'oil' && ingWord === 'frying') ||
          (word === 'frying' && ingWord === 'oil') ||
          (word === 'chilli' && ingWord === 'red') ||
          (word === 'red' && ingWord === 'chilli') ||
          (word === 'pepper' && ingWord === 'black') ||
          (word === 'black' && ingWord === 'pepper')
        )
      );
      
      const confidence = matchingWords.length / Math.max(searchWords.length, ingWords.length);
      
      return { matchedIngredient: ing, confidence };
    })
    .filter(match => match.confidence > 0.3) // Lower the confidence threshold for more matches
    .sort((a, b) => b.confidence - a.confidence);

  return partialMatches.length > 0 ? partialMatches[0] : null;
}

// Add after the existing interfaces
interface MeasurementUnit {
  value: string;
  label: string;
  type: 'weight' | 'volume' | 'count' | 'custom';
}

const measurementUnits: MeasurementUnit[] = [
  { value: 'g', label: 'Grams (g)', type: 'weight' },
  { value: 'kg', label: 'Kilograms (kg)', type: 'weight' },
  { value: 'ml', label: 'Milliliters (ml)', type: 'volume' },
  { value: 'l', label: 'Liters (l)', type: 'volume' },
  { value: 'tbsp', label: 'Tablespoon (tbsp)', type: 'custom' },
  { value: 'tsp', label: 'Teaspoon (tsp)', type: 'custom' },
  { value: 'piece', label: 'Piece', type: 'count' },
  { value: 'pinch', label: 'Pinch', type: 'custom' },
  { value: 'cup', label: 'Cup', type: 'custom' },
  { value: 'oz', label: 'Ounces (oz)', type: 'weight' },
  { value: 'lb', label: 'Pounds (lb)', type: 'weight' }
];

// Add helper function to extract gram amount from ingredient name
const extractGramAmount = (ingredientName: string): number | null => {
  const match = ingredientName.match(/(\d+)\s*GM/i);
  return match ? parseInt(match[1]) : null;
};

// NEW: More robust function to get volume in ML from ingredient name
const extractVolumeInMl = (ingredientName: string): number | null => {
  // Check for ML first to avoid partially matching LTR
  let match = ingredientName.match(/(\d+)\s*ML/i);
  if (match) return parseInt(match[1]);

  // Check for LTR or L
  match = ingredientName.match(/(\d+)\s*(?:LTR|L)/i);
  if (match) return parseInt(match[1]) * 1000;
  
  return null;
}

// Update the convertUnit function to properly handle piece-to-gram conversions
const convertUnit = (value: number, fromUnit: string, toUnit: string, ingredientName?: string): number => {
  // Common conversion factors
  const conversions: { [key: string]: { [key: string]: number } } = {
    'g': {
      'kg': 0.001,
      'oz': 0.035274,
      'lb': 0.00220462,
      'tsp': 0.2,
      'tbsp': 0.067,
      'cup': 0.00423,
      'ml': 1,
      'l': 0.001,
      'piece': 1
    },
    'kg': {
      'g': 1000,
      'oz': 35.274,
      'lb': 2.20462,
      'tsp': 200,
      'tbsp': 67,
      'cup': 4.23,
      'ml': 1000,
      'l': 1,
      'piece': 1000
    },
    'ml': {
      'g': 1,
      'kg': 0.001,
      'oz': 0.033814,
      'lb': 0.00220462,
      'tsp': 0.2,
      'tbsp': 0.067,
      'cup': 0.00423,
      'l': 0.001,
      'piece': 1
    },
    'l': {
      'g': 1000,
      'kg': 1,
      'oz': 33.814,
      'lb': 2.20462,
      'tsp': 200,
      'tbsp': 67,
      'cup': 4.23,
      'ml': 1000,
      'piece': 1000
    },
    'piece': {
      'g': 1, // 1 piece = 1g (default conversion)
      'kg': 0.001,
      'ml': 1,
      'l': 0.001,
      'tsp': 0.2,
      'tbsp': 0.067,
      'cup': 0.00423
    }
  };

  // If units are the same, return the same value
  if (fromUnit === toUnit) return value;

  // Special handling for piece-to-gram conversions
  if (fromUnit === 'piece' && toUnit === 'g' && ingredientName) {
    const gramAmount = extractGramAmount(ingredientName);
    if (gramAmount) {
      // Convert pieces to grams using the gram amount from the name
      return value * gramAmount;
    }
  }

  // Special handling for gram-to-piece conversions
  if (fromUnit === 'g' && toUnit === 'piece' && ingredientName) {
    const gramAmount = extractGramAmount(ingredientName);
    if (gramAmount) {
      // Convert grams to pieces using the gram amount from the name
      return value / gramAmount;
    }
  }

  // UPDATED: Special handling for piece-to-volume conversions
  if (fromUnit === 'piece' && (toUnit === 'ml' || toUnit === 'l') && ingredientName) {
    const mlAmount = extractVolumeInMl(ingredientName);
    if (mlAmount) {
      const totalMl = value * mlAmount;
      return toUnit === 'l' ? totalMl / 1000 : totalMl;
    }
  }

  // UPDATED: Special handling for volume-to-piece conversions
  if ((fromUnit === 'ml' || fromUnit === 'l') && toUnit === 'piece' && ingredientName) {
    const mlAmount = extractVolumeInMl(ingredientName);
    if (mlAmount) {
      const totalMl = fromUnit === 'l' ? value * 1000 : value;
      return totalMl / mlAmount;
    }
  }

  // If we have a direct conversion, use it
  if (conversions[fromUnit]?.[toUnit]) {
    return value * conversions[fromUnit][toUnit];
  }

  // If we have a reverse conversion, use it
  if (conversions[toUnit]?.[fromUnit]) {
    return value / conversions[toUnit][fromUnit];
  }

  // If no conversion is found, return the original value
  return value;
};

// Add a helper for safe date formatting
function formatDateSafe(dateValue: string | number | Date | undefined): string {
  if (!dateValue) return '-';
  try {
    return format(new Date(dateValue), "MMM d, yyyy HH:mm");
  } catch {
    return '-';
  }
}

// Update the createBatch function to use Supabase
const createBatch = async (
  name: string,
  ingredients: BatchIngredient[],
  notes?: string,
  yieldInfo?: {
    yield?: number;
    portions?: number;
    yield_unit?: string;
  }
) => {
  const { batches } = useKitchenStore.getState()
  const { toast } = useToast()
  
  const newBatch: Batch = {
    id: crypto.randomUUID(),
    name,
    ingredients,
    status: "preparing",
    start_time: new Date().toISOString(),
    end_time: undefined,
    notes: notes || "",
    yield: yieldInfo?.yield || 0,
    portions: yieldInfo?.portions || 0,
    yield_unit: yieldInfo?.yield_unit || "g"
  }
  try {
    // Insert the new batch into Supabase
    await upsertBatch(newBatch)
    
    // Update local state
    const updatedBatches = [...batches, newBatch]
    useKitchenStore.setState({ batches: updatedBatches })
    
    // Log the batch creation
    await insertSystemLog({
      type: "batch",
      action: "Batch Created",
      details: `Created new batch "${name}" with ${ingredients.length} ingredients`,
      status: "success"
    })
  } catch (err) {
    console.error("Error creating batch:", err)
    toast({
      title: "Error",
      description: "Failed to create batch. Please try again.",
      variant: "destructive"
    })
  }
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  available_quantity: number;
  unit: string;
  threshold?: number;  // Optional threshold property
  current_stock?: number; // Add this line for import dialog compatibility
}

export function CorrectedKitchenManager() {
  const { toast } = useToast()
  const { updateStock } = useSynchronizedInventoryStore()
  
  // Kitchen store
  const {
    storage,
    batches,
    addToStorage,
    removeFromStorage,
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
    yield: number;
    yieldUnit: string;
    portions: number;
    ingredients: BatchIngredient[];
  }>({
    name: "",
    yield: 0,
    yieldUnit: "g",
    portions: 0,
    ingredients: []
  })
  const [requestedIngredientDetails, setRequestedIngredientDetails] = useState<any>(null) // Holds latest ingredient from Supabase
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
  const [isStartingBatch, setIsStartingBatch] = useState(false)
  const [isDeletingBatch, setIsDeletingBatch] = useState(false)

  // Supabase-backed state
  const [kitchenStorage, setKitchenStorage] = useState<KitchenStorageItem[]>([])
  const [inventoryIngredientsList, setInventoryIngredientsList] = useState<Ingredient[]>([])
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false)

  // Get unique categories for filters
  const categories = Array.from(new Set(inventoryIngredientsList.map(i => i.category)))

  // Filter ingredients based on search and category
  const filteredIngredients = inventoryIngredientsList.filter(ingredient => {
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

  // Update handleImportIngredients to use direct Supabase data
  const [isImporting, setIsImporting] = useState(false)
  const handleImportIngredients = async () => {
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
      const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId)
      return !syncedIngredient || 
             Number(syncedIngredient.current_stock) <= 0 || 
             ingredient.requiredQuantity <= 0 ||
             ingredient.requiredQuantity > Number(syncedIngredient.current_stock)
    })

    if (invalidImports.length > 0) {
      const invalidNames = invalidImports.map(ing => {
        const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ing.ingredientId)
        return syncedIngredient?.name
      }).filter(Boolean).join(", ")

      toast({
        title: "Invalid Import",
        description: `Cannot import: ${invalidNames}. Please check stock availability.`,
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
    // Process all valid imports
      for (const ingredient of selectedIngredients) {
        const syncedIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId)
      if (syncedIngredient) {
          // First, check if the ingredient already exists in kitchen storage
          const existingItem = kitchenStorage.find(item => item.ingredient_id === ingredient.ingredientId)
          
          // Prepare the storage item data
          const storageItem = {
            ...(existingItem?.id ? { id: existingItem.id } : {}), // Only include id if updating
            ingredient_id: ingredient.ingredientId,
            quantity: (existingItem?.quantity || 0) + ingredient.requiredQuantity,
            unit: syncedIngredient.unit,
            last_updated: new Date().toISOString()
          }

          // Update or insert the item in Supabase
          await upsertKitchenStorage(storageItem)

          // Update local state
          setKitchenStorage(prevStorage => {
            const index = prevStorage.findIndex(item => item.ingredient_id === ingredient.ingredientId)
            // Always ensure a valid id for every KitchenStorageItem
            const ensureId = (item: any) => ({
              ...item,
              id: item.id || crypto.randomUUID?.() || Date.now().toString(),
            })
            if (index >= 0) {
              const updatedStorage = [...prevStorage]
              updatedStorage[index] = ensureId(storageItem)
              return updatedStorage
            }
            return [...prevStorage, ensureId(storageItem)]
          })

          // Update inventory stock in Supabase
          await supabase
            .from('ingredients')
            .update({ 
              current_stock: Number(syncedIngredient.current_stock) - ingredient.requiredQuantity 
            })
            .eq('id', ingredient.ingredientId)

          // Log the successful import
          await insertSystemLog({
            type: "storage",
            action: "Import Success",
            details: `Imported ${ingredient.requiredQuantity} ${syncedIngredient.unit} of ${syncedIngredient.name}`,
            status: "success"
          })
        }
      }

    setShowImportDialog(false)
    setSelectedIngredients([])

    toast({
      title: "Ingredients Imported",
      description: "Selected ingredients have been imported to kitchen storage.",
    })

      // Refresh the ingredients list
      const updatedIngredients = await fetchIngredients()
      setInventoryIngredientsList(updatedIngredients || [])
    } catch (error) {
      console.error("Error importing ingredients:", error)
      toast({
        title: "Import Failed",
        description: "An error occurred while importing ingredients. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
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

  // Add missing state for ingredient selection in recipe creation
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null)
  const [newBatchIngredients, setNewBatchIngredients] = useState<BatchIngredient[]>([])

  const addIngredientToRecipe = () => {
    if (!selectedIngredient) return;
    
    const newIngredient: BatchIngredient = {
      ingredientId: selectedIngredient.id.toString(),
      requiredQuantity: 0,
      unit: measurementUnits[0].value, // Default to first unit
      status: "available",
      isBatch: false
    };
    
    setNewBatchIngredients(prevIngredients => [...prevIngredients, newIngredient]);
    setSelectedIngredient(null);
  };

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

  // Initial data load from Supabase
  useEffect(() => {
    async function loadKitchenData() {
      try {
        const [storageData, batchData, logData, ingredientsData] = await Promise.all([
          fetchKitchenStorage(),
          fetchBatches(),
          fetchSystemLogs(),
          fetchIngredients(),
        ])
        setKitchenStorage(storageData || [])
        setInventoryIngredientsList(ingredientsData || [])
        setSystemLogs(logData || [])
        
        // Update batches in the Zustand store
        if (batchData) {
          useKitchenStore.setState({ batches: batchData })
        }
      } catch (err) {
        toast({
          title: "Error loading kitchen data",
          description: String(err),
          variant: "destructive",
        })
      }
    }
    loadKitchenData()
  }, [toast])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kitchenStorage', JSON.stringify(storage))
  }, [storage])

  useEffect(() => {
    localStorage.setItem('kitchenBatches', JSON.stringify(batches))
  }, [batches])

  // Function to get ingredient name
  const getIngredientName = (ingredientId: string, isBatch?: boolean) => {
    if (isBatch) {
      const batch = batches.find(b => b.id === ingredientId)
      return batch ? `${batch.name} (Batch)` : "Unknown Batch"
    }
    // Always try inventoryIngredientsList (from Supabase) first
    const inventoryIngredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === ingredientId)
    if (inventoryIngredient) return inventoryIngredient.name
    // Fallback to Zustand ingredients
    const completeIngredient = ingredients.find(i => i.id.toString() === ingredientId)
    if (completeIngredient) return completeIngredient.name
    return "Unknown Ingredient"
  }

  // --- Request More Logic ---
  const handleRequestMore = async (item: KitchenStorageItem) => {
    // Always fetch the latest ingredient from Supabase
    let latestIngredient = null
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', item.ingredient_id)
        .single()
      if (error) throw error
      latestIngredient = data
    } catch (err) {
      toast({
        title: "Ingredient Not Found",
        description: "This ingredient could not be found in the main inventory.",
        variant: "destructive",
      })
      return
    }
    if (!latestIngredient || Number(latestIngredient.current_stock) <= 0) {
      addSystemLog(
        "storage",
        "Request Failed",
        `Failed to request more ${latestIngredient?.name || ''}:\n- Current stock: ${latestIngredient?.current_stock || 0} ${latestIngredient?.unit || ''}\n- Status: Out of stock`,
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
      `Initiating request for ${latestIngredient.name}:\n- Current kitchen stock: ${item.quantity} ${item.unit}\n- Available in main inventory: ${latestIngredient.current_stock} ${latestIngredient.unit}`,
      "info"
    )
    setSelectedIngredients([
      {
        ingredientId: item.ingredient_id,
      requiredQuantity: 1,
      unit: item.unit,
      status: "available"
      }
    ])
    setRequestedIngredientDetails(latestIngredient)
    setRequestQuantity("")
    setShowRequestDialog(true)
  }

  // Confirm request: update kitchen storage and inventory, refresh both
  const handleConfirmRequest = async () => {
    if (selectedIngredients.length === 0 || !requestedIngredientDetails) {
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
    const ingredient = selectedIngredients[0]
    const requestQty = parseFloat(requestQuantity)
    const currentStock = Number(requestedIngredientDetails.current_stock)
    if (!requestQty || requestQty <= 0 || requestQty > currentStock) {
      toast({
        title: "Invalid Quantity",
        description: `Cannot request more than available in main inventory.`,
        variant: "destructive",
      })
      return
    }
    try {
      // 1. Update kitchen storage (add the requested quantity)
      const existingItem = kitchenStorage.find(item => item.ingredient_id === ingredient.ingredientId)
      const storageItem = {
        ...(existingItem?.id ? { id: existingItem.id } : {}),
        ingredient_id: ingredient.ingredientId,
        quantity: (existingItem?.quantity || 0) + requestQty,
        unit: requestedIngredientDetails.unit,
        last_updated: new Date().toISOString()
      }
      await upsertKitchenStorage(storageItem)
      // 2. Update inventory (deduct the requested quantity)
      await supabase
        .from('ingredients')
        .update({ current_stock: currentStock - requestQty })
        .eq('id', ingredient.ingredientId)
      // 3. Log
      await insertSystemLog({
        type: "storage",
        action: "Request Processed",
        details: `Requested ${requestQty} ${requestedIngredientDetails.unit} of ${requestedIngredientDetails.name}:
- Previous kitchen stock: ${(existingItem?.quantity || 0)} ${requestedIngredientDetails.unit}
- New kitchen stock: ${(existingItem?.quantity || 0) + requestQty} ${requestedIngredientDetails.unit}
- Previous main inventory: ${currentStock} ${requestedIngredientDetails.unit}
- New main inventory: ${currentStock - requestQty} ${requestedIngredientDetails.unit}`,
        status: "success"
      })
      // 4. Refresh both lists
      const [updatedKitchen, updatedIngredients] = await Promise.all([
        fetchKitchenStorage(),
        fetchIngredients()
      ])
      setKitchenStorage(updatedKitchen || [])
      setInventoryIngredientsList(updatedIngredients || [])
    setShowRequestDialog(false)
    setSelectedIngredients([])
    setRequestQuantity("")
      setRequestedIngredientDetails(null)
    toast({
      title: "Request Processed",
        description: `Successfully requested ${requestQty} ${requestedIngredientDetails.unit} of ${requestedIngredientDetails.name}`,
      })
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "An error occurred while processing the request. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddIngredientToBatch = (ingredientId: string, requiredQuantity: number, unit: string) => {
    const ingredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === ingredientId);
    if (!ingredient) return;

    setNewBatchIngredients(prevIngredients => [
      ...prevIngredients,
      {
        ingredientId,
        requiredQuantity,
        unit, // Use the provided unit instead of the storage unit
        status: "available",
        isBatch: false
      }
    ]);
  };

  // Update the handleCreateBatch function to just create the batch definition
  const handleCreateBatch = async () => {
    try {
      // Create the batch object with "draft" status
      const batchData: Batch = {
        id: crypto.randomUUID(),
        name: newBatchName,
        ingredients: selectedIngredients,
        status: "draft" as const, // New status for batches that haven't started preparing
        start_time: undefined, // Will be set when starting preparation
        end_time: undefined,
        notes: batchNotes || "",
        yield: Number(newBatch.yield),
        portions: Number(newBatch.portions),
        yield_unit: newBatch.yieldUnit
      };

      await upsertBatch(batchData);

      // Add the new batch to batches array
      const updatedBatches = [...batches, batchData];

      // Update localStorage and store
      localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches));
      useKitchenStore.setState({ batches: updatedBatches });

      // Show success message
      toast({
        title: "Batch Created",
        description: `Successfully created batch "${newBatchName}". Click "Start Preparing" when ready to begin.`,
      });

      // Reset form and close dialog
      setNewBatchName("");
      setBatchNotes("");
      setNewBatch({
        name: "",
        yield: 0,
        yieldUnit: "g",
        portions: 0,
        ingredients: []
      });
      setSelectedIngredients([]);
      setShowNewBatchDialog(false);

      // Log the creation
      await insertSystemLog({
        type: "batch",
        action: "Batch Created",
        details: `Created new batch "${newBatchName}" with ${selectedIngredients.length} ingredients (Draft status)`,
        status: "success"
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      toast({
        title: "Error",
        description: "Failed to create batch. Please try again.",
        variant: "destructive"
      });
    }
  };

  // New function to start preparing a batch
  const handleStartPreparing = async (batch: Batch) => {
    if (isStartingBatch) return; // Prevent multiple simultaneous starts
    
    setIsStartingBatch(true);
    try {
      const validationErrors: string[] = [];
      
      interface StorageUpdateInstruction {
        item: KitchenStorageItem;
        ingredientName: string;
        newQuantity?: number;
        addUsedGrams?: number;
        addUsedLiters?: number;
      }
      const storageUpdateInstructions: StorageUpdateInstruction[] = [];

      for (const ingredient of batch.ingredients) {
        if (ingredient.isBatch) {
          const sourceBatch = batches.find(b => b.id === ingredient.ingredientId);
          if (!sourceBatch || !sourceBatch.portions || sourceBatch.portions < ingredient.requiredQuantity) {
              validationErrors.push(
                `Insufficient batch "${sourceBatch?.name || 'Unknown'}": Need ${ingredient.requiredQuantity} portions, have ${sourceBatch?.portions || 0}`
              );
          }
        } else {
            const kitchenItem = kitchenStorage.find(item => item.ingredient_id === ingredient.ingredientId);
            const inventoryIngredient = inventoryIngredientsList.find(i => i.id.toString() === ingredient.ingredientId);
            
            if (!kitchenItem) {
              const ingredientName = inventoryIngredient?.name || getIngredientName(ingredient.ingredientId);
              validationErrors.push(`Missing ingredient: ${ingredientName}`);
              continue;
            }

            if (!inventoryIngredient) {
              validationErrors.push(`Ingredient not found in inventory: ${ingredient.ingredientId}`);
              continue;
            }

            const ingredientName = inventoryIngredient.name;
            const requiredUnitInfo = measurementUnits.find(u => u.value === ingredient.unit);

            // LOGIC: If units are different and we're dealing with weight or volume, update used_grams/liters
            if (ingredient.unit !== kitchenItem.unit && (requiredUnitInfo?.type === 'weight' || requiredUnitInfo?.type === 'volume')) {
              if (requiredUnitInfo.type === 'weight') {
                const requiredGrams = convertUnit(ingredient.requiredQuantity, ingredient.unit, 'g', ingredientName);
                const totalAvailableInGrams = convertUnit(kitchenItem.quantity, kitchenItem.unit, 'g', ingredientName);
                const currentUsedGrams = kitchenItem.used_grams || 0;
                const remainingGrams = totalAvailableInGrams - currentUsedGrams;
                
                if (requiredGrams > remainingGrams) {
                  validationErrors.push(`Insufficient ${ingredientName}: Need ${ingredient.requiredQuantity} ${ingredient.unit} (~${requiredGrams.toFixed(0)}g), but only ~${Math.round(remainingGrams)}g available.`);
                } else {
                  storageUpdateInstructions.push({
                    item: kitchenItem,
                    ingredientName,
                    addUsedGrams: requiredGrams,
                  });
                }
              } else { // Volume
                const requiredLiters = convertUnit(ingredient.requiredQuantity, ingredient.unit, 'l', ingredientName);
                const totalAvailableInLiters = convertUnit(kitchenItem.quantity, kitchenItem.unit, 'l', ingredientName);
                const currentUsedLiters = kitchenItem.used_liters || 0;
                const remainingLiters = totalAvailableInLiters - currentUsedLiters;

                if (requiredLiters > remainingLiters) {
                  validationErrors.push(`Insufficient ${ingredientName}: Need ${ingredient.requiredQuantity} ${ingredient.unit} (~${requiredLiters.toFixed(2)}l), but only ~${remainingLiters.toFixed(2)}l available.`);
                } else {
                  storageUpdateInstructions.push({
                    item: kitchenItem,
                    ingredientName,
                    addUsedLiters: requiredLiters,
                  });
                }
              }
            } else {
              // ORIGINAL LOGIC: Units are the same or it's not a special case, so deduct from main quantity.
              const requiredQuantityInStorageUnit = convertUnit(ingredient.requiredQuantity, ingredient.unit, kitchenItem.unit, ingredientName);

              if (requiredQuantityInStorageUnit > kitchenItem.quantity) {
                validationErrors.push(
                  `Insufficient ${ingredientName}: Need ${ingredient.requiredQuantity} ${ingredient.unit}, have ${kitchenItem.quantity} ${kitchenItem.unit}`
                );
              } else {
                storageUpdateInstructions.push({
                  item: kitchenItem,
                  ingredientName,
                  newQuantity: kitchenItem.quantity - requiredQuantityInStorageUnit,
                });
              }
            }
          }
        }

      if (validationErrors.length > 0) {
        toast({
          title: "Cannot Start Batch",
          description: validationErrors.join('\\n'),
          variant: "destructive",
        });
        return;
      }

      // All validations passed - proceed with updates
      const updatePromises: Promise<any>[] = [];
      const updateLogs: string[] = [];

      for (const instruction of storageUpdateInstructions) {
        const { item, ingredientName, newQuantity, addUsedGrams, addUsedLiters } = instruction;

        const updatedItem = {
          id: item.id,
          ingredient_id: item.ingredient_id,
          quantity: newQuantity !== undefined ? newQuantity : item.quantity,
          unit: item.unit,
          used_grams: (item.used_grams || 0) + (addUsedGrams || 0),
          used_liters: (item.used_liters || 0) + (addUsedLiters || 0),
          last_updated: new Date().toISOString()
        };

        updatePromises.push(upsertKitchenStorage(updatedItem));
        
        if (newQuantity !== undefined) {
          updateLogs.push(`Updated ${ingredientName}: ${item.quantity} → ${newQuantity.toFixed(2)} ${item.unit}`);
        }
        if (addUsedGrams) {
          updateLogs.push(`Used ${addUsedGrams.toFixed(2)}g of ${ingredientName}`);
        }
        if (addUsedLiters) {
          updateLogs.push(`Used ${addUsedLiters.toFixed(2)}l of ${ingredientName}`);
        }
      }

      const updatedBatch = {
        id: batch.id,
        name: batch.name,
        ingredients: batch.ingredients,
        status: "preparing" as const,
        start_time: new Date().toISOString(),
        end_time: batch.end_time,
        notes: batch.notes,
        yield: batch.yield,
        yield_unit: batch.yield_unit,
        portions: batch.portions
      };

      updatePromises.push(upsertBatch(updatedBatch));

      await Promise.all(updatePromises);

      const updatedKitchenStorage = await fetchKitchenStorage();
      setKitchenStorage(updatedKitchenStorage || []);

      const updatedBatches = batches.map(b => b.id === batch.id ? updatedBatch : b);
      useKitchenStore.setState({ batches: updatedBatches });
      localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches));

      await insertSystemLog({
        type: "batch",
        action: "Batch Started",
        details: `Started preparing batch "${batch.name}":\\n${updateLogs.join('\\n')}`,
        status: "success"
      });

      toast({
        title: "Batch Started Successfully",
        description: `Started preparing "${batch.name}". ${storageUpdateInstructions.length} ingredients updated.`,
      });

    } catch (error) {
      console.error("Error starting batch:", error);
      toast({
        title: "Error Starting Batch",
        description: "Failed to start batch preparation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStartingBatch(false);
    }
  };

  const getBatchStatusBadge = (batch: Batch) => {
    // Check if batch is low on portions (5 or fewer)
    const isLowStock = batch.portions && batch.portions <= 5 && batch.portions > 0;
    const isDepleted = batch.portions === 0;

    switch (batch.status) {
      case "draft":
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-500">
            <Save className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </Badge>
        )
      case "ready":
        if (isLowStock) {
          return (
            <Badge variant="outline" className="text-red-500 border-red-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock ({batch.portions} portions)
            </Badge>
          )
        } else if (isDepleted) {
          return (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Depleted
            </Badge>
          )
        } else {
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
        }
      case "completed":
        if (isLowStock) {
          return (
            <Badge variant="outline" className="text-red-500 border-red-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock ({batch.portions} portions)
            </Badge>
          )
        } else if (isDepleted) {
          return (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Depleted
            </Badge>
          )
        } else {
        return (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
        }
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
        return <Badge variant="default">Available</Badge>
      case "low":
        return <Badge variant="outline">Low Stock</Badge>
      case "missing":
        return <Badge variant="destructive">Missing</Badge>
      default:
        return null
    }
  }

  const getStorageStatusBadge = (item: KitchenStorageItem) => {
    if (item.quantity > 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          Available
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          Out of Stock
        </Badge>
      )
    }
  }

  // Add a function to check if any items are low in stock
  const hasLowStockItems = () => {
    return kitchenStorage.some(item => {
      const inventoryIngredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === item.ingredient_id)
      if (!inventoryIngredient) return false
      const threshold = inventoryIngredient.threshold || 5
      return item.quantity <= threshold
    })
  }

  const getLowStockItems = () => {
    return kitchenStorage.filter(item => {
      const inventoryIngredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === item.ingredient_id)
      if (!inventoryIngredient) return false
      const threshold = inventoryIngredient.threshold || 5
      return item.quantity <= threshold
    })
  }

  // Update the handleCheckStorageLevels function to include low stock check
  const handleCheckStorageLevels = () => {
    // checkStorageLevels() // (optional: keep Zustand logic if needed)
    const lowStockItems = getLowStockItems()
    
    if (lowStockItems.length > 0) {
      const lowStockNames = lowStockItems.map(item => {
        const ingredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === item.ingredient_id)
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
        - Current yield: ${batch.yield || 0} ${batch.yield_unit || 'g'}
        - Current portions: ${batch.portions || 0}
        - Start time: ${formatDateSafe(batch.start_time)}
        ${batch.end_time ? `- End time: ${formatDateSafe(batch.end_time)}` : ''}`,
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
      - Current yield: ${batch.yield || 0} ${batch.yield_unit || 'g'}`,
      "info"
    )

    // Update the batch with doubled portions
    const updatedBatch: Batch = {
      ...batch,
      portions: (batch.portions || 0) + (batch.portions || 0),
      status: "preparing" as Batch['status']
    }

    // Update the batch in the store
    const updatedBatches = batches.map(b => 
      b.id === batch.id ? updatedBatch : b
    )

    // Update localStorage
    localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches))

    // Update the store state
    useKitchenStore.setState({ batches: updatedBatches.filter(isValidBatch) })

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
    const isLowStock = batch.portions && batch.portions <= 5 && batch.portions > 0;
    const isDepleted = batch.portions === 0;

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
            <p>{batch.yield || 0} {batch.yield_unit || 'g'}</p>
        </div>
          <div className="space-y-2">
            <Label>Portions</Label>
            <div className="flex items-center gap-2">
            <p>{batch.portions || 0}</p>
              {isLowStock && (
                <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                  Low Stock
                </Badge>
              )}
              {isDepleted && (
                <Badge variant="destructive" className="text-xs">
                  Depleted
                </Badge>
              )}
            </div>
                    </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <p>{formatDateSafe(batch.start_time)}</p>
                    </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <p>{batch.end_time ? formatDateSafe(batch.end_time) : "-"}</p>
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
          {batch.status === "draft" && (
            <Button
              onClick={() => handleStartPreparing(batch)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Start Preparing
            </Button>
          )}
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

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;

    setIsDeletingBatch(true);
    try {
      // Log the batch details before deletion
      await insertSystemLog({
        type: "batch",
        action: "Batch Deletion",
        details: `Deleting batch "${batchToDelete.name}" with:
        - Status: ${batchToDelete.status}
        - Yield: ${batchToDelete.yield || 0} ${batchToDelete.yield_unit || 'g'}
        - Portions: ${batchToDelete.portions || 0}
        - Ingredients: ${batchToDelete.ingredients.map(ing => 
          `${getIngredientName(ing.ingredientId, ing.isBatch)} (${ing.requiredQuantity} ${ing.isBatch ? 'portions' : ing.unit})`
        ).join(', ')}`,
        status: "info"
      });

      // Delete the batch from the database
      await deleteBatch(batchToDelete.id);

      // Remove the batch from local state
      const updatedBatches = batches.filter(b => b.id !== batchToDelete.id);
      useKitchenStore.setState({ batches: updatedBatches });
      localStorage.setItem('kitchenBatches', JSON.stringify(updatedBatches));

      // Log successful deletion
      await insertSystemLog({
        type: "batch",
        action: "Batch Deleted",
        details: `Successfully deleted batch "${batchToDelete.name}"`,
        status: "success"
      });

      setShowDeleteConfirmDialog(false);
      setBatchToDelete(null);

      toast({
        title: "Batch Deleted",
        description: `${batchToDelete.name} has been deleted successfully.`,
      });

    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error Deleting Batch",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Add function to handle starting a new batch from a completed one
  const handleStartNewBatch = (batch: Batch) => {
    // Create a new batch with the same ingredients
    createBatch(`${batch.name} (New)`, batch.ingredients, batch.notes, {
      yield: batch.yield || 0,
      yield_unit: batch.yield_unit || 'g',
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
          yield_unit: batch.yieldUnit,
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

  // Update the checkStorageForBatch function to use the new matching system
  const checkStorageForBatch = (ingredients: BatchIngredient[]) => {
    const missingIngredients: string[] = [];
    
    ingredients.forEach(ingredient => {
      const storageItem = storage.find(item => item.ingredientId === ingredient.ingredientId);
      const inventoryIngredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === ingredient.ingredientId);
      
      if (!storageItem || !inventoryIngredient) {
        missingIngredients.push(getIngredientName(ingredient.ingredientId));
      } else {
        // Here, you could add more sophisticated logic to check quantity
        const required = ingredient.requiredQuantity;
        const available = storageItem.quantity;
        if (required > available) {
          missingIngredients.push(`${getIngredientName(ingredient.ingredientId)} (low stock)`);
        }
      }
    });
    
    return missingIngredients;
  };

  // Update the handleStartPredefinedBatch function to use the matching system
  const handleStartPredefinedBatch = (batch: PredefinedBatch) => {
    const ingredients = batch.ingredients.map(ingredient => {
      const inventoryIngredient = inventoryIngredientsList.find((i: Ingredient) => i.id.toString() === ingredient.id);
      return {
        ...ingredient,
        name: inventoryIngredient?.name || "Unknown",
        ingredientId: ingredient.id,
        requiredQuantity: ingredient.quantity
      };
    });
    // ... rest of the function is unused for now
  };

  // Update the renderPredefinedBatches function to allow clicking start and show missing ingredients
  const renderPredefinedBatches = () => {
    return predefinedBatches.map(batch => {
      const missingIngredients = checkStorageForBatch(
        batch.ingredients.map(i => ({
          ingredientId: i.id,
          requiredQuantity: i.quantity,
          unit: i.unit,
          status: 'available',
          isBatch: false,
        }))
      );

      const handleUsePredefined = () => {
        setNewBatchName(batch.name);
        setNewBatch({
          name: batch.name,
          yield: batch.yield,
          yieldUnit: batch.yieldUnit,
          portions: batch.portions,
          ingredients: [],
        });
        setSelectedIngredients(batch.ingredients.map(ing => ({
          ingredientId: ing.id,
          requiredQuantity: ing.quantity,
          unit: ing.unit,
          status: 'available',
          isBatch: false,
        })));
        setShowPredefinedBatches(false);
      }

      return (
        <Card key={batch.name} className="mb-2">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">{batch.name}</p>
              <p className="text-sm text-muted-foreground">{batch.ingredients.length} ingredients</p>
              {missingIngredients.length > 0 && (
                <p className="text-xs text-red-500">Missing: {missingIngredients.join(', ')}</p>
              )}
            </div>
            <Button size="sm" onClick={handleUsePredefined} disabled={missingIngredients.some(m => !m.includes('(low stock)'))}>Use</Button>
          </CardContent>
        </Card>
      );
    });
  };

  // Update the renderNewBatchDialog function
  const renderNewBatchDialog = () => {
    return (
      <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        min="0"
                        step="0.01"
                        value={newBatch.yield || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewBatch({ ...newBatch, yield: value === "" ? 0 : parseFloat(value) });
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
                          {measurementUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                        </SelectItem>
                      ))}
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
                      value={newBatch.portions || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewBatch({ ...newBatch, portions: value === "" ? 0 : parseInt(value) });
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
                        const isBatch = ingredient.isBatch;
                        const batch = isBatch ? batches.find(b => b.id === ingredient.ingredientId) : null;
                        const kitchenItem = !isBatch ? storage.find(item => item.ingredientId === ingredient.ingredientId) : null;
                        const ingredientName = !isBatch ? getIngredientName(ingredient.ingredientId) : batch?.name || '';
                        const availableQuantity = isBatch ? (batch?.portions || 0) : (kitchenItem?.quantity || 0);
                        
                        // Calculate the storage unit equivalent with special handling for pieces
                        const storageUnitEquivalent = !isBatch && kitchenItem ? 
                          (kitchenItem.unit === 'pcs' ? 
                            convertUnit(ingredient.requiredQuantity, ingredient.unit, 'g', ingredientName) : 
                            convertUnit(ingredient.requiredQuantity, ingredient.unit, kitchenItem.unit)) : 
                          ingredient.requiredQuantity;
                        
                        // Get the gram amount from ingredient name if it exists
                        const gramAmount = !isBatch ? extractGramAmount(ingredientName) : null;
                        
                        const unitHasChanged = !isBatch && kitchenItem && ingredient.unit !== kitchenItem.unit;

                        const unitBadge = unitHasChanged ? (
                          <Badge variant="outline" className="ml-2 text-xs font-normal">
                            {ingredient.requiredQuantity}{ingredient.unit} used
                          </Badge>
                        ) : null;
                        
                        return (
                          <div 
                            key={`${isBatch ? 'batch-' : 'ingredient-'}${ingredient.ingredientId}`} 
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate flex items-center">
                                {ingredientName}
                                {isBatch && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Batch
                                  </Badge>
                                )}
                                {unitBadge}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Required: {ingredient.requiredQuantity} {ingredient.unit}
                                {!isBatch && kitchenItem && (
                                  <span className="ml-2">
                                    (Available: {kitchenItem.quantity} {kitchenItem.unit}
                                    {gramAmount && ` - ${gramAmount}g total`})
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Input
                                name="forBamci"
                                type="number"
                                value={ingredient.requiredQuantity || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const newQuantity = value === "" ? 0 : parseFloat(value);
                                  
                                  // Simply update the quantity without any validation
                                  setSelectedIngredients(
                                    selectedIngredients.map((i) =>
                                      i.ingredientId === ingredient.ingredientId && i.isBatch === isBatch
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  );
                                }}
                                className="w-24"
                                min="0"
                                step="any"
                              />
                              {!isBatch && (
                                <Select
                                  value={ingredient.unit}
                                  onValueChange={(value) => {
                                    setSelectedIngredients(
                                      selectedIngredients.map((i) =>
                                        i.ingredientId === ingredient.ingredientId && i.isBatch === isBatch
                                          ? { ...i, unit: value }
                                          : i
                                      )
                                    );
                                  }}
                                >
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {measurementUnits.map((unit) => (
                                      <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {isBatch && (
                                <span className="text-sm text-muted-foreground">portions</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedIngredients(
                                    selectedIngredients.filter(
                                      (i) => i.ingredientId !== ingredient.ingredientId || i.isBatch !== isBatch
                                    )
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        );
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
                newBatch.yield <= 0 || 
                newBatch.portions <= 0
              }
            >
              Create Batch
                  </Button>
          </DialogFooter>
            </DialogContent>
          </Dialog>
    );
  };

  // Update the storage item display to show used grams
  const renderStorageItem = (item: KitchenStorageItem) => {
    const ingredient = inventoryIngredientsList.find(i => i.id.toString() === item.ingredient_id)
    const gramAmount = ingredient ? extractGramAmount(ingredient.name) : null
    const usedGrams = item.used_grams || 0

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>{getIngredientName(item.ingredient_id) || 'Unknown Ingredient'}</span>
          <span className="text-sm text-gray-500">
            {item.quantity} {item.unit}
          </span>
          {gramAmount && usedGrams > 0 && (
            <Badge variant="secondary" className="ml-2">
              Used: {usedGrams}g
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getStorageStatusBadge(item)}
        </div>
      </div>
    )
  }

  // Function to load ingredients when import modal opens
  const handleOpenImportDialog = async () => {
    setIsLoadingIngredients(true)
    try {
      // Fetch ingredients directly from Supabase
      const ingredients = await fetchIngredients()
      setInventoryIngredientsList(ingredients || [])
    } catch (error) {
      console.error("Error loading ingredients:", error)
      toast({
        title: "Error",
        description: "Failed to load ingredients. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingIngredients(false)
      setShowImportDialog(true)
    }
  }

  // Add state for import dialog search
  const [importSearchQuery, setImportSearchQuery] = useState("")

  // Update the Import Ingredients Dialog section
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
          <Button variant="outline" onClick={handleOpenImportDialog}>
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
              {/* Show loading spinner or message if ingredients are not loaded */}
              {isLoadingIngredients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4" />
                  <span>Loading ingredients...</span>
                </div>
              ) : (
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
                    {kitchenStorage.map((item) => (
                        <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                              <span>{getIngredientName(item.ingredient_id)}</span>
                            {(item.used_grams || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Used: {(item.used_grams || 0).toFixed(2)}g
                              </Badge>
                            )}
                            {(item.used_liters || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Used: {(item.used_liters || 0).toFixed(2)}l
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{getStorageStatusBadge(item)}</TableCell>
                          <TableCell>{formatDateSafe(item.last_updated)}</TableCell>
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
              )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="batches">
      <Card>
        <CardHeader>
              <CardTitle>Active Batches</CardTitle>
        </CardHeader>
        <CardContent>
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
                          {formatDateSafe(batch.start_time)}
                    </TableCell>
                        <TableCell>{batch.yield || 0} {batch.yield_unit || 'g'}</TableCell>
                        <TableCell>{batch.portions || 0}</TableCell>
                    <TableCell>
                          <div className="flex items-center gap-2">
                            {batch.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isStartingBatch}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartPreparing(batch)
                                }}
                              >
                                {isStartingBatch ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                    Starting...
                                  </>
                                ) : (
                                  <>
                                <ChefHat className="h-4 w-4 mr-1" />
                                Start Preparing
                                  </>
                                )}
                              </Button>
                            )}
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
                            {formatDateSafe(log.timestamp)}
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
            {isLoadingIngredients ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search ingredients..."
                    value={importSearchQuery}
                    onChange={e => setImportSearchQuery(e.target.value)}
                  />
                </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4">
                    {inventoryIngredientsList
                      .filter(ingredient => ingredient.name.toLowerCase().includes(importSearchQuery.toLowerCase()))
                      .map((ingredient) => {
                        const stock = ingredient.current_stock ?? ingredient.available_quantity ?? 0;
                        return (
                  <div key={ingredient.id} className="flex items-center space-x-4">
                    <Checkbox
                      id={`ingredient-${ingredient.id}`}
                      checked={selectedIngredients.some(
                        (i) => i.ingredientId === ingredient.id.toString()
                      )}
                              disabled={Number(stock) <= 0}
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
                                className={Number(stock) <= 0 ? "text-muted-foreground" : ""}
                      >
                        {ingredient.name}
                      </Label>
                              <p className={`text-sm ${Number(stock) > 0 ? "text-muted-foreground" : "text-red-500"}`}>
                                {Number(stock) > 0
                                  ? `Available: ${stock} ${ingredient.unit || ""}`
                                  : "Out of stock"}
                                      </p>
                                    </div>
                    {selectedIngredients.some(i => i.ingredientId === ingredient.id.toString()) && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={selectedIngredients.find(i => i.ingredientId === ingredient.id.toString())?.requiredQuantity || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newQuantity = value === "" ? 0 : parseFloat(value);
                            if (value === "" || (newQuantity > 0 && newQuantity <= Number(stock))) {
                              setSelectedIngredients(
                                selectedIngredients.map(i =>
                                  i.ingredientId === ingredient.id.toString()
                                    ? { ...i, requiredQuantity: newQuantity }
                                    : i
                                )
                              )
                            }
                          }}
                          className="w-24"
                        />
                                <span className="text-sm text-muted-foreground">{ingredient.unit || ""}</span>
                                  </div>
                    )}
              </div>
                        )
                      })}
            </div>
            </ScrollArea>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportIngredients}
              disabled={selectedIngredients.length === 0 || isLoadingIngredients || isImporting}
            >
              {isImporting ? "Importing..." : "Import Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request More Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={(open) => {
        setShowRequestDialog(open)
        if (!open) setRequestedIngredientDetails(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Ingredients</DialogTitle>
            <DialogDescription>
              Specify the quantity you want to request from the main inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedIngredients.length > 0 && requestedIngredientDetails && (
              <>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
                                  <div>
                    <p className="font-medium">{requestedIngredientDetails.name}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Available: {requestedIngredientDetails.current_stock} {requestedIngredientDetails.unit}
                      </p>
                                    </div>
                                  </div>
                                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Quantity to Request</Label>
                    <span className="text-sm text-muted-foreground">
                      Available in main inventory: {requestedIngredientDetails.current_stock} {requestedIngredientDetails.unit}
                    </span>
                                </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={requestQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        const maxAvailable = Number(requestedIngredientDetails.current_stock)
                        if (value === "" || parseFloat(value) <= maxAvailable) {
                          setRequestQuantity(value)
                        }
                      }}
                      placeholder={`Enter quantity in ${requestedIngredientDetails.unit}`}
                      className={requestQuantity && parseFloat(requestQuantity) > Number(requestedIngredientDetails.current_stock) ? "border-red-500" : ""}
                    />
                    {requestQuantity && parseFloat(requestQuantity) > Number(requestedIngredientDetails.current_stock) && (
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
            <Button variant="outline" onClick={() => {
              setShowRequestDialog(false)
              setRequestedIngredientDetails(null)
            }}>
              Cancel
            </Button>
                      <Button
              onClick={handleConfirmRequest}
              disabled={
                !requestQuantity || 
                parseFloat(requestQuantity) <= 0 || 
                !requestedIngredientDetails ||
                parseFloat(requestQuantity) > Number(requestedIngredientDetails.current_stock)
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
                  {kitchenStorage.map((item) => {
                    const inventoryIngredient = inventoryIngredientsList.find(i => i.id.toString() === item.ingredient_id)
                    if (!inventoryIngredient) return null

                    return (
                      <div key={`storage-${item.ingredient_id}`} className="flex items-center space-x-4">
                        <Checkbox
                          id={`ingredient-${item.ingredient_id}`}
                          checked={selectedIngredients.some(
                            (i) => i.ingredientId === item.ingredient_id && !i.isBatch
                          )}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedIngredients([
                                ...selectedIngredients,
                                {
                                  ingredientId: item.ingredient_id,
                                  requiredQuantity: 1,
                                  unit: item.unit,
                                  status: "available",
                                  isBatch: false
                                },
                              ])
                            } else {
                              setSelectedIngredients(
                                selectedIngredients.filter(
                                  (i) => i.ingredientId !== item.ingredient_id || i.isBatch
                                )
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`ingredient-${item.ingredient_id}`}
                          >
                            {inventoryIngredient.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Available: {item.quantity} {item.unit}
                                      </p>
                                    </div>
                        {selectedIngredients.some(i => i.ingredientId === item.ingredient_id && !i.isBatch) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={selectedIngredients.find(i => i.ingredientId === item.ingredient_id && !i.isBatch)?.requiredQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                const newQuantity = value === "" ? 0 : parseFloat(value)
                                // No validation against stock here
                                  setSelectedIngredients(
                                    selectedIngredients.map(i =>
                                    i.ingredientId === item.ingredient_id && !i.isBatch
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  )
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
                            Yield: {batch.yield || 0} {batch.yield_unit || 'g'}
                          </p>
                                </div>
                        {selectedIngredients.some(i => i.ingredientId === batch.id && i.isBatch) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={selectedIngredients.find(i => i.ingredientId === batch.id && i.isBatch)?.requiredQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                const newQuantity = value === "" ? 0 : parseInt(value, 10)
                                // No validation against stock here
                                  setSelectedIngredients(
                                    selectedIngredients.map(i =>
                                      i.ingredientId === batch.id && i.isBatch
                                        ? { ...i, requiredQuantity: newQuantity }
                                        : i
                                    )
                                  )
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
