CREATE TABLE IF NOT EXISTS kra_test_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  item_cd VARCHAR(50),
  item_cls_cd VARCHAR(50),
  tax_ty_cd VARCHAR(10),
  composition JSONB DEFAULT '[]',
  total_cost DECIMAL(10,2) DEFAULT 0,
  kra_status VARCHAR(20) DEFAULT 'pending',
  kra_response JSONB,
  kra_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kra_test_recipes_name ON kra_test_recipes(name);
CREATE INDEX IF NOT EXISTS idx_kra_test_recipes_category ON kra_test_recipes(category);
CREATE INDEX IF NOT EXISTS idx_kra_test_recipes_created_at ON kra_test_recipes(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kra_test_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kra_test_recipes_updated_at
  BEFORE UPDATE ON kra_test_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_kra_test_recipes_updated_at(); 