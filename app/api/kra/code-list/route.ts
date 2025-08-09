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

    const payload = {
      lastReqDt
    }

    console.log("KRA Code List Payload:", payload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectCodeList', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Code List Response:", kraData)

    return NextResponse.json({
      resultCd: kraData.resultCd,
      resultMsg: kraData.resultMsg,
      data: {
        clsList: kraData.data?.clsList || []
      }
    })

  } catch (error: any) {
    console.error('KRA Code List Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 