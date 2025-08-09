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

    const { receiptData } = await req.json()

    if (!receiptData) {
      return NextResponse.json({ error: 'Receipt data is required' }, { status: 400 })
    }

    console.log("KRA Generate Receipt Payload:", receiptData)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/generateReceipt', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(receiptData),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Generate Receipt Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA receipt generation failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Receipt generated successfully'
    })

  } catch (error: any) {
    console.error('KRA Generate Receipt Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 