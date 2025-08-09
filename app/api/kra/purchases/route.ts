import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

export async function POST(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    const { lastReqDt } = await req.json()

    if (!lastReqDt) {
      return NextResponse.json({ error: 'lastReqDt is required' }, { status: 400 })
    }

    // Prepare payload for fetching purchases from KRA
    const kraPayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      lastReqDt: lastReqDt
    }

    console.log("KRA Fetch Purchases Payload:", JSON.stringify(kraPayload, null, 2))

    // Call KRA API to fetch purchases
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectTrnsPurchaseSalesList', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Fetch Purchases Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA fetch purchases failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      sales: kraData.data?.purchaseList || [],
      message: 'Purchases fetched from KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Fetch Purchases Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 