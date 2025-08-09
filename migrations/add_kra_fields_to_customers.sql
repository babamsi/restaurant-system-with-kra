-- Add KRA-related fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS kra_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS kra_submission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kra_customer_no VARCHAR(100);

-- Create index for KRA status
CREATE INDEX IF NOT EXISTS idx_customers_kra_status ON customers(kra_status); 