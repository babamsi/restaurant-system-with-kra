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

    const { stockInData } = await req.json()

    if (!stockInData) {
      return NextResponse.json({ error: 'Stock-in data is required' }, { status: 400 })
    }

    console.log("KRA Stock-in Payload:", stockInData)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertStockIO', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(stockInData),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Stock-in Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA stock-in failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Stock-in sent to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Stock-in Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 