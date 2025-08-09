-- Create kra_test_items table
CREATE TABLE IF NOT EXISTS kra_test_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    item_cd VARCHAR(50),
    item_cls_cd VARCHAR(20),
    tax_ty_cd VARCHAR(5) DEFAULT 'B',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kra_test_items_category ON kra_test_items(category);
CREATE INDEX IF NOT EXISTS idx_kra_test_items_tax_ty_cd ON kra_test_items(tax_ty_cd);
CREATE INDEX IF NOT EXISTS idx_kra_test_items_item_cd ON kra_test_items(item_cd);
CREATE INDEX IF NOT EXISTS idx_kra_test_items_is_active ON kra_test_items(is_active);

-- Add comments for documentation
COMMENT ON TABLE kra_test_items IS 'Stores test items for KRA testing with classifications and tax types';
COMMENT ON COLUMN kra_test_items.item_cd IS 'KRA item code returned from registration';
COMMENT ON COLUMN kra_test_items.item_cls_cd IS 'KRA item classification code';
COMMENT ON COLUMN kra_test_items.tax_ty_cd IS 'KRA tax type code (A, B, C, D, E)';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kra_test_items_updated_at 
    BEFORE UPDATE ON kra_test_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 