import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getKRAHeaders } from '@/lib/kra-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// KRA Unit Codes mapping
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

// Category mapping for test items
const CATEGORY_MAP: Record<string, string> = {
  'Food & Beverages': '73131600',
  'Electronics': '50131600',
  'Clothing': '50200000',
  'Furniture': '50400000',
  'Automotive': '24120000',
  'Medical Supplies': '5020220050',
  'Office Supplies': '14121600',
  'Sports Equipment': '55121600',
  'Home & Garden': '50130000',
  'Toys & Games': '50150000',
  'Books & Media': '50300000',
  'Jewelry': '50460000',
  'Pet Supplies': '50100000',
  'Services': '99012015',
  'Consulting': '99012013',
  'Maintenance': '99012022'
}

// Tax type mapping based on item classification
const TAX_TYPE_MAP: Record<string, string> = {
  '73131600': 'B', // Food & Beverages - Standard VAT
  '50131600': 'B', // Electronics - Standard VAT
  '50200000': 'B', // Clothing - Standard VAT
  '50400000': 'B', // Furniture - Standard VAT
  '24120000': 'B', // Automotive - Standard VAT
  '5020220050': 'B', // Medical Supplies - Standard VAT
  '14121600': 'B', // Office Supplies - Standard VAT
  '55121600': 'B', // Sports Equipment - Standard VAT
  '50130000': 'B', // Home & Garden - Standard VAT
  '50150000': 'B', // Toys & Games - Standard VAT
  '50300000': 'B', // Books & Media - Standard VAT
  '50460000': 'B', // Jewelry - Standard VAT
  '50100000': 'B', // Pet Supplies - Standard VAT
  '99012015': 'A', // Services - Exempt
  '99012013': 'A', // Consulting - Exempt
  '99012022': 'A'  // Maintenance - Exempt
}

// Generate KRA item classification code based on category
function generateItemClsCd(category: string): string {
  return CATEGORY_MAP[category] || '73131600' // Default to Food & Beverages
}

// Generate tax type code based on item classification
function generateTaxTyCd(itemClsCd: string): string {
  return TAX_TYPE_MAP[itemClsCd] || 'B' // Default to Standard VAT
}

// Map unit to KRA unit code
function mapToKRAUnit(unit: string): string {
  const unitUpper = unit.toUpperCase()
  
  // Direct matches
  if (KRA_UNIT_CODES[unitUpper as keyof typeof KRA_UNIT_CODES]) {
    return unitUpper
  }
  
  // Common variations
  const unitVariations: Record<string, string> = {
    'KG': 'KG',
    'KGS': 'KG',
    'KILOGRAM': 'KG',
    'KILOGRAMS': 'KG',
    'GRAM': 'GRM',
    'GRAMS': 'GRM',
    'G': 'GRM',
    'LITRE': 'L',
    'LITRES': 'L',
    'LITER': 'L',
    'LITERS': 'L',
    'L': 'L',
    'PIECE': 'U',
    'PIECES': 'U',
    'PCS': 'U',
    'PC': 'U',
    'U': 'U',
    'UNIT': 'U',
    'UNITS': 'U',
    'BAG': 'BG',
    'BAGS': 'BG',
    'BOX': 'BX',
    'BOXES': 'BX',
    'CAN': 'CA',
    'CANS': 'CA',
    'BOTTLE': 'NO',
    'BOTTLES': 'NO',
    'PAIR': 'PR',
    'PAIRS': 'PR',
    'SET': 'SET',
    'SETS': 'SET',
    'METER': 'M',
    'METERS': 'M',
    'M': 'M',
    'METRE': 'M',
    'METRES': 'M'
  }
  
  return unitVariations[unitUpper] || 'U' // Default to pieces
}

// Get next item code for the given unit
async function getNextItemCd(unitCode: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('item_cd')
      .like('item_cd', `KE2NT${unitCode}%`)
      .order('item_cd', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching existing item codes:', error)
      return `KE2NT${unitCode}0000001`
    }

    if (!data || data.length === 0) {
      return `KE2NT${unitCode}0000001`
    }

    // Find the highest number and increment
    let maxNumber = 0
    data.forEach(item => {
      if (item.item_cd) {
        const match = item.item_cd.match(new RegExp(`KE2NT${unitCode}(\\d+)`))
        if (match) {
          const number = parseInt(match[1])
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })

    const nextNumber = maxNumber + 1
    return `KE2NT${unitCode}${nextNumber.toString().padStart(7, '0')}`
  } catch (error) {
    console.error('Error in getNextItemCd:', error)
    return `KE2NT${unitCode}0000001`
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        success: false,
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    const body = await req.json()
    const { name, category, unit, cost_per_unit, description, itemClsCd, taxTyCd } = body

    // Validate required fields
    if (!name || !category || !unit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, category, and unit are required' 
      }, { status: 400 })
    }

    console.log('Registering test item with KRA:', { name, category, unit, itemClsCd, taxTyCd })

    // Map unit to KRA unit code
    const kraUnitCode = mapToKRAUnit(unit)
    console.log('Mapped unit to KRA code:', { unit, kraUnitCode })

    // Generate item classification code if not provided
    const finalItemClsCd = itemClsCd || generateItemClsCd(category)
    const finalTaxTyCd = taxTyCd || generateTaxTyCd(finalItemClsCd)

    // Generate unique item code
    const itemCd = await getNextItemCd(kraUnitCode)
    console.log('Generated item code:', itemCd)

    // Prepare KRA payload
    const kraPayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      itemCd: itemCd,
      itemClsCd: finalItemClsCd,
      itemNm: name,
      itemStdNm: name,
      pkgUnitCd: "NT",
      qtyUnitCd: kraUnitCode,
      taxTyCd: finalTaxTyCd,
      itemTyCd: "2",
      bcd: "",
      dftPrc: cost_per_unit || 0,
      useYn: "Y",
      isrcAplcbYn: "N", // Not applicable for source application
      modrId: "ADMIN", // Modifier ID
      orgnNatCd: "KE", // Organization nationality code (Kenya)
      regrNm: "Test User", // Registrar name (max 20 chars)
      regrId: "TEST001", // Registrar ID (max 20 chars)
      modrNm: "Test User" // Modifier name (max 20 chars)
    }

    console.log('KRA API Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItem', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA API Response:', kraData)

    // Update the test item with KRA response
    if (kraData.resultCd === '000') {
      // Find the test item by name and category to update it
      const { data: testItems, error: findError } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', name)
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (findError) {
        console.error('Error finding test item:', findError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to find test item for update' 
        }, { status: 500 })
      }

      if (testItems && testItems.length > 0) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ 
            item_cd: itemCd,
            item_cls_cd: finalItemClsCd,
            tax_ty_cd: finalTaxTyCd
          })
          .eq('id', testItems[0].id)
          .select()

        if (updateError) {
          console.error('Error updating test item:', updateError)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to update test item with KRA codes' 
          }, { status: 500 })
        }
      }

      return NextResponse.json({ 
        success: true, 
        itemCd: itemCd,
        itemClsCd: finalItemClsCd,
        taxTyCd: finalTaxTyCd,
        message: 'Test item registered successfully with KRA'
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: kraData.resultMsg || 'KRA registration failed',
        kraResponse: kraData
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('KRA Test Item Registration Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error during test item registration' 
    }, { status: 500 })
  }
} 