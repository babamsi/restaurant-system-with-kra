import { NextRequest, NextResponse } from 'next/server'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lastReqDt } = body

    if (!lastReqDt) {
      return NextResponse.json({ 
        error: 'Missing required field: lastReqDt' 
      }, { status: 400 })
    }

    console.log('Fetching KRA sales with lastReqDt:', lastReqDt)

    // Prepare KRA API payload
    const kraPayload = {
      lastReqDt: lastReqDt
    }

    console.log('KRA Sales List Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectTrnsPurchaseSalesList', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        tin: TIN, 
        bhfId: BHF_ID, 
        cmcKey: CMC_KEY 
      },
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Sales List Response:', kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA sales list fetch failed', 
        kraData
      }, { status: 400 })
    }

    // Extract sales from KRA response - note it's saleList, not purchaseList
    const sales = kraData.data?.saleList || []
    
    console.log(`Successfully fetched ${sales.length} sales from KRA`)

    return NextResponse.json({ 
      success: true, 
      sales, // Changed from purchases to sales
      totalCount: sales.length,
      lastReqDt,
      kraData
    })

  } catch (error: any) {
    console.error('KRA Sales List Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 