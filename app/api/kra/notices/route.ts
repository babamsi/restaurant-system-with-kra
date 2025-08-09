import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

interface NoticeItem {
  noticeNo: number
  title: string
  cont: string
  dtlUrl: string
  regrNm: string
  regDt: string
}

interface NoticeListResponse {
  resultCd: string
  resultMsg: string
  resultDt: string
  data: {
    noticeList: NoticeItem[]
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    // Prepare payload for KRA notices API
    const kraPayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      lastReqDt: "20200218191141" // You might want to make this dynamic based on last request
    }

    console.log("KRA Notices Payload:", JSON.stringify(kraPayload, null, 2))

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectNoticeList', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData: NoticeListResponse = await kraRes.json()
    console.log("KRA Notices Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA notices fetch failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      notices: kraData.data?.noticeList || [],
      message: 'Notices fetched successfully'
    })

  } catch (error: any) {
    console.error('KRA Notices Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 