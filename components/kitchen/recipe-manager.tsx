"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import type { Recipe as UnifiedRecipe, Ingredient as RecipeIngredient } from "@/types/unified-system"
import type { BaseIngredient as UnifiedIngredient } from "@/types/unified-system"
import { useToast } from "@/hooks/use-toast"

// Simplified version for this component
interface Ingredient extends UnifiedIngredient {
  current_stock: number
}

const measurementUnits = [
  { value: 'g', label: 'Grams (g)', type: 'weight' },
  { value: 'kg', label: 'Kilograms (kg)', type: 'weight' },
  { value: 'ml', label: 'Milliliters (ml)', type: 'volume' },
  { value: 'l', label: 'Liters (l)', type: 'volume' },
  { value: 'piece', label: 'Piece', type: 'count' },
  { value: 'tbsp', label: 'Tablespoon', type: 'custom' },
  { value: 'tsp', label: 'Teaspoon', type: 'custom' },
]

interface RecipeManagerProps {
  recipes: UnifiedRecipe[]
  inventoryIngredients: Ingredient[]
  addRecipe: (recipe: Omit<UnifiedRecipe, "id">) => UnifiedRecipe
  publishRecipe: (recipeId: number) => void
  unpublishRecipe: (recipeId: number) => void
  // Stubs for future implementation
  // updateRecipe: (recipe: UnifiedRecipe) => void;
  // deleteRecipe: (recipeId: number) => void;
}

const EMPTY_RECIPE: Omit<UnifiedRecipe, "id"> = {
  name: "",
  category: "",
  description: "",
  yield_per_batch: 1,
  yield_unit: "portions",
  prep_time_minutes: 15,
  ingredients: [],
  total_raw_cost: 0,
  selling_price: 0,
  markup_percentage: 50,
  is_published: false,
  nutrition_per_portion: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  available_portions: 0,
}

