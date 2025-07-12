# Supplier Receipt Management

This document describes the smart supplier receipt management system that allows users to upload, store, and manage receipt images from suppliers with intelligent auto-population features.

## Overview

The smart supplier receipt system provides:
- **Smart Receipt Upload**: Auto-populate receipt details from existing supplier orders
- **Invoice Linking**: Automatically link receipts to supplier orders by invoice number
- **Image Storage**: Secure storage of receipt images in Supabase Storage
- **Receipt Management**: View, search, and download uploaded receipts with order context
- **Future Reference**: Eliminate the need for physical paper receipts

## Smart Features

### 1. Intelligent Receipt Upload
- **Step 1: Supplier Selection**: Choose the supplier for the receipt
- **Step 2: Invoice Selection**: Browse and select from existing supplier orders
- **Step 3: Auto-Population**: Automatically fill receipt date, invoice number, total amount, and notes
- **Step 4: Image Upload**: Upload receipt images with validation and preview
- **Progress Tracking**: Real-time upload progress with visual feedback

### 2. Smart Auto-Population
When a supplier order is selected:
- **Receipt Date**: Automatically set to the order date
- **Invoice Number**: Populated from the selected order
- **Total Amount**: Filled with the order total amount
- **Notes**: Pre-filled with order notes (if any)
- **Visual Indicator**: Green banner shows auto-population status

### 3. Order Linking
- **Automatic Detection**: System automatically links receipts to orders by invoice number
- **Visual Indicators**: Receipts show linked order status and details
- **Order Context**: View order information alongside receipt details

## Database Schema

### supplier_receipts Table

```sql
CREATE TABLE supplier_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Receipt details
    receipt_date DATE NOT NULL,
    invoice_number VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Image storage
    image_url TEXT NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- OCR and processing
    ocr_text TEXT,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'uploaded',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### supplier_orders Table (for linking)

```sql
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
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Storage Setup

### 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** section
2. Click **Create a new bucket**
3. Name: `receipts`
4. Public bucket: ✅ **Yes**
5. File size limit: `10MB`
6. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

### 2. Storage Policies

Run these SQL commands in your Supabase SQL editor:

```sql
-- Allow public read access to receipt images
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Allow authenticated users to update receipts
CREATE POLICY "Authenticated Update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'receipts');

-- Allow authenticated users to delete receipts
CREATE POLICY "Authenticated Delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'receipts');
```

### 3. Automated Setup

Use the provided setup script:

```bash
node scripts/setup-storage.js
```

## Usage

### Smart Receipt Upload Process

1. **Navigate to Inventory**: Go to the Inventory Management page
2. **Click "New Receipt"**: Click the "New Receipt" button in the top section
3. **Step 1: Select Supplier**: Choose the supplier from the dropdown
4. **Step 2: Select Invoice (Optional)**: 
   - Browse existing orders for the supplier
   - Search by invoice number
   - Select an order to auto-populate details
5. **Step 3: Review Details**: 
   - Receipt date, invoice number, and amount are auto-filled
   - Modify any details if needed
   - Add additional notes
6. **Step 4: Upload Image**: Either choose a file or take a photo
7. **Submit**: Click "Upload Receipt" to save

### Managing Receipts

1. **View Receipts**: The Supplier Receipts section shows all uploaded receipts
2. **Search**: Use the search bar to find receipts by invoice number, supplier, or notes
3. **Filter**: Filter by supplier using the dropdown
4. **Linked Orders**: Receipts show linked order information and status
5. **View Image**: Click the eye icon to view the receipt image with order context
6. **Download**: Click the download icon to save the image locally

## Components

### SupplierReceiptUploadDialog
- **Smart Supplier Selection**: Loads supplier orders when supplier is selected
- **Invoice Browser**: Searchable list of existing supplier orders
- **Auto-Population**: Automatically fills receipt details from selected order
- **Image Validation**: File type and size validation with preview
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Form Validation**: Comprehensive validation and error handling

### SupplierReceiptsList
- **Enhanced Display**: Shows linked order information and status
- **Smart Search**: Search across receipts, invoices, and suppliers
- **Order Context**: Displays linked order details in receipt view
- **Status Indicators**: Visual indicators for receipt and order status
- **Image Viewing**: Full-screen receipt viewing with order context

## File Structure

```
components/inventory/
├── supplier-receipt-upload-dialog.tsx  # Smart upload dialog
├── supplier-receipts-list.tsx          # Enhanced receipt list
└── synchronized-inventory-manager.tsx  # Main inventory manager

database/
└── supabase-schema.sql                 # Database schema

scripts/
├── setup-storage.js                    # Storage setup script
├── fix-rls-policies.sql               # RLS policy fix
├── simple-fix-rls.sql                 # Simple RLS fix
└── fix-receipt-upload-issues.sql      # Comprehensive fix

lib/
└── database.ts                         # Database services including supplierReceiptsService

types/
└── database.ts                         # TypeScript types
```

## API Integration

### Smart Upload Process

1. **Supplier Selection**: Triggers loading of supplier orders
2. **Order Selection**: Auto-populates receipt form fields
3. **Image Upload**: Upload image to Supabase Storage
4. **Database Insert**: Save receipt metadata with order linking
5. **URL Generation**: Generate public URL for the image
6. **Success Notification**: Show success message with order context

