-- Cooked Freezer Items Table
-- This table stores cooked batches that have been frozen for later use

CREATE TABLE IF NOT EXISTS cooked_freezer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Batch reference
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    batch_name VARCHAR(255) NOT NULL,
    
    -- Portion management
    portions INTEGER NOT NULL DEFAULT 0,
    original_portions INTEGER NOT NULL DEFAULT 0,
    
    -- Source tracking (what was taken from the batch)
    source_type VARCHAR(20) NOT NULL DEFAULT 'portions' CHECK (source_type IN ('portions', 'yield')),
    source_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    source_unit VARCHAR(20) NOT NULL DEFAULT 'portions',
    
    -- Date management
    best_before TIMESTAMP WITH TIME ZONE NOT NULL,
    date_frozen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Additional information
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cooked_freezer_items_batch_id ON cooked_freezer_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_cooked_freezer_items_best_before ON cooked_freezer_items(best_before);
CREATE INDEX IF NOT EXISTS idx_cooked_freezer_items_date_frozen ON cooked_freezer_items(date_frozen);
CREATE INDEX IF NOT EXISTS idx_cooked_freezer_items_portions ON cooked_freezer_items(portions);

-- Trigger for updated_at
CREATE TRIGGER update_cooked_freezer_items_updated_at 
    BEFORE UPDATE ON cooked_freezer_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE cooked_freezer_items IS 'Stores cooked batches that have been frozen for later use';
COMMENT ON COLUMN cooked_freezer_items.batch_id IS 'Reference to the source batch';
COMMENT ON COLUMN cooked_freezer_items.batch_name IS 'Name of the batch for display purposes';
COMMENT ON COLUMN cooked_freezer_items.portions IS 'Current number of portions available';
COMMENT ON COLUMN cooked_freezer_items.original_portions IS 'Original number of portions when frozen';
COMMENT ON COLUMN cooked_freezer_items.source_type IS 'Whether portions or yield was taken from the batch';
COMMENT ON COLUMN cooked_freezer_items.source_amount IS 'Amount taken from the source batch';
COMMENT ON COLUMN cooked_freezer_items.source_unit IS 'Unit of the source amount (portions, g, kg, etc.)';
COMMENT ON COLUMN cooked_freezer_items.best_before IS 'Expiry date for the frozen item';
COMMENT ON COLUMN cooked_freezer_items.date_frozen IS 'Date when the item was frozen'; 