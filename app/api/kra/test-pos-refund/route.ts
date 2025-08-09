import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

function formatDateTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate())
  )
}

// Get next refund invoice number for test POS
async function getNextTestRefundInvoiceNo(): Promise<number> {
  const { data: lastInvoice, error } = await supabase
    .from('test_pos_invoices')
    .select('trdInvcNo')
    .like('trdInvcNo', 'REFUND%')
    .order('trdInvcNo', { ascending: false })
    .limit(1)
    .single()

  if (error || !lastInvoice) {
    return 1
  }

  const lastNumber = parseInt(lastInvoice.trdInvcNo.toString().replace('REFUND', ''))
  return lastNumber + 1
}

// Get next invoice number for test POS
async function getNextTestInvoiceNo(): Promise<number> {
  const { data, error } = await supabase
    .from('test_pos_invoices')
    .select('trdInvcNo')
    .order('trdInvcNo', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    next = (data[0].trdInvcNo || 0) + 1
  }
  return next
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

    // Read request body once and extract all data
    const requestBody = await req.json()
    const { orderId, refundType = 'full', refundPercentage, refundAmount } = requestBody

    if (!orderId) {
      return NextResponse.json({ 
        success: false,
        error: 'Order ID is required' 
      }, { status: 400 })
    }

    // Get refund details from request body
    // const { refundType = 'full', refundPercentage, refundAmount } = await req.json()

    // Get the original test POS order details
    const { data: order, error: orderError } = await supabase
      .from('test_pos_invoices')
      .select('*')
      .eq('trdInvcNo', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ 
        success: false,
        error: 'Test POS order not found' 
      }, { status: 404 })
    }

    // Check if order is already refunded
    if (order.kra_status === 'refunded') {
      return NextResponse.json({ 
        success: false,
        error: 'Order has already been refunded' 
      }, { status: 400 })
    }

    // Get next refund invoice number
    const refundInvoiceNo = await getNextTestInvoiceNo()
    const refundTrdInvcNo = `REFUND${refundInvoiceNo.toString().padStart(6, '0')}`

    // Format dates
    const now = new Date()
    const cfmDt = formatDateTime(now)
    const salesDt = formatDate(now)

    // Parse the original order items
    const originalItems = order.items || []
    
    // Calculate refund multiplier for partial refunds
    let refundMultiplier = 1.0
    if (refundType === 'partial') {
      if (refundPercentage && parseFloat(refundPercentage) > 0) {
        const percentage = parseFloat(refundPercentage)
        if (percentage > 100) {
          return NextResponse.json({ 
            success: false,
            error: 'Refund percentage cannot exceed 100%' 
          }, { status: 400 })
        }
        refundMultiplier = percentage / 100
      } else if (refundAmount && parseFloat(refundAmount) > 0) {
        const amount = parseFloat(refundAmount)
        const orderTotal = order.totAmt || 0
        // if (amount > orderTotal) {
        //   return NextResponse.json({ 
        //     success: false,
        //     error: 'Refund amount cannot exceed order total' 
        //   }, { status: 400 })
        // }
        if (orderTotal <= 0) {
          return NextResponse.json({ 
            success: false,
            error: 'Order total must be greater than 0' 
          }, { status: 400 })
        }
        refundMultiplier = amount / orderTotal
      } else {
        return NextResponse.json({ 
          success: false,
          error: 'Please provide either refund percentage or amount for partial refund' 
        }, { status: 400 })
      }
    }
    
    // Ensure refund multiplier is valid
    if (refundMultiplier <= 0 || refundMultiplier > 1) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid refund multiplier' 
      }, { status: 400 })
    }
    
    // Calculate refund totals (negative values)
    const totItemCnt = originalItems.length
    const totTaxblAmt = Number((-(order.totTaxblAmt || 0) * refundMultiplier).toFixed(2))
    const totTaxAmt = Number((-(order.totTaxAmt || 0) * refundMultiplier).toFixed(2))
    const totAmt = Number((-(order.totAmt || 0) * refundMultiplier).toFixed(2))
    const totDcAmt = Number((-(order.totDcAmt || 0) * refundMultiplier).toFixed(2))

    // Create refund item list (negative values)
    const itemList = originalItems.map((item: any, index: number) => {
      const originalAmount = item.totalPrice || (item.unitPrice * item.quantity)
      const taxAmount = item.taxAmount || 0
      const discountAmount = item.discountAmount || 0
      
      // Apply refund multiplier to all amounts
      const refundedAmount = Number((originalAmount * refundMultiplier).toFixed(2))
      const refundedTaxAmount = Number((taxAmount * refundMultiplier).toFixed(2))
      const refundedDiscountAmount = Number((discountAmount * refundMultiplier).toFixed(2))
      
      return {
        itemSeq: index + 1,
        itemCd: item.itemCd || `TEST${item.id}`,
        itemClsCd: item.itemClsCd || 'TEST',
        itemNm: item.name,
        bcd: null,
        pkgUnitCd: 'NT',
        pkg: 1,
        qtyUnitCd: item.unit || 'U',
        qty: item.quantity,
        itemExprDt: null,
        prc: -(item.unitPrice || 0),
        splyAmt: -refundedAmount,
        totDcAmt: -refundedDiscountAmount,
        taxblAmt: -refundedAmount,
        taxTyCd: item.taxType || 'B',
        taxAmt: -refundedTaxAmount,
        totAmt: -refundedAmount,
        dcAmt: -refundedDiscountAmount,
        dcRt: 0
      }
    })

    // Calculate tax amounts by type for refund (negative values)
    const calculateRefundTaxByType = (items: any[]) => {
      let taxblAmtA = 0, taxblAmtB = 0, taxblAmtC = 0, taxblAmtD = 0, taxblAmtE = 0
      let taxAmtA = 0, taxAmtB = 0, taxAmtC = 0, taxAmtD = 0, taxAmtE = 0

      items.forEach((item: any) => {
        const amount = item.totalPrice || (item.unitPrice * item.quantity)
        const taxType = item.taxType || 'B'
        const taxAmount = item.taxAmount || 0
        
        // Apply refund multiplier to amounts
        const refundedAmount = Number((amount * refundMultiplier).toFixed(2))
        const refundedTaxAmount = Number((taxAmount * refundMultiplier).toFixed(2))
        
        switch (taxType) {
          case 'A': // Exempt
            taxblAmtA += -refundedAmount
            taxAmtA += 0
            break
          case 'B': // Standard VAT (16%)
            taxblAmtB += -refundedAmount
            taxAmtB += -refundedTaxAmount
            break
          case 'C': // Zero-rated
            taxblAmtC += -refundedAmount
            taxAmtC += 0
            break
          case 'D': // Non-VAT
            taxblAmtD += -refundedAmount
            taxAmtD += 0
            break
          case 'E': // Reduced rate (8%)
            taxblAmtE += -refundedAmount
            taxAmtE += -refundedTaxAmount
            break
          default: // Default to standard VAT
            taxblAmtB += -refundedAmount
            taxAmtB += -refundedTaxAmount
        }
      })

      return {
        taxblAmtA, taxblAmtB, taxblAmtC, taxblAmtD, taxblAmtE,
        taxAmtA, taxAmtB, taxAmtC, taxAmtD, taxAmtE
      }
    }

    const refundTaxBreakdown = calculateRefundTaxByType(originalItems)

    const payload = {
      invcNo: refundInvoiceNo,
      orgInvcNo: parseInt(order.kra_curRcptNo || order.invcNo) || 0, // Original KRA receipt number as number
      custTin: order.custTin || null,
      custNm: order.custNm || "Walk-in Customer",
      salesTyCd: 'N',
      rcptTyCd: 'R', // Refund/Credit Note after Sale
      pmtTyCd: order.pmtTyCd || '01',
      salesSttsCd: '02',
      cfmDt: cfmDt,
      salesDt: salesDt,
      totItemCnt: totItemCnt,
      taxblAmtA: refundTaxBreakdown.taxblAmtA,
      taxblAmtB: refundTaxBreakdown.taxblAmtB,
      taxblAmtC: refundTaxBreakdown.taxblAmtC,
      taxblAmtD: refundTaxBreakdown.taxblAmtD,
      taxblAmtE: refundTaxBreakdown.taxblAmtE,
      taxRtA: 0,
      taxRtB: 16,
      taxRtC: 0,
      taxRtD: 0,
      taxRtE: 8,
      taxAmtA: refundTaxBreakdown.taxAmtA,
      taxAmtB: refundTaxBreakdown.taxAmtB,
      taxAmtC: refundTaxBreakdown.taxAmtC,
      taxAmtD: refundTaxBreakdown.taxAmtD,
      taxAmtE: refundTaxBreakdown.taxAmtE,
      totTaxblAmt: totTaxblAmt,
      totTaxAmt: totTaxAmt,
      totAmt: totAmt,
      totDcAmt: totDcAmt,
      prchrAcptcYn: 'N',
      remark: refundType === 'partial' 
        ? `Partial refund for sale ${orderId} (${(refundMultiplier * 100).toFixed(1)}%)`
        : `Refund for sale ${orderId}`,
      regrId: "11999",
      regrNm: "TestVSCU",
      modrId: "45678",
      modrNm: "TestVSCU",
      receipt: {
        custTin: order.custTin || null,
        custMblNo: null,
        rptNo: 1,
        rcptPbctDt: cfmDt,
        trdeNm: "",
        adrs: "",
        topMsg: "KRA Test POS Refund",
        btmMsg: "www.maamul.com",
        prchrAcptcYn: "N"
      },
      itemList: itemList
    }

    console.log("Test POS Refund Payload:", payload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
    })
    
    const kraData = await kraRes.json()
    console.log("Test POS Refund KRA Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        success: false,
        error: kraData.resultMsg || 'KRA test POS refund failed', 
        kraData, 
        refundInvoiceNo 
      }, { status: 400 })
    }

    // Update the original order status to refunded
    const { error: updateOrderError } = await supabase
      .from('test_pos_invoices')
      .update({ 
        kra_status: 'refunded',
        refund_trdInvcNo: refundTrdInvcNo,
        refund_invcNo: refundInvoiceNo,
        refund_kra_response: kraData,
        // refund_timestamp: new Date().toISOString()
      })
      .eq('trdInvcNo', orderId)

    if (updateOrderError) {
      console.error('Error updating test POS order status:', updateOrderError)
    }

    // Store refund invoice
    const { error: insertError } = await supabase
      .from('test_pos_invoices')
      .insert({
        trdInvcNo: refundTrdInvcNo,
        invcNo: refundInvoiceNo,
        orgInvcNo: order.kra_curRcptNo || order.invcNo,
        custTin: order.custTin || null,
        custNm: order.custNm || "Walk-in Customer",
        salesTyCd: 'N',
        rcptTyCd: 'R',
        pmtTyCd: order.pmtTyCd || '01',
        salesSttsCd: '02',
        cfmDt: cfmDt,
        salesDt: salesDt,
        totItemCnt: totItemCnt,
        // taxblAmtA: refundTaxBreakdown.taxblAmtA,
        // taxblAmtB: refundTaxBreakdown.taxblAmtB,
        // taxblAmtC: refundTaxBreakdown.taxblAmtC,
        // taxblAmtD: refundTaxBreakdown.taxblAmtD,
        // taxblAmtE: refundTaxBreakdown.taxblAmtE,
        // taxRtA: 0,
        // taxRtB: 16,
        // taxRtC: 0,
        // taxRtD: 0,
        // taxRtE: 8,
        // taxAmtA: refundTaxBreakdown.taxAmtA,
        // taxAmtB: refundTaxBreakdown.taxAmtB,
        // taxAmtC: refundTaxBreakdown.taxAmtC,
        // taxAmtD: refundTaxBreakdown.taxAmtD,
        // taxAmtE: refundTaxBreakdown.taxAmtE,
        // totTaxblAmt: totTaxblAmt,
        // totTaxAmt: totTaxAmt,
        // totAmt: totAmt,
        totDcAmt: totDcAmt,
        prchrAcptcYn: 'N',
        kra_status: 'success',
        kra_response: kraData,
        // original_receipt_no: order.kra_curRcptNo || order.invcNo,
        items: originalItems,
        is_refund: true
      })

    if (insertError) {
      console.error('Error storing test POS refund invoice:', insertError)
    }

    return NextResponse.json({ 
      success: true, 
      kraData, 
      refundInvoiceNo,
      refundTrdInvcNo,
      message: 'Test POS refund processed successfully'
    })

  } catch (e: any) {
    console.error('Test POS Refund error:', e)
    return NextResponse.json({ 
      success: false,
      error: e.message || 'Internal error during test POS refund' 
    }, { status: 500 })
  }
} 