import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

export interface KRACustomerPayload {
  custNo: string | null
  custTin: string
  custNm: string
  adrs: string | null
  telNo: string | null
  email: string | null
  faxNo: string | null
  useYn: string
  remark: string | null
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

    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Get customer data from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Set custNo based on phone number
    let custNo: string | null = null
    if (customer.phone && customer.phone.trim() !== '') {
      custNo = customer.phone.trim()
    }

    // Prepare KRA customer payload
    const kraPayload: KRACustomerPayload = {
      custNo,
      custTin: customer.kra_pin,
      custNm: customer.name,
      adrs: customer.address || null,
      telNo: customer.phone || null,
      email: customer.email || null,
      faxNo: null,
      useYn: 'Y',
      remark: null,
      regrNm: 'Restaurant POS',
      regrId: 'Restaurant POS',
      modrNm: 'Restaurant POS',
      modrId: 'Restaurant POS'
    }

    console.log("KRA Customer Payload:", kraPayload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveBhfCustomer', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Customer Response:", kraData)

    if (kraData.resultCd !== '000') {
      // Update customer with error status
      await supabase
        .from('customers')
        .update({
          kra_status: 'failed',
          kra_error: kraData.resultMsg || 'KRA customer registration failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)

      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA customer registration failed', 
        kraData 
      }, { status: 400 })
    }

    // Update customer with success status
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        kra_status: 'success',
        kra_submission_date: new Date().toISOString(),
        kra_customer_no: custNo,
        kra_response: kraData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('Error updating customer with KRA response:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Customer sent to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Customer Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 