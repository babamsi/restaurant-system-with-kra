# KRA Item Composition - Updated Implementation

## Overview

This implementation has been updated to use the correct KRA API endpoint `/saveItemComposition` with the proper payload structure. Each component is sent individually to KRA with the recipe's `itemCd` and the component's `itemCd`.

## Key Changes

### 1. API Endpoint
- **Previous**: `insertTrnsItemComposition` (incorrect)
- **Updated**: `saveItemComposition` (correct)

### 2. Payload Structure
- **Previous**: Complex payload with multiple fields
- **Updated**: Simple payload with required fields only

### 3. Processing Logic
- **Previous**: Single API call with all components
- **Updated**: Individual API call for each component

## API Endpoint Details

### `/api/kra/send-item-composition`
**Method**: POST
**KRA Endpoint**: `https://etims-api-sbx.kra.go.ke/etims-api/saveItemComposition`

### Request Body
```typescript
{
  recipe_id: string,
  recipe_name: string,
  recipe_price: number,
  recipe_category: string,
  recipe_itemCd: string, // REQUIRED: Recipe's KRA itemCd
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

### KRA Payload Structure
For each component, the system sends:
```typescript
{
  itemCd: "KE1NTXU0000007",      // Recipe's itemCd
  cpstItemCd: "ITM001",          // Component's itemCd
  cpstQty: 10,                   // Component quantity (actual quantity used in recipe)
  regrId: "Restaurant POS",      // Registrar ID
  regrNm: "Restaurant POS"       // Registrar Name
}
```

**Important**: The `cpstQty` field contains the actual quantity of the ingredient being used in the recipe, not a fixed value. This is taken directly from the `component.quantity` field in the recipe's component list.

## Process Flow

### 1. Validation
- Check if recipe has `itemCd` (must be registered with KRA first)
- Validate components exist
- Ensure all ingredients have KRA codes

### 2. Ingredient Registration
- For each ingredient component:
  - Fetch ingredient data from `ingredients` table using `component_id`
  - Check if ingredient already has `itemCd` and `itemClsCd`
  - If not registered, automatically register with KRA
  - Update ingredient record with new codes
  - Continue with composition

### 3. Quantity Validation
- Validate that each component has a valid positive quantity
- Ensure quantity is a number greater than 0
- Return error if any component has invalid quantity

### 4. Individual Component Processing
- For each component:
  - Create KRA payload with recipe's `itemCd` and component's `itemCd`
  - Send to KRA `/saveItemComposition` endpoint
  - Track success/failure for each component

### 4. Status Tracking
- **All Success**: Status = `'ok'`
- **Partial Success**: Status = `'partial_success'`
- **All Failed**: Status = `'error'`

## Response Format

### Success Response
```typescript
{
  success: true,
  compositionNo: number,
  registrationResults: Array<{
    component_id: string,
    component_name: string,
    success: boolean,
    itemCd?: string,
    itemClsCd?: string,
    error?: string
  }>,
  compositionResults: Array<{
    component_name: string,
    component_itemCd: string,
    success: boolean,
    kraData: KRAResponse,
    error?: string
  }>,
  message: string,
  warnings?: string[] // Only if partial success
}
```

### Error Response
```typescript
{
  error: string,
  compositionNo?: number
}
```

## User Interface Updates

### Recipe Card States

#### 1. Recipe Not Registered
```typescript
// Badge: None
// Button: None
// Message: "⚠️ Register recipe with KRA first"
```

#### 2. Recipe Registered, No Composition
```typescript
// Badge: "Composition Pending" (yellow)
// Button: "Send Item Composition" (blue)
// Message: None
```

#### 3. Composition Successful
```typescript
// Badge: "Composition #123" (blue)
// Button: None
// Message: "✓ Composition sent to KRA"
```

#### 4. Partial Composition Success
```typescript
// Badge: "Partial Composition #123" (orange)
// Button: None
// Message: "⚠️ Partial composition success"
```

### Toast Messages

#### Success (All Components)
```
Title: "Item Composition Sent"
Description: "Successfully sent to KRA. Composition #123. 3 ingredients registered."
```

#### Partial Success
```
Title: "Item Composition Partial Success"
Description: "Completed with 2 successful and 1 failed components. Check details for errors."
```

#### Recipe Not Registered
```
Title: "Recipe Not Registered"
Description: "Recipe must be registered with KRA first. Please register the recipe item before sending composition."
```

## Database Schema

### `recipes` Table Updates
```sql
-- Status values for kra_composition_status
-- NULL: Not attempted
-- 'ok': All components successful
-- 'partial_success': Some components successful, some failed
-- 'error': All components failed
```

### `kra_transactions` Table
```sql
-- New fields for item composition tracking
composition_results: JSONB,           -- Array of component results
total_components: INTEGER,            -- Total number of components
successful_compositions: INTEGER,     -- Number of successful compositions
failed_compositions: INTEGER,         -- Number of failed compositions
status: VARCHAR(20)                   -- 'success', 'partial_success', 'error'
```

## Testing Scenarios

### 1. Recipe Not Registered
**Steps**:
1. Create recipe without registering with KRA
2. Add ingredients to recipe
3. Try to send item composition

**Expected**: Error message about recipe needing to be registered first

### 2. All Ingredients Registered
**Steps**:
1. Create recipe and register with KRA
2. Add ingredients that are already registered with KRA
3. Send item composition

**Expected**: All components sent successfully, status = 'ok'

### 3. Some Ingredients Not Registered
**Steps**:
1. Create recipe and register with KRA
2. Add mix of registered and unregistered ingredients
3. Send item composition

**Expected**: Unregistered ingredients auto-registered, then composition sent

### 4. Partial Success
**Steps**:
1. Create recipe with valid and invalid components
2. Send item composition

**Expected**: Some components succeed, some fail, status = 'partial_success'

## Error Handling

### Common Errors

#### Recipe Not Registered
```typescript
if (!recipe_itemCd) {
  return NextResponse.json({ 
    error: 'Recipe must be registered with KRA first. Please register the recipe item before sending composition.' 
  }, { status: 400 })
}
```

#### Ingredient Registration Failed
```typescript
if (!result.success) {
  return NextResponse.json({ 
    error: `Failed to register ingredient ${component.name}: ${result.error}` 
  }, { status: 400 })
}
```

#### Ingredient Not Found
```typescript
if (!ingredientData) {
  return { success: false, error: `Ingredient not found in database: ${ingredient.name}` }
}
```

#### Missing Ingredient itemCd
```typescript
if (!component.itemCd) {
  console.error('Missing itemCd for component:', component.name)
  // Handle missing itemCd error
}
```

#### Invalid Quantity
```typescript
if (typeof component.quantity !== 'number' || component.quantity <= 0) {
  return NextResponse.json({ 
    error: `Invalid quantity for ingredient ${component.name}: ${component.quantity}. Quantity must be a positive number.` 
  }, { status: 400 })
}
```

#### KRA API Errors
- Individual component failures are logged but don't stop the process
- Failed components are tracked and reported
- Partial success is handled gracefully

## Monitoring and Debugging

### Console Logs
```typescript
// Ingredient registration
console.log('Processing item composition for recipe:', recipe_name, 'with itemCd:', recipe_itemCd)
console.log('Registering ingredient:', ingredient)
console.log('Fetched ingredient data:', ingredientData)

