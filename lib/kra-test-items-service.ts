import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface TestKRAItem {
  id: string
  name: string
  description: string | null
  category: string
  unit: string
  cost_per_unit: number
  current_stock: number
  item_cd?: string
  item_cls_cd?: string
  tax_ty_cd?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateTestItemData {
  name: string
  description?: string
  category: string
  unit: string
  cost_per_unit: number
  current_stock: number
  item_cls_cd: string
  tax_ty_cd: string
}

export interface UpdateTestItemData {
  name?: string
  description?: string
  cost_per_unit?: number
  current_stock?: number
  is_active?: boolean
}

export const kraTestItemsService = {
  // Get all test items
  async getTestItems(): Promise<{ success: boolean; data?: TestKRAItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching test items:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error in getTestItems:', error)
      return { success: false, error: 'Failed to fetch test items' }
    }
  },

  // Create a new test item
  async createTestItem(itemData: CreateTestItemData): Promise<{ success: boolean; data?: TestKRAItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert([{
          name: itemData.name,
          description: itemData.description || null,
          category: itemData.category,
          unit: itemData.unit,
          cost_per_unit: itemData.cost_per_unit,
          current_stock: itemData.current_stock,
          item_cls_cd: itemData.item_cls_cd,
          tax_ty_cd: itemData.tax_ty_cd,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating test item:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in createTestItem:', error)
      return { success: false, error: 'Failed to create test item' }
    }
  },

  // Update a test item
  async updateTestItem(id: string, updateData: UpdateTestItemData): Promise<{ success: boolean; data?: TestKRAItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating test item:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in updateTestItem:', error)
      return { success: false, error: 'Failed to update test item' }
    }
  },

  // Update KRA item code after registration
  async updateKRAItemCode(id: string, itemCd: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ item_cd: itemCd })
        .eq('id', id)

      if (error) {
        console.error('Error updating KRA item code:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in updateKRAItemCode:', error)
      return { success: false, error: 'Failed to update KRA item code' }
    }
  },

  // Delete a test item (hard delete)
  async deleteTestItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting test item:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteTestItem:', error)
      return { success: false, error: 'Failed to delete test item' }
    }
  }
} 