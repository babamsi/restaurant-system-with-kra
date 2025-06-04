"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, Clock, Users, DollarSign, TrendingUp, Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockRecipes, mockIngredients } from "@/data/mock-data"
import type { RecipeWithAvailability, RecipeIngredient } from "@/data/mock-data"

export function RecipeManager() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<RecipeWithAvailability[]>(mockRecipes)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithAvailability | null>(null)
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false)

  // New recipe form state
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    category: "",
    default_yield: 50,
    markup_percentage: 50,
    prep_time: 15,
  })

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])

  const calculateAvailablePortions = (recipe: RecipeWithAvailability) => {
    let minPortions = Number.POSITIVE_INFINITY

    for (const ingredient of recipe.ingredients) {
      const stockIngredient = mockIngredients.find((ing) => ing.id === ingredient.ingredient_id)
      if (stockIngredient) {
        const possiblePortions = Math.floor(stockIngredient.current_stock / ingredient.quantity_per_batch)
        minPortions = Math.min(minPortions, possiblePortions)
      }
    }

    return minPortions === Number.POSITIVE_INFINITY ? 0 : Math.min(minPortions, recipe.available_portions)
  }

  const getRecipeStatus = (recipe: RecipeWithAvailability) => {
    const availablePortions = calculateAvailablePortions(recipe)

    if (availablePortions === 0) {
      return { status: "Out of Stock", variant: "destructive" as const }
    } else if (availablePortions <= 10) {
      return { status: "Low Stock", variant: "outline" as const, className: "text-amber-500 border-amber-500" }
    } else {
      return { status: "Available", variant: "default" as const }
    }
  }

  const addIngredientToRecipe = () => {
    const newIngredient: RecipeIngredient = {
      ingredient_id: 0,
      ingredient_name: "",
      quantity_per_batch: 0,
      unit: "",
      cost_per_unit: 0,
      total_cost: 0,
    }
    setRecipeIngredients([...recipeIngredients, newIngredient])
  }

  const updateRecipeIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...recipeIngredients]

    if (field === "ingredient_id") {
      const selectedIngredient = mockIngredients.find((ing) => ing.id === Number.parseInt(value))
      if (selectedIngredient) {
        updated[index] = {
          ...updated[index],
          ingredient_id: selectedIngredient.id,
          ingredient_name: selectedIngredient.name,
          unit: selectedIngredient.unit,
          cost_per_unit: selectedIngredient.cost_per_unit,
          total_cost: updated[index].quantity_per_batch * selectedIngredient.cost_per_unit,
        }
      }
    } else if (field === "quantity_per_batch") {
      updated[index] = {
        ...updated[index],
        [field]: Number.parseFloat(value) || 0,
        total_cost: (Number.parseFloat(value) || 0) * updated[index].cost_per_unit,
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
    const costPerPortion = totalRawCost / newRecipe.default_yield
    const sellingPrice = costPerPortion * (1 + newRecipe.markup_percentage / 100)

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

    const recipe: RecipeWithAvailability = {
      id: recipes.length + 1,
      name: newRecipe.name,
      category: newRecipe.category,
      default_yield: newRecipe.default_yield,
      prep_time: newRecipe.prep_time,
      ingredients: recipeIngredients,
      total_raw_cost: costs.totalRawCost,
      cost_per_portion: costs.costPerPortion,
      selling_price: costs.sellingPrice,
      markup_percentage: newRecipe.markup_percentage,
      is_published: false,
      available_portions: newRecipe.default_yield,
      portion_sizes: {
        small: { multiplier: 0.7, price_adjustment: -1.0 },
        regular: { multiplier: 1.0, price_adjustment: 0.0 },
        large: { multiplier: 1.3, price_adjustment: 2.0 },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setRecipes([...recipes, recipe])

    // Reset form
    setNewRecipe({ name: "", category: "", default_yield: 50, markup_percentage: 50, prep_time: 15 })
    setRecipeIngredients([])
    setIsCreatingRecipe(false)

    toast({
      title: "Recipe Saved",
      description: `${recipe.name} has been saved successfully`,
    })
  }

  const publishRecipe = (recipeId: number) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, is_published: true, updated_at: new Date().toISOString() } : recipe,
      ),
    )

    toast({
      title: "Recipe Published",
      description: "Recipe is now available in POS system",
    })
  }

  const unpublishRecipe = (recipeId: number) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, is_published: false, updated_at: new Date().toISOString() } : recipe,
      ),
    )
  }

  const costs = calculateRecipeCosts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recipe Management</h2>
        <Dialog open={isCreatingRecipe} onOpenChange={setIsCreatingRecipe}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Recipe</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="costing">Costing</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipe-name">Recipe Name</Label>
                    <Input
                      id="recipe-name"
                      value={newRecipe.name}
                      onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                      placeholder="Enter recipe name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-category">Category</Label>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="default-yield">Default Yield (portions)</Label>
                    <Input
                      id="default-yield"
                      type="number"
                      value={newRecipe.default_yield}
                      onChange={(e) =>
                        setNewRecipe({ ...newRecipe, default_yield: Number.parseInt(e.target.value) || 50 })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                    <Input
                      id="prep-time"
                      type="number"
                      value={newRecipe.prep_time}
                      onChange={(e) => setNewRecipe({ ...newRecipe, prep_time: Number.parseInt(e.target.value) || 15 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="markup">Markup Percentage</Label>
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
                              value={ingredient.ingredient_id.toString()}
                              onValueChange={(value) => updateRecipeIngredient(index, "ingredient_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockIngredients.map((ing) => (
                                  <SelectItem key={ing.id} value={ing.id.toString()}>
                                    {ing.name} (${ing.cost_per_unit.toFixed(2)}/{ing.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={ingredient.quantity_per_batch}
                              onChange={(e) => updateRecipeIngredient(index, "quantity_per_batch", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>{ingredient.unit}</TableCell>
                          <TableCell>${ingredient.cost_per_unit.toFixed(2)}</TableCell>
                          <TableCell>${ingredient.total_cost.toFixed(2)}</TableCell>
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
                    <CardTitle>Cost Calculation</CardTitle>
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
                        <Label>Suggested Selling Price</Label>
                        <div className="text-2xl font-bold text-green-600">${costs.sellingPrice.toFixed(2)}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Profit Margin</Label>
                        <div className="text-2xl font-bold text-blue-600">{newRecipe.markup_percentage}%</div>
                      </div>
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
      </div>

      {/* Recipe Statistics */}
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
                <p className="text-2xl font-bold">{recipes.filter((r) => r.is_published).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Prep Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(recipes.reduce((sum, r) => sum + r.prep_time, 0) / recipes.length)} min
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold">
                  {Math.round(recipes.reduce((sum, r) => sum + (r.markup_percentage || 0), 0) / recipes.length)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe Inventory</CardTitle>
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
                <TableHead>Margin</TableHead>
                <TableHead>Available Portions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => {
                const recipeStatus = getRecipeStatus(recipe)
                const availablePortions = calculateAvailablePortions(recipe)

                return (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>{recipe.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.prep_time} min
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">${recipe.total_raw_cost.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${recipe.selling_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {recipe.markup_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{availablePortions}</TableCell>
                    <TableCell>
                      <Badge variant={recipeStatus.variant} className={recipeStatus.className}>
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
                                        <span className="font-medium">Prep Time:</span> {selectedRecipe.prep_time}{" "}
                                        minutes
                                      </p>
                                      <p>
                                        <span className="font-medium">Selling Price:</span> $
                                        {selectedRecipe.selling_price.toFixed(2)}
                                      </p>
                                      <p>
                                        <span className="font-medium">Profit Margin:</span>{" "}
                                        {selectedRecipe.markup_percentage}%
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Portion Sizes</h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <span className="font-medium">Small:</span> $
                                        {(
                                          selectedRecipe.selling_price +
                                          selectedRecipe.portion_sizes.small.price_adjustment
                                        ).toFixed(2)}
                                      </p>
                                      <p>
                                        <span className="font-medium">Regular:</span> $
                                        {selectedRecipe.selling_price.toFixed(2)}
                                      </p>
                                      <p>
                                        <span className="font-medium">Large:</span> $
                                        {(
                                          selectedRecipe.selling_price +
                                          selectedRecipe.portion_sizes.large.price_adjustment
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Ingredients Required</h4>
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
                                      {selectedRecipe.ingredients.map((ingredient, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{ingredient.ingredient_name}</TableCell>
                                          <TableCell>{ingredient.quantity_per_batch}</TableCell>
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

                        {recipe.is_published ? (
                          <Button variant="outline" size="sm" onClick={() => unpublishRecipe(recipe.id)}>
                            Unpublish
                          </Button>
                        ) : (
                          <Button variant="default" size="sm" onClick={() => publishRecipe(recipe.id)}>
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
