import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

const ORGN_NAT_CD = "KE"
const ITEM_TY_CD = "2"
const PKG_UNIT_CD = "NT"
const TAX_TY_CD = "B"

// KRA Unit Codes mapping for validation
const KRA_UNIT_CODES = {
  '4B': { name: 'Pair', description: 'Pair' },
  'AV': { name: 'Cap', description: 'Cap' },
  'BA': { name: 'Barrel', description: 'Barrel' },
  'BE': { name: 'bundle', description: 'bundle' },
  'BG': { name: 'bag', description: 'bag' },
  'BL': { name: 'block', description: 'block' },
  'BLL': { name: 'BLL Barrel', description: 'BLL Barrel (petroleum) (158,987 dm3)' },
  'BX': { name: 'box', description: 'box' },
  'CA': { name: 'Can', description: 'Can' },
  'CEL': { name: 'Cell', description: 'Cell' },
  'CMT': { name: 'centimetre', description: 'centimetre' },
  'CR': { name: 'CARAT', description: 'CARAT' },
  'DR': { name: 'Drum', description: 'Drum' },
  'DZ': { name: 'Dozen', description: 'Dozen' },
  'GLL': { name: 'Gallon', description: 'Gallon' },
  'GRM': { name: 'Gram', description: 'Gram' },
  'GRO': { name: 'Gross', description: 'Gross' },
  'KG': { name: 'Kilo-Gramme', description: 'Kilo-Gramme' },
  'KTM': { name: 'kilometre', description: 'kilometre' },
  'KWT': { name: 'kilowatt', description: 'kilowatt' },
  'L': { name: 'Litre', description: 'Litre' },
  'LBR': { name: 'pound', description: 'pound' },
  'LK': { name: 'link', description: 'link' },
  'LTR': { name: 'Litre', description: 'Litre' },
  'M': { name: 'Metre', description: 'Metre' },
  'M2': { name: 'Square Metre', description: 'Square Metre' },
  'M3': { name: 'Cubic Metre', description: 'Cubic Metre' },
  'MGM': { name: 'milligram', description: 'milligram' },
  'MTR': { name: 'metre', description: 'metre' },
  'MWT': { name: 'megawatt hour', description: 'megawatt hour (1000 kW.h)' },
  'NO': { name: 'Number', description: 'Number' },
  'NX': { name: 'part per thousand', description: 'part per thousand' },
  'PA': { name: 'packet', description: 'packet' },
  'PG': { name: 'plate', description: 'plate' },
  'PR': { name: 'pair', description: 'pair' },
  'RL': { name: 'reel', description: 'reel' },
  'RO': { name: 'roll', description: 'roll' },
  'SET': { name: 'set', description: 'set' },
  'ST': { name: 'sheet', description: 'sheet' },
  'TNE': { name: 'tonne', description: 'tonne (metric ton)' },
  'TU': { name: 'tube', description: 'tube' },
  'U': { name: 'Pieces/item', description: 'Pieces/item [Number]' },
  'YRD': { name: 'yard', description: 'yard' }
}

function padNumber(num: number, size: number) {
  let s = num + ""
  while (s.length < size) s = "0" + s
  return s
}

