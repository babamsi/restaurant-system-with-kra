import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package } from "lucide-react";
import { ImageUpload } from '@/components/recipes/ImageUpload'

interface ComponentOption {
  id: string;
  name: string;
  type: "ingredient" | "batch";
  unit: string;
}

interface InventoryIngredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  itemCd?: string;
  itemClsCd?: string;
  taxTyCd?: string;
}

export interface RecipeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  ingredientOptions: ComponentOption[];
  batchOptions: ComponentOption[];
  categories: string[];
  editMode?: boolean;
  recipe?: any;
  inventoryIngredients?: InventoryIngredient[];
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  ingredientOptions,
  batchOptions,
  categories,
  editMode = false,
  recipe,
  inventoryIngredients = [],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    restaurant: "Omel Dunia" as 'Omel Dunia' | 'Mamma Mia',
    price: "",
    category: "",
    components: [] as any[],
    recipeType: "complex" as "complex" | "inventory", // New field
    selectedInventoryItem: null as InventoryIngredient | null, // For direct inventory sales
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (editMode && recipe) {
        setFormData({
          name: recipe.name || "",
          description: recipe.description || "",
          restaurant: recipe.restaurant || "Omel Dunia",
          price: recipe.price?.toString() || "",
          category: recipe.category || "",
          components: recipe.components?.map((comp: any) => ({
            id: comp.component_id,
            type: comp.component_type,
            quantity: comp.quantity,
            unit: comp.unit,
            name: comp.name,
          })) || [],
          recipeType: recipe.recipeType || "complex",
          selectedInventoryItem: recipe.selectedInventoryItem || null,
        });
        setImagePreviewUrl(recipe.image_url || null)
      } else {
        setFormData({
          name: "",
          description: "",
          restaurant: "Omel Dunia",
          price: "",
          category: "",
          components: [],
          recipeType: "complex",
          selectedInventoryItem: null,
        });
        setImageFile(null)
        setImagePreviewUrl(null)
      }
    }
  }, [open, editMode, recipe]);

  const addComponent = () => {
    setFormData(prev => ({ ...prev, components: [...prev.components, { type: "ingredient", id: "", quantity: 1, unit: "" }] }));
  };

  const updateComponent = (idx: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.map((c, i) => i === idx ? { ...c, [field]: value } : c)
    }));
  };

  const removeComponent = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form based on recipe type
    if (!formData.name.trim()) {
      return;
    }

    if (formData.recipeType === "complex") {
      if (formData.components.some(c => !c.id || !c.quantity || !c.unit)) {
        return;
      }
    } else if (formData.recipeType === "inventory") {
      if (!formData.selectedInventoryItem) {
        return;
      }
    }
    
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      id: editMode ? recipe?.id : undefined,
      imageFile,
      currentImageUrl: imagePreviewUrl || undefined,
    };
    Promise.resolve(onSubmit(submitData)).finally(() => {
      setIsSubmitting(false);
    });
  };

  // Filter inventory ingredients that have KRA codes
  const availableInventoryItems = inventoryIngredients.filter(item => 
    item.itemCd && item.itemClsCd && item.current_stock > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Recipe" : "Add New Recipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue={editMode ? "details" : "type"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {!editMode && <TabsTrigger value="type">Recipe Type</TabsTrigger>}
              <TabsTrigger value="details">Recipe Details</TabsTrigger>
            </TabsList>

            {!editMode && (
            <TabsContent value="type" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Select Recipe Type</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how you want to create this recipe
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Complex Recipe Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.recipeType === "complex" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, recipeType: "complex" }))}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Complex Recipe</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create a recipe with multiple ingredients and components. 
                          Perfect for dishes that require multiple ingredients.
                        </p>
                        {formData.recipeType === "complex" && (
                          <Badge variant="secondary" className="mt-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Inventory Sale Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.recipeType === "inventory" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, recipeType: "inventory" }))}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Direct Inventory Sale</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sell inventory items directly. Uses existing KRA codes and tax information.
                          Available items: {availableInventoryItems.length}
                        </p>
                        {formData.recipeType === "inventory" && (
                          <Badge variant="secondary" className="mt-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {formData.recipeType === "inventory" && availableInventoryItems.length === 0 && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      No inventory items available for direct sale. All items must have KRA codes and stock available.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            )}

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4">
                {/* Image upload moved to top */}
                <ImageUpload
                  value={imagePreviewUrl || ''}
                  onChange={(url) => setImagePreviewUrl(url)}
                />
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Recipe name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Description (optional)" />
                </div>
                <div>
                  <Label>Restaurant</Label>
                  <Select value={formData.restaurant} onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant: value as 'Omel Dunia' | 'Mamma Mia' }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Omel Dunia">Omel Dunia</SelectItem>
                      <SelectItem value="Mamma Mia">Mamma Mia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 25.00"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show different content based on recipe type */}
                {formData.recipeType === "complex" ? (
                  <div>
                    <Label>Components</Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {formData.components.map((comp, idx) => {
                        const options = comp.type === "ingredient" ? ingredientOptions : batchOptions;
                        return (
                          <div
                            key={idx}
                            className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full"
                          >
                            <div className="w-full sm:w-auto min-w-0">
                              <Select value={comp.type} onValueChange={v => updateComponent(idx, "type", v as "ingredient" | "batch") }>
                                <SelectTrigger className="w-full min-w-0 max-w-full">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ingredient">Ingredient</SelectItem>
                                  <SelectItem value="batch">Batch</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <Select value={comp.id} onValueChange={v => updateComponent(idx, "id", v)}>
                                <SelectTrigger className="w-full min-w-0 max-w-full">
                                  <SelectValue placeholder={comp.type === "ingredient" ? "Select Ingredient" : "Select Batch"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map(opt => (
                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-24 min-w-0">
                              <Input
                                type="number"
                                min={1}
                                value={comp.quantity}
                                onChange={e => updateComponent(idx, "quantity", Number(e.target.value))}
                                className="w-full min-w-0"
                                placeholder="Qty"
                              />
                            </div>
                            <div className="w-24 min-w-0">
                              <Select value={comp.unit} onValueChange={v => updateComponent(idx, "unit", v)}>
                                <SelectTrigger className="w-full min-w-0 max-w-full">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.find(opt => opt.id === comp.id)?.unit && (
                                    <SelectItem value={options.find(opt => opt.id === comp.id)?.unit!}>
                                      {options.find(opt => opt.id === comp.id)?.unit}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-auto">
                              <Button variant="ghost" size="icon" onClick={() => removeComponent(idx)}>
                                ×
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <Button variant="outline" size="sm" onClick={addComponent} className="w-full sm:w-auto">
                        + Add Component
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Select Inventory Item</Label>
                    <Select 
                      value={formData.selectedInventoryItem?.id || ""} 
                      onValueChange={(value) => {
                        const selectedItem = availableInventoryItems.find(item => item.id === value);
                        setFormData(prev => ({ 
                          ...prev, 
                          selectedInventoryItem: selectedItem || null,
                          name: selectedItem?.name || prev.name,
                          price: selectedItem?.cost_per_unit?.toString() || prev.price
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select inventory item to sell" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{item.name}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.current_stock} {item.unit}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  KRA: {item.itemCd}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.selectedInventoryItem && (
                      <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Stock:</span>
                            <p>{formData.selectedInventoryItem.current_stock} {formData.selectedInventoryItem.unit}</p>
                          </div>
                          <div>
                            <span className="font-medium">Cost per Unit:</span>
                            <p>Ksh {formData.selectedInventoryItem.cost_per_unit.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="font-medium">KRA Item Code:</span>
                            <p className="font-mono text-xs">{formData.selectedInventoryItem.itemCd}</p>
                          </div>
                          <div>
                            <span className="font-medium">Tax Type:</span>
                            <p>{formData.selectedInventoryItem.taxTyCd || "B"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.name.trim() ||
                (formData.recipeType === "complex" && formData.components.some(c => !c.id || !c.quantity || !c.unit)) ||
                (formData.recipeType === "inventory" && !formData.selectedInventoryItem)
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : (editMode ? "Update Recipe" : "Add Recipe")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 