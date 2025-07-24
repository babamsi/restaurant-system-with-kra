-- =====================================================
-- KRA RECEIPTS TABLE
-- =====================================================

-- KRA receipts table for storing generated receipts
CREATE TABLE IF NOT EXISTS kra_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order reference
    order_id UUID REFERENCES table_orders(id) ON DELETE CASCADE,
    
    -- KRA receipt details
    kra_receipt_no VARCHAR(50) NOT NULL,
    kra_total_receipt_no VARCHAR(50) NOT NULL,
    kra_internal_data TEXT NOT NULL,
    kra_receipt_signature VARCHAR(100) NOT NULL,
    kra_sdc_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    kra_invoice_no INTEGER NOT NULL,
    
    -- Receipt content
    receipt_text TEXT NOT NULL,
    
    -- Transaction details
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_pin VARCHAR(50),
    
    -- Discount information
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_narration TEXT,
    
    -- Items data for reference
    items_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_kra_receipts_order_id ON kra_receipts(order_id);
CREATE INDEX idx_kra_receipts_kra_receipt_no ON kra_receipts(kra_receipt_no);
CREATE INDEX idx_kra_receipts_kra_invoice_no ON kra_receipts(kra_invoice_no);
CREATE INDEX idx_kra_receipts_created_at ON kra_receipts(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kra_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_kra_receipts_updated_at
    BEFORE UPDATE ON kra_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_kra_receipts_updated_at(); 