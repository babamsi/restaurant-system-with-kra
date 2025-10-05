-- =============================================
-- KRA SUPABASE BOOTSTRAP SCHEMA (CONSOLIDATED)
-- =============================================
-- This script consolidates required base tables and KRA-specific tables
-- for running the app against a fresh Supabase project.
-- Safe to run multiple times (IF NOT EXISTS guards where applicable).

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========= Base schema (subset from database/supabase-schema.sql) =========

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
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

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('weight', 'volume', 'count', 'custom')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    current_stock DECIMAL(15,3) DEFAULT 0,
    minimum_stock DECIMAL(15,3) DEFAULT 0,
    maximum_stock DECIMAL(15,3) DEFAULT 0,
    reorder_point DECIMAL(15,3) DEFAULT 0,
    cost_per_unit DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    calories_per_unit DECIMAL(10,2) DEFAULT 0,
    protein_per_unit DECIMAL(10,2) DEFAULT 0,
    carbs_per_unit DECIMAL(10,2) DEFAULT 0,
    fat_per_unit DECIMAL(10,2) DEFAULT 0,
    fiber_per_unit DECIMAL(10,2) DEFAULT 0,
    sodium_per_unit DECIMAL(10,2) DEFAULT 0,
    is_sellable_individually BOOLEAN DEFAULT false,
    is_cooked BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_perishable BOOLEAN DEFAULT false,
    expiry_date DATE,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    notes TEXT,
    -- KRA fields for item registration
    itemCd VARCHAR(50),
    itemClsCd VARCHAR(50),
    taxTyCd VARCHAR(10),
    kra_status VARCHAR(20),
    kra_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen storage
CREATE TABLE IF NOT EXISTS kitchen_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    used_grams DECIMAL(15,3) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ingredient_id)
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    yield_per_batch DECIMAL(15,3) NOT NULL,
    yield_unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    prep_time_minutes INTEGER DEFAULT 0,
    cooking_time_minutes INTEGER DEFAULT 0,
    total_raw_cost DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    calories_per_portion DECIMAL(10,2) DEFAULT 0,
    protein_per_portion DECIMAL(10,2) DEFAULT 0,
    carbs_per_portion DECIMAL(10,2) DEFAULT 0,
    fat_per_portion DECIMAL(10,2) DEFAULT 0,
    fiber_per_portion DECIMAL(10,2) DEFAULT 0,
    sodium_per_portion DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    instructions TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_needed DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    cost_per_unit DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    yield DECIMAL(15,3) DEFAULT 0,
    yield_unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    portions INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'preparing', 'ready', 'completed', 'finished')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('storage', 'batch', 'inventory', 'purchase', 'system')),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'info' CHECK (status IN ('success', 'error', 'warning', 'info')),
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS: table_orders and table_order_items (needed by receipts)
CREATE TABLE IF NOT EXISTS table_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(20) NOT NULL,
    table_id INTEGER NOT NULL,
    customer_name VARCHAR(255),
    order_type VARCHAR(20) DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway')),
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(50),
    discount_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'paid')),
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE,
    special_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS table_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES table_orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(255) NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    portion_size VARCHAR(50),
    customization_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers (KRA requires)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  kra_pin VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========= KRA-specific tables =========

-- kra_registrations
CREATE TABLE IF NOT EXISTS kra_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_type VARCHAR(20) NOT NULL CHECK (registration_type IN ('device_init', 'branch_reg')),
    tin VARCHAR(20) NOT NULL,
    bhf_id VARCHAR(10) NOT NULL,
    dvc_srl_no VARCHAR(50),
    dvc_id VARCHAR(50),
    sdc_id VARCHAR(50),
    mrc_no VARCHAR(50),
    cmc_key VARCHAR(100),
    bhf_nm VARCHAR(255),
    bhf_open_dt VARCHAR(20),
    prvnc_nm VARCHAR(100),
    dstrt_nm VARCHAR(100),
    sctr_nm VARCHAR(100),
    loc_desc TEXT,
    hq_yn VARCHAR(5),
    mgr_nm VARCHAR(255),
    mgr_tel_no VARCHAR(20),
    mgr_email VARCHAR(255),
    taxpr_nm VARCHAR(255),
    bsns_actv VARCHAR(255),
    kra_status VARCHAR(20) DEFAULT 'pending',
    kra_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kra_purchase_submissions
CREATE TABLE IF NOT EXISTS kra_purchase_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spplr_invc_no INTEGER NOT NULL,
    spplr_tin VARCHAR(20) NOT NULL,
    spplr_nm VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(10) NOT NULL,
    receipt_type VARCHAR(10) NOT NULL,
    submission_status VARCHAR(20) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'success', 'failed')),
    kra_response JSONB,
    kra_error_message TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(spplr_invc_no, spplr_tin)
);

-- kra_item_compositions
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

-- kra_receipts
CREATE TABLE IF NOT EXISTS kra_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES table_orders(id) ON DELETE CASCADE,
    kra_receipt_no VARCHAR(50) NOT NULL,
    kra_total_receipt_no VARCHAR(50) NOT NULL,
    kra_internal_data TEXT NOT NULL,
    kra_receipt_signature VARCHAR(100) NOT NULL,
    kra_sdc_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    kra_invoice_no INTEGER NOT NULL,
    receipt_text TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_pin VARCHAR(50),
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_narration TEXT,
    items_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kra_transactions (omit sales_invoices FK since not present)
