// =====================================================
// DATABASE TYPES FOR CAFETERIA MANAGEMENT SYSTEM
// =====================================================

// =====================================================
// SUPPLIERS MANAGEMENT
// =====================================================

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierInput {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  current_balance?: number;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: string;
}

// =====================================================
// INVENTORY MANAGEMENT
// =====================================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  type: 'weight' | 'volume' | 'count' | 'custom';
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateUnitInput {
  name: string;
  symbol: string;
  type: 'weight' | 'volume' | 'count' | 'custom';
  description?: string;
  is_active?: boolean;
}

export interface UpdateUnitInput extends Partial<CreateUnitInput> {
  id: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  unit_id: string;
  supplier_id?: string;
  
  // Stock management
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  
  // Cost and pricing
  cost_per_unit: number;
  selling_price: number;
  markup_percentage: number;
  
  // Nutritional information
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
  fiber_per_unit: number;
  sodium_per_unit: number;
  
  // Status and flags
  is_sellable_individually: boolean;
  is_cooked: boolean;
  is_active: boolean;
  is_perishable: boolean;
  expiry_date?: string;
  
  // Metadata
  barcode?: string;
  sku?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  category?: Category;
  unit?: Unit;
  supplier?: Supplier;
}

export interface CreateIngredientInput {
  name: string;
  description?: string;
  category_id?: string;
  unit_id: string;
  supplier_id?: string;
  current_stock?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  reorder_point?: number;
  cost_per_unit?: number;
  selling_price?: number;
  markup_percentage?: number;
  calories_per_unit?: number;
  protein_per_unit?: number;
  carbs_per_unit?: number;
  fat_per_unit?: number;
  fiber_per_unit?: number;
  sodium_per_unit?: number;
  is_sellable_individually?: boolean;
  is_cooked?: boolean;
  is_active?: boolean;
  is_perishable?: boolean;
  expiry_date?: string;
  barcode?: string;
  sku?: string;
  notes?: string;
}

export interface UpdateIngredientInput extends Partial<CreateIngredientInput> {
  id: string;
}

// =====================================================
// PURCHASE ORDERS
// =====================================================

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  delivery_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  status?: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  notes?: string;
  created_by?: string;
}

export interface UpdatePurchaseOrderInput extends Partial<CreatePurchaseOrderInput> {
  id: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  ingredient?: Ingredient;
  purchase_order?: PurchaseOrder;
}

