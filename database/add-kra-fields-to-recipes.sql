-- =====================================================
-- ADD KRA FIELDS TO RECIPES TABLE
-- =====================================================

-- Add KRA status fields to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS kra_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kra_error TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kra_composition_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kra_composition_no VARCHAR(50) DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_kra_status ON recipes(kra_status);
CREATE INDEX IF NOT EXISTS idx_recipes_kra_composition_status ON recipes(kra_composition_status);
CREATE INDEX IF NOT EXISTS idx_recipes_kra_composition_no ON recipes(kra_composition_no);

-- Add comments to explain the fields
COMMENT ON COLUMN recipes.kra_status IS 'KRA registration status: ok, error, or NULL if not registered';
COMMENT ON COLUMN recipes.kra_error IS 'KRA error message if registration failed';
COMMENT ON COLUMN recipes.kra_composition_status IS 'Status of KRA item composition: ok, error, pending, or NULL if not sent';
COMMENT ON COLUMN recipes.kra_composition_no IS 'KRA composition number assigned when successfully sent to KRA';
