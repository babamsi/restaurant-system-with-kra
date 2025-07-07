import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type {
  // Suppliers
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  
  // Categories
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  
  // Units
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
  
  // Ingredients
  Ingredient,
  CreateIngredientInput,
  UpdateIngredientInput,
  IngredientFilters,
  
  // Purchase Orders
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderItem,
  CreatePurchaseOrderItemInput,
  UpdatePurchaseOrderItemInput,
  PurchaseOrderFilters,
  
  // Kitchen Storage
  KitchenStorage,
  CreateKitchenStorageInput,
  UpdateKitchenStorageInput,
  
  // Recipes
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeIngredient,
  CreateRecipeIngredientInput,
  UpdateRecipeIngredientInput,
  RecipeFilters,
  
  // Batches
  Batch,
  CreateBatchInput,
  UpdateBatchInput,
  BatchIngredient,
  CreateBatchIngredientInput,
  UpdateBatchIngredientInput,
  BatchFilters,
  
  // System Logs
  SystemLog,
  CreateSystemLogInput,
  
  // Query Results
  QueryResult,
  SingleQueryResult,
  PaginationOptions,
  PaginatedResult,
  SortOptions
} from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

// Helper function to calculate pagination range
const getPaginationRange = (page: number, limit: number) => {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
}

// =====================================================
// SUPPLIERS SERVICE
// =====================================================

export const suppliersService = {
  // Get all suppliers
  async getAll(): Promise<QueryResult<Supplier>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch suppliers' }
    }
  },

  // Get supplier by ID
  async getById(id: string): Promise<SingleQueryResult<Supplier>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch supplier' }
    }
  },

  // Create new supplier
  async create(input: CreateSupplierInput): Promise<SingleQueryResult<Supplier>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(input)
        .select()
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create supplier' }
    }
  },

  // Update supplier
  async update(input: UpdateSupplierInput): Promise<SingleQueryResult<Supplier>> {
    try {
      const { id, ...updateData } = input
      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to update supplier' }
    }
  },

  // Delete supplier
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
      
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to delete supplier' }
    }
  }
}

// =====================================================
// CATEGORIES SERVICE
// =====================================================

export const categoriesService = {
  // Get all categories
  async getAll(): Promise<QueryResult<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch categories' }
    }
  },

  // Get category by ID
  async getById(id: string): Promise<SingleQueryResult<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch category' }
    }
  },

  // Create new category
  async create(input: CreateCategoryInput): Promise<SingleQueryResult<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(input)
        .select()
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create category' }
    }
  },

  // Update category
  async update(input: UpdateCategoryInput): Promise<SingleQueryResult<Category>> {
    try {
      const { id, ...updateData } = input
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to update category' }
    }
  },

  // Delete category
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to delete category' }
    }
  }
}

// =====================================================
// UNITS SERVICE
// =====================================================

export const unitsService = {
  // Get all units
  async getAll(): Promise<QueryResult<Unit>> {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch units' }
    }
  },

  // Get unit by ID
  async getById(id: string): Promise<SingleQueryResult<Unit>> {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch unit' }
    }
  },

  // Get units by type
  async getByType(type: Unit['type']): Promise<QueryResult<Unit>> {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name')
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch units by type' }
    }
  }
}

// =====================================================
// INGREDIENTS SERVICE
// =====================================================

