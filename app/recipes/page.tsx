'use client'

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RecipeList } from "@/components/recipes/RecipeList";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipeDetailsDialog } from "@/components/recipes/RecipeDetailsDialog";
import { useToast } from "@/hooks/use-toast";

export default function RecipesPage() {
  const { toast } = useToast();
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<any[]>([]);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);
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
          .insert([{ name: data.name, description: data.description, price: data.price, category: data.category }])
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
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading recipes...</div>
      ) : (
        <div className="space-y-10">
          {staticCategories.map((cat) => {
            const catRecipes = recipes.filter(r => (r.category || '').toLowerCase() === cat.toLowerCase());
            if (!catRecipes.length) return null;
            return (
              <div key={cat}>
                <h2 className="text-2xl font-bold mb-4 text-primary">{cat}</h2>
                <RecipeList 
                  recipes={catRecipes} 
                  onDelete={handleDeleteRecipe}
                  onViewDetails={handleViewDetails}
                />
              </div>
            );
          })}
          {/* Handle Uncategorized recipes */}
          {(() => {
            const uncategorized = recipes.filter(r => !r.category || !staticCategories.some(cat => cat.toLowerCase() === (r.category || '').toLowerCase()));
            if (!uncategorized.length) return null;
            return (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-primary">Uncategorized</h2>
                <RecipeList 
                  recipes={uncategorized} 
                  onDelete={handleDeleteRecipe}
                  onViewDetails={handleViewDetails}
                />
              </div>
            );
          })()}
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
  );
} 