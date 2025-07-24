# KRA Item Composition - Ingredient Check Test Guide

## Overview

This test guide verifies that the item composition system correctly checks ingredient `itemCd` from the inventory table, not the recipe `itemCd`.

## Key Fix

### Previous Logic (Incorrect)
```typescript
// ❌ Wrong: Checking ingredient.itemCd from component data
if (ingredient.itemCd && ingredient.itemClsCd) {
  return { success: true, itemCd: ingredient.itemCd, itemClsCd: ingredient.itemClsCd }
}
```

### Updated Logic (Correct)
```typescript
// ✅ Correct: Fetch ingredient data from database and check its itemCd
const { data: ingredientData } = await supabase
  .from('ingredients')
  .select('id, name, itemCd, itemClsCd, cost_per_unit, description, unit, category')
  .eq('id', ingredient.component_id)
  .single()

if (ingredientData.itemCd && ingredientData.itemClsCd) {
  return { success: true, itemCd: ingredientData.itemCd, itemClsCd: ingredientData.itemClsCd }
}
```

## Test Scenarios

### Test Case 1: Ingredient Already Registered
**Setup**:
1. Create ingredient in inventory with `itemCd: "KE1NTXU0000008"`
2. Create recipe with this ingredient as component
3. Register recipe with KRA

**Expected Behavior**:
- System fetches ingredient from database
- Finds existing `itemCd: "KE1NTXU0000008"`
- Skips registration, uses existing codes
- Sends composition with correct ingredient `itemCd`

**Console Output**:
```
Registering ingredient: { component_id: "123", name: "Chicken Breast" }
Fetched ingredient data: { id: "123", name: "Chicken Breast", itemCd: "KE1NTXU0000008", itemClsCd: "73131600" }
Ingredient already registered with KRA: KE1NTXU0000008
Updated component Chicken Breast with KRA codes: { itemCd: "KE1NTXU0000008", itemClsCd: "73131600" }
```

### Test Case 2: Ingredient Not Registered
**Setup**:
1. Create ingredient in inventory without `itemCd`
2. Create recipe with this ingredient as component
3. Register recipe with KRA

**Expected Behavior**:
- System fetches ingredient from database
- Finds no `itemCd`
- Registers ingredient with KRA
- Updates ingredient record with new codes
- Sends composition with new ingredient `itemCd`

**Console Output**:
```
Registering ingredient: { component_id: "124", name: "New Spice" }
Fetched ingredient data: { id: "124", name: "New Spice", itemCd: null, itemClsCd: null }
Ingredient needs KRA registration: New Spice
Successfully registered ingredient with KRA: KE1NTXU0000009
Updated component New Spice with KRA codes: { itemCd: "KE1NTXU0000009", itemClsCd: "5059690800" }
```

### Test Case 3: Ingredient Not Found in Database
**Setup**:
1. Create recipe with component referencing non-existent ingredient ID
2. Try to send item composition

**Expected Behavior**:
- System tries to fetch ingredient from database
- Ingredient not found
- Returns error with clear message

**Console Output**:
```
Registering ingredient: { component_id: "999", name: "Unknown Ingredient" }
Error fetching ingredient data: { message: "No rows found" }
```

**Error Response**:
```json
{
  "error": "Failed to register ingredient Unknown Ingredient: Ingredient not found in database: Unknown Ingredient"
}
```

## Database Verification

### Check Ingredient Registration
```sql
-- Check if ingredient has KRA codes
SELECT id, name, itemCd, itemClsCd, kra_status 
FROM ingredients 
WHERE id = 'component_id_here';
```

### Check KRA Transactions
```sql
-- Check composition transactions
SELECT * FROM kra_transactions 
WHERE transaction_type = 'item_composition' 
ORDER BY created_at DESC;
```

## KRA Payload Verification

### Correct Payload Structure
```typescript
{
  itemCd: "KE1NTXU0000007",        // Recipe's itemCd
  cpstItemCd: "KE1NTXU0000008",    // Ingredient's itemCd (from database)
  cpstQty: 500,                    // Component quantity
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

### Validation Points
1. **`itemCd`**: Should be recipe's KRA itemCd
2. **`cpstItemCd`**: Should be ingredient's KRA itemCd (from ingredients table)
3. **`cpstQty`**: Should be component quantity from recipe
4. **Ingredient itemCd**: Must exist before sending to KRA

## Error Handling

### Missing Ingredient itemCd
```typescript
if (!component.itemCd) {
  console.error('Missing itemCd for component:', component.name)
  compositionResults.push({
    component_name: component.name,
    component_itemCd: 'MISSING',
    success: false,
    kraData: null,
    error: 'Missing ingredient itemCd - ingredient not properly registered with KRA'
  })
  continue
}
```

### Database Fetch Errors
```typescript
if (fetchError) {
  console.error('Error fetching ingredient data:', fetchError)
  return { success: false, error: `Failed to fetch ingredient data: ${fetchError.message}` }
}
```

## Success Criteria

- ✅ Ingredient data is fetched from `ingredients` table using `component_id`
- ✅ Ingredient `itemCd` is checked from database, not component data
- ✅ Existing KRA codes are reused if available
- ✅ Missing KRA codes trigger automatic registration
- ✅ Database errors are handled gracefully
- ✅ Missing ingredient `itemCd` prevents KRA submission
- ✅ Console logging shows ingredient fetching process
- ✅ KRA payload uses correct ingredient `itemCd`

## Testing Steps

1. **Create test ingredients** with and without KRA codes
2. **Create test recipe** with mixed ingredient types
3. **Register recipe** with KRA
4. **Send item composition** and monitor console output
5. **Verify database updates** for ingredient KRA codes
6. **Check KRA transactions** for correct payload structure
7. **Test error scenarios** with invalid ingredient IDs

## Expected Results

- Ingredients with existing KRA codes should be reused
- Ingredients without KRA codes should be auto-registered
- KRA payload should contain correct ingredient `itemCd`
- All transactions should be logged in database
- Error messages should be clear and actionable 