export const ingredientsService = {
  // Get all ingredients with relations
  async getAll(filters?: IngredientFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Ingredient>> {
    try {
      let query = supabase
        .from('ingredients')
        .select(`
          *,
          category:categories(*),
          unit:units(*),
          supplier:suppliers(*)
        `)
        .order('name')

      // Apply filters
      if (filters) {
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id)
        }
        if (filters.supplier_id) {
          query = query.eq('supplier_id', filters.supplier_id)
        }
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active)
        }
        if (filters.is_sellable_individually !== undefined) {
          query = query.eq('is_sellable_individually', filters.is_sellable_individually)
        }
        if (filters.is_cooked !== undefined) {
          query = query.eq('is_cooked', filters.is_cooked)
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`)
        }
      }

      // Apply pagination
      if (pagination) {
        const { from, to } = getPaginationRange(pagination.page || 1, pagination.limit || 10)
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / (pagination?.limit || 10))

      return {
        data: data || [],
        pagination: {
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          total,
          totalPages,
          hasNext: (pagination?.page || 1) < totalPages,
          hasPrev: (pagination?.page || 1) > 1
        }
      }
    } catch (error) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  },

  // Get ingredient by ID with relations
  async getById(id: string): Promise<SingleQueryResult<Ingredient>> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          category:categories(*),
          unit:units(*),
          supplier:suppliers(*)
        `)
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch ingredient' }
    }
  },

  // Create new ingredient
  async create(input: CreateIngredientInput): Promise<SingleQueryResult<Ingredient>> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert(input)
        .select(`
          *,
          category:categories(*),
          unit:units(*),
          supplier:suppliers(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create ingredient' }
    }
  },

  // Update ingredient
  async update(input: UpdateIngredientInput): Promise<SingleQueryResult<Ingredient>> {
    try {
      const { id, ...updateData } = input
      const { data, error } = await supabase
        .from('ingredients')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          unit:units(*),
          supplier:suppliers(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to update ingredient' }
    }
  },

  // Delete ingredient
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
      
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to delete ingredient' }
    }
  },

  // Update stock quantity
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<SingleQueryResult<Ingredient>> {
    try {
      const { data: current } = await this.getById(id)
      if (!current) {
        return { data: null, error: 'Ingredient not found' }
      }

      const newQuantity = operation === 'add' 
        ? current.current_stock + quantity 
        : Math.max(0, current.current_stock - quantity)

      return await this.update({ id, current_stock: newQuantity })
    } catch (error) {
      return { data: null, error: 'Failed to update stock' }
    }
  }
}

// =====================================================
// KITCHEN STORAGE SERVICE
// =====================================================

export const kitchenStorageService = {
  // Get all kitchen storage items with relations
  async getAll(): Promise<QueryResult<KitchenStorage>> {
    try {
      const { data, error } = await supabase
        .from('kitchen_storage')
        .select(`
          *,
          ingredient:ingredients(*),
          unit:units(*)
        `)
        .order('last_updated', { ascending: false })
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch kitchen storage' }
    }
  },

  // Get kitchen storage item by ingredient ID
  async getByIngredientId(ingredientId: string): Promise<SingleQueryResult<KitchenStorage>> {
    try {
      const { data, error } = await supabase
        .from('kitchen_storage')
        .select(`
          *,
          ingredient:ingredients(*),
          unit:units(*)
        `)
        .eq('ingredient_id', ingredientId)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch kitchen storage item' }
    }
  },

  // Add to kitchen storage
  async addToStorage(input: CreateKitchenStorageInput): Promise<SingleQueryResult<KitchenStorage>> {
    try {
      const { data: existing } = await this.getByIngredientId(input.ingredient_id)
      
      if (existing) {
        // Update existing item
        const newQuantity = existing.quantity + (input.quantity || 0)
        const newUsedGrams = existing.used_grams + (input.used_grams || 0)
        
        const { data, error } = await supabase
          .from('kitchen_storage')
          .update({
            quantity: newQuantity,
            used_grams: newUsedGrams,
            last_updated: new Date().toISOString()
          })
          .eq('ingredient_id', input.ingredient_id)
          .select(`
            *,
            ingredient:ingredients(*),
            unit:units(*)
          `)
          .single()
        
        return { data, error: error?.message || null }
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('kitchen_storage')
          .insert(input)
          .select(`
            *,
            ingredient:ingredients(*),
            unit:units(*)
          `)
          .single()
        
        return { data, error: error?.message || null }
      }
    } catch (error) {
      return { data: null, error: 'Failed to add to kitchen storage' }
    }
  },

  // Remove from kitchen storage
  async removeFromStorage(ingredientId: string, quantity: number): Promise<SingleQueryResult<KitchenStorage>> {
    try {
      const { data: existing } = await this.getByIngredientId(ingredientId)
      
      if (!existing) {
        return { data: null, error: 'Item not found in kitchen storage' }
      }

      const newQuantity = Math.max(0, existing.quantity - quantity)
      
      const { data, error } = await supabase
        .from('kitchen_storage')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('ingredient_id', ingredientId)
        .select(`
          *,
          ingredient:ingredients(*),
          unit:units(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to remove from kitchen storage' }
    }
  }
}

