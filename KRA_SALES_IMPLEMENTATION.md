# KRA Sales Implementation

## Overview

This implementation provides a comprehensive KRA sales viewing system that allows users to fetch and view all sales from KRA using the `selectTrnsPurchaseSalesList` API with a user-selectable date. The system correctly handles the actual KRA API response format which returns sales data in the `saleList` field.

## Features

1. **Date Selection**: Interactive calendar to select the date for fetching sales
2. **Real-time Fetching**: Calls KRA API to get sales data for selected date
3. **Search & Filter**: Search by supplier name, invoice numbers, and filter by payment type
4. **Detailed View**: Click on any sale to view detailed information including item list
5. **Responsive Design**: Works on desktop, tablet, and mobile devices
6. **Payment Type Indicators**: Visual badges for different payment methods
7. **Tax Breakdown**: Detailed tax analysis by tax types (A, B, C, D, E)
8. **Currency Formatting**: Proper Kenyan Shilling formatting for all amounts

## API Integration

### KRA API Endpoint
- **Endpoint**: `selectTrnsPurchaseSalesList`
- **URL**: `https://etims-api-sbx.kra.go.ke/etims-api/selectTrnsPurchaseSalesList`
- **Method**: POST

### Request Payload
```typescript
{
  lastReqDt: "20241201000000"  // Format: YYYYMMDDHHMMSS
}
```

### Response Structure
```typescript
{
  resultCd: "000",
  resultMsg: "Successful",
  resultDt: "20250724151928",
  data: {
    saleList: Array<KRASale>
  }
}
```

## Data Structure

### KRASale Interface
```typescript
interface KRASale {
  spplrTin: string              // Supplier TIN
  spplrNm: string               // Supplier Name
  spplrBhfId: string            // Supplier BHF ID
  spplrInvcNo: number           // Supplier Invoice Number
  spplrSdcId: string            // Supplier SDC ID
  spplrMrcNo: string            // Supplier MRC Number
  rcptTyCd: string              // Receipt Type Code
  pmtTyCd: string               // Payment Type Code
  cfmDt: string                 // Confirm Date (YYYY-MM-DD HH:mm:ss)
  salesDt: string               // Sales Date (YYYYMMDD)
  stockRlsDt: string | null     // Stock Release Date
  totItemCnt: number            // Total Item Count
  taxblAmtA: number             // Taxable Amount Type A
  taxblAmtB: number             // Taxable Amount Type B
  taxblAmtC: number             // Taxable Amount Type C
  taxblAmtD: number             // Taxable Amount Type D
  taxblAmtE: number             // Taxable Amount Type E
  taxRtA: number                // Tax Rate Type A
  taxRtB: number                // Tax Rate Type B
  taxRtC: number                // Tax Rate Type C
  taxRtD: number                // Tax Rate Type D
  taxRtE: number                // Tax Rate Type E
  taxAmtA: number               // Tax Amount Type A
  taxAmtB: number               // Tax Amount Type B
  taxAmtC: number               // Tax Amount Type C
  taxAmtD: number               // Tax Amount Type D
  taxAmtE: number               // Tax Amount Type E
  totTaxblAmt: number           // Total Taxable Amount
  totTaxAmt: number             // Total Tax Amount
  totAmt: number                // Total Amount
  remark: string | null         // Remarks
  itemList: KRASaleItem[]       // Array of sale items
}
```

### KRASaleItem Interface
```typescript
interface KRASaleItem {
  itemSeq: number               // Item Sequence
  itemCd: string                // Item Code
  itemClsCd: string             // Item Classification Code
  itemNm: string                // Item Name
  bcd: string | null            // Barcode
  pkgUnitCd: string             // Package Unit Code
  pkg: number                   // Package Quantity
  qtyUnitCd: string             // Quantity Unit Code
  qty: number                   // Quantity
  prc: number                   // Unit Price
  splyAmt: number               // Supply Amount
  dcRt: number                  // Discount Rate
  dcAmt: number                 // Discount Amount
  taxTyCd: string               // Tax Type Code
  taxblAmt: number              // Taxable Amount
  taxAmt: number                // Tax Amount
  totAmt: number                // Total Amount
}
```

