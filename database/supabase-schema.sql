-- =====================================================
-- CAFETERIA MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SUPPLIERS MANAGEMENT
-- =====================================================

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(255),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVENTORY MANAGEMENT
-- =====================================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units table
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('weight', 'volume', 'count', 'custom')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Stock management
    current_stock DECIMAL(15,3) DEFAULT 0,
    minimum_stock DECIMAL(15,3) DEFAULT 0,
    maximum_stock DECIMAL(15,3) DEFAULT 0,
    reorder_point DECIMAL(15,3) DEFAULT 0,
    
    -- Cost and pricing
    cost_per_unit DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Nutritional information
    calories_per_unit DECIMAL(10,2) DEFAULT 0,
    protein_per_unit DECIMAL(10,2) DEFAULT 0,
    carbs_per_unit DECIMAL(10,2) DEFAULT 0,
    fat_per_unit DECIMAL(10,2) DEFAULT 0,
    fiber_per_unit DECIMAL(10,2) DEFAULT 0,
    sodium_per_unit DECIMAL(10,2) DEFAULT 0,
    
    -- Status and flags
    is_sellable_individually BOOLEAN DEFAULT false,
    is_cooked BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_perishable BOOLEAN DEFAULT false,
    expiry_date DATE,
    
    -- Metadata
    barcode VARCHAR(100),
    sku VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PURCHASE ORDERS
-- =====================================================

-- Purchase orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Order details
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    delivery_date DATE,
    
    -- Financial
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
    
    -- Notes and metadata
    notes TEXT,
    created_by UUID, -- Will reference auth.users when auth is set up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    
    -- Item details
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- Received quantities
    received_quantity DECIMAL(15,3) DEFAULT 0,
    
    -- Notes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPPLIER ORDERS
-- =====================================================

-- Supplier orders table
CREATE TABLE supplier_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Order details
    invoice_number VARCHAR(100) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Financial
    total_amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')),
    
    -- Notes and metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier order items table
CREATE TABLE supplier_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES supplier_orders(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    
    -- Item details
    quantity DECIMAL(15,3) NOT NULL,
    cost_per_unit DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    
    -- Notes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KITCHEN MANAGEMENT
-- =====================================================

-- Kitchen storage table
CREATE TABLE kitchen_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    
    -- Storage details
    quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    used_grams DECIMAL(15,3) DEFAULT 0, -- For ingredients with GM amounts
    
    -- Status and metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per ingredient
    UNIQUE(ingredient_id)
);

-- Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Recipe details
    yield_per_batch DECIMAL(15,3) NOT NULL,
    yield_unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    prep_time_minutes INTEGER DEFAULT 0,
    cooking_time_minutes INTEGER DEFAULT 0,
    
    -- Financial
    total_raw_cost DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Nutritional information per portion
    calories_per_portion DECIMAL(10,2) DEFAULT 0,
    protein_per_portion DECIMAL(10,2) DEFAULT 0,
    carbs_per_portion DECIMAL(10,2) DEFAULT 0,
    fat_per_portion DECIMAL(10,2) DEFAULT 0,
    fiber_per_portion DECIMAL(10,2) DEFAULT 0,
    sodium_per_portion DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    instructions TEXT,
    notes TEXT,
    created_by UUID, -- Will reference auth.users when auth is set up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients table
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    
    -- Ingredient details
    quantity_needed DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    
    -- Cost calculation
    cost_per_unit DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Notes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    
    -- Batch details
    yield DECIMAL(15,3) DEFAULT 0,
    yield_unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    portions INTEGER DEFAULT 0,
    
    -- Status and timing
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'preparing', 'ready', 'completed', 'finished')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    created_by UUID, -- Will reference auth.users when auth is set up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch ingredients table
CREATE TABLE batch_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    
    -- Ingredient details
    required_quantity DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'low', 'missing')),
    
    -- Batch dependency (if this ingredient is another batch)
    is_batch BOOLEAN DEFAULT false,
    source_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SYSTEM LOGS
-- =====================================================

-- System logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Log details
    type VARCHAR(50) NOT NULL CHECK (type IN ('storage', 'batch', 'inventory', 'purchase', 'system')),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'info' CHECK (status IN ('success', 'error', 'warning', 'info')),
    
    -- Related entities
    entity_type VARCHAR(50), -- 'ingredient', 'batch', 'recipe', etc.
    entity_id UUID,
    
    -- User and timing
    user_id UUID, -- Will reference auth.users when auth is set up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- POS SYSTEM - TABLE ORDERS
