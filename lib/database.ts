import { supabase } from './supabase'
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
        const { from, to } = getPaginationRange(pagination)
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
        const { from, to } = getPaginationRange(pagination)
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
        const { from, to } = getPaginationRange(pagination)
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
// HELPER FUNCTIONS
// =====================================================

function getPaginationRange(pagination: PaginationOptions): { from: number; to: number } {
  const { page, limit } = pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
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