// =====================================================
// RECIPES SERVICE
// =====================================================

export const recipesService = {
  // Get all recipes with relations
  async getAll(filters?: RecipeFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Recipe>> {
    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          category:categories(*),
          yield_unit:units(*),
          ingredients:recipe_ingredients(
            *,
            ingredient:ingredients(*),
            unit:units(*)
          )
        `)
        .order('name')

      // Apply filters
      if (filters) {
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id)
        }
        if (filters.is_published !== undefined) {
          query = query.eq('is_published', filters.is_published)
        }
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active)
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`)
        }
      }

      // Apply pagination
      if (pagination) {
        const { from, to } = getPaginationRange(pagination.page || 1, pagination.limit || 10)
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / (pagination?.limit || 10))

      return {
        data: data || [],
        pagination: {
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          total,
          totalPages,
          hasNext: (pagination?.page || 1) < totalPages,
          hasPrev: (pagination?.page || 1) > 1
        }
      }
    } catch (error) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  },

  // Get recipe by ID with relations
  async getById(id: string): Promise<SingleQueryResult<Recipe>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          category:categories(*),
          yield_unit:units(*),
          ingredients:recipe_ingredients(
            *,
            ingredient:ingredients(*),
            unit:units(*)
          )
        `)
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch recipe' }
    }
  },

  // Create new recipe
  async create(input: CreateRecipeInput): Promise<SingleQueryResult<Recipe>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert(input)
        .select(`
          *,
          category:categories(*),
          yield_unit:units(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create recipe' }
    }
  },

  // Update recipe
  async update(input: UpdateRecipeInput): Promise<SingleQueryResult<Recipe>> {
    try {
      const { id, ...updateData } = input
      const { data, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          yield_unit:units(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to update recipe' }
    }
  },

  // Delete recipe
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
      
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to delete recipe' }
    }
  }
}

// =====================================================
// BATCHES SERVICE
// =====================================================

export const batchesService = {
  // Get all batches with relations
  async getAll(filters?: BatchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Batch>> {
    try {
      let query = supabase
        .from('batches')
        .select(`
          *,
          recipe:recipes(*),
          yield_unit:units(*),
          ingredients:batch_ingredients(
            *,
            ingredient:ingredients(*),
            unit:units(*),
            source_batch:batches(*)
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.recipe_id) {
          query = query.eq('recipe_id', filters.recipe_id)
        }
        if (filters.created_by) {
          query = query.eq('created_by', filters.created_by)
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from)
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to)
        }
      }

      // Apply pagination
      if (pagination) {
        const { from, to } = getPaginationRange(pagination.page || 1, pagination.limit || 10)
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / (pagination?.limit || 10))

      return {
        data: data || [],
        pagination: {
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          total,
          totalPages,
          hasNext: (pagination?.page || 1) < totalPages,
          hasPrev: (pagination?.page || 1) > 1
        }
      }
    } catch (error) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  },

  // Get batch by ID with relations
  async getById(id: string): Promise<SingleQueryResult<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          recipe:recipes(*),
          yield_unit:units(*),
          ingredients:batch_ingredients(
            *,
            ingredient:ingredients(*),
            unit:units(*),
            source_batch:batches(*)
          )
        `)
        .eq('id', id)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch batch' }
    }
  },

  // Create new batch
  async create(input: CreateBatchInput): Promise<SingleQueryResult<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .insert(input)
        .select(`
          *,
          recipe:recipes(*),
          yield_unit:units(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create batch' }
    }
  },

  // Update batch
  async update(input: UpdateBatchInput): Promise<SingleQueryResult<Batch>> {
    try {
      const { id, ...updateData } = input
      const { data, error } = await supabase
        .from('batches')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          recipe:recipes(*),
          yield_unit:units(*)
        `)
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to update batch' }
    }
  },

  // Delete batch
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id)
      
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to delete batch' }
    }
  },

  // Update batch status
  async updateStatus(id: string, status: Batch['status']): Promise<SingleQueryResult<Batch>> {
    const updateData: UpdateBatchInput = { id, status }
    
    if (status === 'preparing') {
      updateData.start_time = new Date().toISOString()
    } else if (status === 'completed' || status === 'finished') {
      updateData.end_time = new Date().toISOString()
    }
    
    return await this.update(updateData)
  }
}

