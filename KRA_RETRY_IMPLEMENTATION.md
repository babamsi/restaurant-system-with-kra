# KRA Retry Implementation with Invoice Number Handling

## Overview

This implementation provides a comprehensive KRA retry system for failed sales transactions. It automatically handles duplicate invoice number errors by generating new invoice numbers and creates PDF receipts when retries are successful.

## Features

1. **Automatic Invoice Number Handling**: Detects duplicate invoice errors and generates new invoice numbers
2. **PDF Receipt Generation**: Automatically generates and downloads PDF receipts after successful retries
3. **Error Classification**: Distinguishes between duplicate invoice errors and other KRA errors
4. **Visual Indicators**: Clear UI indicators for different types of errors
5. **Comprehensive Logging**: Detailed logging for debugging and audit purposes
6. **Database Updates**: Updates failed sale records with new status and invoice numbers

## Error Handling

### Duplicate Invoice Error Detection
The system automatically detects duplicate invoice errors by checking for specific error messages:

```typescript
const isDuplicateInvoiceError = failedSale.kra_error?.toLowerCase().includes('invoice number already exists') ||
                               failedSale.kra_error?.toLowerCase().includes('duplicate invoice') ||
                               failedSale.kra_error?.toLowerCase().includes('invoice already exists')
```

### Invoice Number Generation
When a duplicate invoice error is detected, the system generates a new unique invoice number:

```typescript
async function getNextRetryInvoiceNo() {
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('trdInvcNo')
    .not('trdInvcNo', 'is', null)
    .order('trdInvcNo', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastInvoice = data[0].trdInvcNo
    if (lastInvoice) {
      next = parseInt(lastInvoice, 10) + 1
    }
  }
  return next
}
```

## Retry Process Flow

### 1. Error Analysis
- Fetch the failed sale record from database
- Analyze the error message to determine if it's a duplicate invoice error
- Fetch the original order and items data

### 2. Invoice Number Handling
- If duplicate invoice error: Generate new unique invoice number
- If other error: Use original invoice number
- Log the decision for audit purposes

### 3. KRA API Call
- Prepare items with proper tax calculations
- Call KRA save-sale API with appropriate invoice number
- Handle KRA response and errors

### 4. Success Handling
- Update database record with new KRA data
- Generate PDF receipt with QR code
- Download receipt automatically
- Update UI to reflect success

### 5. Error Handling
- Update database with new error details
- Provide user feedback based on error type
- Log all actions for debugging

## API Endpoints

### `/api/kra/retry-sale`
**Method**: POST
**Purpose**: Retry failed KRA sales with automatic invoice number handling

**Request Body**:
```typescript
{
  sales_invoice_id: string // ID of the failed sale record
}
```

**Response**:
```typescript
// Success
{
  success: true,
  kraData: KRAResponse,
  invcNo: number,
  message: string,
  receiptGenerated: boolean
}

// Error
{
  error: string,
  kraData?: KRAResponse
}
```

### Enhanced `/api/kra/save-sale`
**Method**: POST
**Purpose**: Handle both new sales and retry scenarios

**Request Body**:
```typescript
{
  items: ReceiptItem[],
  payment: { method: string },
  customer: { name: string, tin?: string },
  saleId: string,
  orgInvcNo?: number,
  retryInvoiceNo?: number // New parameter for retry scenarios
}
```

## Database Schema Updates

### `sales_invoices` Table
The existing table is used with enhanced error tracking:

```sql
-- Existing fields
id UUID PRIMARY KEY,
order_id UUID REFERENCES table_orders(id),
trdInvcNo INTEGER,
kra_status VARCHAR(20), -- 'ok', 'error', 'pending'
kra_error TEXT,
kra_curRcptNo VARCHAR(50),
kra_totRcptNo VARCHAR(50),
kra_intrlData TEXT,
kra_rcptSign VARCHAR(100),
kra_sdcDateTime TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE,
updated_at TIMESTAMP WITH TIME ZONE
```

## User Interface

### Failed Sales Page (`/kra-failed-sales`)

#### Visual Indicators
- **Duplicate Invoice Errors**: Yellow badge with "Duplicate Invoice" label
- **Other Errors**: Red badge with "Error" label
- **Retry Buttons**: Different text based on error type

#### Error Display
```typescript
const isDuplicateError = receipt.kra_error?.toLowerCase().includes('invoice number already exists') ||
                        receipt.kra_error?.toLowerCase().includes('duplicate invoice') ||
                        receipt.kra_error?.toLowerCase().includes('invoice already exists');

// UI Elements
<Badge variant={isDuplicateError ? "secondary" : "destructive"}>
  {isDuplicateError ? "Duplicate" : "Error"}
</Badge>

<Button>
  {isDuplicateError ? 'Retry with New Invoice' : 'Retry'}
</Button>
```

#### User Feedback
- **Success**: Shows new invoice number and confirms receipt generation
- **Duplicate Error**: Explains that new invoice number will be used
- **Other Errors**: Shows specific error message
- **Network Errors**: Generic error message with logging

## Implementation Details