-- =====================================================

-- Table orders table
-- Note: Business logic ensures only one active order per table
-- Active orders are those with status: 'pending', 'preparing', 'ready'
-- This is enforced at the application level, not database level
CREATE TABLE table_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Table information
    table_number VARCHAR(20) NOT NULL,
    table_id INTEGER NOT NULL, -- Reference to the table number (1, 2, 3, etc.)
    
    -- Order details
    customer_name VARCHAR(255),
    order_type VARCHAR(20) DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway')),
    
    -- Financial
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'paid')),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes and metadata
    special_instructions TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table order items table
CREATE TABLE table_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES table_orders(id) ON DELETE CASCADE,
    
    -- Item details
    menu_item_id VARCHAR(255) NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- Customization
    portion_size VARCHAR(50),
    customization_notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPPLIER RECEIPTS STORAGE
-- =====================================================

-- Supplier receipts table for storing receipt images and metadata
CREATE TABLE supplier_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Receipt details
    receipt_date DATE NOT NULL,
    invoice_number VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Image storage
    image_url TEXT NOT NULL, -- URL to the stored image in Supabase Storage
    image_filename VARCHAR(255) NOT NULL,
    file_size INTEGER, -- File size in bytes
    mime_type VARCHAR(100), -- e.g., 'image/jpeg', 'image/png'
    
    -- OCR and processing
    ocr_text TEXT, -- Extracted text from OCR
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- CUSTOMERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  kra_pin VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_kra_pin ON customers(kra_pin);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Suppliers indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Ingredients indexes
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier_id);
CREATE INDEX idx_ingredients_status ON ingredients(is_active);
CREATE INDEX idx_ingredients_stock ON ingredients(current_stock);

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);

-- Supplier orders indexes
CREATE INDEX idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_supplier_orders_date ON supplier_orders(order_date);
CREATE INDEX idx_supplier_orders_invoice ON supplier_orders(invoice_number);

-- Supplier order items indexes
CREATE INDEX idx_supplier_order_items_order ON supplier_order_items(order_id);
CREATE INDEX idx_supplier_order_items_ingredient ON supplier_order_items(ingredient_id);

-- Kitchen storage indexes
CREATE INDEX idx_kitchen_storage_ingredient ON kitchen_storage(ingredient_id);
CREATE INDEX idx_kitchen_storage_quantity ON kitchen_storage(quantity);

-- Recipes indexes
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_published ON recipes(is_published);

-- Batches indexes
CREATE INDEX idx_batches_recipe ON batches(recipe_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_start_time ON batches(start_time);

-- System logs indexes
CREATE INDEX idx_system_logs_type ON system_logs(type);
CREATE INDEX idx_system_logs_status ON system_logs(status);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);

-- Table orders indexes
CREATE INDEX idx_table_orders_table_id ON table_orders(table_id);
CREATE INDEX idx_table_orders_status ON table_orders(status);
CREATE INDEX idx_table_orders_created_at ON table_orders(created_at);
CREATE INDEX idx_table_orders_table_status ON table_orders(table_id, status);

-- Table order items indexes
CREATE INDEX idx_table_order_items_order_id ON table_order_items(order_id);
CREATE INDEX idx_table_order_items_status ON table_order_items(status);
CREATE INDEX idx_table_order_items_menu_item ON table_order_items(menu_item_id);

-- Supplier receipts indexes
CREATE INDEX idx_supplier_receipts_supplier ON supplier_receipts(supplier_id);
CREATE INDEX idx_supplier_receipts_date ON supplier_receipts(receipt_date);
CREATE INDEX idx_supplier_receipts_status ON supplier_receipts(status);
CREATE INDEX idx_supplier_receipts_processed ON supplier_receipts(is_processed);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kitchen_storage_updated_at BEFORE UPDATE ON kitchen_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batch_ingredients_updated_at BEFORE UPDATE ON batch_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_receipts_updated_at BEFORE UPDATE ON supplier_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_table_orders_updated_at BEFORE UPDATE ON table_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_table_order_items_updated_at BEFORE UPDATE ON table_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
('Proteins', 'Meat, fish, poultry, and other protein sources', '#EF4444', 'drumstick'),
('Vegetables', 'Fresh and frozen vegetables', '#10B981', 'carrot'),
('Grains', 'Rice, pasta, bread, and other grains', '#F59E0B', 'wheat'),
('Dairy', 'Milk, cheese, yogurt, and other dairy products', '#3B82F6', 'milk'),
('Spices', 'Herbs, spices, and seasonings', '#8B5CF6', 'leaf'),
('Oils & Fats', 'Cooking oils, butter, and other fats', '#F97316', 'droplet'),
('Beverages', 'Drinks and liquid ingredients', '#06B6D4', 'coffee'),
('Snacks', 'Snack items and treats', '#EC4899', 'cookie');

