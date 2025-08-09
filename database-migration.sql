-- Migration to add inventory-based recipe support
-- Add new columns to recipes table

-- Add recipeType column to distinguish between complex and inventory-based recipes
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(20) DEFAULT 'complex';

-- Add selectedInventoryItem column to store inventory item data for direct sales
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS selected_inventory_item JSONB;

-- Add KRA item codes to recipes table for inventory-based recipes
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS item_cd VARCHAR(50);

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS item_cls_cd VARCHAR(50);

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tax_ty_cd VARCHAR(10) DEFAULT 'B';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_type ON recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_recipes_item_cd ON recipes(item_cd);

-- Update existing recipes to have the default recipe type
UPDATE recipes 
SET recipe_type = 'complex' 
WHERE recipe_type IS NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN recipes.recipe_type IS 'Type of recipe: complex (multi-ingredient) or inventory (direct sale)';
COMMENT ON COLUMN recipes.selected_inventory_item IS 'JSON data of the selected inventory item for direct sales';
COMMENT ON COLUMN recipes.item_cd IS 'KRA item code for the recipe';
COMMENT ON COLUMN recipes.item_cls_cd IS 'KRA item classification code for the recipe';
COMMENT ON COLUMN recipes.tax_ty_cd IS 'KRA tax type code for the recipe'; 