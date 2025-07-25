# KRA Imported Items Implementation

## Overview

This implementation provides a comprehensive KRA imported items viewing system that allows users to fetch and view all imported items from KRA using the `selectImportItemList` API with a user-selectable date. The system displays detailed information about imported items including supplier details, tax breakdown, and import-specific information.

## Features

1. **Date Selection**: Interactive calendar to select the date for fetching imported items
2. **Real-time Fetching**: Calls KRA API to get imported items data for selected date
3. **Search & Filter**: Search by item name, code, invoice numbers, and filter by payment type
4. **Detailed View**: Click on any imported item to view detailed information
5. **Responsive Design**: Works on desktop, tablet, and mobile devices
6. **Payment Type Indicators**: Visual badges for different payment methods
7. **Tax Breakdown**: Detailed tax analysis by tax types (A, B, C, D, E)
8. **Import Information**: Complete import details including supplier and invoice information
9. **Currency Formatting**: Proper Kenyan Shilling formatting for all amounts

## API Integration

### KRA API Endpoint
- **Endpoint**: `selectImportItemList`
- **URL**: `https://etims-api-sbx.kra.go.ke/etims-api/selectImportItemList`
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
    importItemList: Array<KRAImportedItem>
  }
}
```

## Data Structure

### KRAImportedItem Interface
```typescript
interface KRAImportedItem {
  // Item Information
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
  
  // Import Information
  importDt: string              // Import Date
  importInvcNo: string          // Import Invoice Number
  importSpplrNm: string         // Import Supplier Name
  importSpplrTin: string        // Import Supplier TIN
  importSpplrBhfId: string      // Import Supplier BHF ID
  importSpplrSdcId: string      // Import Supplier SDC ID
  importSpplrMrcNo: string      // Import Supplier MRC Number
  importRcptTyCd: string        // Import Receipt Type Code
  importPmtTyCd: string         // Import Payment Type Code
  importCfmDt: string           // Import Confirm Date
  importSalesDt: string         // Import Sales Date
  importStockRlsDt: string | null // Import Stock Release Date
  importTotItemCnt: number      // Import Total Item Count
  
