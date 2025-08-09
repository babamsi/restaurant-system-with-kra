import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

function formatDateTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

// Generate item classification code based on category
function generateItemClsCd(category: string): string {
  const CATEGORY_MAP: Record<string, string> = {
    'meats': '73131600',
    'drinks': '50200000', 
    'vegetables': '50400000',
    'package': '24120000',
    'dairy': '50130000',
    'grains': '50130000', // Same as dairy as per your mapping
    'oil': '50150000',
    'fruits': '50300000',
    'canned': '50460000',
    'nuts': '50100000'
  }
  
  const normalizedCategory = category.toLowerCase().trim()
  return CATEGORY_MAP[normalizedCategory] || '5059690800' // Default for unknown categories
}

// Register ingredient with KRA if not already registered
async function registerIngredientIfNeeded(ingredient: any) {
  console.log('Registering ingredient:', ingredient)
  
  // First, fetch the ingredient data from the database to get its current KRA status
  const { data: ingredientData, error: fetchError } = await supabase
    .from('ingredients')
    .select('id, name, itemCd, itemClsCd, cost_per_unit, unit, category')
    .eq('id', ingredient.component_id)
    .single()

  if (fetchError) {
    console.error('Error fetching ingredient data:', fetchError)
    return { success: false, error: `Failed to fetch ingredient data: ${fetchError.message}` }
  }

  if (!ingredientData) {
    return { success: false, error: `Ingredient not found in database: ${ingredient.name}` }
  }

  console.log('Fetched ingredient data:', ingredientData)

  // Check if ingredient already has KRA codes
  if (ingredientData.itemCd && ingredientData.itemClsCd) {
    console.log('Ingredient already registered with KRA:', ingredientData.itemCd)
    return { 
      success: true, 
      itemCd: ingredientData.itemCd, 
      itemClsCd: ingredientData.itemClsCd 
    }
  }

  console.log('Ingredient needs KRA registration:', ingredientData.name)

  try {
    const res = await fetch('/api/kra/register-ingredient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: ingredientData.id,
        name: ingredientData.name,
        price: ingredientData.cost_per_unit || 0,
        // description: ingredientData.description || ingredientData.name,
        itemCd: ingredientData.itemCd,
        unit: ingredientData.unit,
        category: ingredientData.category,
      }),
    })
    
    const result = await res.json()
    
    if (result.success) {
      console.log('Successfully registered ingredient with KRA:', result.itemCd)
      // Update the ingredient in database with KRA codes
      await supabase
        .from('ingredients')
        .update({
          itemCd: result.itemCd,
          itemClsCd: result.itemClsCd,
          kra_status: 'ok'
        })
        .eq('id', ingredientData.id)
      
      return { success: true, itemCd: result.itemCd, itemClsCd: result.itemClsCd }
    } else {
      console.error('Failed to register ingredient with KRA:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error('Error registering ingredient:', error)
    return { success: false, error: error.message }
  }
}

// Generate unique item composition number
async function getNextItemCompositionNo() {
  const { data, error } = await supabase
    .from('kra_transactions')
    .select('kra_invoice_no')
    .eq('transaction_type', 'item_composition')
    .not('kra_invoice_no', 'is', null)
    .order('kra_invoice_no', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastComposition = data[0].kra_invoice_no
    if (lastComposition) {
      next = parseInt(lastComposition, 10) + 1
    }
  }
  return next
}

export async function POST(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()

    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    const { recipeId } = await req.json()

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 })
    }

    // Get recipe details
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Get recipe components
    const { data: components, error: componentsError } = await supabase
      .from('recipe_components')
      .select('*, ingredient:ingredients(*), batch:batches(*)')
      .eq('recipe_id', recipeId)

    if (componentsError) {
      return NextResponse.json({ error: 'Failed to fetch recipe components' }, { status: 500 })
    }

    if (!components || components.length === 0) {
      return NextResponse.json({ error: 'Recipe has no components' }, { status: 400 })
    }

    // Generate item composition data
    const compositionList = components.map((component, index) => {
      const itemData = component.component_type === 'ingredient' 
        ? component.ingredient 
        : component.batch

      return {
        itemSeq: index + 1,
        itemCd: itemData?.itemCd || 'KE2NTU0000001',
        itemClsCd: itemData?.itemClsCd || '5059690800',
        itemNm: itemData?.name || 'Unknown',
        qty: component.quantity,
        unit: component.unit || itemData?.unit || 'U'
      }
    })

    const now = new Date()
    const cfmDt = formatDateTime(now)

    const payload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      cmcKey: headers.cmcKey,
      itemCd: recipe.itemCd || 'KE2NTU0000001',
      itemClsCd: recipe.itemClsCd || '5059690800',
      itemNm: recipe.name,
      compositionList,
      regrId: 'Recipe Manager',
      regrNm: 'Recipe Manager',
      modrId: 'Recipe Manager',
      modrNm: 'Recipe Manager',
      cfmDt
    }

    console.log("Item Composition Payload:", payload)

    // Call KRA API with dynamic headers
        const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItemComposition', {
          method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
        })
        
        const kraData = await kraRes.json()
    console.log("KRA Item Composition Response:", kraData)

        if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA item composition failed', 
        kraData 
      }, { status: 400 })
    }

    // Update recipe with KRA response
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        kra_composition_status: 'success',
        kra_composition_response: kraData,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)

    if (updateError) {
      console.error('Error updating recipe with KRA response:', updateError)
    }

      return NextResponse.json({ 
        success: true, 
      kraData,
      message: 'Item composition sent to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Item Composition Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 