### 1. Retry Logic
```typescript
const handleRetry = async (invoiceId: string) => {
  setRetryingId(invoiceId);
  
  try {
    const res = await fetch('/api/kra/retry-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales_invoice_id: invoiceId }),
    });
    
    const result = await res.json();
    
    if (result.success) {
      toast({ 
        title: 'KRA Retry Successful', 
        description: `Sale was successfully pushed to KRA. Invoice: ${result.invcNo}. Receipt generated and downloaded.`,
        variant: 'default'
      });
    } else {
      // Handle different error types
      const isDuplicateError = result.error?.toLowerCase().includes('invoice number already exists');
      
      if (isDuplicateError) {
        toast({ 
          title: 'Duplicate Invoice Error', 
          description: 'Invoice number already exists. The system will automatically use a new invoice number on next retry.',
          variant: 'warning'
        });
      } else {
        toast({ 
          title: 'KRA Retry Failed', 
          description: result.error || 'Failed to retry KRA sale',
          variant: 'destructive' 
        });
      }
    }
  } catch (error) {
    console.error('Retry error:', error);
    toast({ 
      title: 'Retry Error', 
      description: 'An error occurred while retrying the sale',
      variant: 'destructive' 
    });
  } finally {
    setRetryingId(null);
  }
};
```

### 2. Invoice Number Handling
```typescript
// Check if the error was due to duplicate invoice number
const isDuplicateInvoiceError = failedSale.kra_error?.toLowerCase().includes('invoice number already exists') ||
                               failedSale.kra_error?.toLowerCase().includes('duplicate invoice') ||
                               failedSale.kra_error?.toLowerCase().includes('invoice already exists')

// Generate new invoice number if needed
let newInvoiceNo = failedSale.trdInvcNo
if (isDuplicateInvoiceError) {
  newInvoiceNo = await getNextRetryInvoiceNo()
  console.log(`Duplicate invoice error detected. Using new invoice number: ${newInvoiceNo}`)
}
```

### 3. PDF Receipt Generation
```typescript
// Generate and download KRA receipt
try {
  const receiptData = {
    kraData: {
      curRcptNo,
      totRcptNo,
      intrlData,
      rcptSign,
      sdcDateTime,
      invcNo: kraData.invcNo,
      trdInvcNo: order.id
    },
    items: receiptItems,
    customer: {
      name: order.customer_name || 'Walk-in Customer',
      pin: order.customer_pin
    },
    payment_method: failedSale.payment_method,
    total_amount: orderTotal,
    tax_amount: orderTax,
    net_amount: orderNet,
    order_id: order.id
  }

  // Generate and download KRA receipt as PDF
  const { generateAndDownloadReceipt } = await import('@/lib/receipt-utils')
  await generateAndDownloadReceipt(receiptData)

} catch (receiptError) {
  console.error('Error generating KRA receipt for retry:', receiptError)
  // Don't fail the retry if receipt generation fails
}
```

## Error Scenarios

### 1. Duplicate Invoice Error
**Cause**: KRA already has an invoice with the same number
**Solution**: Generate new unique invoice number
**User Feedback**: "Invoice number already exists. The system will automatically use a new invoice number on next retry."

### 2. Network/API Errors
**Cause**: KRA API unavailable or network issues
**Solution**: Retry with same invoice number
**User Feedback**: Specific error message from KRA

### 3. Data Validation Errors
**Cause**: Invalid item data or missing required fields
**Solution**: Fix data issues before retry
**User Feedback**: Specific validation error message

### 4. Receipt Generation Errors
**Cause**: PDF generation or QR code creation fails
**Solution**: Continue with retry success, log receipt error
**User Feedback**: Success message with note about receipt issue

## Testing

### Manual Testing Checklist
1. **Create a failed sale** by causing a KRA error
2. **Check failed sales page** shows the error correctly
3. **Test duplicate invoice retry** - should generate new invoice number
4. **Test other error retry** - should use original invoice number
5. **Verify PDF receipt** downloads after successful retry
6. **Check database updates** reflect new status and invoice numbers
7. **Test UI indicators** show correct error types

### Automated Testing
- Unit tests for invoice number generation
- Integration tests for retry API
- Error classification tests
- PDF generation tests for retry scenarios

## Monitoring and Logging

### Console Logs
- Invoice number generation decisions
- KRA API calls and responses
- Receipt generation attempts
- Error details and classifications

### Database Logs
- Failed sale records with error details
- Updated records after successful retries
- Invoice number changes for audit trail

### User Feedback
- Toast notifications for all retry outcomes
- Clear error messages with actionable information
- Success confirmations with invoice numbers

## Future Enhancements

### Planned Features
1. **Bulk Retry**: Retry multiple failed sales at once
2. **Automatic Retry**: Schedule automatic retries for certain error types
3. **Retry Limits**: Prevent infinite retry loops
4. **Error Analytics**: Track error patterns and frequencies
5. **Email Notifications**: Notify administrators of persistent failures

### Technical Improvements
1. **Retry Queues**: Queue retry attempts for better performance
2. **Error Categorization**: More sophisticated error classification
3. **Invoice Number Pooling**: Pre-generate invoice numbers for faster retries
4. **Receipt Templates**: Customizable receipt formats for retry scenarios

## Troubleshooting

### Common Issues

#### Retry Not Working
- Check if the failed sale record exists
- Verify KRA API connectivity
- Check console logs for specific errors

#### Invoice Number Conflicts
- Verify invoice number generation logic
- Check for concurrent retry attempts
- Validate database constraints

#### Receipt Not Generating
- Check PDF generation dependencies
- Verify QR code library installation
- Check browser download permissions

### Debug Information
- All retry attempts are logged
- Invoice number changes are tracked
- Error classifications are preserved
- Receipt generation attempts are logged

## Support

For technical support:
1. Check console logs for retry details
2. Verify failed sale record exists
3. Test KRA API connectivity
4. Check invoice number generation
5. Contact development team with specific error messages 