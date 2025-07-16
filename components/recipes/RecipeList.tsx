import React from "react";
import { RecipeCard, RecipeCardProps } from "./RecipeCard";

export interface RecipeListProps {
  recipes: RecipeCardProps[];
  onDelete?: (id: string) => void;
  onViewDetails?: (recipe: RecipeCardProps) => void;
  onRegisterKRA?: (recipe: RecipeCardProps) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onDelete, onViewDetails, onRegisterKRA }) => {
  if (!recipes.length) {
    return (
      <div className="col-span-full text-center text-muted-foreground py-12">
        No recipes yet. Click "Add Recipe" to create your first menu item.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {recipes.map((recipe, idx) => (
        <RecipeCard 
          key={recipe.id || idx} 
          {...recipe} 
          onDelete={onDelete}
          onViewDetails={onViewDetails ? () => onViewDetails(recipe) : undefined}
          onRegisterKRA={onRegisterKRA ? () => onRegisterKRA(recipe) : undefined}
          itemCd={recipe.itemCd}
          kra_status={recipe.kra_status}
          kra_error={recipe.kra_error}
        />
      ))}
    </div>
  );
}; 