// KRA API calls
console.log('KRA Item Composition Payload for component:', component.name, payload)
console.log('KRA Item Composition Response for component:', component.name, response)

// Component updates
console.log(`Updated component ${component.name} with KRA codes:`, { itemCd, itemClsCd })

// Partial failures
console.warn('Some item compositions failed:', failedCompositions)
```

### Database Logging
- All composition attempts are logged
- Individual component results are stored
- Success/failure counts are tracked
- KRA responses are preserved

## Success Criteria

- ✅ Recipe must be registered with KRA before composition
- ✅ Each component is sent individually to KRA
- ✅ Proper payload structure with `itemCd`, `cpstItemCd`, `cpstQty`
- ✅ Automatic ingredient registration if needed
- ✅ Partial success handling
- ✅ Comprehensive error reporting
- ✅ Status tracking and UI feedback
- ✅ Database logging for audit purposes

## Implementation Files

1. **`app/api/kra/send-item-composition/route.ts`** - Updated API endpoint
2. **`app/recipes/page.tsx`** - Updated composition handler
3. **`components/recipes/RecipeCard.tsx`** - Updated UI states
4. **`database/recipe-composition-schema.sql`** - Database schema

## Next Steps

1. **Test the implementation** with a registered recipe
2. **Verify KRA API responses** for each component
3. **Check database logging** for transaction tracking
4. **Monitor UI feedback** for different scenarios
5. **Validate error handling** for edge cases 