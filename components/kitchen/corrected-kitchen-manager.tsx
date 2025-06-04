"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompleteKitchenStore } from "@/stores/complete-kitchen-store"
import { useCompleteInventoryStore } from "@/stores/complete-inventory-store"

export function CorrectedKitchenManager() {
  const { toast } = useToast()

  // ✅ FIXED: Direct subscription to live Zustand state - NO destructuring
  const ingredients = useCompleteInventoryStore((state) => state.ingredients)
  const lastUpdated = useCompleteInventoryStore((state) => state.lastUpdated)
  const markAsCooked = useCompleteInventoryStore((state) => state.markAsCooked)

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

  // Kitchen store
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

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [selectedRecipeForBatch, setSelectedRecipeForBatch] = useState<any>(null)
  const [batchCount, setBatchCount] = useState(1)
  const [preparedBy, setPreparedBy] = useState("")

  // New recipe form state
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
      selling_price: costs.sellingPrice,
      markup_percentage: newRecipe.markup_percentage,
      is_published: false,
      nutrition_per_portion: nutrition,
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

  // ✅ Calculate real-time stats from current ingredients
  const availableIngredients = ingredients.filter((ing) => ing.current_stock > 0)
  const sellableIngredients = ingredients.filter((ing) => ing.is_sellable_individually)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kitchen Management</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {ingredients.length} total ingredients • {ingredients.filter((ing) => ing.current_stock > 0).length}{" "}
              available
            </span>
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span className="text-green-600">Live Sync</span>
              <span className="text-xs">({new Date().toLocaleTimeString()})</span>
            </div>
            {/* ✅ DEBUG: Show ingredient count in UI */}
            <Badge variant="outline" className="bg-blue-50">
              Debug: {ingredients.length} items
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatingRecipe} onOpenChange={setIsCreatingRecipe}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Combined Recipe</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="ingredients">Ingredients ({ingredients.length} available)</TabsTrigger>
                  <TabsTrigger value="costing">Costing & Nutrition</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipe-name">Recipe Name *</Label>
                      <Input
                        id="recipe-name"
                        value={newRecipe.name}
                        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                        placeholder="Enter recipe name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipe-category">Category *</Label>
                      <Select
                        value={newRecipe.category}
                        onValueChange={(value) => setNewRecipe({ ...newRecipe, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Main Course">Main Course</SelectItem>
                          <SelectItem value="Side Dish">Side Dish</SelectItem>
                          <SelectItem value="Appetizer">Appetizer</SelectItem>
                          <SelectItem value="Dessert">Dessert</SelectItem>
                          <SelectItem value="Beverage">Beverage</SelectItem>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="Vegan">Vegan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newRecipe.description}
                        onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                        placeholder="Describe the recipe..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="yield-per-batch">Portions per Batch</Label>
                      <Input
                        id="yield-per-batch"
                        type="number"
                        value={newRecipe.yield_per_batch}
                        onChange={(e) =>
                          setNewRecipe({ ...newRecipe, yield_per_batch: Number.parseInt(e.target.value) || 10 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                      <Input
                        id="prep-time"
                        type="number"
                        value={newRecipe.prep_time_minutes}
                        onChange={(e) =>
                          setNewRecipe({ ...newRecipe, prep_time_minutes: Number.parseInt(e.target.value) || 15 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="markup">Markup Percentage (%)</Label>
                      <Input
                        id="markup"
                        type="number"
                        value={newRecipe.markup_percentage}
                        onChange={(e) =>
                          setNewRecipe({ ...newRecipe, markup_percentage: Number.parseInt(e.target.value) || 50 })
                        }
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="selling-price">Selling Price (Optional)</Label>
                      <Input
                        id="selling-price"
                        type="number"
                        step="0.01"
                        value={newRecipe.selling_price}
                        onChange={(e) =>
                          setNewRecipe({ ...newRecipe, selling_price: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="Auto-calculated if empty"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Recipe Ingredients</h3>
                    <Button onClick={addIngredientToRecipe} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>

                  {ingredients.length === 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <h4 className="font-medium text-amber-800 dark:text-amber-200">No Ingredients Available</h4>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Please add ingredients in the Inventory module first before creating recipes.
                      </p>
                    </div>
                  )}

                  {recipeIngredients.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Quantity per Batch</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Cost per Unit</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeIngredients.map((ingredient, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={ingredient.ingredient_id ? ingredient.ingredient_id.toString() : ""}
                                onValueChange={(value) => updateRecipeIngredient(index, "ingredient_id", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ingredient" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map((ing) => (
                                    <SelectItem key={ing.id} value={ing.id.toString()}>
                                      {ing.name} (${ing.cost_per_unit.toFixed(2)}/{ing.unit}) - Stock:{" "}
                                      {ing.current_stock} - {ing.category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={ingredient.quantity_needed || ""}
                                onChange={(e) => updateRecipeIngredient(index, "quantity_needed", e.target.value)}
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>{ingredient.unit || "-"}</TableCell>
                            <TableCell>${(ingredient.cost_per_unit || 0).toFixed(2)}</TableCell>
                            <TableCell>${(ingredient.total_cost || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeIngredientFromRecipe(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="costing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Calculation & Nutrition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Total Raw Cost</Label>
                          <div className="text-2xl font-bold">${costs.totalRawCost.toFixed(2)}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cost per Portion</Label>
                          <div className="text-2xl font-bold">${costs.costPerPortion.toFixed(2)}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Selling Price</Label>
                          <div className="text-2xl font-bold text-green-600">${costs.sellingPrice.toFixed(2)}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Profit Margin</Label>
                          <div className="text-2xl font-bold text-blue-600">{newRecipe.markup_percentage}%</div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">Nutrition Information</h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Nutrition facts will be automatically calculated based on ingredients and displayed in POS and
                          Customer Portal.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingRecipe(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveRecipe}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Recipe
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ChefHat className="h-4 w-4 mr-2" />
                Prepare Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Prepare Recipe Batch</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipe-select">Select Recipe</Label>
                  <Select
                    value={selectedRecipeForBatch?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const recipe = recipes.find((r) => r.id === Number.parseInt(value))
                      setSelectedRecipeForBatch(recipe)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a recipe to prepare" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id.toString()}>
                          {recipe.name} (Current: {recipe.available_portions} portions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRecipeForBatch && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="batch-count">Number of Batches</Label>
                        <Input
                          id="batch-count"
                          type="number"
                          min="1"
                          value={batchCount}
                          onChange={(e) => setBatchCount(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prepared-by">Prepared By</Label>
                        <Input
                          id="prepared-by"
                          value={preparedBy}
                          onChange={(e) => setPreparedBy(e.target.value)}
                          placeholder="Chef name"
                        />
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium mb-2">Batch Summary</h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Portions per batch:</span>{" "}
                          {selectedRecipeForBatch.yield_per_batch}
                        </p>
                        <p>
                          <span className="font-medium">Total portions to produce:</span>{" "}
                          {selectedRecipeForBatch.yield_per_batch * batchCount}
                        </p>
                        <p>
                          <span className="font-medium">Total cost:</span> $
                          {(selectedRecipeForBatch.total_raw_cost * batchCount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {!canMakeBatch(selectedRecipeForBatch.id, batchCount) && (
                      <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            Insufficient Ingredients
                          </span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Not enough ingredients in stock to prepare this batch.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePrepareBatch}
                    disabled={
                      !selectedRecipeForBatch ||
                      !preparedBy.trim() ||
                      !canMakeBatch(selectedRecipeForBatch?.id, batchCount)
                    }
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Prepare Batch
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kitchen Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recipes</p>
                <p className="text-2xl font-bold">{recipes.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{getPublishedRecipes().length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Portions</p>
                <p className="text-2xl font-bold">{recipes.reduce((sum, r) => sum + r.available_portions, 0)}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Prep Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(recipes.reduce((sum, r) => sum + r.prep_time_minutes, 0) / recipes.length || 0)} min
                </p>
              </div>
              <Clock className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Ingredients Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Individual Ingredients (Sellable Items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark ingredients as "cooked" to make them available for individual sale in the POS system.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellableIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.category}</TableCell>
                    <TableCell>
                      {ingredient.current_stock} {ingredient.unit}
                    </TableCell>
                    <TableCell>${ingredient.individual_selling_price?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={ingredient.is_cooked ? "default" : "secondary"}>
                        {ingredient.is_cooked ? "Cooked & Ready" : "Raw"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={ingredient.is_cooked ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleMarkAsCooked(ingredient.id, !ingredient.is_cooked)}
                      >
                        {ingredient.is_cooked ? "Mark as Raw" : "Mark as Cooked"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Combined Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Prep Time</TableHead>
                <TableHead>Raw Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Available Portions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => {
                const recipeStatus = getRecipeStatus(recipe)
                const StatusIcon = recipeStatus.icon

                return (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>{recipe.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.prep_time_minutes} min
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">${recipe.total_raw_cost.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${recipe.selling_price.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">{recipe.available_portions}</TableCell>
                    <TableCell>
                      <Badge variant={recipeStatus.variant} className={recipeStatus.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {recipeStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedRecipe(recipe)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{selectedRecipe?.name} - Recipe Details</DialogTitle>
                            </DialogHeader>
                            {selectedRecipe && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Recipe Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <span className="font-medium">Category:</span> {selectedRecipe.category}
                                      </p>
                                      <p>
                                        <span className="font-medium">Prep Time:</span>{" "}
                                        {selectedRecipe.prep_time_minutes} minutes
                                      </p>
                                      <p>
                                        <span className="font-medium">Selling Price:</span> $
                                        {selectedRecipe.selling_price.toFixed(2)}
                                      </p>
                                      <p>
                                        <span className="font-medium">Available Portions:</span>{" "}
                                        {selectedRecipe.available_portions}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Nutrition per Portion</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <p>
                                        <span className="font-medium">Calories:</span>{" "}
                                        {selectedRecipe.nutrition_per_portion.calories}
                                      </p>
                                      <p>
                                        <span className="font-medium">Protein:</span>{" "}
                                        {selectedRecipe.nutrition_per_portion.protein}g
                                      </p>
                                      <p>
                                        <span className="font-medium">Carbs:</span>{" "}
                                        {selectedRecipe.nutrition_per_portion.carbs}g
                                      </p>
                                      <p>
                                        <span className="font-medium">Fat:</span>{" "}
                                        {selectedRecipe.nutrition_per_portion.fat}g
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Ingredients Required per Batch</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Cost</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedRecipe.ingredients.map((ingredient: any, index: number) => (
                                        <TableRow key={index}>
                                          <TableCell>{ingredient.ingredient_name}</TableCell>
                                          <TableCell>{ingredient.quantity_needed}</TableCell>
                                          <TableCell>{ingredient.unit}</TableCell>
                                          <TableCell>${ingredient.total_cost.toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecipeForBatch(recipe)
                            setShowBatchDialog(true)
                          }}
                        >
                          <ChefHat className="h-4 w-4 mr-1" />
                          Prepare
                        </Button>

                        {recipe.is_published ? (
                          <Button variant="outline" size="sm" onClick={() => handleUnpublishRecipe(recipe.id)}>
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublishRecipe(recipe.id)}
                            disabled={recipe.available_portions === 0}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Publish to POS
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