## User Interface

### Main Page (`/kra/purchases`)
- **Header**: Page title with refresh button
- **Filters Section**: Date selector, search, and payment type filter
- **Sales Table**: List of all sales with key information
- **Details Dialog**: Detailed view of selected sale

### Navigation
- Added to sidebar navigation as "KRA Sales"
- Uses Receipt icon for visual identification
- Accessible from main navigation menu

## Components

### 1. KRASalesPage (`app/kra/purchases/page.tsx`)
**Main page component with features:**
- Date selection with calendar popup
- Search functionality
- Payment type filtering
- Sales table with clickable rows
- Loading states and error handling

### 2. SalesDetailsDialog (`components/kra/sales-details-dialog.tsx`)
**Detailed sale view with:**
- Sale header information
- Supplier details
- Financial summary cards
- Tax breakdown by type
- Complete item list table
- Payment and receipt type badges

### 3. API Route (`app/api/kra/purchases/route.ts`)
**Backend API that:**
- Validates request payload
- Calls KRA API with proper headers
- Handles KRA responses
- Returns formatted sales data

## Date Handling

### Date Format Conversion
```typescript
// Convert Date object to KRA format (YYYYMMDDHHMMSS)
const formatDateForKRA = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}000000`
}

// Convert KRA date format back to readable format
const formatDate = (dateString: string) => {
  // KRA date format: YYYY-MM-DD HH:mm:ss
  const date = new Date(dateString)
  return format(date, 'dd/MM/yyyy HH:mm')
}
```

## Payment Type Mapping

### Payment Type Codes
- **'01'**: Cash (Green badge)
- **'02'**: Card (Blue badge)
- **'03'**: Mobile Money (Purple badge)

### Receipt Type Codes
- **'S'**: Standard
- **'Z'**: Zero Rated
- **'E'**: Exempt

### Tax Type Codes
- **'A'**: Type A (0% rate)
- **'B'**: Type B (18% rate)
- **'C'**: Type C (0% rate)
- **'D'**: Type D (0% rate)
- **'E'**: Type E (16% rate)

## Filtering and Search

### Search Functionality
- **Supplier Name**: Search by supplier name
- **Invoice Numbers**: Search by supplier invoice number
- **SDC ID**: Search by supplier SDC ID
- **Real-time**: Updates results as you type

### Payment Type Filtering
- **All Payment Types**: Shows all sales
- **Cash**: Shows only cash payments
- **Card**: Shows only card payments
- **Mobile Money**: Shows only mobile money payments

## Tax Analysis

### Tax Breakdown Display
The system shows detailed tax information:

#### Taxable Amounts by Type
- Type A (0%): Zero-rated items
- Type B (18%): Standard VAT rate
- Type C (0%): Exempt items
- Type D (0%): Special categories
- Type E (16%): Reduced VAT rate

#### Tax Amounts by Type
- Corresponding tax amounts for each tax type
- Clear breakdown for compliance reporting

## Error Handling

### API Errors
- **Network Errors**: Handled with user-friendly messages
- **KRA API Errors**: Displays KRA error messages
- **Validation Errors**: Prevents invalid requests

### User Feedback
- **Loading States**: Spinner during API calls
- **Success Messages**: Confirmation of successful data fetch
- **Error Messages**: Clear error descriptions
- **Empty States**: Helpful messages when no data found

## Responsive Design

### Desktop Layout
- Full-width table with all columns
- Side-by-side filters
- Detailed sale information

### Tablet Layout
- Responsive table with horizontal scroll
- Stacked filters
- Maintained functionality

### Mobile Layout
- Vertical table layout
- Full-width filters
- Touch-friendly interactions

## Usage Instructions

### 1. Access the Page
- Navigate to "KRA Sales" in the sidebar
- Page loads with today's date by default

### 2. Select Date
- Click the date selector button
- Choose desired date from calendar
- Sales automatically fetch for selected date

### 3. Search and Filter
- Use search box to find specific sales
- Use payment type filter to narrow results
- Results update in real-time

### 4. View Details
- Click on any sale row
- Detailed dialog opens with complete information
- View individual items and tax breakdown

### 5. Refresh Data
- Click refresh button to reload current date
- Useful for checking new sales

## Testing Scenarios

### 1. Date Selection
- Select different dates
- Verify sales load for selected date
- Test with dates that have no sales

### 2. Search Functionality
- Search by supplier name
- Search by invoice numbers
- Search by SDC ID
- Test with partial matches

### 3. Payment Type Filtering
- Filter by different payment types
- Verify correct sales shown
- Test "All Payment Types" option

### 4. Details View
- Click on sale rows
- Verify dialog opens with correct data
- Check item list accuracy
- Verify tax breakdown

### 5. Error Handling
- Test with network issues
- Test with invalid dates
- Verify error messages

## Success Criteria

- ✅ Date selection works correctly
- ✅ KRA API integration functions properly
- ✅ Search and filtering work as expected
- ✅ Sale details show complete information
- ✅ Tax breakdown displays correctly
- ✅ Responsive design works on all devices
- ✅ Error handling provides clear feedback
- ✅ Loading states provide good UX
- ✅ Navigation integration works seamlessly

## Key Differences from Previous Implementation

### 1. Data Structure
- **Previous**: Expected `purchaseList` field
- **Current**: Correctly handles `saleList` field

### 2. Field Names
- **Previous**: Used purchase-specific field names
- **Current**: Uses correct KRA sales field names

### 3. Tax Handling
- **Previous**: Basic tax display
- **Current**: Detailed tax breakdown by type (A, B, C, D, E)

### 4. Payment Types
- **Previous**: Transaction status filtering
- **Current**: Payment type filtering (Cash, Card, Mobile Money)

### 5. Date Format
- **Previous**: Expected YYYYMMDDHHMMSS format
- **Current**: Handles YYYY-MM-DD HH:mm:ss format

## Future Enhancements

### Planned Features
1. **Export Functionality**: Download sales as CSV/PDF
2. **Date Range Selection**: Select date ranges instead of single dates
3. **Advanced Filtering**: Filter by amount ranges, tax types
4. **Sales Analytics**: Charts and statistics
5. **Bulk Operations**: Select multiple sales for actions

### Technical Improvements
1. **Caching**: Cache sales data for better performance
2. **Pagination**: Handle large sales lists
3. **Real-time Updates**: WebSocket integration for live updates
4. **Offline Support**: Cache data for offline viewing

## Implementation Files

1. **`app/kra/purchases/page.tsx`** - Main sales page
2. **`app/api/kra/purchases/route.ts`** - API endpoint
3. **`components/kra/sales-details-dialog.tsx`** - Details dialog
4. **`components/sidebar.tsx`** - Navigation integration

## Configuration

### Environment Variables
- `TIN`: KRA Tax Identification Number
- `BHF_ID`: KRA Business Hub Facility ID
- `CMC_KEY`: KRA Communication Key

### KRA API Configuration
- **Base URL**: `https://etims-api-sbx.kra.go.ke/etims-api/`
- **Headers**: TIN, BHF_ID, CMC_KEY required for all requests
- **Response Format**: JSON with result codes and data

## Data Validation

### Required Fields
- `lastReqDt`: Date in YYYYMMDDHHMMSS format
- `saleList`: Array of sale objects
- `itemList`: Array of item objects within each sale

### Optional Fields
- `remark`: Remarks field (can be null)
- `stockRlsDt`: Stock release date (can be null)
- `bcd`: Barcode (can be null)

## Performance Considerations

### API Optimization
- Single API call per date selection
- Efficient data processing
- Minimal re-renders

### UI Performance
- Virtual scrolling for large lists
- Debounced search input
- Optimized table rendering

## Security Considerations

### Data Protection
- Secure API communication
- Input validation
- Error message sanitization

### Access Control
- Protected route implementation
- User authentication required
- Role-based access control ready 