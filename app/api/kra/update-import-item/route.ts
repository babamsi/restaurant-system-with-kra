import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      taskCd, 
      dclDe, 
      itemSeq, 
      hsCd, 
      itemClsCd, 
      itemCd, 
      imptItemSttsCd, 
      remark, 
      modrNm, 
      modrId 
    } = body

    // Validate required fields
    const requiredFields = ['taskCd', 'dclDe', 'itemSeq', 'hsCd', 'itemClsCd', 'itemCd', 'imptItemSttsCd']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate date format (YYYYMMDD)
    if (dclDe && !/^\d{8}$/.test(dclDe)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'dclDe must be in YYYYMMDD format' 
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

    // Prepare KRA import item payload
    const kraPayload = {
      taskCd: taskCd,
      dclDe: dclDe,
      itemSeq: parseInt(itemSeq),
      hsCd: hsCd,
      itemClsCd: itemClsCd,
      itemCd: itemCd,
      imptItemSttsCd: imptItemSttsCd,
      remark: remark || "Imported item update",
      modrNm: modrNm || "TestVSCU",
      modrId: modrId || "11999"
    }

    console.log('KRA Import Item Payload:', kraPayload)

    // Call KRA API to update import item
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/updateImportItem', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Import Item Response:', kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json(
        { 
          success: false, 
          error: kraData.resultMsg || 'KRA import item update failed',
          kraResponse: kraData
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Import item successfully sent to KRA',
      kraResponse: kraData,
      payload: kraPayload
    })

  } catch (error: any) {
    console.error('Error in update-import-item:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 