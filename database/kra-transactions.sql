-- =====================================================
-- KRA TRANSACTIONS TRACKING TABLE
-- =====================================================

-- KRA transactions table for tracking all KRA API calls
CREATE TABLE IF NOT EXISTS kra_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'stock_in', 'stock_out', 'item_registration')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- KRA response details
    kra_invoice_no INTEGER,
    kra_sar_no INTEGER,
    kra_result_code VARCHAR(10),
    kra_result_message TEXT,
    kra_receipt_data JSONB,
    
    -- Business context
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
    sales_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    
    -- Transaction data
    items_data JSONB, -- Store the items that were sent to KRA
    total_amount DECIMAL(15,2),
    vat_amount DECIMAL(15,2),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retry')),
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_kra_transactions_type ON kra_transactions(transaction_type);
CREATE INDEX idx_kra_transactions_date ON kra_transactions(transaction_date);
CREATE INDEX idx_kra_transactions_status ON kra_transactions(status);
CREATE INDEX idx_kra_transactions_supplier ON kra_transactions(supplier_id);
CREATE INDEX idx_kra_transactions_result_code ON kra_transactions(kra_result_code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kra_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_kra_transactions_updated_at
    BEFORE UPDATE ON kra_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_kra_transactions_updated_at();

-- Add KRA transaction tracking to existing tables
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS kra_purchase_id UUID REFERENCES kra_transactions(id);
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS kra_stock_in_id UUID REFERENCES kra_transactions(id);

ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS kra_sale_id UUID REFERENCES kra_transactions(id);

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS kra_registration_id UUID REFERENCES kra_transactions(id); 