async function getNextItemCd(unit: string) {
  // Map unit to KRA unit code for the item code
  const unitCode = mapToKRAUnit(unit)
  
  console.log(`Getting next item code for unit: "${unit}" → unitCode: "${unitCode}"`)
  
  // Find the highest itemCd for this specific unit type
  let maxNum = 0
  
  // Check ingredients table for existing item codes with this unit pattern
  const { data: ingData } = await supabase
    .from('ingredients')
    .select('itemCd')
    .not('itemCd', 'is', null)
    .like('itemCd', `KE2NT${unitCode}%`)
    .order('itemCd', { ascending: false })
    .limit(20) // Get more results to ensure we find the highest

  if (ingData && ingData.length > 0) {
    console.log(`Found ${ingData.length} existing ingredients with unit code ${unitCode}:`, ingData.map(item => item.itemCd))
    
    // Find the highest number in the pattern KE2NT + unitCode + 7 digits
    const pattern = new RegExp(`KE2NT${unitCode}(\\d{7})`)
    ingData.forEach(item => {
      const match = item.itemCd.match(pattern)
      if (match) {
        const num = parseInt(match[1], 10)
        maxNum = Math.max(maxNum, num)
        console.log(`Found existing code: ${item.itemCd}, extracted number: ${num}, current max: ${maxNum}`)
      }
    })
  }

  // Check recipes table for existing item codes with this unit pattern
  const { data: recData } = await supabase
    .from('recipes')
    .select('itemCd')
    .not('itemCd', 'is', null)
    .like('itemCd', `KE2NT${unitCode}%`)
    .order('itemCd', { ascending: false })
    .limit(20) // Get more results to ensure we find the highest

  if (recData && recData.length > 0) {
    console.log(`Found ${recData.length} existing recipes with unit code ${unitCode}:`, recData.map(item => item.itemCd))
    
    // Find the highest number in the pattern KE2NT + unitCode + 7 digits
    const pattern = new RegExp(`KE2NT${unitCode}(\\d{7})`)
    recData.forEach(item => {
      const match = item.itemCd.match(pattern)
    if (match) {
        const num = parseInt(match[1], 10)
        maxNum = Math.max(maxNum, num)
        console.log(`Found existing code: ${item.itemCd}, extracted number: ${num}, current max: ${maxNum}`)
      }
    })
  }

  // Generate next item code with incremented number
  const nextNum = maxNum + 1
  const itemCd = `KE2NT${unitCode}${padNumber(nextNum, 7)}`
  
  console.log(`Generated item code: ${itemCd} for unit: ${unit} (unitCode: ${unitCode}, maxNum: ${maxNum}, nextNum: ${nextNum})`)
  
  return itemCd
}

// Map unit to KRA unit code
function mapToKRAUnit(unit: string): string {
  const KRA_UNIT_MAP: Record<string, string> = {
    // Common unit mappings
    'bag': 'BG', 'box': 'BX', 'can': 'CA', 'dozen': 'DZ', 'gram': 'GRM', 'g': 'GRM', 
    'kg': 'KG', 'kilogram': 'KG', 'kilo gramme': 'KG', 'kilogramme': 'KG',
    'litre': 'L', 'liter': 'L', 'l': 'L', 
    'milligram': 'MGM', 'mg': 'MGM', 'packet': 'PA', 'set': 'SET', 'piece': 'U', 
    'pieces': 'U', 'item': 'U', 'number': 'U', 'pcs': 'U', 'u': 'U',
    'pair': '4B', 'cap': 'AV', 'barrel': 'BA', 'bundle': 'BE', 'block': 'BL', 'bll barrel': 'BLL',
    'cell': 'CEL', 'centimetre': 'CMT', 'carat': 'CR', 'drum': 'DR', 'gallon': 'GLL', 'gross': 'GRO',
    'kilometre': 'KTM', 'kilowatt': 'KWT', 'pound': 'LBR', 'link': 'LK', 'metre': 'M', 'm': 'M',
    'square metre': 'M2', 'cubic metre': 'M3', 'megawatt hour': 'MWT', 'part per thousand': 'NX',
    'plate': 'PG', 'reel': 'RL', 'roll': 'RO', 'sheet': 'ST', 'tonne': 'TNE', 'tube': 'TU', 'yard': 'YRD',
    
    // Direct KRA code mappings
    '4B': '4B', 'AV': 'AV', 'BA': 'BA', 'BE': 'BE', 'BG': 'BG', 'BL': 'BL', 'BLL': 'BLL',
    'BX': 'BX', 'CA': 'CA', 'CEL': 'CEL', 'CMT': 'CMT', 'CR': 'CR', 'DR': 'DR', 'DZ': 'DZ',
    'GLL': 'GLL', 'GRM': 'GRM', 'GRO': 'GRO', 'KG': 'KG', 'KTM': 'KTM', 'KWT': 'KWT',
    'L': 'L', 'LBR': 'LBR', 'LK': 'LK', 'LTR': 'LTR', 'M': 'M', 'M2': 'M2', 'M3': 'M3',
    'MGM': 'MGM', 'MTR': 'MTR', 'MWT': 'MWT', 'NO': 'NO', 'NX': 'NX', 'PA': 'PA',
    'PG': 'PG', 'PR': 'PR', 'RL': 'RL', 'RO': 'RO', 'SET': 'SET', 'ST': 'ST',
    'TNE': 'TNE', 'TU': 'TU', 'U': 'U', 'YRD': 'YRD'
  }
  
  if (!unit) {
    console.log(`No unit provided, using default 'U'`)
    return 'U'
  }
  
  const normalized = unit.trim().toLowerCase()
  const mappedCode = KRA_UNIT_MAP[normalized]
  
  console.log(`Mapping unit "${unit}" (normalized: "${normalized}") to KRA code: "${mappedCode}"`)
  
  if (!mappedCode) {
    console.log(`No mapping found for unit "${unit}", using default 'U'`)
    return 'U'
  }
  
  return mappedCode
}

