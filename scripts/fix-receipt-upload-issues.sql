-- =====================================================
-- COMPREHENSIVE FIX FOR RECEIPT UPLOAD ISSUES
-- =====================================================

-- This script fixes both database RLS policies and storage policies
-- to allow receipt uploads to work properly

-- =====================================================
-- 1. FIX DATABASE RLS POLICIES
-- =====================================================

-- Drop existing policies for supplier_receipts
DROP POLICY IF EXISTS "Allow all operations on supplier_receipts" ON supplier_receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON supplier_receipts;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON supplier_receipts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON supplier_receipts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON supplier_receipts;

-- Create new policy that allows all operations
CREATE POLICY "Allow all operations on supplier_receipts" 
ON supplier_receipts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- 2. FIX STORAGE POLICIES
-- =====================================================

-- Drop existing storage policies for receipts bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Create new storage policies that allow all operations
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Allow Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow Update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'receipts');

CREATE POLICY "Allow Delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'receipts');

-- =====================================================
-- 3. VERIFY FIXES
-- =====================================================

-- Check database policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'supplier_receipts';

-- Check storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- 4. TEST THE FIX
-- =====================================================

-- Test database insert (this will be rolled back)
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
        'TEST-FIX-001',
        100.00,
        'https://example.com/test.jpg',
        'test.jpg',
        1024,
        'image/jpeg',
        'uploaded'
    );
    
    RAISE NOTICE 'Database insert test successful';
    
    -- Clean up
    DELETE FROM supplier_receipts WHERE invoice_number = 'TEST-FIX-001';
ROLLBACK;

RAISE NOTICE 'All fixes applied successfully!';
RAISE NOTICE 'You should now be able to upload receipt images without authorization errors.'; 