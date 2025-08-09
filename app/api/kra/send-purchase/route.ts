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

    const { purchaseData } = await req.json()

    if (!purchaseData) {
      return NextResponse.json({ error: 'Purchase data is required' }, { status: 400 })
    }

    console.log("KRA Send Purchase Payload:", JSON.stringify(purchaseData, null, 2))

    // Call KRA API to send purchase
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertTrnsPurchase', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(purchaseData),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Send Purchase Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA purchase submission failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Purchase sent to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Send Purchase Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 