// Generate item classification code based on category
function generateItemClsCd(category: string): string {
  const CATEGORY_MAP: Record<string, string> = {
    'meats': '73131600',
    'eggs': '50131600',
    'beverages': '50200000', 
    'vegetables': '50400000',
    'package': '24120000',
    'alcohol': '5020220050',
    'tissue_paper': '14121600',
    'label': '55121600',
    'dairy': '50130000',
    'grains': '50130000', // Same as dairy as per your mapping
    'oil': '50150000',
    'fruits': '50300000',
    'canned': '50460000',
    'nuts': '50100000',
    'spices': '50400000',
    'cans': '50460000',
    'oils': '50150000',
    'packaging': '24120000',
    'sauces': '50400000',
    'milk': '99012015',
    'bread': '99012013',
    'flour': '99012022',
    // Additional inventory categories
    'condiments': '50400000',
    'herbs': '50400000',
    'seasonings': '50400000',
    'pasta': '50130000',
    'rice': '50130000',
    'beans': '50130000',
    'legumes': '50130000',
    'seafood': '73131600',
    'poultry': '73131600',
    'beef': '73131600',
    'pork': '73131600',
    'lamb': '73131600',
    'fish': '73131600',
    'cheese': '50130000',
    'yogurt': '50130000',
    'butter': '50130000',
    'cream': '50130000',
    'juice': '50200000',
    'soda': '50200000',
    'coffee': '50200000',
    'tea': '50200000',
    'water': '50200000',
    'wine': '5020220050',
    'beer': '5020220050',
    'spirits': '5020220050',
    'tomatoes': '50400000',
    'onions': '50400000',
    'potatoes': '50400000',
    'carrots': '50400000',
    'lettuce': '50400000',
    'cabbage': '50400000',
    'spinach': '50400000',
    'kale': '50400000',
    'apples': '50300000',
    'bananas': '50300000',
    'oranges': '50300000',
    'lemons': '50300000',
    'limes': '50300000',
    'grapes': '50300000',
    'strawberries': '50300000',
    'peanuts': '50100000',
    'almonds': '50100000',
    'walnuts': '50100000',
    'cashews': '50100000',
    'olive_oil': '50150000',
    'vegetable_oil': '50150000',
    'coconut_oil': '50150000',
    'sunflower_oil': '50150000',
    'salt': '50400000',
    'pepper': '50400000',
    'garlic': '50400000',
    'ginger': '50400000',
    'cinnamon': '50400000',
    'nutmeg': '50400000',
    'oregano': '50400000',
    'basil': '50400000',
    'thyme': '50400000',
    'rosemary': '50400000',
    'paprika': '50400000',
    'curry': '50400000',
    'chili': '50400000',
    'vinegar': '50400000',
    'soy_sauce': '50400000',
    'ketchup': '50400000',
    'mustard': '50400000',
    'mayonnaise': '50400000',
    'honey': '50130000',
    'sugar': '50130000',
    'brown_sugar': '50130000',
    'powdered_sugar': '50130000',
    'chocolate': '50130000',
    'cocoa': '50130000',
    'vanilla': '50400000',
    'baking_soda': '50400000',
    'baking_powder': '50400000',
    'yeast': '50130000',
    'cornstarch': '50130000',
    'gelatin': '50130000',
    'food_coloring': '50400000',
    'plastic_wrap': '24120000',
    'aluminum_foil': '24120000',
    'parchment_paper': '24120000',
    'ziploc_bags': '24120000',
    'paper_towels': '14121600',
    'toilet_paper': '14121600',
    'napkins': '14121600',
    'disposable_gloves': '24120000',
    'cleaning_supplies': '24120000',
    'detergent': '24120000',
    'dish_soap': '24120000',
    'trash_bags': '24120000',
    'freezer_bags': '24120000',
    'storage_containers': '24120000',
    'cooking_spray': '50150000',
    'non_stick_spray': '50150000'
  }
  
  const normalizedCategory = category.toLowerCase().trim()
  return CATEGORY_MAP[normalizedCategory] || '5059690800' // Default for unknown categories
}

