-- Add original_yield and original_portions columns to batches table
-- This migration adds the missing columns that are referenced in the code

-- Add original_yield column
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS original_yield DECIMAL(15,3) DEFAULT 0;

-- Add original_portions column  
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS original_portions INTEGER DEFAULT 0;

-- Update existing records to set original values equal to current values
UPDATE batches 
SET 
  original_yield = COALESCE(yield, 0),
  original_portions = COALESCE(portions, 0)
WHERE original_yield IS NULL OR original_portions IS NULL;

-- Make the columns NOT NULL after setting default values
ALTER TABLE batches 
ALTER COLUMN original_yield SET NOT NULL,
ALTER COLUMN original_portions SET NOT NULL;

-- Add comments
COMMENT ON COLUMN batches.original_yield IS 'Original yield value when batch was created';
COMMENT ON COLUMN batches.original_portions IS 'Original portions value when batch was created'; 