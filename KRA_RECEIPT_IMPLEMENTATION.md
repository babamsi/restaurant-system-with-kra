# KRA Receipt Implementation

## Overview

This implementation adds automatic KRA receipt generation and download functionality to the POS system. After a successful KRA sale transaction, the system generates a properly formatted KRA receipt and automatically downloads it as a text file.

## Features

1. **Automatic Receipt Generation**: Generates KRA-compliant receipts after successful sales
2. **Automatic Download**: Downloads receipts as text files with proper naming
3. **Database Storage**: Stores all receipts in the database for audit purposes
4. **Error Handling**: Graceful handling of receipt generation failures
5. **KRA Format Compliance**: Follows the exact KRA receipt format specification

## KRA Receipt Format

The receipt follows the KRA specification format:

```
Restaurant POS
Nairobi, Kenya
PIN: P052380018M
--------------------------------------------------
SALES RECEIPT
INVOICE NO.#: [KRA Invoice Number]
--------------------------------------------------
[Customer Information]
--------------------------------------------------
[Item Details with Tax Breakdown]
-----------------------------------------------------
TOTAL [Total Amount]
TOTAL B-16.00% [Net Amount]
TOTAL TAX B [Tax Amount]
TOTAL TAX [Tax Amount]
--------------------------------------------------
[Payment Method] [Total Amount]
ITEMS NUMBER [Item Count]
------------------------------------------------
SCU INFORMATION
Date: [Date] Time: [Time]
CU ID: [KRA Receipt Number]
Invoice No.: [KRA Receipt Number]/[Invoice Number]
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
```

## Implementation Details

### 1. Database Schema

**Table: `kra_receipts`**
```sql
CREATE TABLE kra_receipts (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. API Endpoints

#### `/api/kra/generate-receipt`
- **Method**: POST
- **Purpose**: Generate KRA receipt and save to database
- **Request Body**:
  ```typescript
  {
    kraData: {
      curRcptNo: string,
      totRcptNo: string,
      intrlData: string,
      rcptSign: string,
      sdcDateTime: string,
      invcNo: number,
      trdInvcNo: string
    },
    items: ReceiptItem[],
    customer: { name: string, pin?: string },
    payment_method: string,
    total_amount: number,
    tax_amount: number,
    net_amount: number,
    order_id: string
  }
  ```

### 3. Utility Functions

#### `lib/receipt-utils.ts`
- `generateKRAReceiptText()`: Generates formatted receipt text
- `downloadReceiptAsText()`: Downloads receipt as text file
- `generateReceiptFilename()`: Creates proper filename for receipts
- `generateAndDownloadReceipt()`: Complete receipt generation and download

### 4. POS Integration

#### Payment Flow
1. **KRA Sale API Call**: Send sale to KRA
2. **Success Check**: Verify KRA response
3. **Receipt Generation**: Generate receipt data
4. **Database Save**: Store receipt in database
5. **File Download**: Automatically download receipt
6. **User Notification**: Show success/error messages

#### Code Integration
```typescript
// After successful KRA sale
if (kraData.success) {
  const { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime } = kraData.kraData.data
  
  // Generate receipt data
  const receiptData: ReceiptRequest = {
    kraData: { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime, invcNo: kraData.invcNo, trdInvcNo: order.id },
    items: receiptItems,
    customer: { name: order.customer_name || 'Walk-in Customer', pin: order.customer_pin },
    payment_method: paymentMethod,
    total_amount: orderTotal,
    tax_amount: orderTax,
    net_amount: orderNet,
    order_id: order.id
  }

  // Generate and download receipt
  await generateAndDownloadReceipt(receiptData)
}
```

## File Naming Convention

Receipts are automatically named using the format:
```
KRA-Receipt-[InvoiceNumber]-[OrderID]-[Date]-[Time].txt
```

Example: `KRA-Receipt-12345-abc123-20241201-143022.txt`

## Error Handling

### Receipt Generation Errors
- If KRA sale succeeds but receipt generation fails, the order still completes
- User is notified of receipt generation failure
- Error is logged for debugging

### Database Errors
- If database save fails, receipt generation continues
- File download still occurs
- Error is logged for investigation

### Network Errors
- Graceful fallback if API calls fail
- User is informed of partial success
- System continues to function

## Business Logic

### Tax Calculation
- Default VAT rate: 16%
- Tax calculation: `(item_price * quantity) * 0.16`
- Net amount: `total_amount - tax_amount`

### Customer Information
- If customer PIN is available, it's included in receipt
- Default customer name: "Walk-in Customer"
- Customer information is stored for audit purposes

### Payment Methods
- All payment methods are supported
- Payment method is displayed in uppercase on receipt
- Payment method is stored in database

## Security Considerations

### Data Protection
- Receipt data is stored securely in database
- No sensitive information is exposed in filenames
- Receipt signatures are preserved for verification

### Audit Trail
- All receipts are logged with timestamps
- Receipt IDs are linked to orders
- Complete transaction history is maintained

## Testing

### Manual Testing
1. **Complete a sale** in the POS system
2. **Verify KRA sale** is successful
3. **Check receipt download** occurs automatically
4. **Verify receipt format** matches KRA specification
5. **Check database** for receipt storage

### Automated Testing
- Unit tests for receipt generation functions
- Integration tests for API endpoints
- End-to-end tests for complete payment flow

## Configuration

### Business Information
```typescript
const BUSINESS_CONFIG = {
  name: "Restaurant POS",
  address: "Nairobi, Kenya",
  pin: "P052380018M"
}
```

### Tax Configuration
```typescript
const TAX_CONFIG = {
  defaultRate: 16,
  taxFactor: 0.16
}
```

## Future Enhancements

### Planned Features
1. **PDF Generation**: Convert text receipts to PDF format
2. **Email Receipts**: Send receipts via email
3. **Receipt Templates**: Customizable receipt layouts
4. **Bulk Receipt Generation**: Generate receipts for multiple orders
5. **Receipt Search**: Search and retrieve historical receipts

### Technical Improvements
1. **Caching**: Cache frequently used receipt data
2. **Compression**: Compress receipt files for storage
3. **Backup**: Automated backup of receipt database
4. **Analytics**: Receipt generation analytics and reporting

## Troubleshooting

### Common Issues

#### Receipt Not Downloading
- Check browser download settings
- Verify file permissions
- Check console for JavaScript errors

#### Receipt Format Issues
- Verify KRA data structure
- Check date/time formatting
- Validate currency formatting

#### Database Errors
- Check database connection
- Verify table schema
- Check for constraint violations

### Debug Information
- All receipt generation is logged
- KRA API responses are preserved
- Error details are stored in database
- Console logs provide detailed debugging info

## Compliance

### KRA Requirements
- ✅ Receipt format compliance
- ✅ Tax calculation accuracy
- ✅ Invoice number tracking
- ✅ Receipt signature preservation
- ✅ Audit trail maintenance

### Data Retention
- Receipts are stored indefinitely
- Database backups include receipt data
- Receipt data is exportable for compliance

## Support

For technical support or questions about the KRA receipt implementation:
1. Check the console logs for error details
2. Verify the database schema is correctly applied
3. Test with a simple sale transaction
4. Contact the development team with specific error messages 