# KRA Retry PDF Generation Test Guide

## Issue Fixed
The "ReferenceError: document is not defined" error was occurring because the PDF generation was being attempted on the server side (in the API route) where the `document` object is not available.

## Solution Implemented
1. **Server-side changes**: The retry-sale API now returns receipt data instead of generating PDFs
2. **Client-side changes**: The failed sales page now handles PDF generation on the client side
3. **Environment checks**: Added browser environment checks to prevent server-side PDF generation

## Test Steps

### 1. Create a Failed Sale
1. Go to the POS system
2. Complete a sale that will fail KRA submission (e.g., duplicate invoice error)
3. Verify the sale appears in the failed sales list

### 2. Test Retry with PDF Generation
1. Navigate to `/kra-failed-sales`
2. Click "Retry" on a failed sale
3. Verify the retry process completes successfully
4. Check that a PDF receipt is automatically downloaded
5. Verify the failed sale is removed from the list

### 3. Test Duplicate Invoice Handling
1. Create a sale with a duplicate invoice number
2. Verify it shows as "Duplicate Invoice" error
3. Click "Retry with New Invoice"
4. Verify a new invoice number is generated
5. Check that PDF is downloaded with new invoice number

### 4. Test Error Handling
1. Try retrying a sale with other types of errors
2. Verify appropriate error messages are shown
3. Check that the sale remains in the failed list

## Expected Behavior

### Successful Retry
- ✅ KRA API call succeeds
- ✅ Database record is updated with new KRA data
- ✅ PDF receipt is generated and downloaded automatically
- ✅ Toast notification shows success message
- ✅ Failed sale is removed from the list

### Duplicate Invoice Error
- ✅ New invoice number is generated
- ✅ KRA API call succeeds with new invoice number
- ✅ PDF receipt is generated with new invoice number
- ✅ Success message shows new invoice number

### Other Errors
- ✅ Error message is displayed
- ✅ Sale remains in failed list
- ✅ No PDF is generated
- ✅ Appropriate error classification is shown

## Technical Details

### Files Modified
1. `app/api/kra/retry-sale/route.ts` - Removed server-side PDF generation
2. `app/kra-failed-sales/page.tsx` - Added client-side PDF generation
3. `lib/receipt-utils.ts` - Added environment checks

### Key Changes
```typescript
// Server-side: Return receipt data instead of generating PDF
return NextResponse.json({ 
  success: true, 
  kraData,
  invcNo: kraData.invcNo,
  message: 'Sale successfully retried and pushed to KRA',
  receiptData: receiptData // Return receipt data for client-side PDF generation
})

// Client-side: Generate PDF after successful retry
if (result.success) {
  try {
    const { generateAndDownloadReceipt } = await import('@/lib/receipt-utils')
    await generateAndDownloadReceipt(result.receiptData)
    // Show success message
  } catch (receiptError) {
    // Handle PDF generation error
  }
}
```

### Environment Checks
```typescript
// Check if we're in a browser environment
if (typeof window === 'undefined') {
  throw new Error('PDF generation is only available in browser environment')
}

// Check for document object
if (typeof window === 'undefined' || typeof document === 'undefined') {
  console.warn('PDF download attempted in server environment. Skipping download.')
  return Promise.resolve()
}
```

## Troubleshooting

### PDF Not Downloading
1. Check browser console for errors
2. Verify jsPDF and qrcode libraries are installed
3. Check browser download permissions
4. Verify the receipt data is properly formatted

### Retry Not Working
1. Check network connectivity to KRA API
2. Verify the failed sale record exists
3. Check console logs for specific errors
4. Verify invoice number generation logic

### Environment Issues
1. Ensure the code is running in browser environment
2. Check that all imports are client-side compatible
3. Verify dynamic imports are working correctly

## Success Criteria
- ✅ No "document is not defined" errors
- ✅ PDF receipts are generated and downloaded automatically
- ✅ Failed sales are properly retried with new invoice numbers
- ✅ User receives appropriate feedback for all scenarios
- ✅ Database records are updated correctly 