export function RecipeManager({
  recipes,
  inventoryIngredients,
  addRecipe,
  publishRecipe,
  unpublishRecipe,
}: RecipeManagerProps) {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRecipe, setNewRecipe] = useState(EMPTY_RECIPE)

  const handleAddIngredient = () => {
    const emptyIngredient: RecipeIngredient = {
      ingredient_id: 0,
      ingredient_name: "",
      quantity_needed: 1,
      unit: "g",
      cost_per_unit: 0,
      total_cost: 0,
    }
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, emptyIngredient],
    }))
  }

  const handleRemoveIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const updatedIngredients = [...newRecipe.ingredients]
    const currentIngredient = updatedIngredients[index]

    if (field === "ingredient_id") {
      const selected = inventoryIngredients.find(i => i.id === Number(value))
      if (selected) {
        currentIngredient.ingredient_id = selected.id
        currentIngredient.ingredient_name = selected.name
        currentIngredient.unit = selected.unit
        currentIngredient.cost_per_unit = selected.cost_per_unit || 0
      }
    } else {
      // @ts-ignore
      currentIngredient[field] = value
    }

    // Recalculate cost
    currentIngredient.total_cost =
      currentIngredient.quantity_needed * currentIngredient.cost_per_unit
    
    setNewRecipe(prev => ({ ...prev, ingredients: updatedIngredients }))
  }
  
  const totalRawCost = useMemo(() => {
    return newRecipe.ingredients.reduce((sum, ing) => sum + ing.total_cost, 0)
  }, [newRecipe.ingredients])

  const suggestedSellingPrice = useMemo(() => {
    const cost = totalRawCost / (newRecipe.yield_per_batch || 1)
    return cost * (1 + (newRecipe.markup_percentage || 0) / 100)
  }, [totalRawCost, newRecipe.yield_per_batch, newRecipe.markup_percentage])

  const handleSaveRecipe = () => {
    if (!newRecipe.name || !newRecipe.category || newRecipe.ingredients.length === 0) {
      toast({
        title: "Incomplete Recipe",
        description: "Please provide a name, category, and at least one ingredient.",
        variant: "destructive",
      })
      return
    }

    const finalRecipe = {
      ...newRecipe,
      total_raw_cost: totalRawCost,
      selling_price: newRecipe.selling_price || suggestedSellingPrice,
    }

    addRecipe(finalRecipe)
    
    toast({
      title: "Recipe Created!",
      description: `The recipe "${finalRecipe.name}" has been saved.`,
    })
    
    setNewRecipe(EMPTY_RECIPE)
    setIsCreateDialogOpen(false)
  }

  const getRecipeStatus = (recipe: UnifiedRecipe) => {
    if (recipe.is_published) {
      return { text: "Published", color: "bg-green-500", icon: CheckCircle }
    }
    return { text: "Draft", color: "bg-gray-500", icon: Edit }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recipe Management</CardTitle>
            <CardDescription>
              Create, view, and manage all your recipes.
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create a New Recipe</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new recipe for your menu.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[70vh] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-name">Recipe Name</Label>
                      <Input
                        id="recipe-name"
                        placeholder="e.g., Classic Burger"
                        value={newRecipe.name}
                        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-category">Category</Label>
                      <Input
                        id="recipe-category"
                        placeholder="e.g., Main Course"
                        value={newRecipe.category}
                        onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-description">Description</Label>
                      <Textarea
                        id="recipe-description"
                        placeholder="A short description of the recipe."
                        value={newRecipe.description}
                        onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label htmlFor="recipe-yield">Yield</Label>
                        <Input
                          id="recipe-yield"
                          type="number"
                          min="1"
                          value={newRecipe.yield_per_batch}
                          onChange={(e) => setNewRecipe({ ...newRecipe, yield_per_batch: Number(e.target.value) })}
                        />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="recipe-yield-unit">Yield Unit</Label>
                         <Select
                           value={newRecipe.yield_unit}
                           onValueChange={(value) => setNewRecipe({ ...newRecipe, yield_unit: value })}
                         >
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portions">Portions</SelectItem>
                            <SelectItem value="g">Grams</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="l">Liters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                        <Input
                          id="prep-time"
                          type="number"
                          min="0"
                          value={newRecipe.prep_time_minutes}
                          onChange={(e) => setNewRecipe({ ...newRecipe, prep_time_minutes: Number(e.target.value) })}
                        />
                      </div>
                  </div>

                  {/* Column 2: Ingredients and Costing */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h3 className="text-lg font-medium">Ingredients</h3>
                       <Button variant="outline" size="sm" onClick={handleAddIngredient}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add Ingredient
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newRecipe.ingredients.map((ing, index) => (
                        <div key={index} className="flex gap-2 items-center p-2 border rounded-md">
                          <Select onValueChange={(value) => handleIngredientChange(index, 'ingredient_id', value)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select Ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryIngredients.map(invIng => (
                                <SelectItem key={invIng.id} value={String(invIng.id)}>
                                  {invIng.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="0"
                            step="any"
                            className="w-20"
                            value={ing.quantity_needed}
                            onChange={(e) => handleIngredientChange(index, 'quantity_needed', Number(e.target.value))}
                          />
                          <Select value={ing.unit} onValueChange={(value) => handleIngredientChange(index, 'unit', value)}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Unit"/>
                            </SelectTrigger>
                            <SelectContent>
                              {measurementUnits.map(unit => (
                                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(index)}>
                            <Trash2 className="h-4 w-4 text-red-500"/>
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <h3 className="text-lg font-medium pt-4">Costing</h3>
                     <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                       <div className="flex justify-between items-center">
                        <Label>Total Raw Cost</Label>
                        <span className="font-medium">${totalRawCost.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between items-center">
                        <Label htmlFor="markup">Markup (%)</Label>
                        <Input
                           id="markup"
                          type="number"
                           className="w-24"
                          value={newRecipe.markup_percentage}
                          onChange={(e) => setNewRecipe({ ...newRecipe, markup_percentage: Number(e.target.value) })}
                        />
                      </div>
                       <div className="flex justify-between items-center">
                        <Label>Suggested Price</Label>
                        <span className="font-medium">${suggestedSellingPrice.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between items-center">
                        <Label htmlFor="selling-price">Final Selling Price</Label>
                        <Input
                           id="selling-price"
                          type="number"
                           className="w-24"
                           placeholder={suggestedSellingPrice.toFixed(2)}
                          onChange={(e) => setNewRecipe({ ...newRecipe, selling_price: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRecipe}>Save Recipe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Yield</TableHead>
              <TableHead>Raw Cost</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map(recipe => {
              const status = getRecipeStatus(recipe)
              return (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>{recipe.category}</TableCell>
                  <TableCell>{recipe.yield_per_batch} {recipe.yield_unit}</TableCell>
                  <TableCell>${recipe.total_raw_cost.toFixed(2)}</TableCell>
                  <TableCell>${recipe.selling_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <status.icon
                        className={`mr-2 h-3 w-3 ${
                          status.text === "Published"
                            ? "text-green-500"
                            : "text-gray-500"
                        }`}
                      />
                      {status.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {recipe.is_published ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unpublishRecipe(recipe.id)}
                      >
                        <XCircle className="h-4 w-4 text-amber-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => publishRecipe(recipe.id)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
