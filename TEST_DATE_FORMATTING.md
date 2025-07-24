# KRA Date Formatting Test Guide

## Issue Fixed
The KRA `sdcDateTime` format is "YYYYMMDDHHMMSS" (e.g., "20250724113711"), but the previous `formatDateTime` function was trying to parse it as a standard date string, resulting in invalid dates and times.

## Solution Implemented
Updated the `formatDateTime` function to properly parse KRA's specific date format and convert it to the correct DD/MM/YYYY and HH:MM:SS format for receipts.

## Date Format Conversion

### Input Format (KRA sdcDateTime)
```
"20250724113711"
```

### Parsing Logic
```typescript
// Extract components from "YYYYMMDDHHMMSS"
const year = dateTimeString.substring(0, 4)    // "2025"
const month = dateTimeString.substring(4, 6)   // "07"
const day = dateTimeString.substring(6, 8)     // "24"
const hour = dateTimeString.substring(8, 10)   // "11"
const minute = dateTimeString.substring(10, 12) // "37"
const second = dateTimeString.substring(12, 14) // "11"
```

### Output Format (Receipt Display)
```
Date: 24/07/2025
Time: 11:37:11
```

## Test Cases

### 1. Valid KRA Date Format
**Input**: `"20250724113711"`
**Expected Output**:
- Date: `"24/07/2025"`
- Time: `"11:37:11"`

### 2. Valid KRA Date Format (Different Date)
**Input**: `"20241201143022"`
**Expected Output**:
- Date: `"01/12/2024"`
- Time: `"14:30:22"`

### 3. Invalid KRA Date Format
**Input**: `"invalid-date"`
**Expected Output**: Current date/time as fallback

### 4. Empty String
**Input**: `""`
**Expected Output**: Current date/time as fallback

### 5. Standard Date String (Fallback)
**Input**: `"2024-12-01T14:30:22Z"`
**Expected Output**: Properly formatted date/time

## Implementation Details

### Updated formatDateTime Function
```typescript
export function formatDateTime(dateTimeString: string): { date: string; time: string } {
  try {
    // Handle KRA sdcDateTime format: "YYYYMMDDHHMMSS" (e.g., "20250724113711")
    if (dateTimeString && dateTimeString.length === 14 && /^\d{14}$/.test(dateTimeString)) {
      const year = dateTimeString.substring(0, 4)
      const month = dateTimeString.substring(4, 6)
      const day = dateTimeString.substring(6, 8)
      const hour = dateTimeString.substring(8, 10)
      const minute = dateTimeString.substring(10, 12)
      const second = dateTimeString.substring(12, 14)
      
      const dateStr = `${day}/${month}/${year}`
      const timeStr = `${hour}:${minute}:${second}`
      
      return { date: dateStr, time: timeStr }
    }
    
    // Fallback to standard date parsing for other formats
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return { date: dateStr, time: timeStr }
  } catch (error) {
    console.warn('Error parsing date time:', dateTimeString, error)
    // Return current date/time as fallback
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-GB', { hour12: false })
    }
  }
}
```

### Files Updated
1. `lib/receipt-utils.ts` - Updated formatDateTime function
2. `app/api/kra/generate-receipt/route.ts` - Updated formatDateTime function

## Testing Steps

### 1. Test KRA Receipt Generation
1. Complete a sale in the POS system
2. Verify KRA sale is successful
3. Check that the PDF receipt shows correct date and time
4. Verify the date format is DD/MM/YYYY
5. Verify the time format is HH:MM:SS

### 2. Test KRA Retry Receipt Generation
1. Create a failed sale
2. Retry the sale successfully
3. Check that the retry PDF receipt shows correct date and time
4. Verify the date format matches the original receipt

### 3. Test Different Date Scenarios
1. Test with various KRA date formats
2. Verify edge cases (end of month, year changes)
3. Test with invalid date formats
4. Verify fallback behavior

## Expected Behavior

### Valid KRA Date
- ✅ Correctly parses "YYYYMMDDHHMMSS" format
- ✅ Displays date as "DD/MM/YYYY"
- ✅ Displays time as "HH:MM:SS"
- ✅ No console errors

### Invalid Date
- ✅ Gracefully handles invalid formats
- ✅ Uses current date/time as fallback
- ✅ Logs warning for debugging
- ✅ Receipt still generates successfully

### Receipt Display
- ✅ SCU Information shows correct date and time
- ✅ TIS Information shows correct date and time
- ✅ Date format is consistent throughout receipt
- ✅ Time format is 24-hour format

## Validation Examples

### Example 1: July 24, 2025 at 11:37:11
**Input**: `"20250724113711"`
**Output**:
```
Date: 24/07/2025
Time: 11:37:11
```

### Example 2: December 1, 2024 at 14:30:22
**Input**: `"20241201143022"`
**Output**:
```
Date: 01/12/2024
Time: 14:30:22
```

### Example 3: January 1, 2025 at 00:00:01
**Input**: `"20250101000001"`
**Output**:
```
Date: 01/01/2025
Time: 00:00:01
```

## Success Criteria
- ✅ KRA date format "YYYYMMDDHHMMSS" is correctly parsed
- ✅ Date displays as "DD/MM/YYYY" format
- ✅ Time displays as "HH:MM:SS" format (24-hour)
- ✅ Invalid dates fallback to current date/time
- ✅ No console errors for valid KRA dates
- ✅ Receipt generation works with correct dates
- ✅ Both POS and retry receipts show correct dates 