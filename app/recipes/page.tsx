'use client'

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RecipeList } from "@/components/recipes/RecipeList";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipeDetailsDialog } from "@/components/recipes/RecipeDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from '@/components/ui/ProtectedRoute';

export default function RecipesPage() {
  const { toast } = useToast();
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<any[]>([]);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const staticCategories = [
    'Soups',
    'Salads',
    'Starters',
    'Dessert',
    'International Breakfast',
    'Pancakes & Crepes',
    'Somali Breakfast',
    'Eggs',
    'Toast',
    'Fruits',
    'Main Dishes',
    'Chicken Wings',
    'Extra Chips',
    'Sea Food',
    'Chicken',
    'Red Meat',
    'Fish',
    'Shwarma & Wraps',
    'Fatah',
    'Mandi',
    'Fir & Sat Special',
    'Kids Menu',
    'Coffee',
    'Tea',
    'Milk Shakes',
    'Juices',
    'Soda',
    'Water',
    'Mocktails',
    'Special Ice Cream',
    'Ice Cream',
  ];
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<any>(null);

  // Filter recipes based on search and filters
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRestaurant = selectedRestaurant === "all" || recipe.restaurant === selectedRestaurant;
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    
    return matchesSearch && matchesRestaurant && matchesCategory;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRestaurant("all");
    setSelectedCategory("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedRestaurant !== "all" || selectedCategory !== "all";

  // Fetch all ingredients and batches for the form
  useEffect(() => {
    async function fetchOptions() {
      const { data: ingredients } = await supabase.from("ingredients").select("id, name, unit");
      const { data: batches } = await supabase.from("batches").select("id, name, yield_unit as unit");
      setIngredientOptions((ingredients || []).filter(i => i && typeof i === 'object').map(i => ({ ...(i as object), type: "ingredient" })));
      setBatchOptions((batches || []).filter(b => b && typeof b === 'object').map(b => ({ ...(b as object), type: "batch" })));
    }
    fetchOptions();
  }, []);

  // Fetch all recipes and their components
  const fetchRecipes = async () => {
    setLoading(true);
    const { data: recipesData } = await supabase.from("recipes").select("*");
    if (!recipesData) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    // For each recipe, fetch its components and resolve names/units
    const allRecipes = await Promise.all(recipesData.map(async (recipe) => {
      const { data: components } = await supabase
        .from("recipe_components")
        .select("*")
        .eq("recipe_id", recipe.id);
      // For each component, get the name/unit from the correct table
      const resolvedComponents = await Promise.all((components || []).map(async (c) => {
        if (c.component_type === "ingredient") {
          const { data: ing } = await supabase.from("ingredients").select("name, unit").eq("id", c.component_id).single();
          return { ...c, name: ing?.name || "Unknown", unit: c.unit || ing?.unit, type: "ingredient", available: true };
        } else {
          const { data: batch } = await supabase.from("batches").select("name, yield_unit").eq("id", c.component_id).single();
          return { ...c, name: batch?.name || "Unknown", unit: c.unit || batch?.yield_unit, type: "batch", available: true };
        }
      }));
      return {
        ...recipe,
        components: resolvedComponents,
        available: true, // You can add logic to check stock here
      };
    }));
    setRecipes(allRecipes);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Register recipe with KRA
  const handleRegisterKRA = async (recipe: any) => {
    try {
      const res = await fetch('/api/kra/register-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recipe.id,
          name: recipe.name,
          price: recipe.price,
          description: recipe.description,
          itemCd: recipe.itemCd || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Registered with KRA', description: `itemCd: ${data.itemCd}` })
        await fetchRecipes()
      } else {
        toast({ title: 'KRA Registration Failed', description: data.error || 'Unknown error', variant: 'destructive' })
        await fetchRecipes()
      }
    } catch (e: any) {
      toast({ title: 'KRA Registration Error', description: e.message, variant: 'destructive' })
    }
  }

  // Add a new recipe and its components
  const handleAddRecipe = async (data: any) => {
    try {
      if (editMode && data.id) {
        // Update existing recipe
        const { error: recipeError } = await supabase
          .from("recipes")
          .update({ 
            name: data.name, 
            description: data.description, 
            restaurant: data.restaurant,
            price: data.price, 
            category: data.category 
          })
          .eq("id", data.id);
        
        if (recipeError) {
          toast({
            title: "Error Updating Recipe",
            description: recipeError.message,
            variant: "destructive",
          });
          throw new Error(recipeError.message);
        }
        
        // Delete existing components and insert new ones
        await supabase.from("recipe_components").delete().eq("recipe_id", data.id);
        
        const componentsToInsert = data.components.map((c: any) => ({
          recipe_id: data.id,
          component_type: c.type,
          component_id: c.id,
          quantity: c.quantity,
          unit: c.unit,
        }));
        
        await supabase.from("recipe_components").insert(componentsToInsert);
        
        // Refetch recipes and close form
        await fetchRecipes();
        setShowRecipeForm(false);
        setEditMode(false);
        setRecipeToEdit(null);
        
        toast({
          title: "Recipe Updated",
          description: `Recipe "${data.name}" was updated successfully!`,
        });
      } else {
        // Create new recipe
        const { data: newRecipe, error } = await supabase
          .from("recipes")
          .insert([{ name: data.name, description: data.description, restaurant: data.restaurant, price: data.price, category: data.category }])
          .select()
          .single();
        
        if (error || !newRecipe) {
          toast({
            title: "Error Adding Recipe",
            description: error?.message || "Failed to add recipe.",
            variant: "destructive",
          });
          throw new Error(error?.message || "Failed to add recipe.");
        }
        
        // Insert components
        const componentsToInsert = data.components.map((c: any) => ({
          recipe_id: newRecipe.id,
          component_type: c.type,
          component_id: c.id,
          quantity: c.quantity,
          unit: c.unit,
        }));
        
        await supabase.from("recipe_components").insert(componentsToInsert);
        
        // Register with KRA
        await handleRegisterKRA({
          id: newRecipe.id,
          name: newRecipe.name,
          price: newRecipe.price,
          description: newRecipe.description,
          itemCd: newRecipe.itemCd,
        })
        // After successful add, refetch recipes from DB for consistency
        await fetchRecipes();
        setShowRecipeForm(false);
        
        toast({
          title: "Recipe Added",
          description: `Recipe "${data.name}" was added successfully!`,
        });
      }
    } catch (error) {
      // Error is already handled with toast above
      console.error("Recipe operation failed:", error);
    }
  };

  // Handle editing a recipe
  const handleEditRecipe = (recipe: any) => {
    setRecipeToEdit(recipe);
    setEditMode(true);
    setShowRecipeForm(true);
    setShowRecipeDetails(false); // Close details dialog
  };

  // Delete a recipe and its components
  const handleDeleteRecipe = async (id: string) => {
    // First delete recipe components
    await supabase.from("recipe_components").delete().eq("recipe_id", id);
    
    // Then delete the recipe
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error Deleting Recipe",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    // Remove from UI
    setRecipes(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Recipe Deleted",
      description: "The recipe was deleted successfully.",
    });
  };

  // Handle viewing recipe details
  const handleViewDetails = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetails(true);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Recipe Menu</h1>
          <Button onClick={() => {
            setEditMode(false);
            setRecipeToEdit(null);
            setShowRecipeForm(true);
          }}>
            <Plus className="h-5 w-5 mr-2" />
            Add Recipe
          </Button>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Restaurants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Restaurants</SelectItem>
                      <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                      <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 sm:w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {staticCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {selectedRestaurant !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Restaurant: {selectedRestaurant}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setSelectedRestaurant("all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {selectedCategory}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setSelectedCategory("all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading recipes...</div>
        ) : (
          <div className="space-y-10">
            {staticCategories.map((cat) => {
              const catRecipes = filteredRecipes.filter(r => (r.category || '').toLowerCase() === cat.toLowerCase());
              if (!catRecipes.length) return null;
              return (
                <div key={cat}>
                  <h2 className="text-2xl font-bold mb-4 text-primary">{cat}</h2>
                  <RecipeList 
                    recipes={catRecipes} 
                    onDelete={handleDeleteRecipe}
                    onViewDetails={handleViewDetails}
                    onRegisterKRA={handleRegisterKRA}
                  />
                </div>
              );
            })}
            {/* Handle Uncategorized recipes */}
            {(() => {
              const uncategorized = filteredRecipes.filter(r => !r.category || !staticCategories.some(cat => cat.toLowerCase() === (r.category || '').toLowerCase()));
              if (!uncategorized.length) return null;
              return (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-primary">Uncategorized</h2>
                  <RecipeList 
                    recipes={uncategorized} 
                    onDelete={handleDeleteRecipe}
                    onViewDetails={handleViewDetails}
                    onRegisterKRA={handleRegisterKRA}
                  />
                </div>
              );
            })()}
            
            {/* No results message */}
            {filteredRecipes.length === 0 && recipes.length > 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">No recipes found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
        <RecipeForm
          open={showRecipeForm}
          onOpenChange={(open) => {
            setShowRecipeForm(open);
            if (!open) {
              // Reset edit mode when form is closed
              setEditMode(false);
              setRecipeToEdit(null);
            }
          }}
          onSubmit={handleAddRecipe}
          ingredientOptions={ingredientOptions}
          batchOptions={batchOptions}
          categories={staticCategories}
          editMode={editMode}
          recipe={recipeToEdit}
        />
        <RecipeDetailsDialog
          open={showRecipeDetails}
          onOpenChange={setShowRecipeDetails}
          recipe={selectedRecipe}
          onEdit={handleEditRecipe}
        />
      </div>
    </ProtectedRoute>
  );
} 