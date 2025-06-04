export interface Ingredient {
  id: number
  name: string
  unit: string // kg, g, L, ml, pieces, etc.
  cost_per_unit: number
  current_stock: number
  threshold: number // low stock alert threshold
  category: string
  supplier_id?: number
  last_updated: string
  created_at: string
}

export interface Recipe {
  id: number
  name: string
  category: string
  default_yield: number // number of portions per batch
  ingredients: RecipeIngredient[]
  total_raw_cost: number
  cost_per_portion: number
  selling_price: number
  markup_percentage?: number
  is_published: boolean
  created_at: string
  updated_at: string
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