-- Insert default units
INSERT INTO units (name, symbol, type, description) VALUES
('Grams', 'g', 'weight', 'Metric weight unit'),
('Kilograms', 'kg', 'weight', 'Metric weight unit'),
('Pounds', 'lb', 'weight', 'Imperial weight unit'),
('Ounces', 'oz', 'weight', 'Imperial weight unit'),
('Milliliters', 'ml', 'volume', 'Metric volume unit'),
('Liters', 'L', 'volume', 'Metric volume unit'),
('Cups', 'cup', 'custom', 'Cooking volume unit'),
('Tablespoons', 'tbsp', 'custom', 'Cooking volume unit'),
('Teaspoons', 'tsp', 'custom', 'Cooking volume unit'),
('Pieces', 'pcs', 'count', 'Count unit'),
('Pinch', 'pinch', 'custom', 'Small amount unit');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city, status) VALUES
('Fresh Foods Ltd', 'John Doe', 'john@freshfoods.com', '+2348012345678', '123 Market Street', 'Lagos', 'active'),
('Quality Meats', 'Jane Smith', 'jane@qualitymeats.com', '+2348098765432', '456 Butcher Road', 'Abuja', 'active'),
('Spice World', 'Mike Johnson', 'mike@spiceworld.com', '+2348076543210', '789 Spice Lane', 'Kano', 'active');

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_receipts ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created when authentication is set up
-- For now, we'll create basic policies that allow all operations
-- These should be updated when user authentication is implemented

-- Basic RLS policies (temporary - should be updated with proper auth)
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on units" ON units FOR ALL USING (true);
CREATE POLICY "Allow all operations on ingredients" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on kitchen_storage" ON kitchen_storage FOR ALL USING (true);
CREATE POLICY "Allow all operations on recipes" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow all operations on recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on batches" ON batches FOR ALL USING (true);
CREATE POLICY "Allow all operations on batch_ingredients" ON batch_ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_logs" ON system_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on supplier_receipts" ON supplier_receipts FOR ALL USING (true);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE suppliers IS 'Stores information about ingredient suppliers';
COMMENT ON TABLE categories IS 'Categorizes ingredients for better organization';
COMMENT ON TABLE units IS 'Defines measurement units used throughout the system';
COMMENT ON TABLE ingredients IS 'Main inventory items with stock and nutritional information';
COMMENT ON TABLE purchase_orders IS 'Purchase orders sent to suppliers';
COMMENT ON TABLE purchase_order_items IS 'Individual items within purchase orders';
COMMENT ON TABLE kitchen_storage IS 'Current stock levels in kitchen storage';
COMMENT ON TABLE recipes IS 'Recipe definitions with ingredients and instructions';
COMMENT ON TABLE recipe_ingredients IS 'Ingredients required for each recipe';
COMMENT ON TABLE batches IS 'Batch preparation records';
COMMENT ON TABLE batch_ingredients IS 'Ingredients used in each batch';
COMMENT ON TABLE system_logs IS 'System activity logs for auditing';
COMMENT ON TABLE supplier_receipts IS 'Stores images and metadata of supplier receipts';

COMMENT ON COLUMN ingredients.current_stock IS 'Current available quantity in main inventory';
COMMENT ON COLUMN ingredients.minimum_stock IS 'Minimum stock level before reorder';
COMMENT ON COLUMN ingredients.reorder_point IS 'Stock level at which to reorder';
COMMENT ON COLUMN kitchen_storage.used_grams IS 'Track used grams for ingredients with GM amounts';
COMMENT ON COLUMN batches.status IS 'Current status of batch preparation';
COMMENT ON COLUMN batch_ingredients.is_batch IS 'Whether this ingredient is another batch';
COMMENT ON COLUMN batch_ingredients.source_batch_id IS 'Reference to source batch if is_batch is true'; 

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for receipt images
-- Note: This requires the storage extension to be enabled
-- Run this in Supabase SQL editor after enabling storage

-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policy for receipts bucket (run after creating bucket)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
-- CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own receipts" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]); -- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for receipt images
-- Note: This requires the storage extension to be enabled
-- Run this in Supabase SQL editor after enabling storage

-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policy for receipts bucket (run after creating bucket)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
-- CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own receipts" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]); 