// =====================================================
// SYSTEM LOGS SERVICE
// =====================================================

export const systemLogsService = {
  // Get all system logs
  async getAll(limit = 100): Promise<QueryResult<SystemLog>> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch system logs' }
    }
  },

  // Create new system log
  async create(input: CreateSystemLogInput): Promise<SingleQueryResult<SystemLog>> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .insert(input)
        .select()
        .single()
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to create system log' }
    }
  },

  // Get logs by type
  async getByType(type: SystemLog['type'], limit = 50): Promise<QueryResult<SystemLog>> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      return { data, error: error?.message || null }
    } catch (error) {
      return { data: null, error: 'Failed to fetch system logs by type' }
    }
  }
}

// =====================================================
// SUPPLIER ORDERS SERVICE
// =====================================================

export const supplierOrdersService = {
  // Create a new supplier order and its items
  async createOrderWithItems({
    supplier_id,
    invoice_number,
    order_date = new Date().toISOString(),
    total_amount,
    vat_amount,
    notes,
    items
  }: {
    supplier_id: string,
    invoice_number: string,
    order_date?: string,
    total_amount: number,
    vat_amount: number,
    notes?: string,
    items: Array<{
      ingredient_id: string,
      quantity: number,
      cost_per_unit: number,
      total_cost: number
    }>
  }) {
    try {
      // 1. Create the supplier order
      const { data: order, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          supplier_id,
          invoice_number,
          order_date,
          total_amount,
          vat_amount,
          notes: notes || null
        })
        .select()
        .single();
      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create supplier order');
      }

      // 2. Create the order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        cost_per_unit: item.cost_per_unit,
        total_cost: item.total_cost
      }));
      const { error: itemsError } = await supabase
        .from('supplier_order_items')
        .insert(orderItems);
      if (itemsError) {
        throw new Error(itemsError.message || 'Failed to create supplier order items');
      }

      return { data: order, success: true };
    } catch (error) {
      return { data: null, success: false, error: handleSupabaseError(error) };
    }
  },

  // Get all orders for a supplier
  async getOrdersBySupplier(supplier_id: string) {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*')
        .eq('supplier_id', supplier_id)
        .order('order_date', { ascending: false });
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Get order items for a given order
  async getOrderItems(order_id: string) {
    try {
      const { data, error } = await supabase
        .from("supplier_order_items")
        .select("*, ingredient:ingredient_id(name)")
        .eq("order_id", order_id);
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Update order status
  async updateOrderStatus(order_id: string, status: string) {
    try {
      const { error } = await supabase
        .from('supplier_orders')
        .update({ status })
        .eq('id', order_id)
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) }
    }
  }
};

// =====================================================
// TABLE ORDERS SERVICE
// =====================================================