  // Import Tax Information
  importTaxblAmtA: number       // Import Taxable Amount Type A
  importTaxblAmtB: number       // Import Taxable Amount Type B
  importTaxblAmtC: number       // Import Taxable Amount Type C
  importTaxblAmtD: number       // Import Taxable Amount Type D
  importTaxblAmtE: number       // Import Taxable Amount Type E
  importTaxRtA: number          // Import Tax Rate Type A
  importTaxRtB: number          // Import Tax Rate Type B
  importTaxRtC: number          // Import Tax Rate Type C
  importTaxRtD: number          // Import Tax Rate Type D
  importTaxRtE: number          // Import Tax Rate Type E
  importTaxAmtA: number         // Import Tax Amount Type A
  importTaxAmtB: number         // Import Tax Amount Type B
  importTaxAmtC: number         // Import Tax Amount Type C
  importTaxAmtD: number         // Import Tax Amount Type D
  importTaxAmtE: number         // Import Tax Amount Type E
  importTotTaxblAmt: number     // Import Total Taxable Amount
  importTotTaxAmt: number       // Import Total Tax Amount
  importTotAmt: number          // Import Total Amount
  importRemark: string | null   // Import Remarks
}
```

## User Interface

### Main Page (`/kra/imported-items`)
- **Header**: Page title with refresh button
- **Filters Section**: Date selector, search, and payment type filter
- **Imported Items Table**: List of all imported items with key information
- **Details Dialog**: Detailed view of selected imported item

### Navigation
- Added to sidebar navigation as "KRA Imported Items"
- Uses Globe icon for visual identification
- Accessible from main navigation menu

## Components

### 1. KRAImportedItemsPage (`app/kra/imported-items/page.tsx`)
**Main page component with features:**
- Date selection with calendar popup
- Search functionality
- Payment type filtering
- Imported items table with clickable rows
- Loading states and error handling

### 2. ImportedItemDetailsDialog (`components/kra/imported-item-details-dialog.tsx`)
**Detailed imported item view with:**
- Item header information
- Import information
- Supplier details
- Item pricing details
- Tax information
- Import tax breakdown by type
- Import summary cards
- Payment and receipt type badges

### 3. API Route (`app/api/kra/imported-items/route.ts`)
**Backend API that:**
- Validates request payload
- Calls KRA API with proper headers
- Handles KRA responses
- Returns formatted imported items data

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
- **Item Name**: Search by imported item name
- **Item Code**: Search by item code
- **Invoice Numbers**: Search by import invoice number
- **Supplier Name**: Search by import supplier name
- **Real-time**: Updates results as you type

### Payment Type Filtering
- **All Payment Types**: Shows all imported items
- **Cash**: Shows only cash payments
- **Card**: Shows only card payments
- **Mobile Money**: Shows only mobile money payments

## Tax Analysis

### Tax Breakdown Display
The system shows detailed tax information for both item-level and import-level:

#### Item Tax Information
- Individual item tax type and amounts
- Item-specific taxable amounts and tax calculations

#### Import Tax Breakdown
- **Type A (0%)**: Zero-rated items
- **Type B (18%)**: Standard VAT rate
- **Type C (0%)**: Exempt items
- **Type D (0%)**: Special categories
- **Type E (16%)**: Reduced VAT rate

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
- Detailed imported item information

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
- Navigate to "KRA Imported Items" in the sidebar
- Page loads with today's date by default

### 2. Select Date
- Click the date selector button
- Choose desired date from calendar
- Imported items automatically fetch for selected date

### 3. Search and Filter
- Use search box to find specific imported items
- Use payment type filter to narrow results
- Results update in real-time

### 4. View Details
- Click on any imported item row
- Detailed dialog opens with complete information
- View item details, import information, and tax breakdown

### 5. Refresh Data
- Click refresh button to reload current date
- Useful for checking new imported items

## Testing Scenarios

### 1. Date Selection
- Select different dates
- Verify imported items load for selected date
- Test with dates that have no imported items

### 2. Search Functionality
- Search by item name
- Search by item code
- Search by invoice numbers
- Search by supplier name
- Test with partial matches

### 3. Payment Type Filtering
- Filter by different payment types
- Verify correct imported items shown
- Test "All Payment Types" option

### 4. Details View
- Click on imported item rows
- Verify dialog opens with correct data
- Check item information accuracy
- Verify import tax breakdown

### 5. Error Handling
- Test with network issues
- Test with invalid dates
- Verify error messages

## Success Criteria

- ✅ Date selection works correctly
- ✅ KRA API integration functions properly
- ✅ Search and filtering work as expected
- ✅ Imported item details show complete information
- ✅ Tax breakdown displays correctly
- ✅ Import information is comprehensive
- ✅ Responsive design works on all devices
- ✅ Error handling provides clear feedback
- ✅ Loading states provide good UX
- ✅ Navigation integration works seamlessly

## Key Features

### 1. Comprehensive Item Information
- Item codes, names, and classifications
- Barcode information
- Package and quantity details
- Pricing information including discounts

### 2. Import-Specific Details
- Import invoice numbers
- Import dates and confirmation dates
- Import supplier information
- Import payment and receipt types

### 3. Dual Tax Analysis
- Item-level tax information
- Import-level tax breakdown by type
- Complete tax compliance reporting

### 4. Supplier Information
- Import supplier details
- TIN, BHF ID, SDC ID, MRC numbers
- Payment method tracking

## Future Enhancements

### Planned Features
1. **Export Functionality**: Download imported items as CSV/PDF
2. **Date Range Selection**: Select date ranges instead of single dates
3. **Advanced Filtering**: Filter by amount ranges, tax types, suppliers
4. **Import Analytics**: Charts and statistics for imported items
5. **Bulk Operations**: Select multiple imported items for actions

### Technical Improvements
1. **Caching**: Cache imported items data for better performance
2. **Pagination**: Handle large imported items lists
3. **Real-time Updates**: WebSocket integration for live updates
4. **Offline Support**: Cache data for offline viewing

## Implementation Files

1. **`app/kra/imported-items/page.tsx`** - Main imported items page
2. **`app/api/kra/imported-items/route.ts`** - API endpoint
3. **`components/kra/imported-item-details-dialog.tsx`** - Details dialog
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
- `importItemList`: Array of imported item objects
- `itemCd`, `itemNm`: Basic item information
- `importInvcNo`, `importSpplrNm`: Import information

### Optional Fields
- `importRemark`: Import remarks field (can be null)
- `importStockRlsDt`: Import stock release date (can be null)
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

## Compliance Features

### Tax Reporting
- Complete tax breakdown by type
- Import-specific tax calculations
- Compliance-ready data structure

### Audit Trail
- Import date tracking
- Supplier information
- Invoice number tracking
- Payment method recording 