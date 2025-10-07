import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { lastReqDt?: string }
    const lastReqDt = body.lastReqDt || '20160523000000'

    const { success, headers, error } = await getKRAHeaders()
    if (!success || !headers) {
      return NextResponse.json({ error: error || 'KRA headers unavailable. Configure device/branch first.' }, { status: 400 })
    }

    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectItemList', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify({ lastReqDt })
    })

    const kraData = await kraRes.json()

    return NextResponse.json({ success: true, kraData })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}



