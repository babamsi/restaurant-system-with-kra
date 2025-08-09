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

    const { branchData } = await req.json()

    if (!branchData) {
      return NextResponse.json({ error: 'Branch data is required' }, { status: 400 })
    }

    console.log("KRA Branch Registration Payload:", branchData)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveBhf', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(branchData),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Branch Registration Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA branch registration failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Branch registered with KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Branch Registration Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 