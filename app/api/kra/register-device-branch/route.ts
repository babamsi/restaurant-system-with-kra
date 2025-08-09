import { NextRequest, NextResponse } from 'next/server'
import { kraRegistrationsService } from '@/lib/kra-registrations-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tin, bhfId, dvcSrlNo, registrationType } = body

    // Validate required fields
    if (!tin || !bhfId) {
      return NextResponse.json({ 
        resultCd: "001",
        resultMsg: 'Missing required fields: tin and bhfId are required' 
      }, { status: 400 })
    }

    if (!registrationType || !['device_init', 'branch_reg'].includes(registrationType)) {
      return NextResponse.json({ 
        resultCd: "001",
        resultMsg: 'Invalid registration type. Must be "device_init" or "branch_reg"' 
      }, { status: 400 })
    }

    console.log(`Processing ${registrationType} registration:`, { tin, bhfId, dvcSrlNo })

    // Create registration record in database
    const createResult = await kraRegistrationsService.createRegistration({
      registration_type: registrationType,
      tin: tin.trim(),
      bhf_id: bhfId.trim(),
      dvc_srl_no: dvcSrlNo?.trim()
    })

    if (!createResult.success || !createResult.data) {
      return NextResponse.json({ 
        resultCd: "001",
        resultMsg: createResult.error || 'Failed to create registration record' 
      }, { status: 500 })
    }

    // Prepare KRA API payload
    const kraPayload = {
      tin: tin.trim(),
      bhfId: bhfId.trim(),
      dvcSrlNo: dvcSrlNo?.trim() || ""
    }

    console.log('KRA API Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA API - Using production endpoint
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/selectInitOsdcInfo', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA API Response:', kraData)

    // Update registration with KRA response
    const status = kraData.resultCd === '000' ? 'success' : 'failed'
    const updateResult = await kraRegistrationsService.updateRegistrationWithKRAResponse(
      createResult.data.id,
      kraData,
      status
    )

    if (!updateResult.success) {
      console.error('Failed to update registration with KRA response:', updateResult.error)
    }

    // Return response based on KRA result
    if (kraData.resultCd === '000') {
      return NextResponse.json({ 
        resultCd: "000",
        resultMsg: "Registration successful",
        data: {
          registration_id: createResult.data.id,
          kra_response: kraData
        }
      })
    } else {
      return NextResponse.json({ 
        resultCd: kraData.resultCd || "001",
        resultMsg: kraData.resultMsg || 'KRA registration failed',
        data: {
          registration_id: createResult.data.id,
          kra_response: kraData
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('KRA Registration Error:', error)
    return NextResponse.json({ 
      resultCd: "001",
      resultMsg: error.message || 'Internal error during registration' 
    }, { status: 500 })
  }
} 