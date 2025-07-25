# KRA Purchases Implementation

## Overview

This implementation provides a comprehensive KRA purchases viewing system that allows users to fetch and view all purchases from KRA using the `selectTrnsPurchaseSalesList` API with a user-selectable date.

## Features

1. **Date Selection**: Interactive calendar to select the date for fetching purchases
2. **Real-time Fetching**: Calls KRA API to get purchase data for selected date
3. **Search & Filter**: Search by supplier name, invoice numbers, and filter by status
4. **Detailed View**: Click on any purchase to view detailed information including item list
5. **Responsive Design**: Works on desktop, tablet, and mobile devices
6. **Status Indicators**: Visual badges for different transaction statuses
7. **Currency Formatting**: Proper Kenyan Shilling formatting for all amounts

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
  resultMsg: "Success",
  data: {
    purchaseList: Array<KRAPurchase>
  }
}
```

## Data Structure

### KRAPurchase Interface
```typescript
interface KRAPurchase {
  invcNo: string              // KRA Invoice Number
  orgInvcNo: string           // Organization Invoice Number
  spplrInvcNo: string         // Supplier Invoice Number
  spplrNm: string             // Supplier Name
  spplrTin: string            // Supplier TIN
  spplrBhfId: string          // Supplier BHF ID
  totItemCnt: number          // Total Item Count
  totAmt: number              // Total Amount
  totTaxblAmt: number         // Total Taxable Amount
  totTaxAmt: number           // Total Tax Amount
  purDt: string               // Purchase Date (YYYYMMDDHHMMSS)
  regTyCd: string             // Registration Type Code
  trnTyCd: string             // Transaction Type Code
  trnSttsCd: string           // Transaction Status Code
  itemList: PurchaseItem[]    // Array of purchase items
}
```

### PurchaseItem Interface
```typescript
interface PurchaseItem {
  itemSeq: number             // Item Sequence
  itemCd: string              // Item Code
  itemClsCd: string           // Item Classification Code
  itemNm: string              // Item Name
  qtyUnitCd: string           // Quantity Unit Code
  qty: number                 // Quantity
  prc: number                 // Unit Price
  splyAmt: number             // Supply Amount
  taxblAmt: number            // Taxable Amount
  taxTyCd: string             // Tax Type Code
  taxAmt: number              // Tax Amount
  totAmt: number              // Total Amount
}
```

## User Interface

### Main Page (`/kra/purchases`)
- **Header**: Page title with refresh button
- **Filters Section**: Date selector, search, and status filter
- **Purchases Table**: List of all purchases with key information
- **Details Dialog**: Detailed view of selected purchase

### Navigation
- Added to sidebar navigation as "KRA Purchases"
- Uses Receipt icon for visual identification
- Accessible from main navigation menu

## Components

### 1. KRAPurchasesPage (`app/kra/purchases/page.tsx`)
**Main page component with features:**
- Date selection with calendar popup
- Search functionality
- Status filtering
- Purchase table with clickable rows
- Loading states and error handling

### 2. PurchaseDetailsDialog (`components/kra/purchase-details-dialog.tsx`)
**Detailed purchase view with:**
- Purchase header information
- Supplier details
- Financial summary cards
- Complete item list table
- Status and type badges

### 3. API Route (`app/api/kra/purchases/route.ts`)
**Backend API that:**
- Validates request payload
- Calls KRA API with proper headers
- Handles KRA responses
- Returns formatted data

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
  const year = dateString.substring(0, 4)
  const month = dateString.substring(4, 6)
  const day = dateString.substring(6, 8)
  const hour = dateString.substring(8, 10)
  const minute = dateString.substring(10, 12)
  const second = dateString.substring(12, 14)
  
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
  return format(date, 'dd/MM/yyyy HH:mm')
}
```

## Status Mapping

### Transaction Status Codes
- **'01'**: Active (Green badge)
- **'02'**: Inactive (Gray badge)
- **'03'**: Cancelled (Red badge)

### Transaction Type Codes
- **'01'**: Purchase
- **'02'**: Sale

## Filtering and Search

### Search Functionality
- **Supplier Name**: Search by supplier name
- **Invoice Numbers**: Search by KRA, Org, or Supplier invoice numbers
- **Real-time**: Updates results as you type

### Status Filtering
- **All Status**: Shows all purchases
- **Active**: Shows only active transactions
- **Inactive**: Shows only inactive transactions
- **Cancelled**: Shows only cancelled transactions

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
- Detailed purchase information

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
- Navigate to "KRA Purchases" in the sidebar
- Page loads with today's date by default

### 2. Select Date
- Click the date selector button
- Choose desired date from calendar
- Purchases automatically fetch for selected date

### 3. Search and Filter
- Use search box to find specific purchases
- Use status filter to narrow results
- Results update in real-time

### 4. View Details
- Click on any purchase row
- Detailed dialog opens with complete information
- View individual items and amounts

### 5. Refresh Data
- Click refresh button to reload current date
- Useful for checking new purchases

## Testing Scenarios

### 1. Date Selection
- Select different dates
- Verify purchases load for selected date
- Test with dates that have no purchases

### 2. Search Functionality
- Search by supplier name
- Search by invoice numbers
- Test with partial matches

### 3. Status Filtering
- Filter by different statuses
- Verify correct purchases shown
- Test "All Status" option

### 4. Details View
- Click on purchase rows
- Verify dialog opens with correct data
- Check item list accuracy

### 5. Error Handling
- Test with network issues
- Test with invalid dates
- Verify error messages

## Success Criteria

- ✅ Date selection works correctly
- ✅ KRA API integration functions properly
- ✅ Search and filtering work as expected
- ✅ Purchase details show complete information
- ✅ Responsive design works on all devices
- ✅ Error handling provides clear feedback
- ✅ Loading states provide good UX
- ✅ Navigation integration works seamlessly

## Future Enhancements

### Planned Features
1. **Export Functionality**: Download purchases as CSV/PDF
2. **Date Range Selection**: Select date ranges instead of single dates
3. **Advanced Filtering**: Filter by amount ranges, supplier types
4. **Purchase Analytics**: Charts and statistics
5. **Bulk Operations**: Select multiple purchases for actions

### Technical Improvements
1. **Caching**: Cache purchase data for better performance
2. **Pagination**: Handle large purchase lists
3. **Real-time Updates**: WebSocket integration for live updates
4. **Offline Support**: Cache data for offline viewing

## Implementation Files

1. **`app/kra/purchases/page.tsx`** - Main purchases page
2. **`app/api/kra/purchases/route.ts`** - API endpoint
3. **`components/kra/purchase-details-dialog.tsx`** - Details dialog
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