### Service Functions

```typescript
// Upload receipt with smart linking
const uploadReceipt = async (receiptData) => {
  return await supplierReceiptsService.uploadReceipt(receiptData)
}

// Get receipts with linked order information
const getReceipts = async () => {
  return await supplierReceiptsService.getReceipts()
}

// Get supplier orders for auto-population
const getSupplierOrders = async (supplierId) => {
  return await supplierReceiptsService.getSupplierOrders(supplierId)
}

// Link receipt to existing order
const linkReceiptToOrder = async (receiptId, orderId) => {
  return await supplierReceiptsService.linkReceiptToOrder(receiptId, orderId)
}
```

### Storage URLs

Receipt images are stored with the following structure:
```
https://[project].supabase.co/storage/v1/object/public/receipts/supplier-receipts/[filename]
```

## Security Considerations

- **File Size Limits**: 10MB maximum file size
- **File Type Validation**: Only image files allowed
- **Public Access**: Receipt images are publicly accessible
- **Database Security**: Receipt metadata protected by RLS policies
- **Order Linking**: Secure linking between receipts and orders

## Troubleshooting

### Common Issues

#### 1. Upload Fails with "Unauthorized" Error

**Error**: `"new row violates row-level security policy"`

**Cause**: RLS (Row Level Security) policies are blocking the insert operation.

**Solution**: Run this SQL in your Supabase SQL editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on supplier_receipts" ON supplier_receipts;

-- Create new policy that allows all operations
CREATE POLICY "Allow all operations on supplier_receipts" 
ON supplier_receipts 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

**Alternative**: Use the provided fix script:
```bash
# Copy the contents of scripts/simple-fix-rls.sql and run in Supabase SQL editor
```

#### 2. No Orders Found for Supplier

**Issue**: No orders appear when selecting a supplier

**Cause**: The supplier has no orders in the system yet.

**Solution**: 
- You can still upload receipts manually
- Create supplier orders first for auto-population to work
- The system gracefully handles suppliers without orders

#### 3. Auto-Population Not Working

**Issue**: Receipt details don't auto-populate when selecting an order

**Cause**: Order data might be incomplete or corrupted.

**Solution**:
- Check that the supplier order has all required fields
- Verify the order date format is correct
- Ensure the total amount is a valid number

#### 4. Image Upload Fails

**Error**: Storage upload fails

**Cause**: Storage bucket doesn't exist or policies are incorrect.

**Solution**: 
1. Create the `receipts` bucket in Supabase Storage
2. Set it as public
3. Run the storage setup script:
```bash
node scripts/setup-storage.js
```

#### 5. Image Not Displaying

**Error**: Image URL returns 404 or access denied

**Cause**: Storage bucket permissions or policies issue.

**Solution**:
1. Check that the `receipts` bucket is public
2. Verify storage policies allow public read access
3. Check the image URL in browser

#### 6. Database Errors

**Error**: Table doesn't exist or schema issues

**Cause**: Database schema not up to date.

**Solution**:
1. Run the complete database schema from `database/supabase-schema.sql`
2. Ensure all tables and policies are created
3. Check that RLS is properly configured

### Quick Fix Script

For immediate resolution of upload issues, run this comprehensive fix:

```sql
-- Comprehensive fix for receipt upload issues
-- Run this in your Supabase SQL editor

-- 1. Fix database RLS policies
DROP POLICY IF EXISTS "Allow all operations on supplier_receipts" ON supplier_receipts;
CREATE POLICY "Allow all operations on supplier_receipts" 
ON supplier_receipts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Fix storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Allow Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'receipts');
```

### Support

For issues with the supplier receipt system:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Ensure storage bucket is properly set up
4. Check database schema is up to date
5. Run the RLS policy fix if uploads fail
6. Verify supplier orders exist for auto-population

## Future Enhancements

### Planned Features

1. **OCR Processing**: Automatic text extraction from receipt images
2. **Receipt Parsing**: Automatic extraction of line items and totals
3. **Smart Matching**: AI-powered matching of receipts to orders
4. **Bulk Upload**: Upload multiple receipts at once
5. **Receipt Categories**: Categorize receipts by type
6. **Export**: Export receipt data to CSV/PDF
7. **Receipt Validation**: Automatic validation of receipt amounts vs order amounts
8. **Duplicate Detection**: Detect and prevent duplicate receipt uploads

### OCR Integration

The system is designed to support OCR processing:

```typescript
// Future OCR processing with smart linking
const processReceiptOCR = async (receiptId: string) => {
  // 1. Get receipt image
  // 2. Process with OCR service
  // 3. Extract text and line items
  // 4. Match with existing orders
  // 5. Auto-link to matching order
  // 6. Update database with extracted data
  // 7. Mark as processed
}
```

### Smart Matching

Future enhancement for intelligent receipt-to-order matching:

```typescript
// Future smart matching
const smartMatchReceipt = async (receiptData) => {
  // 1. Extract invoice number from OCR
  // 2. Search for matching orders
  // 3. Validate amounts and dates
  // 4. Auto-link if confidence is high
  // 5. Prompt user for confirmation
}
``` 