export interface CreatePurchaseOrderItemInput {
  purchase_order_id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderItemInput extends Partial<CreatePurchaseOrderItemInput> {
  id: string;
}

// =====================================================
// KITCHEN MANAGEMENT
// =====================================================

export interface KitchenStorage {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit_id: string;
  used_grams: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  ingredient?: Ingredient;
  unit?: Unit;
}

export interface CreateKitchenStorageInput {
  ingredient_id: string;
  quantity?: number;
  unit_id: string;
  used_grams?: number;
}

export interface UpdateKitchenStorageInput extends Partial<CreateKitchenStorageInput> {
  id: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  yield_per_batch: number;
  yield_unit_id: string;
  prep_time_minutes: number;
  cooking_time_minutes: number;
  total_raw_cost: number;
  selling_price: number;
  markup_percentage: number;
  calories_per_portion: number;
  protein_per_portion: number;
  carbs_per_portion: number;
  fat_per_portion: number;
  fiber_per_portion: number;
  sodium_per_portion: number;
  is_published: boolean;
  is_active: boolean;
  instructions?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  category?: Category;
  yield_unit?: Unit;
  ingredients?: RecipeIngredient[];
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  category_id?: string;
  yield_per_batch: number;
  yield_unit_id: string;
  prep_time_minutes?: number;
  cooking_time_minutes?: number;
  total_raw_cost?: number;
  selling_price?: number;
  markup_percentage?: number;
  calories_per_portion?: number;
  protein_per_portion?: number;
  carbs_per_portion?: number;
  fat_per_portion?: number;
  fiber_per_portion?: number;
  sodium_per_portion?: number;
  is_published?: boolean;
  is_active?: boolean;
  instructions?: string;
  notes?: string;
  created_by?: string;
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity_needed: number;
  unit_id: string;
  cost_per_unit: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  ingredient?: Ingredient;
  unit?: Unit;
  recipe?: Recipe;
}

export interface CreateRecipeIngredientInput {
  recipe_id: string;
  ingredient_id: string;
  quantity_needed: number;
  unit_id: string;
  cost_per_unit?: number;
  total_cost?: number;
  notes?: string;
}

export interface UpdateRecipeIngredientInput extends Partial<CreateRecipeIngredientInput> {
  id: string;
}

export interface Batch {
  id: string;
  name: string;
  recipe_id?: string;
  yield: number;
  yield_unit_id: string;
  portions: number;
  status: 'draft' | 'preparing' | 'ready' | 'completed' | 'finished';
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  recipe?: Recipe;
  yield_unit?: Unit;
  ingredients?: BatchIngredient[];
}

export interface CreateBatchInput {
  name: string;
  recipe_id?: string;
  yield?: number;
  yield_unit_id: string;
  portions?: number;
  status?: 'draft' | 'preparing' | 'ready' | 'completed' | 'finished';
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_by?: string;
}

export interface UpdateBatchInput extends Partial<CreateBatchInput> {
  id: string;
}

export interface BatchIngredient {
  id: string;
  batch_id: string;
  ingredient_id: string;
  required_quantity: number;
  unit_id: string;
  status: 'available' | 'low' | 'missing';
  is_batch: boolean;
  source_batch_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  ingredient?: Ingredient;
  unit?: Unit;
  batch?: Batch;
  source_batch?: Batch;
}

export interface CreateBatchIngredientInput {
  batch_id: string;
  ingredient_id: string;
  required_quantity: number;
  unit_id: string;
  status?: 'available' | 'low' | 'missing';
  is_batch?: boolean;
  source_batch_id?: string;
  notes?: string;
}

export interface UpdateBatchIngredientInput extends Partial<CreateBatchIngredientInput> {
  id: string;
}

// =====================================================
// SYSTEM LOGS
// =====================================================

export interface SystemLog {
  id: string;
  type: 'storage' | 'batch' | 'inventory' | 'purchase' | 'system';
  action: string;
  details?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  created_at: string;
}

export interface CreateSystemLogInput {
  type: 'storage' | 'batch' | 'inventory' | 'purchase' | 'system';
  action: string;
  details?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
}

// =====================================================
// DATABASE TABLES ENUM
// =====================================================

export type DatabaseTable = 
  | 'suppliers'
  | 'categories'
  | 'units'
  | 'ingredients'
  | 'purchase_orders'
  | 'purchase_order_items'
  | 'kitchen_storage'
  | 'recipes'
  | 'recipe_ingredients'
  | 'batches'
  | 'batch_ingredients'
  | 'system_logs';

// =====================================================
// RELATIONSHIP TYPES
// =====================================================

export interface IngredientWithRelations extends Ingredient {
  category: Category;
  unit: Unit;
  supplier: Supplier;
}

export interface RecipeWithRelations extends Recipe {
  category: Category;
  yield_unit: Unit;
  ingredients: RecipeIngredientWithRelations[];
}

export interface RecipeIngredientWithRelations extends RecipeIngredient {
  ingredient: Ingredient;
  unit: Unit;
}

export interface BatchWithRelations extends Batch {
  recipe: Recipe;
  yield_unit: Unit;
  ingredients: BatchIngredientWithRelations[];
}

export interface BatchIngredientWithRelations extends BatchIngredient {
  ingredient: Ingredient;
  unit: Unit;
  source_batch: Batch;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier: Supplier;
  items: PurchaseOrderItemWithRelations[];
}

export interface PurchaseOrderItemWithRelations extends PurchaseOrderItem {
  ingredient: Ingredient;
}

export interface KitchenStorageWithRelations extends KitchenStorage {
  ingredient: Ingredient;
  unit: Unit;
}

// =====================================================
// QUERY RESULT TYPES
// =====================================================

export interface QueryResult<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export interface SingleQueryResult<T> {
  data: T | null;
  error: string | null;
}

// =====================================================
// FILTER AND SORT TYPES
// =====================================================

export interface IngredientFilters {
  category_id?: string;
  supplier_id?: string;
  is_active?: boolean;
  is_sellable_individually?: boolean;
  is_cooked?: boolean;
  search?: string;
}

export interface BatchFilters {
  status?: Batch['status'];
  recipe_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface RecipeFilters {
  category_id?: string;
  is_published?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface PurchaseOrderFilters {
  supplier_id?: string;
  status?: PurchaseOrder['status'];
  date_from?: string;
  date_to?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// =====================================================
// PAGINATION TYPES
// =====================================================

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 