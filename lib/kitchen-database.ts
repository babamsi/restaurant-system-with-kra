import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export const kitchenService = {
  // Kitchen Storage
  async getKitchenStorage() {
    const { data, error } = await supabase.from('kitchen_storage').select('*')
    return { data, error }
  },
  async addToKitchenStorage(item: {
    ingredient_id: string,
    quantity: number,
    unit: string,
    used_grams?: number,
  }) {
    const { data, error } = await supabase.from('kitchen_storage').insert([item]).select().single()
    return { data, error }
  },
  async updateKitchenStorage(id: string, updates: any) {
    const { data, error } = await supabase.from('kitchen_storage').update(updates).eq('id', id).select().single()
    return { data, error }
  },
  async removeFromKitchenStorage(id: string) {
    const { error } = await supabase.from('kitchen_storage').delete().eq('id', id)
    return { error }
  },

  // Batches
  async getBatches() {
    const { data, error } = await supabase.from('kitchen_batches').select('*')
    return { data, error }
  },
  async createBatch(batch: any) {
    const { data, error } = await supabase.from('kitchen_batches').insert([batch]).select().single()
    return { data, error }
  },
  async updateBatch(id: string, updates: any) {
    const { data, error } = await supabase.from('kitchen_batches').update(updates).eq('id', id).select().single()
    return { data, error }
  },
  async deleteBatch(id: string) {
    const { error } = await supabase.from('kitchen_batches').delete().eq('id', id)
    return { error }
  },

  // System Logs
  async getSystemLogs() {
    const { data, error } = await supabase.from('kitchen_system_logs').select('*').order('timestamp', { ascending: false })
    return { data, error }
  },
  async addSystemLog(log: any) {
    const { data, error } = await supabase.from('kitchen_system_logs').insert([log]).select().single()
    return { data, error }
  },
} 