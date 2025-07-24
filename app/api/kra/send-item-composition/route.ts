import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

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
        description: ingredientData.description || ingredientData.name,
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
    const body = await req.json()
    const { recipe_id, recipe_name, recipe_price, recipe_category, components, recipe_itemCd } = body

    if (!recipe_id || !recipe_name || !components || components.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipe_id, recipe_name, or components' 
      }, { status: 400 })
    }

    if (!recipe_itemCd) {
      return NextResponse.json({ 
        error: 'Recipe must be registered with KRA first. Please register the recipe item before sending composition.' 
      }, { status: 400 })
    }

    console.log('Processing item composition for recipe:', recipe_name, 'with itemCd:', recipe_itemCd)

    // Step 1: Register all ingredients with KRA if needed
    const registrationResults = []
    for (const component of components) {
      if (component.component_type === 'ingredient') {
        const result = await registerIngredientIfNeeded(component)
        registrationResults.push({
          component_id: component.component_id,
          component_name: component.name,
          success: result.success,
          itemCd: result.itemCd,
          itemClsCd: result.itemClsCd,
          error: result.error
        })
        
        if (!result.success) {
          return NextResponse.json({ 
            error: `Failed to register ingredient ${component.name}: ${result.error}` 
          }, { status: 400 })
        }
        
        // Update component with KRA codes from the database
        component.itemCd = result.itemCd
        component.itemClsCd = result.itemClsCd
        console.log(`Updated component ${component.name} with KRA codes:`, {
          itemCd: result.itemCd,
          itemClsCd: result.itemClsCd
        })
      }
    }

    // Step 2: Generate unique composition number
    const compositionNo = await getNextItemCompositionNo()

    // Step 3: Send each component composition to KRA
    const compositionResults = []
    
    for (const component of components) {
      if (component.component_type === 'ingredient') {
        // Validate component quantity
        if (typeof component.quantity !== 'number' || component.quantity <= 0) {
          return NextResponse.json({ 
            error: `Invalid quantity for ingredient ${component.name}: ${component.quantity}. Quantity must be a positive number.` 
          }, { status: 400 })
        }

        // Prepare KRA saveItemComposition payload
        const compositionPayload = {
          itemCd: recipe_itemCd, // Recipe's itemCd
          cpstItemCd: component.itemCd, // Component's itemCd (from ingredient table)
          cpstQty: component.quantity, // Use the actual quantity from the component
          regrId: 'Restaurant POS',
          regrNm: 'Restaurant POS'
        }

        console.log('KRA Item Composition Payload for component:', component.name, {
          itemCd: recipe_itemCd,
          cpstItemCd: component.itemCd, // This should be the ingredient's itemCd
          cpstQty: component.quantity, // This is the actual ingredient quantity
          unit: component.unit,
          regrId: 'Restaurant POS',
          regrNm: 'Restaurant POS'
        })

        // Validate that we have the ingredient's itemCd
        if (!component.itemCd) {
          console.error('Missing itemCd for component:', component.name)
          compositionResults.push({
            component_name: component.name,
            component_itemCd: 'MISSING',
            success: false,
            kraData: null,
            error: 'Missing ingredient itemCd - ingredient not properly registered with KRA'
          })
          continue
        }

        // Send to KRA API
        const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItemComposition', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            tin: TIN, 
            bhfId: BHF_ID, 
            cmcKey: CMC_KEY 
          },
          body: JSON.stringify(compositionPayload),
        })
        
        const kraData = await kraRes.json()
        console.log('KRA Item Composition Response for component:', component.name, kraData)

        compositionResults.push({
          component_name: component.name,
          component_itemCd: component.itemCd,
          success: kraData.resultCd === '000',
          kraData: kraData,
          error: kraData.resultCd !== '000' ? kraData.resultMsg : null
        })

        if (kraData.resultCd !== '000') {
          console.error('KRA composition failed for component:', component.name, kraData.resultMsg)
          // Continue with other components but log the error
        }
      }
    }

    // Step 4: Check if any compositions failed
    const failedCompositions = compositionResults.filter(result => !result.success)
    const successfulCompositions = compositionResults.filter(result => result.success)

    if (failedCompositions.length > 0) {
      console.warn('Some item compositions failed:', failedCompositions)
    }

    // Step 5: Log transaction in database
    const transactionData = {
      transaction_type: 'item_composition',
      kra_invoice_no: compositionNo,
      recipe_id: recipe_id,
      items_data: components,
      composition_results: compositionResults,
      total_components: components.length,
      successful_compositions: successfulCompositions.length,
      failed_compositions: failedCompositions.length,
      status: failedCompositions.length === 0 ? 'success' : 'partial_success',
      kra_response_data: compositionResults
    }

    const { error: dbError } = await supabase
      .from('kra_transactions')
      .insert(transactionData)

    if (dbError) {
      console.error('Database error logging transaction:', dbError)
    }

    // Step 6: Update recipe with KRA status
    const compositionStatus = failedCompositions.length === 0 ? 'ok' : 'partial_success'
    await supabase
      .from('recipes')
      .update({
        kra_composition_status: compositionStatus,
        kra_composition_no: compositionNo,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipe_id)

    // Step 7: Return response
    if (failedCompositions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        compositionNo,
        registrationResults,
        compositionResults,
        message: `Item composition successfully sent to KRA for all ${components.length} components`
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        compositionNo,
        registrationResults,
        compositionResults,
        message: `Item composition completed with ${successfulCompositions.length} successful and ${failedCompositions.length} failed components`,
        warnings: failedCompositions.map(f => `${f.component_name}: ${f.error}`)
      })
    }

  } catch (error: any) {
    console.error('KRA Item Composition Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 