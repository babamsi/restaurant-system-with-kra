-- Create kra_item_compositions table
CREATE TABLE IF NOT EXISTS kra_item_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_item_cd VARCHAR(50) NOT NULL,
  main_item_name VARCHAR(255) NOT NULL,
  composition_item_cd VARCHAR(50) NOT NULL,
  composition_item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  kra_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kra_item_compositions_main_item_cd ON kra_item_compositions(main_item_cd);
CREATE INDEX IF NOT EXISTS idx_kra_item_compositions_composition_item_cd ON kra_item_compositions(composition_item_cd);
CREATE INDEX IF NOT EXISTS idx_kra_item_compositions_created_at ON kra_item_compositions(created_at);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kra_item_compositions_updated_at 
  BEFORE UPDATE ON kra_item_compositions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 