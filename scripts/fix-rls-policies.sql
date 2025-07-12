-- =====================================================
-- FIX RLS POLICIES FOR SUPPLIER RECEIPTS
-- =====================================================

-- This script fixes the Row Level Security policies for the supplier_receipts table
-- to allow anyone to upload receipts (temporary solution for development)

-- First, let's check if RLS is enabled and drop any existing policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow all operations on supplier_receipts" ON supplier_receipts;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON supplier_receipts;
    DROP POLICY IF EXISTS "Enable select for authenticated users only" ON supplier_receipts;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON supplier_receipts;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON supplier_receipts;
    
    RAISE NOTICE 'Dropped existing policies for supplier_receipts';
END $$;

-- Create a new policy that allows ALL operations for everyone
-- This is a temporary solution for development - should be updated for production
CREATE POLICY "Allow all operations on supplier_receipts" 
ON supplier_receipts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Alternative: If you want to be more specific, you can create separate policies:

-- Allow anyone to insert receipts
-- CREATE POLICY "Allow insert on supplier_receipts" 
-- ON supplier_receipts 
-- FOR INSERT 
-- WITH CHECK (true);

-- Allow anyone to select receipts
-- CREATE POLICY "Allow select on supplier_receipts" 
-- ON supplier_receipts 
-- FOR SELECT 
-- USING (true);

-- Allow anyone to update receipts
-- CREATE POLICY "Allow update on supplier_receipts" 
-- ON supplier_receipts 
-- FOR UPDATE 
-- USING (true) 
-- WITH CHECK (true);

-- Allow anyone to delete receipts
-- CREATE POLICY "Allow delete on supplier_receipts" 
-- ON supplier_receipts 
-- FOR DELETE 
-- USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'supplier_receipts';

-- Test the policy by checking if we can insert a test record
-- (This will be rolled back)
BEGIN;
    INSERT INTO supplier_receipts (
        supplier_id,
        receipt_date,
        invoice_number,
        total_amount,
        image_url,
        image_filename,
        file_size,
        mime_type,
        status
    ) VALUES (
        (SELECT id FROM suppliers LIMIT 1),
        CURRENT_DATE,
        'TEST-001',
        100.00,
        'https://example.com/test.jpg',
        'test.jpg',
        1024,
        'image/jpeg',
        'uploaded'
    );
    
    -- If we get here, the policy is working
    RAISE NOTICE 'RLS policy test successful - insert allowed';
    
    -- Clean up the test record
    DELETE FROM supplier_receipts WHERE invoice_number = 'TEST-001';
    
    RAISE NOTICE 'Test record cleaned up';
ROLLBACK;

RAISE NOTICE 'RLS policies for supplier_receipts have been fixed successfully!';
RAISE NOTICE 'You should now be able to upload receipt images without authorization errors.'; 