export interface Ingredient {
  id: string
  name: string
  unit: string // kg, g, L, ml, pieces, etc.
  quantity: number
  min_quantity: number
  created_at: Date
  last_updated: Date
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

export interface Recipe {
  id: number
  name: string
  description: string
  category: string
  prep_time_minutes: number
  cooking_time_minutes: number
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string[]
  nutrition_per_portion: NutritionInfo
  selling_price: number
  available_portions: number
  image?: string
  total_raw_cost: number
  cost_per_portion: number
  markup_percentage?: number
  is_published: boolean
  created_at: string
  updated_at: string
  portion_sizes?: {
    small: { multiplier: number; price_adjustment: number }
    regular: { multiplier: number; price_adjustment: number }
    large: { multiplier: number; price_adjustment: number }
  }
}

export interface RecipeIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity_per_batch: number
  unit: string
  cost_per_unit: number
  total_cost: number
}

export interface BatchLog {
  id: number
  recipe_id: string
  recipe_name: string
  batch_count: number
  total_portions_produced: number
  ingredients_used: BatchIngredient[]
  total_cost: number
  prepared_at: string
  prepared_by: string
}

export interface BatchIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity_used: number
  unit: string
  cost: number
}

export interface InvoiceItem {
  id: number
  name: string
  quantity: number
  unit: string
  total_cost: number
  cost_per_unit: number
  mapped_ingredient_id?: number
  is_new_ingredient: boolean
}

export interface Sale {
  id: number
  type: "ingredient" | "recipe"
  item_id: number
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  cost_basis: number
  profit_margin: number
  sold_at: string
  sold_by: string
}

export interface StockMovement {
  id: number
  ingredient_id: number
  ingredient_name: string
  movement_type: "purchase" | "usage" | "adjustment" | "waste"
  quantity: number
  unit: string
  reference_id?: string // invoice_id, batch_id, sale_id
  reference_type?: string
  notes?: string
  created_at: string
}

export interface BaseIngredient {
  id: string
  name: string
  category: string
  description?: string
  unit: string
  cost_per_unit: number
  available_quantity: number
  threshold: number
  image?: string,
  itemCd?: string,
  itemClsCd?: string,
  taxTyCd?: string,
  kra_status?: string,
  nutrition?: NutritionInfo
  supplier_id: string // Reference to supplier
  created_at: string
  last_updated: string
}

export interface RawMaterialBatch {
  id: string
  ingredient_id: string
  purchase_order_id: string
  quantity: number
  purchase_date: Date
  expiry_date: Date
  cost_per_unit: number
  location: 'storage' | 'kitchen'
  status: 'active' | 'consumed' | 'wasted'
  created_at: string
  last_updated: string
}

export interface PreparedItemBatch {
  id: string
  prepared_item_id: string
  quantity_produced: number
  production_date: Date
  expiry_date: Date
  cost_per_unit: number
  components: {
    batch_id: string
    quantity_used: number
  }[]
  created_at: string
  last_updated: string
}

export interface StockTake {
  id: string
  date: Date
  location: 'storage' | 'kitchen'
  status: 'in_progress' | 'completed'
  items: {
    ingredient_id: string
    expected_quantity: number
    actual_quantity: number
    variance: number
  }[]
  created_at: string
  last_updated: string
}

export interface InventoryTransfer {
  id: string
  from_location: 'storage' | 'kitchen'
  to_location: 'storage' | 'kitchen'
  batch_id: string
  quantity: number
  transferred_by: string
  reason: string
  created_at: string
  last_updated: string
}

export interface WastageLog {
  id: string
  batch_id: string
  quantity_wasted: number
  reason: string
  cost_impact: number
  created_at: string
  last_updated: string
}

export interface StocktakeItem {
  ingredient_id: string
  expected_quantity: number
  actual_quantity: number
  variance: number
}

export interface Stocktake {
  id: string
  date: Date
  location: "storage" | "kitchen"
  status: "in_progress" | "completed"
  items: StocktakeItem[]
  created_at: Date
  last_updated: Date
}

export interface Batch {
  id: string
  ingredient_id: string
  purchase_order_id: string
  quantity: number
  purchase_date: Date
  expiry_date: Date
  cost_per_unit: number
  location: "storage" | "kitchen"
  status: "active" | "expired" | "depleted"
  created_at: Date
  last_updated: Date
}

export interface ProductionBatch {
  id: string
  prepared_item_id: string
  quantity_produced: number
  production_date: Date
  expiry_date: Date
  cost_per_unit: number
  components: {
    ingredient_id: string
    quantity: number
  }[]
  created_at: Date
  last_updated: Date
}

export interface Receipt {
  id: string
  date: Date
  supplier: string
  items: {
    ingredient_id: string
    quantity: number
    cost_per_unit: number
  }[]
  total_amount: number
  status: "pending" | "processed"
  created_at: Date
  last_updated: Date
}
