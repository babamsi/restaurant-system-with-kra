import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"
const ORGN_NAT_CD = "KE"
const ITEM_TY_CD = "2"
const PKG_UNIT_CD = "NT"
const QTY_UNIT_CD = "U"
const TAX_TY_CD = "B"
const REGR_ID = "Test"
const REGR_NM = "Test"
const MODR_ID = "Test"
const MODR_NM = "Test"

function padNumber(num: number, size: number) {
  let s = num + ""
  while (s.length < size) s = "0" + s
  return s
}

async function getNextItemCd() {
  // Find the highest itemCd in the DB
  const { data, error } = await supabase
    .from('recipes')
    .select('itemCd')
    .not('itemCd', 'is', null)
    .order('itemCd', { ascending: false })
    .limit(1)
  let nextNum = 1
  if (data && data.length > 0) {
    const lastCd = data[0].itemCd
    const match = lastCd.match(/KE2NTBA(\d{7})/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }
  return `KE2NTBA${padNumber(nextNum, 7)}`
}

function generateItemClsCd() {
  // 10-digit unique number (timestamp-based)
  return (Date.now() % 1e10).toString().padStart(10, '0')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, price, description, itemCd: existingItemCd } = body
    if (!id || !name || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use existing itemCd if present (for updates), else generate new
    let itemCd = existingItemCd
    if (!itemCd) {
      itemCd = await getNextItemCd()
    }
    const itemClsCd = generateItemClsCd()

    // Build KRA payload
    const kraPayload = {
      tin: TIN,
      bhfId: BHF_ID,
      itemCd,
      itemClsCd,
      itemTyCd: ITEM_TY_CD,
      itemNm: name,
      orgnNatCd: ORGN_NAT_CD,
      pkgUnitCd: PKG_UNIT_CD,
      qtyUnitCd: QTY_UNIT_CD,
      taxTyCd: TAX_TY_CD,
      dftPrc: price,
      isrcAplcbYn: "N",
      useYn: "Y",
      regrId: name,
      regrNm: name,
      modrId: name,
      modrNm: name,
    }

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'tin': TIN, 'bhfId': BHF_ID, 'cmcKey': "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"  },
      body: JSON.stringify(kraPayload),
    })
    const kraData = await kraRes.json()
    console.log('from kra registration: ', kraData)

    if (kraData.resultCd !== "000") {
      // Mark as not KRA compliant
      await supabase.from('recipes').update({ kra_status: 'error'}).eq('id', id)
      return NextResponse.json({ error: kraData.resultMsg || 'KRA registration failed', kraData }, { status: 400 })
    }

    // Update recipe in Supabase
    await supabase.from('recipes').update({ itemCd, itemClsCd, kra_status: 'ok'}).eq('id', id)

    return NextResponse.json({ success: true, itemCd, kraData })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 