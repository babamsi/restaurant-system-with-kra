-- =====================================================
-- RECIPE COMPOSITION SCHEMA UPDATES
-- =====================================================

-- Add KRA composition fields to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS kra_composition_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kra_composition_no VARCHAR(50) DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_recipes_kra_composition_status ON recipes(kra_composition_status);
CREATE INDEX IF NOT EXISTS idx_recipes_kra_composition_no ON recipes(kra_composition_no);

-- Update existing recipes to have NULL composition status
UPDATE recipes 
SET kra_composition_status = NULL, 
    kra_composition_no = NULL 
WHERE kra_composition_status IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN recipes.kra_composition_status IS 'Status of KRA item composition: ok, error, pending, or NULL if not sent';
COMMENT ON COLUMN recipes.kra_composition_no IS 'KRA composition number assigned when successfully sent to KRA'; 