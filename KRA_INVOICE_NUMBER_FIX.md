# KRA Invoice Number Fix

## Problem Description

The KRA purchase API was generating its own invoice numbers instead of using the invoice number entered in the bulk update component. This caused all purchases to show the same invoice number (7677) in the KRA system, regardless of the actual invoice number entered.

## Root Cause

1. **Wrong Invoice Number Source**: The API was generating its own `invcNo` instead of using the user-provided invoice number
2. **Non-Unique orgInvcNo**: The `orgInvcNo` was not properly incrementing for each transaction
3. **Incorrect Field Mapping**: The supplier invoice number was being used in the wrong field

## Solution Implemented

### 1. Fixed Invoice Number Handling

**Before:**
```javascript
// Generate KRA invoice number if not provided
const kraInvoiceNo = await getNextPurchaseInvoiceNo()

const purchasePayload = {
  invcNo: kraInvoiceNo,  // ❌ Using generated number
  orgInvcNo: 0,          // ❌ Always 0
  spplrInvcNo: invoiceNumber, // ❌ Supplier invoice in wrong field
}
```

**After:**
```javascript
// Generate unique orgInvcNo for this transaction
const orgInvcNo = await getNextOrgInvcNo()

// Use the exact invoice number from the bulk update component
const invcNo = parseInt(invoiceNumber) || orgInvcNo

const purchasePayload = {
  invcNo,                // ✅ Using user-provided invoice number
  orgInvcNo,             // ✅ Unique incrementing number
  spplrInvcNo: invoiceNumber, // ✅ Supplier invoice in correct field
}
```

### 2. Improved orgInvcNo Generation

**Before:**
```javascript
async function getNextPurchaseInvoiceNo() {
  const { data, error } = await supabase
    .from('supplier_orders')  // ❌ Wrong table
    .select('invoice_number') // ❌ Wrong field
    .order('invoice_number', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastInvoice = data[0].invoice_number
    const match = lastInvoice.match(/(\d+)/)  // ❌ Complex parsing
    if (match) {
      next = parseInt(match[1], 10) + 1
    }
  }
  return next
}
```

**After:**
```javascript
async function getNextOrgInvcNo() {
  const { data, error } = await supabase
    .from('kra_transactions')  // ✅ Correct table
    .select('kra_invoice_no')  // ✅ Correct field
    .not('kra_invoice_no', 'is', null)
    .order('kra_invoice_no', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastInvcNo = data[0].kra_invoice_no
    if (lastInvcNo) {
      next = lastInvcNo + 1  // ✅ Simple increment
    }
  }
  return next
}
```

### 3. Enhanced Logging and Debugging

Added comprehensive logging to track invoice number generation:

```javascript
console.log('KRA Purchase Invoice Numbers:', {
  inputInvoiceNumber: invoiceNumber,
  parsedInvcNo: invcNo,
  generatedOrgInvcNo: orgInvcNo,
  supplierInvoiceNumber: invoiceNumber
})

console.log('Key fields for debugging:', {
  invcNo: purchasePayload.invcNo,
  orgInvcNo: purchasePayload.orgInvcNo,
  spplrInvcNo: purchasePayload.spplrInvcNo,
  supplierName: purchasePayload.spplrNm,
  totalAmount: purchasePayload.totAmt,
  itemCount: purchasePayload.totItemCnt
})
```

### 4. Fixed Stock-In SAR Numbers

Also fixed the stock-in API to generate truly unique SAR numbers:

```javascript
async function generateUniqueSarNo(): Promise<number> {
  const { data, error } = await supabase
    .from('kra_transactions')
    .select('kra_sar_no')
    .not('kra_sar_no', 'is', null)
    .order('kra_sar_no', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastSarNo = data[0].kra_sar_no
    if (lastSarNo) {
      next = lastSarNo + 1
    }
  }
  return next
}
```

## Field Mapping in KRA Payload

| Field | Purpose | Value Source |
|-------|---------|--------------|
| `invcNo` | KRA Invoice Number | User-provided invoice number from bulk update |
| `orgInvcNo` | Original Invoice Number | Auto-incrementing unique number |
| `spplrInvcNo` | Supplier Invoice Number | User-provided invoice number (for supplier reference) |

## Testing

### Test Script

Created a test script (`scripts/test-kra-invoice-numbers.js`) to verify:
- Current highest invoice number
- Next invoice number generation
- Duplicate detection
- Recent transaction history

### Manual Testing

1. **Enter different invoice numbers** in the bulk update component
2. **Check KRA system** to verify each purchase shows the correct invoice number
3. **Verify uniqueness** - each transaction should have a unique `orgInvcNo`
4. **Check logs** for proper invoice number handling

## Expected Behavior After Fix

1. **Unique Invoice Numbers**: Each bulk update will show the exact invoice number entered in the form
2. **Incrementing orgInvcNo**: Each transaction will have a unique, incrementing `orgInvcNo`
3. **Proper KRA Display**: KRA system will show different invoice numbers for different purchases
4. **Audit Trail**: All invoice numbers are properly logged in the `kra_transactions` table

## Files Modified

1. `app/api/kra/purchase/route.ts` - Fixed invoice number handling
2. `app/api/kra/stock-in-enhanced/route.ts` - Fixed SAR number generation
3. `components/inventory/bulk-inventory-update.tsx` - Enhanced logging
4. `scripts/test-kra-invoice-numbers.js` - Added test script

## Verification Steps

1. Run the database migration for the `kra_transactions` table
2. Test with different invoice numbers in bulk update
3. Check KRA system to verify unique invoice numbers
4. Run the test script to verify no duplicates
5. Monitor logs for proper invoice number handling

## Future Considerations

1. **Invoice Number Validation**: Add validation to ensure invoice numbers are unique per supplier
2. **Batch Processing**: Consider batch invoice number generation for multiple transactions
3. **Rollback Mechanism**: Add ability to rollback invoice numbers if needed
4. **Audit Reports**: Generate reports showing invoice number usage and patterns 