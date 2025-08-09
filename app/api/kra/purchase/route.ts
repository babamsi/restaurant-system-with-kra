import { NextRequest, NextResponse } from 'next/server'
import { kraPurchaseSubmissionsService } from '@/lib/kra-purchase-submissions-service'
import { getKRAHeaders } from '@/lib/kra-utils'

interface KRASaleItem {
  itemSeq: number
  itemCd: string
  itemClsCd: string
  itemNm: string
  bcd: string | null
  pkgUnitCd: string
  pkg: number
  qtyUnitCd: string
  qty: number
  prc: number
  splyAmt: number
  dcRt: number
  dcAmt: number
  taxTyCd: string
  taxblAmt: number
  taxAmt: number
  totAmt: number
}

interface KRASale {
  spplrTin: string
  spplrNm: string
  spplrBhfId: string
  spplrInvcNo: number
  spplrSdcId: string
  spplrMrcNo: string
  rcptTyCd: string
  pmtTyCd: string
  cfmDt: string
  salesDt: string
  stockRlsDt: string | null
  totItemCnt: number
  taxblAmtA: number
  taxblAmtB: number
  taxblAmtC: number
  taxblAmtD: number
  taxblAmtE: number
  taxRtA: number
  taxRtB: number
  taxRtC: number
  taxRtD: number
  taxRtE: number
  taxAmtA: number
  taxAmtB: number
  taxAmtC: number
  taxAmtD: number
  taxAmtE: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark: string | null
  itemList: KRASaleItem[]
}

export async function POST(req: NextRequest) {
  try {
    // Get dynamic KRA headers
    const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
    
    if (!headersSuccess || !headers) {
      return NextResponse.json({ 
        success: false,
        error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
      }, { status: 400 })
    }

    const body = await req.json()
    const { purchase } = body

    if (!purchase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Purchase data is required' 
      }, { status: 400 })
    }

    const sale: KRASale = purchase

    console.log('Sending purchase to KRA:', {
      supplier: sale.spplrNm,
      invoice: sale.spplrInvcNo,
      totalAmount: sale.totAmt
    })

    // Check if this purchase has already been successfully submitted
    const existingSubmission = await kraPurchaseSubmissionsService.isSubmissionSuccessful(
      sale.spplrInvcNo, 
      sale.spplrTin
    )

    if (existingSubmission.success && existingSubmission.isSuccessful) {
      return NextResponse.json({ 
        success: false, 
        error: 'This purchase has already been successfully submitted to KRA',
        alreadySubmitted: true
      }, { status: 400 })
    }

    // Create submission record before sending to KRA
    const createResult = await kraPurchaseSubmissionsService.createSubmission({
      spplr_invc_no: sale.spplrInvcNo,
      spplr_tin: sale.spplrTin,
      spplr_nm: sale.spplrNm,
      total_amount: sale.totAmt,
      tax_amount: sale.totTaxAmt,
      payment_type: sale.pmtTyCd,
      receipt_type: sale.rcptTyCd
    })

    if (!createResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create submission record' 
      }, { status: 500 })
    }

    const formatDateForKRA = (dateString: string): string => {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}${month}${day}`
    }

    const mapPaymentTypeToKRA = (pmtTyCd: string): string => {
      const paymentTypeMap: Record<string, string> = {
        '01': '01', // Cash
        '02': '02', // Credit
        '03': '03', // Cash/Credit
        '04': '04', // Bank Check
        '05': '05', // Debit&Credit card
        '06': '06', // Mobile Money
        '07': '07'  // Other
      }
      return paymentTypeMap[pmtTyCd] || '01'
    }

    // Prepare KRA purchase payload with correct structure
    const kraPayload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      invcNo: sale.spplrInvcNo, // Use supplier invoice number
      orgInvcNo: sale.spplrInvcNo, // Use supplier invoice number as org invoice
      spplrTin: sale.spplrTin,
      spplrBhfId: sale.spplrBhfId,
      spplrNm: sale.spplrNm,
      spplrInvcNo: sale.spplrInvcNo,
      regTyCd: 'M', // Manual
      pchsTyCd: 'N', // Normal purchase
      rcptTyCd: 'P', // Purchase receipt
      pmtTyCd: mapPaymentTypeToKRA(sale.pmtTyCd), // Dynamic payment type
      pchsSttsCd: '02', // Confirmed
      cfmDt: formatDateForKRA(sale.cfmDt),
      pchsDt: sale.salesDt,
      wrhsDt: sale.stockRlsDt ? formatDateForKRA(sale.stockRlsDt) : '',
      cnclReqDt: undefined,
      cnclDt: undefined,
      rfdDt: undefined,
      totItemCnt: sale.totItemCnt,
      taxblAmtA: sale.taxblAmtA,
      taxblAmtB: sale.taxblAmtB,
      taxblAmtC: sale.taxblAmtC,
      taxblAmtD: sale.taxblAmtD,
      taxblAmtE: sale.taxblAmtE,
      taxRtA: sale.taxRtA,
      taxRtB: sale.taxRtB,
      taxRtC: sale.taxRtC,
      taxRtD: sale.taxRtD,
      taxRtE: sale.taxRtE,
      taxAmtA: sale.taxAmtA,
      taxAmtB: sale.taxAmtB,
      taxAmtC: sale.taxAmtC,
      taxAmtD: sale.taxAmtD,
      taxAmtE: sale.taxAmtE,
      totTaxblAmt: sale.totTaxblAmt,
      totTaxAmt: sale.totTaxAmt,
      totAmt: sale.totAmt,
      remark: sale.remark || undefined,
      regrNm: 'Restaurant POS',
      regrId: 'Restaurant POS',
      modrNm: 'Restaurant POS',
      modrId: 'Restaurant POS',
      itemList: sale.itemList.map(item => ({
        itemSeq: item.itemSeq,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.itemNm,
        bcd: item.bcd || undefined,
        spplrItemClsCd: undefined,
        spplrItemCd: undefined,
        spplrItemNm: undefined,
        pkgUnitCd: item.pkgUnitCd,
        pkg: item.pkg,
        qtyUnitCd: item.qtyUnitCd,
        qty: item.qty,
        prc: item.prc,
        splyAmt: item.splyAmt,
        dcRt: item.dcRt,
        dcAmt: item.dcAmt,
        taxblAmt: item.taxblAmt,
        taxTyCd: item.taxTyCd,
        taxAmt: item.taxAmt,
        totAmt: item.totAmt,
        itemExprDt: undefined
      }))
    }

    console.log('KRA Purchase API Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA purchase API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertTrnsPurchase', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Purchase API Response:', kraData)

    // Update submission record with KRA response
    const status = kraData.resultCd === '000' ? 'success' : 'failed'
    const errorMessage = kraData.resultCd !== '000' ? kraData.resultMsg : undefined
    
    await kraPurchaseSubmissionsService.updateSubmissionWithKRAResponse(
      sale.spplrInvcNo,
      sale.spplrTin,
      kraData,
      status,
      errorMessage
    )

    // Return response based on KRA result
    if (kraData.resultCd === '000') {
      return NextResponse.json({ 
        success: true, 
        message: 'Purchase sent to KRA successfully',
        kraResponse: kraData
      })
      } else {
      return NextResponse.json({ 
        success: false, 
        error: kraData.resultMsg || 'KRA purchase failed', 
        kraResponse: kraData
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('KRA Purchase Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error during purchase submission' 
    }, { status: 500 })
  }
} 