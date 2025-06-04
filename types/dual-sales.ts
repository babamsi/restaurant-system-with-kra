export interface NutritionInfo {
  calories: number
  protein: number
  carbohydrates: number
  fat: number
}

export interface MenuItemForSale {
  id: string
  name: string
  type: "individual" | "recipe"
  category: string
  price: number
  available_quantity: number
  unit: string // Original bulk unit (kg, L, portion)
  display_unit?: string // Display unit (g, ml, portion)
  bulk_unit?: string // Bulk unit for conversion
  conversion_factor?: number // Conversion factor from bulk to display
  prep_time_minutes?: number
  nutrition: NutritionInfo
}
