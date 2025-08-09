import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

interface StockMasterPayload {
  itemCd: string
  rsdQty: number
  regrId: string
  regrNm: string
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

    const { stockData } = await req.json()

    if (!stockData) {
      return NextResponse.json({ error: 'Stock data is required' }, { status: 400 })
    }

    // Validate required fields
    if (!stockData.itemCd || stockData.rsdQty === undefined) {
      return NextResponse.json({ 
        error: 'itemCd and rsdQty are required fields' 
      }, { status: 400 })
    }

    const kraPayload: StockMasterPayload = {
      itemCd: stockData.itemCd,
      rsdQty: stockData.rsdQty,
      regrId: stockData.regrId || 'Admin',
      regrNm: stockData.regrNm || 'Admin',
      modrNm: stockData.modrNm || 'Admin',
      modrId: stockData.modrId || 'Admin'
    }

    console.log("KRA Stock Master Payload:", JSON.stringify(kraPayload, null, 2))

    // Call KRA API to save stock master
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveStockMaster', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Stock Master Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA stock master save failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      message: 'Stock inventory information saved to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Stock Master Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 