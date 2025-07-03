import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { RecipeComponent } from "./RecipeCard";

export interface RecipeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: {
    id?: string;
    name: string;
    description?: string;
    price?: number;
    category?: string;
    components: RecipeComponent[];
    available: boolean;
  } | null;
  onEdit?: (recipe: any) => void;
}

export const RecipeDetailsDialog: React.FC<RecipeDetailsDialogProps> = ({
  open,
  onOpenChange,
  recipe,
  onEdit,
}) => {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold text-primary">
              {recipe.name}
            </DialogTitle>
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(recipe)}
              className="ml-4"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recipe Info */}
          <div className="space-y-4">
            {recipe.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm leading-relaxed">{recipe.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recipe.category && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Category
                  </h3>
                  <Badge variant="secondary" className="text-sm">
                    {recipe.category}
                  </Badge>
                </div>
              )}
              
              {typeof recipe.price === 'number' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Price
                  </h3>
                  <div className="text-2xl font-bold text-green-600">
                    ${recipe.price.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Components */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recipe Components</h3>
            <div className="space-y-3">
              {recipe.components.map((component, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant={component.type === "batch" ? "secondary" : "outline"}>
                      {component.type === "batch" ? "Batch" : "Ingredient"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{component.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {component.quantity} {component.unit}
                      </p>
                    </div>
                  </div>
                  {!component.available && (
                    <Badge variant="destructive" className="ml-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Availability Status */}
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Availability:</span>
            <Badge variant={recipe.available ? "default" : "destructive"}>
              {recipe.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};