CREATE TABLE IF NOT EXISTS kra_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'stock_in', 'stock_out', 'item_registration')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kra_invoice_no INTEGER,
    kra_sar_no INTEGER,
    kra_result_code VARCHAR(10),
    kra_result_message TEXT,
    kra_receipt_data JSONB,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_order_id UUID,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    items_data JSONB,
    total_amount DECIMAL(15,2),
    vat_amount DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retry')),
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- branch_users
CREATE TABLE IF NOT EXISTS branch_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId VARCHAR(255) NOT NULL UNIQUE,
    userNm VARCHAR(255) NOT NULL,
    pwd VARCHAR(255) NOT NULL,
    adrs TEXT,
    cntc VARCHAR(255),
    authCd VARCHAR(255),
    remark TEXT,
    useYn VARCHAR(1) DEFAULT 'Y',
    regrNm VARCHAR(255) DEFAULT 'Admin',
    regrId VARCHAR(255) DEFAULT 'Admin',
    modrNm VARCHAR(255) DEFAULT 'Admin',
    modrId VARCHAR(255) DEFAULT 'Admin',
    kra_status VARCHAR(50),
    kra_submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test-only tables (optional, comment if not needed in prod)
-- CREATE TABLE IF NOT EXISTS kra_test_items (...)
-- CREATE TABLE IF NOT EXISTS kra_test_recipes (...)

-- ========= KRA-related column additions =========

-- Recipes: recipe_type and KRA fields
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(20) DEFAULT 'complex';
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS selected_inventory_item JSONB;
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS item_cd VARCHAR(50);
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS item_cls_cd VARCHAR(50);
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS tax_ty_cd VARCHAR(10) DEFAULT 'B';

-- Customers: KRA fields
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS kra_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kra_submission_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS kra_customer_no VARCHAR(100);

-- Ingredients: optional KRA linkage
ALTER TABLE ingredients 
  ADD COLUMN IF NOT EXISTS kra_registration_id UUID REFERENCES kra_transactions(id);

-- ========= Indexes (subset) =========
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_kitchen_storage_ingredient ON kitchen_storage(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_type ON recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_customers_kra_pin ON customers(kra_pin);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_kra_status ON customers(kra_status);
CREATE INDEX IF NOT EXISTS idx_kra_registrations_type ON kra_registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_kra_purchase_submissions_status ON kra_purchase_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_kra_item_compositions_main_item_cd ON kra_item_compositions(main_item_cd);
CREATE INDEX IF NOT EXISTS idx_kra_receipts_kra_invoice_no ON kra_receipts(kra_invoice_no);
CREATE INDEX IF NOT EXISTS idx_kra_transactions_type ON kra_transactions(transaction_type);

-- ========= updated_at trigger helper =========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables with updated_at
DO $$ BEGIN
  IF to_regclass('public.suppliers') IS NOT NULL THEN
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.ingredients') IS NOT NULL THEN
    CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kitchen_storage') IS NOT NULL THEN
    CREATE TRIGGER update_kitchen_storage_updated_at BEFORE UPDATE ON kitchen_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.recipes') IS NOT NULL THEN
    CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.recipe_ingredients') IS NOT NULL THEN
    CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.batches') IS NOT NULL THEN
    CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kra_registrations') IS NOT NULL THEN
    CREATE TRIGGER update_kra_registrations_updated_at BEFORE UPDATE ON kra_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kra_purchase_submissions') IS NOT NULL THEN
    CREATE TRIGGER update_kra_purchase_submissions_updated_at BEFORE UPDATE ON kra_purchase_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kra_item_compositions') IS NOT NULL THEN
    CREATE TRIGGER update_kra_item_compositions_updated_at BEFORE UPDATE ON kra_item_compositions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kra_receipts') IS NOT NULL THEN
    CREATE TRIGGER update_kra_receipts_updated_at BEFORE UPDATE ON kra_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.kra_transactions') IS NOT NULL THEN
    CREATE TRIGGER update_kra_transactions_updated_at BEFORE UPDATE ON kra_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.table_orders') IS NOT NULL THEN
    CREATE TRIGGER update_table_orders_updated_at BEFORE UPDATE ON table_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF to_regclass('public.table_order_items') IS NOT NULL THEN
    CREATE TRIGGER update_table_order_items_updated_at BEFORE UPDATE ON table_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ========= RLS (open policies; tighten when auth is wired) =========
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kra_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kra_purchase_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kra_item_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kra_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kra_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on categories" ON categories FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on units" ON units FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on ingredients" ON ingredients FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kitchen_storage" ON kitchen_storage FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on recipes" ON recipes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on batches" ON batches FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on system_logs" ON system_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on table_orders" ON table_orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on table_order_items" ON table_order_items FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on customers" ON customers FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kra_registrations" ON kra_registrations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kra_purchase_submissions" ON kra_purchase_submissions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kra_item_compositions" ON kra_item_compositions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kra_receipts" ON kra_receipts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on kra_transactions" ON kra_transactions FOR ALL USING (true);

-- ========= Seed minimal lookup data =========
INSERT INTO categories (name, description) VALUES
('Proteins', 'Meat, fish, poultry'),
('Vegetables', 'Fresh and frozen vegetables')
ON CONFLICT (name) DO NOTHING;

INSERT INTO units (name, symbol, type, description) VALUES
('Grams', 'g', 'weight', 'Metric weight unit'),
('Kilograms', 'kg', 'weight', 'Metric weight unit'),
('Pieces', 'pcs', 'count', 'Count unit')
ON CONFLICT (name) DO NOTHING;


