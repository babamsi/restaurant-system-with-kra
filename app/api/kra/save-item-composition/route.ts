import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemCd, cpstItemCd, cpstQty } = body

    // Validate required fields
    if (!itemCd || !cpstItemCd || !cpstQty) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: itemCd, cpstItemCd, cpstQty' 
        },
        { status: 400 }
      )
    }

    // Validate quantity is positive
    if (parseFloat(cpstQty) <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Quantity must be greater than 0' 
        },
        { status: 400 }
      )
    }

    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json(
        { 
          success: false, 
          error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
        },
        { status: 500 }
      )
    }

    // Prepare KRA composition payload
    const kraPayload = {
      itemCd: itemCd,
      cpstItemCd: cpstItemCd,
      cpstQty: parseFloat(cpstQty),
      regrId: "11999",
      regrNm: "TestVSCU"
    }

    console.log('KRA Composition Payload:', kraPayload)

    // Call KRA API to save item composition
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveItemComposition', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Composition Response:', kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json(
        { 
          success: false, 
          error: kraData.resultMsg || 'KRA composition registration failed',
          kraResponse: kraData
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Item composition successfully sent to KRA',
      kraResponse: kraData,
      payload: kraPayload
    })

  } catch (error: any) {
    console.error('Error in save-item-composition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 