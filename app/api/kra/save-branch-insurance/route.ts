import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

interface BranchInsurancePayload {
  tin: string
  bhfId: string
  isrccCd: string
  isrccNm: string
  isrcRt: number
  useYn: string
  regrId: string
  regrNm: string
  modrId: string
  modrNm: string
}

export async function POST(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    const { insuranceData } = await req.json()

    if (!insuranceData) {
      return NextResponse.json({ error: 'Insurance data is required' }, { status: 400 })
    }

    // Validate required fields
    if (!insuranceData.isrccCd || !insuranceData.isrccNm || !insuranceData.isrcRt) {
      return NextResponse.json({ 
        error: 'isrccCd, isrccNm, and isrcRt are required fields' 
      }, { status: 400 })
    }

    const kraPayload: BranchInsurancePayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      isrccCd: insuranceData.isrccCd,
      isrccNm: insuranceData.isrccNm,
      isrcRt: insuranceData.isrcRt,
      useYn: insuranceData.useYn || 'Y',
      regrId: insuranceData.regrId || 'Admin',
      regrNm: insuranceData.regrNm || 'Admin',
      modrId: insuranceData.modrId || 'Admin',
      modrNm: insuranceData.modrNm || 'Admin'
    }

    console.log("KRA Branch Insurance Payload:", JSON.stringify(kraPayload, null, 2))

    // Call KRA API to save branch insurance
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveBhfInsurance', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Branch Insurance Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA branch insurance save failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Branch insurance information saved to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Branch Insurance Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 