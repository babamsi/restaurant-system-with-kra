# KRA Item Composition Implementation

## Overview

This implementation provides a comprehensive KRA item composition system for recipes. It automatically registers ingredients with KRA if they don't have an `itemCd`, then sends the complete item composition to KRA for compliance.

## Features

1. **Automatic Ingredient Registration**: Checks if ingredients have KRA codes and registers them if needed
2. **Item Composition Submission**: Sends complete recipe composition to KRA
3. **Status Tracking**: Tracks composition status and KRA composition numbers
4. **Visual Indicators**: Shows composition status with badges and buttons
5. **Error Handling**: Comprehensive error handling and user feedback
6. **Database Logging**: Logs all transactions for audit purposes

## Process Flow

### 1. User Action
- User clicks "Send Item Composition" button on a recipe card
- System validates that the recipe has components

### 2. Ingredient Registration Check
- For each ingredient component, check if it has `itemCd` and `itemClsCd`
- If not registered, automatically register with KRA
- Update ingredient record with KRA codes

### 3. Composition Preparation
- Generate unique composition number
- Map all components to KRA format
- Calculate totals and tax amounts

### 4. KRA Submission
- Send item composition to KRA API
- Handle response and errors
- Log transaction in database

### 5. Status Update
- Update recipe with composition status
- Show success/error feedback to user
- Refresh recipe list to show updated status

## API Endpoint

### `/api/kra/send-item-composition`
**Method**: POST
**Purpose**: Send recipe item composition to KRA

**Request Body**:
```typescript
{
  recipe_id: string,
  recipe_name: string,
  recipe_price: number,
  recipe_category: string,
  components: Array<{
    component_type: 'ingredient' | 'batch',
    component_id: string,
    name: string,
    quantity: number,
    unit: string,
    cost_per_unit?: number,
    itemCd?: string,
    itemClsCd?: string
  }>
}
```

**Response**:
```typescript
// Success
{
  success: true,
  kraData: KRAResponse,
  compositionNo: number,
  registrationResults: Array<{
    component_id: string,
    component_name: string,
    success: boolean,
    itemCd?: string,
    itemClsCd?: string,
    error?: string
  }>,
  message: string
}

// Error
{
  error: string,
  kraData?: KRAResponse,
  compositionNo?: number
}
```

## Database Schema Updates

### `recipes` Table
```sql
-- Add KRA composition fields
ALTER TABLE recipes 
ADD COLUMN kra_composition_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN kra_composition_no VARCHAR(50) DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX idx_recipes_kra_composition_status ON recipes(kra_composition_status);
CREATE INDEX idx_recipes_kra_composition_no ON recipes(kra_composition_no);
```

### `kra_transactions` Table
The existing table is used to log item composition transactions:
```sql
-- Transaction type: 'item_composition'
-- Links to recipe_id instead of supplier_order_id
-- Stores components data and KRA response
```

## User Interface

### Recipe Card Display
- **Composition Pending**: Orange badge for recipes with components but no composition sent
- **Composition Sent**: Blue badge showing composition number
- **Send Item Composition Button**: Blue button for recipes with pending composition
- **Success Indicator**: Green checkmark for completed compositions

### Visual States
```typescript
// Composition status badges
if (kra_composition_status === 'ok') {
  compositionBadge = <Badge>Composition #{kra_composition_no}</Badge>
} else if (components.length > 0) {
  compositionBadge = <Badge>Composition Pending</Badge>
}

// Action buttons
if (kra_composition_status !== 'ok') {
  <Button>Send Item Composition</Button>
} else {
  <span>✓ Composition sent to KRA</span>
}
```

## Implementation Details

### 1. Ingredient Registration Logic
```typescript
async function registerIngredientIfNeeded(ingredient: any) {
  if (ingredient.itemCd && ingredient.itemClsCd) {
    return { success: true, itemCd: ingredient.itemCd, itemClsCd: ingredient.itemClsCd }
  }

  // Call KRA registration API
  const result = await registerWithKRA(ingredient)
  
  if (result.success) {
    // Update ingredient in database
    await updateIngredientKRAStatus(ingredient.id, result.itemCd, result.itemClsCd)
  }
  
  return result
}
```