// Generate tax type code based on item classification code
function generateTaxTyCd(itemClsCd: string): string {
  const TAX_TYPE_MAP: Record<string, string> = {
    '73131600': 'B', // meats, seafood, poultry, beef, pork, lamb, fish
    '50131600': 'B', // eggs
    '50200000': 'B', // beverages, juice, soda, coffee, tea, water
    '50400000': 'B', // vegetables, condiments, herbs, seasonings, tomatoes, onions, potatoes, carrots, lettuce, cabbage, spinach, kale, salt, pepper, garlic, ginger, cinnamon, nutmeg, oregano, basil, thyme, rosemary, paprika, curry, chili, vinegar, soy_sauce, ketchup, mustard, mayonnaise, vanilla, baking_soda, baking_powder, food_coloring
    '24120000': 'B', // package, packaging, plastic_wrap, aluminum_foil, parchment_paper, ziploc_bags, disposable_gloves, cleaning_supplies, detergent, dish_soap, trash_bags, freezer_bags, storage_containers
    '5020220050': 'B', // alcohol, wine, beer, spirits
    '14121600': 'B', // tissue_paper, paper_towels, toilet_paper, napkins
    '55121600': 'B', // label
    '50130000': 'B', // dairy, grains, pasta, rice, beans, legumes, cheese, yogurt, butter, cream, honey, sugar, brown_sugar, powdered_sugar, chocolate, cocoa, yeast, cornstarch, gelatin
    '50150000': 'B', // oil, oils, olive_oil, vegetable_oil, coconut_oil, sunflower_oil, cooking_spray, non_stick_spray
    '50300000': 'B', // fruits, apples, bananas, oranges, lemons, limes, grapes, strawberries
    '50460000': 'B', // canned, cans
    '50100000': 'B', // nuts, peanuts, almonds, walnuts, cashews
    '99012015': 'B', // milk
    '99012013': 'B', // bread
    '99012022': 'B'  // flour
  }
  
  return TAX_TYPE_MAP[itemClsCd] || 'B' // Default to 'B' for unknown categories
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

    const body = await req.json()
    const { ingredientId, name, category, unit, cost_per_unit, description } = body

    console.log(`=== KRA Item Registration Request ===`)
    console.log(`Ingredient ID: ${ingredientId}`)
    console.log(`Name: ${name}`)
    console.log(`Category: ${category}`)
    console.log(`Unit: "${unit}"`)
    console.log(`Cost per unit: ${cost_per_unit}`)
    console.log(`Description: ${description}`)

    if (!ingredientId || !name || !category || !unit) {
      return NextResponse.json({ 
        error: 'Missing required fields: ingredientId, name, category, unit' 
      }, { status: 400 })
    }

    // Validate unit code
    if (!KRA_UNIT_CODES[unit as keyof typeof KRA_UNIT_CODES]) {
      return NextResponse.json({ 
        error: `Invalid unit code: ${unit}. Please select a valid KRA unit code.` 
      }, { status: 400 })
    }

    console.log(`Registering ingredient: ${name} (ID: ${ingredientId}) with unit: ${unit}`)

    // Generate KRA codes using the working approach
    const itemCd = await getNextItemCd(unit)
    const itemClsCd = generateItemClsCd(category)
    const taxTyCd = generateTaxTyCd(itemClsCd)

    console.log(`Generated codes - itemCd: ${itemCd}, itemClsCd: ${itemClsCd}, taxTyCd: ${taxTyCd}`)

    // Truncate modrId/regrId to 20 chars
    const safeName = name.length > 20 ? name.slice(0, 20) : name

    // Prepare KRA payload using the working format
    const kraPayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      itemCd,
      itemClsCd,
      itemTyCd: ITEM_TY_CD,
      itemNm: name,
      orgnNatCd: ORGN_NAT_CD,
      pkgUnitCd: PKG_UNIT_CD,
      qtyUnitCd: mapToKRAUnit(unit),
      taxTyCd: taxTyCd, // Use generated tax type code
      dftPrc: cost_per_unit,
      isrcAplcbYn: "N",
      useYn: "Y",
      regrId: safeName,
      regrNm: safeName,
      modrId: safeName,
      modrNm: safeName,
    }

    console.log("KRA Item Registration Payload:", kraPayload)

    // Call KRA API using the working endpoint with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItem', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Item Registration Response:", kraData)

    if (kraData.resultCd !== "000") {
      console.log(`KRA registration failed for ingredient ${ingredientId}:`, kraData.resultMsg)
      
      // Update ingredient with KRA error but still save the generated codes
      console.log(`Updating ingredient ${ingredientId} with error status but saving codes: itemCd=${itemCd}, itemClsCd=${itemClsCd}, taxTyCd=${taxTyCd}`)
      
      const { data: updateData, error: updateError } = await supabase
        .from('ingredients')
        .update({
          itemCd: itemCd,
          itemClsCd: itemClsCd,
          taxTyCd: taxTyCd, // Include tax type code
          kra_status: 'error',
          kra_error: kraData.resultMsg || 'KRA registration failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ingredientId)
        .select()

      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json({ 
          error: `Database update failed: ${updateError.message}`, 
          kraData,
          itemCd,
          itemClsCd,
          taxTyCd
        }, { status: 500 })
      }

      console.log(`Updated ingredient ${ingredientId} with error status. Updated rows:`, updateData)

      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA registration failed', 
        kraData,
        itemCd,
        itemClsCd,
        taxTyCd
      }, { status: 400 })
    }

    console.log(`KRA registration successful for ingredient ${ingredientId}`)

    // KRA registration successful - update ingredient with KRA codes
    console.log(`Updating ingredient ${ingredientId} with codes: itemCd=${itemCd}, itemClsCd=${itemClsCd}, taxTyCd=${taxTyCd}`)
    
    const { data: updateData, error: updateError } = await supabase
      .from('ingredients')
      .update({
        itemCd: itemCd,
        itemClsCd: itemClsCd,
        taxTyCd: taxTyCd, // Include tax type code
        kra_status: 'ok',
        kra_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ingredientId)
      .select()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: `Database update failed: ${updateError.message}`, 
        kraData,
        itemCd,
        itemClsCd,
        taxTyCd
      }, { status: 500 })
    }

    console.log(`Successfully updated ingredient ${ingredientId} with KRA codes. Updated rows:`, updateData)

    return NextResponse.json({ 
      success: true, 
      kraData,
      itemCd,
      itemClsCd,
      taxTyCd,
      message: 'Ingredient successfully registered with KRA'
    })

  } catch (error: any) {
    console.error('KRA Item Registration Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 