export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          tax_id: string | null
          payment_terms: string | null
          credit_limit: number | null
          current_balance: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          name: string
          symbol: string
          type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          symbol: string
          type: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          symbol?: string
          type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string
          unit_id: string
          supplier_id: string | null
          current_stock: number
          minimum_stock: number
          maximum_stock: number | null
          reorder_point: number
          cost_per_unit: number
          selling_price: number | null
          markup_percentage: number | null
          calories_per_unit: number | null
          protein_per_unit: number | null
          carbs_per_unit: number | null
          fat_per_unit: number | null
          fiber_per_unit: number | null
          sodium_per_unit: number | null
          is_sellable_individually: boolean
          is_cooked: boolean
          is_active: boolean
          is_perishable: boolean
          expiry_date: string | null
          barcode: string | null
          sku: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id: string
          unit_id: string
          supplier_id?: string | null
          current_stock?: number
          minimum_stock?: number
          maximum_stock?: number | null
          reorder_point?: number
          cost_per_unit: number
          selling_price?: number | null
          markup_percentage?: number | null
          calories_per_unit?: number | null
          protein_per_unit?: number | null
          carbs_per_unit?: number | null
          fat_per_unit?: number | null
          fiber_per_unit?: number | null
          sodium_per_unit?: number | null
          is_sellable_individually?: boolean
          is_cooked?: boolean
          is_active?: boolean
          is_perishable?: boolean
          expiry_date?: string | null
          barcode?: string | null
          sku?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string
          unit_id?: string
          supplier_id?: string | null
          current_stock?: number
          minimum_stock?: number
          maximum_stock?: number | null
          reorder_point?: number
          cost_per_unit?: number
          selling_price?: number | null
          markup_percentage?: number | null
          calories_per_unit?: number | null
          protein_per_unit?: number | null
          carbs_per_unit?: number | null
          fat_per_unit?: number | null
          fiber_per_unit?: number | null
          sodium_per_unit?: number | null
          is_sellable_individually?: boolean
          is_cooked?: boolean
          is_active?: boolean
          is_perishable?: boolean
          expiry_date?: string | null
          barcode?: string | null
          sku?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kitchen_storage: {
        Row: {
          id: string
          ingredient_id: string
          quantity: number
          unit_id: string
          used_grams: number | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          quantity: number
          unit_id: string
          used_grams?: number | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          quantity?: number
          unit_id?: string
          used_grams?: number | null
          last_updated?: string
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string
          yield_per_batch: number
          yield_unit_id: string
          prep_time_minutes: number
          cooking_time_minutes: number | null
          total_raw_cost: number
          selling_price: number | null
          markup_percentage: number | null
          calories_per_portion: number | null
          protein_per_portion: number | null
          carbs_per_portion: number | null
          fat_per_portion: number | null
          fiber_per_portion: number | null
          sodium_per_portion: number | null
          is_published: boolean
          is_active: boolean
          instructions: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id: string
          yield_per_batch: number
          yield_unit_id: string
          prep_time_minutes: number
          cooking_time_minutes?: number | null
          total_raw_cost: number
          selling_price?: number | null
          markup_percentage?: number | null
          calories_per_portion?: number | null
          protein_per_portion?: number | null
          carbs_per_portion?: number | null
          fat_per_portion?: number | null
          fiber_per_portion?: number | null
          sodium_per_portion?: number | null
          is_published?: boolean
          is_active?: boolean
          instructions?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string
          yield_per_batch?: number
          yield_unit_id?: string
          prep_time_minutes?: number
          cooking_time_minutes?: number | null
          total_raw_cost?: number
          selling_price?: number | null
          markup_percentage?: number | null
          calories_per_portion?: number | null
          protein_per_portion?: number | null
          carbs_per_portion?: number | null
          fat_per_portion?: number | null
          fiber_per_portion?: number | null
          sodium_per_portion?: number | null
          is_published?: boolean
          is_active?: boolean
          instructions?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity_needed: number
          unit_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity_needed: number
          unit_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity_needed?: number
          unit_id?: string
          notes?: string | null
          created_at?: string
        }
      }
      batches: {
        Row: {
          id: string
          name: string
          recipe_id: string | null
          yield: number
          yield_unit_id: string
          portions: number
          status: string
          start_time: string | null
          end_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          recipe_id?: string | null
          yield: number
          yield_unit_id: string
          portions: number
          status?: string
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          recipe_id?: string | null
          yield?: number
          yield_unit_id?: string
          portions?: number
          status?: string
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      batch_ingredients: {
        Row: {
          id: string
          batch_id: string
          ingredient_id: string
          required_quantity: number
          unit_id: string
          status: string
          is_batch: boolean
          source_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          ingredient_id: string
          required_quantity: number
          unit_id: string
          status?: string
          is_batch?: boolean
          source_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          ingredient_id?: string
          required_quantity?: number
          unit_id?: string
          status?: string
          is_batch?: boolean
          source_batch_id?: string | null
          created_at?: string
        }
      }
      system_logs: {
        Row: {
          id: string
          type: string
          action: string
          details: string
          status: string
          entity_type: string | null
          entity_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          action: string
          details: string
          status: string
          entity_type?: string | null
          entity_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          action?: string
          details?: string
          status?: string
          entity_type?: string | null
          entity_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      wastage: {
        Row: {
          id: string
          item_id: string
          item_name: string
          is_batch: boolean
          quantity: number
          unit: string
          reason: string
          reported_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          item_name: string
          is_batch?: boolean
          quantity: number
          unit: string
          reason: string
          reported_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          item_name?: string
          is_batch?: boolean
          quantity?: number
          unit?: string
          reason?: string
          reported_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 