### 2. KRA Payload Construction
```typescript
const compositionPayload = {
  tin: TIN,
  bhfId: BHF_ID,
  invcNo: compositionNo,
  orgInvcNo: compositionNo,
  regTyCd: 'M', // Manual
  compTyCd: 'N', // Normal composition
  compDt: compositionDt,
  totItemCnt: kraComponents.length,
  totAmt: totalAmount,
  totTaxblAmt: totalTaxableAmount,
  totTaxAmt: totalTaxAmount,
  remark: `Item composition for recipe: ${recipe_name}`,
  regrNm: 'Restaurant POS',
  regrId: 'Restaurant POS',
  modrNm: 'Restaurant POS',
  modrId: 'Restaurant POS',
  itemList: kraComponents
}
```

### 3. Component Mapping
```typescript
const kraComponents = components.map((component, index) => ({
  itemSeq: index + 1,
  itemCd: component.itemCd,
  itemClsCd: component.itemClsCd,
  itemNm: component.name,
  qtyUnitCd: mapToKRAUnit(component.unit),
  qty: component.quantity,
  prc: component.cost_per_unit || 0,
  splyAmt: (component.cost_per_unit || 0) * component.quantity,
  taxblAmt: (component.cost_per_unit || 0) * component.quantity,
  taxTyCd: 'B', // Default to 16% VAT
  taxAmt: ((component.cost_per_unit || 0) * component.quantity) * 0.16,
  totAmt: ((component.cost_per_unit || 0) * component.quantity) * 1.16
}))
```

## Error Handling

### Registration Errors
- **Ingredient Registration Failed**: Show specific error for failed ingredient registration
- **Missing KRA Codes**: Automatically attempt registration before composition
- **Network Errors**: Handle API connectivity issues

### Composition Errors
- **KRA API Errors**: Display KRA error messages
- **Validation Errors**: Check required fields before submission
- **Database Errors**: Handle transaction logging failures

### User Feedback
- **Loading State**: Show "Processing..." message during operation
- **Success Message**: Display composition number and registration count
- **Error Messages**: Show specific error details with actionable information

## Testing

### Manual Testing Checklist
1. **Create a recipe** with ingredients that have no KRA codes
2. **Click "Send Item Composition"** and verify ingredient registration
3. **Check KRA submission** and verify composition number
4. **Verify status updates** in recipe card
5. **Test with pre-registered ingredients** to skip registration step
6. **Test error scenarios** with invalid data

### Test Scenarios
- **New Ingredients**: Should register automatically
- **Existing Ingredients**: Should use existing KRA codes
- **Mixed Components**: Handle both ingredients and batches
- **Empty Components**: Show appropriate error message
- **Network Failures**: Handle API connectivity issues

## Monitoring and Logging

### Console Logs
- Ingredient registration attempts and results
- KRA API calls and responses
- Composition number generation
- Error details and stack traces

### Database Logs
- All item composition transactions
- Ingredient registration updates
- Recipe status changes
- KRA response data storage

### User Feedback
- Toast notifications for all operations
- Status badges on recipe cards
- Error messages with specific details
- Success confirmations with composition numbers

## Future Enhancements

### Planned Features
1. **Bulk Composition**: Send multiple recipes at once
2. **Composition Templates**: Reusable composition patterns
3. **Composition History**: View past composition submissions
4. **Auto-Composition**: Automatic composition on recipe creation
5. **Composition Validation**: Pre-submission validation checks

### Technical Improvements
1. **Composition Queues**: Queue composition requests for better performance
2. **Retry Logic**: Automatic retry for failed compositions
3. **Composition Analytics**: Track composition patterns and success rates
4. **Enhanced Error Recovery**: Better error handling and recovery mechanisms

## Troubleshooting

### Common Issues

#### Ingredient Registration Fails
- Check ingredient data completeness
- Verify KRA API connectivity
- Check ingredient category mapping
- Validate unit code mapping

#### Composition Submission Fails
- Verify all ingredients are registered
- Check KRA API response codes
- Validate composition payload format
- Check database transaction logging

#### Status Not Updating
- Verify database update queries
- Check recipe refresh logic
- Validate component data structure
- Check UI state management

### Debug Information
- All registration attempts are logged
- Composition payloads are logged
- KRA responses are stored in database
- Error details are preserved for investigation

## Success Criteria
- ✅ Ingredients are automatically registered with KRA if needed
- ✅ Item composition is successfully sent to KRA
- ✅ Recipe status is updated with composition number
- ✅ User receives clear feedback for all operations
- ✅ Error scenarios are handled gracefully
- ✅ All transactions are logged for audit purposes
- ✅ UI clearly shows composition status 