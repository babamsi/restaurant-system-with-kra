-- Simple fix for supplier_receipts RLS policy
-- Run this in your Supabase SQL editor

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all operations on supplier_receipts" ON supplier_receipts;

-- Create a new policy that allows all operations
CREATE POLICY "Allow all operations on supplier_receipts" 
ON supplier_receipts 
FOR ALL 
USING (true) 
WITH CHECK (true); 