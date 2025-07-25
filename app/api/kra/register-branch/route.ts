import { NextRequest, NextResponse } from 'next/server'

const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tin, bhfId, dvcSrlNo } = body

    // Validate required fields
    if (!tin || !bhfId || !dvcSrlNo) {
      return NextResponse.json({ 
        error: 'Missing required fields: tin, bhfId, and dvcSrlNo are required' 
      }, { status: 400 })
    }

    console.log('Registering branch with KRA:', { tin, bhfId, dvcSrlNo })

    // Prepare KRA API payload
    const kraPayload = {
      tin: tin,
      bhfId: bhfId,
      dvcSrlNo: dvcSrlNo
    }

    console.log('KRA Branch Registration Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectInitOsdcInfo', {
      method: 'POST',
    //   headers: { 
    //     'Content-Type': 'application/json', 
    //     cmcKey: CMC_KEY 
    //   },
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Branch Registration Response:', kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA branch registration failed', 
        kraData
      }, { status: 400 })
    }

    console.log('Successfully registered branch with KRA')

    return NextResponse.json({ 
      success: true, 
      message: 'Branch registered successfully with KRA',
      kraData
    })

  } catch (error: any) {
    console.error('KRA Branch Registration Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error during branch registration' 
    }, { status: 500 })
  }
} 