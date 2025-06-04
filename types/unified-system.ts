export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

export interface BaseIngredient {
  id: number
  name: string
  unit: string
  cost_per_unit: number
  current_stock: number
  threshold: number
  category: string
  created_at: string
  last_updated: string
  nutrition_per_unit: NutritionInfo
  is_sellable_individually: boolean
  individual_selling_price?: number
  is_cooked: boolean
  customer_unit?: string
  customer_unit_size?: number
}

export interface StockMovement {
  id: number
  ingredient_id: number
  ingredient_name: string
  movement_type: "purchase" | "usage" | "adjustment" | "waste"
  quantity: number
  unit: string
  reference_id: string
  reference_type: string
  notes?: string
  created_at: string
}

export interface RecipeIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity_needed: number
  unit: string
  cost_per_unit: number
  total_cost: number
}

export interface Recipe {
  id: number
  name: string
  category: string
  description: string
  yield_per_batch: number
  prep_time_minutes: number
  ingredients: RecipeIngredient[]
  total_raw_cost: number
  selling_price: number
  markup_percentage: number
  available_portions: number
  is_published: boolean
  nutrition_per_portion: NutritionInfo
  created_at: string
  last_updated: string
}

export interface BatchPreparation {
  id: number
  recipe_id: number
  recipe_name: string
  batch_count: number
  portions_produced: number
  prepared_by: string
  preparation_date: string
  total_cost: number
}

export interface MenuItem {
  id: string
  name: string
  category: string
  description?: string
  price: number
  type: "recipe" | "individual"
  available_quantity: number
  unit?: string
  prep_time_minutes?: number
  nutrition: NutritionInfo
  inventory_deduction?: {
    ingredient_id: number
    quantity_per_unit: number
  }
}

export interface CartItem {
  id: string
  menu_item_id: string
  name: string
  type: "recipe" | "individual"
  unit_price: number
  quantity: number
  total_price: number
  unit?: string
  total_nutrition: NutritionInfo
  inventory_deduction?: {
    ingredient_id: number
    quantity_to_deduct: number
  }
}

export interface Order {
  id: string
  items: CartItem[]
  customer_name?: string
  table_number?: string
  order_type: "dine-in" | "takeaway"
  subtotal: number
  tax: number
  total: number
  total_nutrition: NutritionInfo
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}
