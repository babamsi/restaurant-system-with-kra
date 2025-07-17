import { NextRequest, NextResponse } from 'next/server'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log(body)
    // body should be the full KRA /insertStockIO payload
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertStockIO', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', tin: TIN, bhfId: BHF_ID, cmcKey: CMC_KEY },
      body: JSON.stringify(body),
    })
    const kraData = await kraRes.json()
    if (kraData.resultCd !== "000") {
      return NextResponse.json({ error: kraData.resultMsg || 'KRA stock-in failed', kraData }, { status: 400 })
    }
    return NextResponse.json({ success: true, kraData })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 