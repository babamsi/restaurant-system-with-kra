# KRA PDF Receipt Implementation with QR Codes

## Overview

This implementation provides a comprehensive KRA receipt system that generates PDF receipts with QR codes, following the exact KRA specification format. The receipts include proper tax breakdown tables, discount handling, and QR codes for KRA verification.

## Features

1. **PDF Generation**: Generates professional PDF receipts instead of text files
2. **QR Code Integration**: Includes QR codes for KRA verification
3. **Tax Breakdown Tables**: Detailed tax breakdown by rate (Exempt, 16% VAT, 0%, Non-VAT, 8% VAT)
4. **Discount Support**: Handles discounts with narration and percentage
5. **Multiple Tax Types**: Supports all KRA tax classifications
6. **Automatic Download**: Downloads PDF receipts automatically after successful sales
7. **Database Storage**: Stores complete receipt data for audit purposes

## KRA Receipt Format

The receipt follows the exact KRA specification:

```
Restaurant POS
Nairobi, Kenya
PIN: P052380018M
TAX INVOICE
--------------------------------------------------
Welcome to our restaurant
Buyer PIN: [Customer PIN] (if available)
--------------------------------------------------
[Item Details with Tax Type Codes]
Discount narration and value: [Percentage]% ([Amount]) (if applicable)
-----------------------------------------------------
TOTAL BEFORE DISCOUNT [Amount]
TOTAL DISCOUNT AWARDED ([Amount]) (if applicable)
SUB TOTAL [Amount]
VAT [Amount]
TOTAL [Amount]
--------------------------------------------------
[Payment Method] [Amount]
ITEMS NUMBER [Count]
------------------------------------------------
Rate Taxable Amount VAT
EX [Amount] [Tax]
16% [Amount] [Tax]
0% [Amount] [Tax]
Non-VAT [Amount] [Tax]
8% [Amount] [Tax]
------------------------------------------------
SCU INFORMATION
Date: [Date] Time: [Time]
SCU ID: [KRA Receipt Number]
CU INVOICE NO.: [SCU ID]/[Receipt Number]
Internal Data:
[KRA Internal Data]
Receipt Signature:
[KRA Receipt Signature]
----------------------------------------------
TIS INFORMATION
RECEIPT NUMBER: [KRA Total Receipt Number]
DATE: [Date] TIME: [Time]
--------------------------------------------
THANK YOU
WE LOOK FORWARD TO SERVE YOU AGAIN
[QR Code for KRA Verification]
```

## Tax Type Classifications

### KRA Tax Codes
- **A-EX**: Exempt items (0% tax)
- **B**: Standard VAT items (16% tax)
- **C**: Zero-rated items (0% tax)
- **D**: Non-VAT items (0% tax)
- **E**: Reduced VAT items (8% tax)

### Automatic Tax Type Assignment
The system automatically assigns tax types based on item categories:

```typescript
// Tax type assignment logic
if (item.category?.toLowerCase().includes('exempt') || 
    item.category?.toLowerCase().includes('basic')) {
  taxType = 'A-EX' // Exempt
} else if (item.category?.toLowerCase().includes('zero') || 
           item.category?.toLowerCase().includes('export')) {
  taxType = 'C' // Zero rated
} else if (item.category?.toLowerCase().includes('non-vat') || 
           item.category?.toLowerCase().includes('service')) {
  taxType = 'D' // Non-VAT
} else if (item.category?.toLowerCase().includes('8%')) {
  taxType = 'E' // 8% VAT
} else {
  taxType = 'B' // Default 16% VAT
}
```

## QR Code Implementation

### QR Code Data Format
The QR code contains the KRA verification URL with:
- Business PIN
- SCU ID (KRA Receipt Number)
- Receipt Signature

```
https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceptData?{PIN+BHF-ID+Signature}
```

### QR Code Generation
```typescript
// Generate QR code data URL
export async function generateQRCode(data: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(data, {
    width: 128,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })
  return qrDataUrl
}
```

## PDF Generation

### Dependencies Required
```bash
npm install jspdf qrcode
```

### PDF Features
- **Professional Layout**: Clean, organized receipt layout
- **Proper Typography**: Different font sizes and weights for hierarchy
- **QR Code Integration**: Embedded QR codes for verification
- **Tax Tables**: Formatted tax breakdown tables
- **Currency Formatting**: Proper Kenyan Shilling formatting
- **Date/Time Formatting**: British date format (DD/MM/YYYY)

### PDF Generation Process
1. **Initialize jsPDF**: Create PDF document with A4 format
2. **Add Header**: Business information and title
3. **Add Items**: List all items with tax codes
4. **Add Totals**: Calculate and display totals
5. **Add Tax Table**: Detailed tax breakdown
6. **Add KRA Information**: SCU and TIS details
7. **Add QR Code**: KRA verification QR code
8. **Generate Blob**: Convert to downloadable PDF

## Database Schema

### Updated `kra_receipts` Table
```sql
CREATE TABLE kra_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
```

## Implementation Details

