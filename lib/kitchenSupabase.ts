import { supabase } from './supabase'
import type { Database } from '@/types/supabase'

// --- Kitchen Storage ---
export async function fetchKitchenStorage() {
  const { data, error } = await supabase
    .from('kitchen_storage')
    .select('*')
    .order('last_updated', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertKitchenStorage(item: Partial<Database['public']['Tables']['kitchen_storage']['Insert']>) {
  const { data, error } = await supabase
    .from('kitchen_storage')
    .upsert(item, { onConflict: 'ingredient_id' })
    .select()
  if (error) throw error
  return data
}

export async function deleteKitchenStorage(id: string) {
  const { error } = await supabase
    .from('kitchen_storage')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// --- Batches ---
export async function fetchBatches() {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertBatch(batch: Partial<Database['public']['Tables']['batches']['Insert']>) {
  const { data, error } = await supabase
    .from('batches')
    .upsert(batch, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data
}

export async function deleteBatch(id: string) {
  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// --- Batch Ingredients ---
export async function fetchBatchIngredients(batchId: string) {
  const { data, error } = await supabase
    .from('batch_ingredients')
    .select('*')
    .eq('batch_id', batchId)
  if (error) throw error
  return data
}

export async function upsertBatchIngredient(ingredient: Partial<Database['public']['Tables']['batch_ingredients']['Insert']>) {
  const { data, error } = await supabase
    .from('batch_ingredients')
    .upsert(ingredient, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data
}

export async function deleteBatchIngredient(id: string) {
  const { error } = await supabase
    .from('batch_ingredients')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// --- System Logs ---
export async function fetchSystemLogs() {
  const { data, error } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function insertSystemLog(log: Database['public']['Tables']['system_logs']['Insert']) {
  const { data, error } = await supabase
    .from('system_logs')
    .insert(log)
    .select()
  if (error) throw error
  return data
}

// --- Ingredients ---
export async function fetchIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// --- Wastage Events ---
export async function fetchWastageEvents() {
  const { data, error } = await supabase
    .from('wastage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function insertWastageEvent(event: Database['public']['Tables']['wastage']['Insert']) {
  const { data, error } = await supabase
    .from('wastage')
    .insert(event)
    .select()
  if (error) throw error
  return data
} 