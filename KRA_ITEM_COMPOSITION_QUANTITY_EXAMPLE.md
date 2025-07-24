# KRA Item Composition - Quantity Example

## Overview

This document demonstrates how the `cpstQty` field correctly uses the actual ingredient quantity from the recipe components.

## Example Recipe

### Recipe: "Chicken Curry"
- **Recipe itemCd**: `KE1NTXU0000007`
- **Components**:
  1. Chicken Breast: 500g
  2. Onions: 200g
  3. Curry Powder: 15g
  4. Coconut Milk: 400ml

## KRA API Calls

### Component 1: Chicken Breast
```typescript
// KRA Payload
{
  itemCd: "KE1NTXU0000007",        // Recipe's itemCd
  cpstItemCd: "KE1NTXU0000008",    // Chicken Breast itemCd
  cpstQty: 500,                    // Actual quantity: 500g
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

### Component 2: Onions
```typescript
// KRA Payload
{
  itemCd: "KE1NTXU0000007",        // Recipe's itemCd
  cpstItemCd: "KE1NTXU0000009",    // Onions itemCd
  cpstQty: 200,                    // Actual quantity: 200g
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

### Component 3: Curry Powder
```typescript
// KRA Payload
{
  itemCd: "KE1NTXU0000007",        // Recipe's itemCd
  cpstItemCd: "KE1NTXU0000010",    // Curry Powder itemCd
  cpstQty: 15,                     // Actual quantity: 15g
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

### Component 4: Coconut Milk
```typescript
// KRA Payload
{
  itemCd: "KE1NTXU0000007",        // Recipe's itemCd
  cpstItemCd: "KE1NTXU0000011",    // Coconut Milk itemCd
  cpstQty: 400,                    // Actual quantity: 400ml
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

## Implementation Details

### Component Data Structure
```typescript
interface RecipeComponent {
  component_type: 'ingredient' | 'batch',
  component_id: string,
  name: string,
  quantity: number,        // This is the actual quantity used
  unit: string,
  cost_per_unit?: number,
  itemCd?: string,
  itemClsCd?: string
}
```

### KRA Payload Construction
```typescript
const compositionPayload = {
  itemCd: recipe_itemCd,           // Recipe's itemCd
  cpstItemCd: component.itemCd,    // Component's itemCd
  cpstQty: component.quantity,     // Uses actual component quantity
  regrId: 'Restaurant POS',
  regrNm: 'Restaurant POS'
}
```

## Validation

### Quantity Validation
```typescript
// Validate component quantity before sending to KRA
if (typeof component.quantity !== 'number' || component.quantity <= 0) {
  return NextResponse.json({ 
    error: `Invalid quantity for ingredient ${component.name}: ${component.quantity}. Quantity must be a positive number.` 
  }, { status: 400 })
}
```

### Console Logging
```typescript
console.log('KRA Item Composition Payload for component:', component.name, {
  itemCd: recipe_itemCd,
  cpstItemCd: component.itemCd,
  cpstQty: component.quantity, // This shows the actual quantity being sent
  unit: component.unit,
  regrId: 'Restaurant POS',
  regrNm: 'Restaurant POS'
})
```

## Expected Console Output

When processing the Chicken Curry recipe, you should see:

```
KRA Item Composition Payload for component: Chicken Breast {
  itemCd: "KE1NTXU0000007",
  cpstItemCd: "KE1NTXU0000008",
  cpstQty: 500,
  unit: "g",
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}

KRA Item Composition Payload for component: Onions {
  itemCd: "KE1NTXU0000007",
  cpstItemCd: "KE1NTXU0000009",
  cpstQty: 200,
  unit: "g",
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}

KRA Item Composition Payload for component: Curry Powder {
  itemCd: "KE1NTXU0000007",
  cpstItemCd: "KE1NTXU0000010",
  cpstQty: 15,
  unit: "g",
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}

KRA Item Composition Payload for component: Coconut Milk {
  itemCd: "KE1NTXU0000007",
  cpstItemCd: "KE1NTXU0000011",
  cpstQty: 400,
  unit: "ml",
  regrId: "Restaurant POS",
  regrNm: "Restaurant POS"
}
```

## Testing

### Test Cases

1. **Valid Quantities**: All positive numbers should work correctly
2. **Zero Quantity**: Should return validation error
3. **Negative Quantity**: Should return validation error
4. **Non-numeric Quantity**: Should return validation error
5. **Missing Quantity**: Should return validation error

### Test Recipe with Different Quantities
```typescript
const testRecipe = {
  name: "Test Recipe",
  itemCd: "TEST001",
  components: [
    { name: "Ingredient 1", quantity: 100, unit: "g" },    // Valid
    { name: "Ingredient 2", quantity: 0, unit: "g" },      // Invalid
    { name: "Ingredient 3", quantity: -5, unit: "g" },     // Invalid
    { name: "Ingredient 4", quantity: 2.5, unit: "kg" },   // Valid
  ]
}
```

## Success Criteria

- ✅ `cpstQty` uses the actual component quantity from the recipe
- ✅ Quantity validation prevents invalid values
- ✅ Each component sends its specific quantity to KRA
- ✅ Console logging shows the exact quantity being sent
- ✅ Error messages clearly indicate quantity validation failures 