export const tableOrdersService = {
  // Create a new table order and its items
  async createOrderWithItems({
    table_number,
    table_id,
    customer_name,
    order_type = 'dine-in',
    subtotal = 0,
    tax_rate = 0,
    tax_amount = 0,
    total_amount = 0,
    special_instructions,
    notes,
    items,
    session_id
  }: {
    table_number: string;
    table_id: number;
    customer_name?: string;
    order_type?: 'dine-in' | 'takeaway';
    subtotal?: number;
    tax_rate?: number;
    tax_amount?: number;
    total_amount?: number;
    special_instructions?: string;
    notes?: string;
    items: Array<{
      menu_item_id: string;
      menu_item_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      portion_size?: string;
      customization_notes?: string;
    }>;
    session_id?: string;
  }) {
    try {
      // Check for existing active order on this table
      const { data: existingOrder } = await this.getActiveOrderByTable(table_id);
      if (existingOrder) {
        throw new Error(`Table ${table_number} already has an active order. Please add items to the existing order instead.`);
      }

      // 1. Create the table order
      const { data: order, error: orderError } = await supabase
        .from('table_orders')
        .insert({
          table_number,
          table_id,
          customer_name,
          order_type,
          subtotal,
          tax_rate,
          tax_amount,
          total_amount,
          special_instructions,
          notes,
          session_id
        })
        .select()
        .single();
      
      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create table order');
      }

      // 2. Create the order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        portion_size: item.portion_size,
        customization_notes: item.customization_notes
      }));
      
      const { error: itemsError } = await supabase
        .from('table_order_items')
        .insert(orderItems);
      
      if (itemsError) {
        throw new Error(itemsError.message || 'Failed to create table order items');
      }

      return { data: order, success: true };
    } catch (error) {
      return { data: null, success: false, error: handleSupabaseError(error) };
    }
  },

  // Get active order for a specific table
  async getActiveOrderByTable(table_id: number) {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select(`
          *,
          items:table_order_items(*)
        `)
        .eq('table_id', table_id)
        .in('status', ['pending', 'preparing', 'ready'])
        .single();
      
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Get all orders for a table (including completed)
  async getOrdersByTable(table_id: number) {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select(`
          *,
          items:table_order_items(*)
        `)
        .eq('table_id', table_id)
        .order('created_at', { ascending: false });
      
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Update order status
  async updateOrderStatus(order_id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .update({ status })
        .eq('id', order_id)
        .select()
        .single();
      
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Mark order as paid
  async markOrderAsPaid(order_id: string, payment_method: string) {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .update({ 
          status: 'paid',
          payment_method,
          payment_date: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single();
      
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Add items to existing order
  async addItemsToOrder(order_id: string, items: Array<{
    menu_item_id: string;
    menu_item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    portion_size?: string;
    customization_notes?: string;
  }>) {
    try {
      const orderItems = items.map(item => ({
        order_id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        portion_size: item.portion_size,
        customization_notes: item.customization_notes
      }));
      
      const { error } = await supabase
        .from('table_order_items')
        .insert(orderItems);
      
      if (error) {
        throw new Error(error.message || 'Failed to add items to order');
      }

      // Update order totals
      const { data: existingOrderItems } = await supabase
        .from('table_order_items')
        .select('total_price')
        .eq('order_id', order_id);
      
      const newSubtotal = existingOrderItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;
      const taxAmount = newSubtotal * 0.16; // 16% tax rate
      const totalAmount = newSubtotal + taxAmount;

      const { data, error: updateError } = await supabase
        .from('table_orders')
        .update({
          subtotal: newSubtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        })
        .eq('id', order_id)
        .select()
        .single();
      
      return { data, error: updateError?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Get all pending orders
  async getPendingOrders() {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select(`
          *,
          items:table_order_items(*)
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });
      
      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }
}

// =====================================================
// EXPORT ALL SERVICES
// =====================================================

export const databaseService = {
  suppliers: suppliersService,
  categories: categoriesService,
  units: unitsService,
  ingredients: ingredientsService,
  kitchenStorage: kitchenStorageService,
  recipes: recipesService,
  batches: batchesService,
  systemLogs: systemLogsService
}

// Enhanced Inventory Service with comprehensive operations
export const inventoryService = {
  // Get all ingredients with optional filters and pagination
  async getIngredients(filters?: {
    category?: string;
    supplier?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    search?: string;
  }, pagination?: { page?: number; limit?: number }) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      let query = supabase
        .from('ingredients')
        .select(`
          *,
          categories(name),
          units(name, symbol),
          suppliers(name, contact_person)
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters?.supplier) {
        query = query.eq('supplier_id', filters.supplier);
      }
      if (filters?.status) {
        switch (filters.status) {
          case 'out_of_stock':
            query = query.eq('current_stock', 0);
            break;
          case 'low_stock':
            query = query.lt('current_stock', query.select('reorder_point'));
            break;
          case 'in_stock':
            query = query.gt('current_stock', 0);
            break;
        }
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page = 1, limit = 50 } = pagination;
        const { from, to } = getPaginationRange(page, limit);
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        count: count || 0,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        count: 0,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Get ingredient by ID
  async getIngredientById(id: string) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          categories(name),
          units(name, symbol),
          suppliers(name, contact_person)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Create new ingredient
  async createIngredient(ingredient: any) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .insert([ingredient])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the creation
      await this.createSystemLog({
        type: 'inventory',
        action: 'create',
        details: `Created ingredient: ${ingredient.name}`,
        status: 'success',
        entity_type: 'ingredients',
        entity_id: data.id
      });

      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Update ingredient
  async updateIngredient(id: string, updates: any) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the update
      await this.createSystemLog({
        type: 'inventory',
        action: 'update',
        details: `Updated ingredient: ${data.name}`,
        status: 'success',
        entity_type: 'ingredients',
        entity_id: id
      });

      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Delete ingredient
  async deleteIngredient(id: string) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      // Get ingredient name before deletion for logging
      const { data: ingredient } = await this.getIngredientById(id);
      const ingredientName = ingredient?.name || 'Unknown';

      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log the deletion
      await this.createSystemLog({
        type: 'inventory',
        action: 'delete',
        details: `Deleted ingredient: ${ingredientName}`,
        status: 'success',
        entity_type: 'ingredients',
        entity_id: id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Update stock quantity
  async updateStock(id: string, quantity: number, type: 'add' | 'subtract', reason: string = 'manual-adjustment') {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      // Get current ingredient
      const { data: currentIngredient } = await this.getIngredientById(id);
      if (!currentIngredient) {
        throw new Error('Ingredient not found');
      }

      const newQuantity = type === 'add' 
        ? currentIngredient.current_stock + quantity
        : Math.max(0, currentIngredient.current_stock - quantity);

      const { data, error } = await supabase
        .from('ingredients')
        .update({
          current_stock: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the stock update
      await this.createSystemLog({
        type: 'inventory',
        action: 'stock_update',
        details: `${type === 'add' ? 'Added' : 'Subtracted'} ${quantity} ${currentIngredient.units?.symbol || 'units'} of ${currentIngredient.name}. Reason: ${reason}`,
        status: 'success',
        entity_type: 'ingredients',
        entity_id: id
      });

      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Update cost
  async updateCost(id: string, newCost: number) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      // Get current ingredient
      const { data: currentIngredient } = await this.getIngredientById(id);
      if (!currentIngredient) {
        throw new Error('Ingredient not found');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .update({
          cost_per_unit: newCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the cost update
      await this.createSystemLog({
        type: 'inventory',
        action: 'cost_update',
        details: `Updated cost for ${currentIngredient.name} from $${currentIngredient.cost_per_unit} to $${newCost}`,
        status: 'success',
        entity_type: 'ingredients',
        entity_id: id
      });

      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Get low stock items
  async getLowStockItems() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          categories(name),
          units(name, symbol),
          suppliers(name, contact_person)
        `)
        .eq('is_active', true)
        .lt('current_stock', 10)
        .gt('current_stock', 0);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Get out of stock items
  async getOutOfStockItems() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          categories(name),
          units(name, symbol),
          suppliers(name, contact_person)
        `)
        .eq('is_active', true)
        .eq('current_stock', 0);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Get total inventory value
  async getTotalInventoryValue() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('ingredients')
        .select('current_stock, cost_per_unit')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalValue = (data || []).reduce((sum, item) => {
        return sum + (item.current_stock * item.cost_per_unit);
      }, 0);

      return {
        data: totalValue,
        success: true
      };
    } catch (error) {
      return {
        data: 0,
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Get ingredient logs
  async getIngredientLogs(ingredientId: string, limit: number = 50) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('entity_type', 'ingredients')
        .eq('entity_id', ingredientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: handleSupabaseError(error)
      };
    }
  },

  // Create system log
  async createSystemLog(log: any) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase
        .from('system_logs')
        .insert([log]);

      if (error) {
        throw error;
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }
}; 