### 1. Receipt Data Structure
```typescript
interface ReceiptRequest {
  kraData: KRAReceiptData
  items: ReceiptItem[]
  customer: { name: string, pin?: string }
  payment_method: string
  total_amount: number
  tax_amount: number
  net_amount: number
  order_id: string
  discount_amount?: number
  discount_percentage?: number
  discount_narration?: string
}
```

### 2. Tax Calculation
```typescript
// Calculate tax breakdown by type
function calculateTaxBreakdown(items: ReceiptItem[]) {
  const breakdown = {
    exempt: { amount: 0, tax: 0 },
    vat16: { amount: 0, tax: 0 },
    zeroRated: { amount: 0, tax: 0 },
    nonVatable: { amount: 0, tax: 0 },
    vat8: { amount: 0, tax: 0 }
  }

  items.forEach(item => {
    switch (item.tax_type) {
      case 'A-EX': breakdown.exempt.amount += item.total; break
      case 'B': 
        breakdown.vat16.amount += item.total;
        breakdown.vat16.tax += item.tax_amount; 
        break
      case 'C': breakdown.zeroRated.amount += item.total; break
      case 'D': breakdown.nonVatable.amount += item.total; break
      case 'E': 
        breakdown.vat8.amount += item.total;
        breakdown.vat8.tax += item.tax_amount; 
        break
    }
  })

  return breakdown
}
```

### 3. POS Integration
The POS system automatically:
1. **Determines Tax Types**: Based on item categories
2. **Calculates Tax Amounts**: Per item and total
3. **Generates Receipt Data**: With all required fields
4. **Creates PDF**: With QR code and tax breakdown
5. **Downloads File**: Automatically saves to user's device
6. **Stores in Database**: For audit and retrieval

## File Naming Convention

PDF receipts are named using the format:
```
KRA-Receipt-[InvoiceNumber]-[OrderID]-[Date]-[Time].pdf
```

Example: `KRA-Receipt-12345-abc123-20241201-143022.pdf`

## Business Configuration

### Configurable Settings
```typescript
const BUSINESS_CONFIG = {
  name: "Restaurant POS",
  address: "Nairobi, Kenya",
  pin: "P052380018M",
  commercialMessage: "Welcome to our restaurant",
  thankYouMessage: "THANK YOU\nWE LOOK FORWARD TO SERVE YOU AGAIN"
}
```

### Tax Configuration
```typescript
const TAX_CONFIG = {
  vat16: 16,
  vat8: 8,
  exempt: 0,
  zeroRated: 0,
  nonVatable: 0
}
```

## Error Handling

### PDF Generation Errors
- Graceful fallback if PDF generation fails
- Console logging for debugging
- User notification of partial success

### QR Code Errors
- Continues without QR code if generation fails
- Logs error for investigation
- Receipt still functions without QR code

### Database Errors
- PDF generation continues even if database save fails
- Error logging for investigation
- User notification of partial success

## Testing

### Manual Testing Checklist
1. **Complete a sale** in the POS system
2. **Verify KRA sale** is successful
3. **Check PDF download** occurs automatically
4. **Verify receipt format** matches KRA specification
5. **Test QR code** by scanning with phone
6. **Check tax breakdown** table accuracy
7. **Verify database storage** of receipt data

### Automated Testing
- Unit tests for tax calculations
- Integration tests for PDF generation
- QR code generation tests
- Database storage tests

## Compliance

### KRA Requirements Met
- ✅ Exact receipt format compliance
- ✅ Proper tax breakdown tables
- ✅ QR code for verification
- ✅ All required KRA fields
- ✅ Tax type classifications
- ✅ Currency formatting
- ✅ Date/time formatting

### Audit Trail
- Complete receipt data stored in database
- QR codes for KRA verification
- Tax breakdown for compliance
- Receipt signatures preserved

## Future Enhancements

### Planned Features
1. **Email Receipts**: Send PDF receipts via email
2. **Receipt Templates**: Customizable layouts
3. **Bulk Generation**: Generate receipts for multiple orders
4. **Receipt Search**: Search and retrieve historical receipts
5. **Digital Signatures**: Enhanced security features

### Technical Improvements
1. **Caching**: Cache frequently used data
2. **Compression**: Optimize PDF file sizes
3. **Backup**: Automated backup of receipt database
4. **Analytics**: Receipt generation analytics

## Troubleshooting

### Common Issues

#### PDF Not Generating
- Check jsPDF installation
- Verify browser compatibility
- Check console for JavaScript errors

#### QR Code Not Appearing
- Verify qrcode library installation
- Check QR code data format
- Verify image generation permissions

#### Tax Calculations Incorrect
- Verify tax type assignments
- Check item categories
- Validate tax rate calculations

### Debug Information
- All generation steps are logged
- Error details stored in database
- Console logs provide debugging info
- Receipt data preserved for investigation

## Support

For technical support:
1. Check console logs for error details
2. Verify all dependencies are installed
3. Test with a simple sale transaction
4. Contact development team with specific errors 