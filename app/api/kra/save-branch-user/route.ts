import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

interface BranchUserPayload {
  userId: string
  userNm: string
  pwd: string
  adrs: string | null
  cntc: string | null
  authCd: string | null
  remark: string | null
  useYn: string
  regrNm: string
  regrId: string
  modrNm: string
  modrId: string
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

    const { branchUserData } = await req.json()

    if (!branchUserData) {
      return NextResponse.json({ error: 'Branch user data is required' }, { status: 400 })
    }

    // Validate required fields
    if (!branchUserData.userId || !branchUserData.userNm || !branchUserData.pwd) {
      return NextResponse.json({ 
        error: 'userId, userNm, and pwd are required fields' 
      }, { status: 400 })
    }

    // Prepare payload with dynamic headers and default values
    const kraPayload: BranchUserPayload = {
      userId: branchUserData.userId,
      userNm: branchUserData.userNm,
      pwd: branchUserData.pwd,
      adrs: branchUserData.adrs || null,
      cntc: branchUserData.cntc || null,
      authCd: branchUserData.authCd || null,
      remark: branchUserData.remark || null,
      useYn: branchUserData.useYn || 'Y',
      regrNm: branchUserData.regrNm || 'Admin',
      regrId: branchUserData.regrId || 'Admin',
      modrNm: branchUserData.modrNm || 'Admin',
      modrId: branchUserData.modrId || 'Admin'
    }

    console.log("KRA Branch User Payload:", JSON.stringify(kraPayload, null, 2))

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveBhfUser', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Branch User Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA branch user save failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Branch user account saved to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Branch User Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 