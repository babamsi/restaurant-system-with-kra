import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// Helper function to check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper function to calculate pagination range
const getPaginationRange = (page: number, limit: number) => {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
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
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
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
            // For low stock, we'll filter in the application layer
            break;
          case 'in_stock':
            // For in stock, we'll filter in the application layer
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

      // Apply status filters in application layer
      let filteredData = data || [];
      if (filters?.status) {
        switch (filters.status) {
          case 'low_stock':
            filteredData = filteredData.filter(item => 
              item.current_stock <= item.reorder_point && item.current_stock > 0
            );
            break;
          case 'in_stock':
            filteredData = filteredData.filter(item => 
              item.current_stock > item.reorder_point
            );
            break;
        }
      }

      return {
        data: filteredData,
        count: filteredData.length,
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
        .select('*')
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
        .select('*')
        .eq('is_active', true)
        .gt('current_stock', 0);

      if (error) {
        throw error;
      }

      // Filter for low stock items in application layer
      const lowStockItems = (data || []).filter(item => 
        item.current_stock <= item.reorder_point
      );

      return {
        data: lowStockItems,
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
        .select('*')
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