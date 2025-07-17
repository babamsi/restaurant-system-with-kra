import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"
const ORGN_NAT_CD = "KE"
const ITEM_TY_CD = "2"
const PKG_UNIT_CD = "NT"
const TAX_TY_CD = "B"

// KRA unit code mapping
const KRA_UNIT_MAP: Record<string, string> = {
  'bag': 'BG',
  'box': 'BOX',
  'can': 'CA',
  'dozen': 'DZ',
  'gram': 'GRM',
  'g': 'GRM',
  'kg': 'KG',
  'kilogram': 'KG',
  'kilo gramme': 'KG',
  'litre': 'L',
  'liter': 'L',
  'l': 'L',
  'milligram': 'MGM',
  'mg': 'MGM',
  'packet': 'PA',
  'set': 'SET',
  'piece': 'U',
  'pieces': 'U',
  'item': 'U',
  'number': 'U',
  'pcs': 'U',
  'u': 'U',
}

function padNumber(num: number, size: number) {
  let s = num + ""
  while (s.length < size) s = "0" + s
  return s
}

async function getNextItemCd() {
  // Find the highest itemCd in both ingredients and recipes
  let maxNum = 0
  // Check ingredients
  const { data: ingData } = await supabase
    .from('ingredients')
    .select('itemCd')
    .not('itemCd', 'is', null)
    .order('itemCd', { ascending: false })
    .limit(1)
  if (ingData && ingData.length > 0) {
    const lastCd = ingData[0].itemCd
    const match = lastCd.match(/KE2NTBA(\d{7})/)
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10))
    }
  }
  // Check recipes
  const { data: recData } = await supabase
    .from('recipes')
    .select('itemCd')
    .not('itemCd', 'is', null)
    .order('itemCd', { ascending: false })
    .limit(1)
  if (recData && recData.length > 0) {
    const lastCd = recData[0].itemCd
    const match = lastCd.match(/KE2NTBA(\d{7})/)
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10))
    }
  }
  return `KE2NTBA${padNumber(maxNum + 1, 7)}`
}

function generateItemClsCd() {
  // 10-digit unique number (timestamp-based)
  return (Date.now() % 1e10).toString().padStart(10, '0')
}

function mapToKRAUnit(unit: string): string {
  if (!unit) return 'U'
  const normalized = unit.trim().toLowerCase()
  return KRA_UNIT_MAP[normalized] || 'U'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, price, description, itemCd: existingItemCd, unit } = body
    if (!id || !name || !price || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use existing itemCd if present (for updates), else generate new
    let itemCd = existingItemCd
    if (!itemCd) {
      itemCd = await getNextItemCd()
    }
    const itemClsCd = generateItemClsCd()

    // Truncate modrId/regrId to 20 chars
    const safeName = name.length > 20 ? name.slice(0, 20) : name
    const kraPayload = {
      tin: TIN,
      bhfId: BHF_ID,
      itemCd,
      itemClsCd,
      itemTyCd: ITEM_TY_CD,
      itemNm: name,
      orgnNatCd: ORGN_NAT_CD,
      pkgUnitCd: PKG_UNIT_CD,
      qtyUnitCd: mapToKRAUnit(unit),
      taxTyCd: TAX_TY_CD,
      dftPrc: price,
      isrcAplcbYn: "N",
      useYn: "Y",
      regrId: safeName,
      regrNm: safeName,
      modrId: safeName,
      modrNm: safeName,
    }

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'tin': TIN, 'bhfId': BHF_ID, 'cmcKey': "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"  },
      body: JSON.stringify(kraPayload),
    })
    const kraData = await kraRes.json()

    if (kraData.resultCd !== "000") {
      // Mark as not KRA compliant
      await supabase.from('ingredients').update({ kra_status: 'error'}).eq('id', id)
      return NextResponse.json({ error: kraData.resultMsg || 'KRA registration failed', kraData }, { status: 400 })
    }

    // Update ingredient in Supabase
    await supabase.from('ingredients').update({ itemCd, itemClsCd, kra_status: 'ok'}).eq('id', id)

    return NextResponse.json({ success: true, itemCd, itemClsCd, kraData })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 