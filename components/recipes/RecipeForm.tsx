import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ComponentOption {
  id: string;
  name: string;
  type: "ingredient" | "batch";
  unit: string;
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
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    restaurant: "Omel Dunia" as 'Omel Dunia' | 'Mamma Mia',
    price: "",
    category: "",
    components: [] as any[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        });
      } else {
        setFormData({
          name: "",
          description: "",
          restaurant: "Omel Dunia",
          price: "",
          category: "",
          components: [],
        });
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
    
    // Validate form
    if (!formData.name.trim()) {
      return;
    }
    
    if (formData.components.some(c => !c.id || !c.quantity || !c.unit)) {
      return;
    }
    
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      id: editMode ? recipe?.id : undefined,
    };
    Promise.resolve(onSubmit(submitData)).finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Recipe" : "Add New Recipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
          </div>
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
                formData.components.some(c => !c.id || !c.quantity || !c.unit)
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