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

// Get next invoice number for refund
async function getNextRefundInvoiceNo(): Promise<number> {
  const { data: lastInvoice, error } = await supabase
    .from('sales_invoices')
    .select('trdInvcNo')
    .not('trdInvcNo', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !lastInvoice) {
    return 1
  }

  return parseInt(lastInvoice.trdInvcNo.toString()) + 1
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

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the original order details
    const { data: order, error: orderError } = await supabase
      .from('table_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get the original sale invoice
    const { data: saleInvoice, error: saleError } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('trdInvcNo', order.id)
      .single()

    if (saleError || !saleInvoice) {
      return NextResponse.json({ error: 'Sale invoice not found' }, { status: 404 })
    }

    // Get next refund invoice number
    const { data: lastRefund } = await supabase
      .from('sales_invoices')
      .select('trdInvcNo')
      .like('trdInvcNo', 'REFUND%')
      .order('trdInvcNo', { ascending: false })
      .limit(1)

    let refundInvoiceNo = 1
    if (lastRefund && lastRefund.length > 0) {
      const lastNumber = parseInt(lastRefund[0].trdInvcNo.replace('REFUND', ''))
      refundInvoiceNo = lastNumber + 1
    }

    const refundTrdInvcNo = `REFUND${refundInvoiceNo.toString().padStart(6, '0')}`

    // Format dates
    const now = new Date()
    const cfmDt = formatDateTime(now)
    const salesDt = formatDateTime(now)

    // Payment type code mapping
    const paymentTypeMap: Record<string, string> = {
      cash: '01',
      card: '05',
      mobile: '06',
    }
    const pmtTyCd = paymentTypeMap[order.payment_method] || '01'

    // Calculate refund totals (negative values)
    const totItemCnt = order.items?.length || 0
    const taxblAmtB = -(order.subtotal || 0)
    const taxAmtB = -(order.tax_amount || 0)
    const totAmt = -(order.total_amount || 0)

    // Create refund item list (negative values)
    const itemList = (order.items || []).map((item: any, index: number) => ({
      itemSeq: index + 1,
      itemCd: item.itemCd || 'KE2NTU0000001',
      itemClsCd: item.itemClsCd || '5059690800',
      itemNm: item.menu_item_name,
      bcd: null,
      pkgUnitCd: 'NT',
      pkg: 1,
      qtyUnitCd: 'U',
      qty: item.quantity,
      itemExprDt: null,
      prc: -(item.unit_price || 0),
      splyAmt: -(item.total_price || 0),
      totDcAmt: 0,
      taxblAmt: -(item.total_price || 0),
      taxTyCd: 'B',
      taxAmt: -Math.round((item.total_price || 0) * 0.16),
      totAmt: -(item.total_price || 0)
    }))

    const payload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      cmcKey: headers.cmcKey,
      trdInvcNo: refundTrdInvcNo,
      invcNo: refundInvoiceNo,
      orgInvcNo: saleInvoice.kra_curRcptNo || saleInvoice.invcNo, // Original receipt number
      custTin: order.customer_tin || 'A123456789Z',
      custNm: order.customer_name || 'WALK IN CUSTOMER',
      salesTyCd: 'N',
      rcptTyCd: 'R', // Refund/Credit Note after Sale
      pmtTyCd,
      salesSttsCd: '02',
      cfmDt,
      salesDt,
      totItemCnt,
      taxblAmtB,
      taxRtB: 16,
      taxAmtB,
      totTaxblAmt: taxblAmtB,
      totTaxAmt: taxAmtB,
      prchrAcptcYn: 'N',
      totAmt,
      receipt: {
        custTin: order.customer_tin || 'A123456789Z',
        rcptPbctDt: cfmDt,
        prchrAcptcYn: 'N',
      },
      itemList,
      // Additional KRA fields
      taxblAmtA: 0,
      taxRtE: 16,
      modrId: 'Refund',
      regrNm: 'Refund',
      regrId: 'Refund',
      taxblAmtD: 0,
      taxRtA: 0,
      taxAmtC: 0,
      taxAmtD: 0,
      taxAmtA: 0,
      taxblAmtE: 0,
      taxblAmtC: 0,
      modrNm: 'Refund',
      taxAmtE: 0,
      taxRtC: 0,
      taxRtD: 0,
    }

    console.log("Refund Payload:", payload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
    })
    
    const kraData = await kraRes.json()
    console.log("Refund KRA Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA refund failed', 
        kraData, 
        refundInvoiceNo 
      }, { status: 400 })
    }

    // Update the original order status
    const { error: updateOrderError } = await supabase
      .from('table_orders')
      .update({ status: 'refunded' })
      .eq('id', orderId)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
    }

    // Store refund invoice
    const { error: insertError } = await supabase
      .from('sales_invoices')
      .insert({
        trdInvcNo: refundTrdInvcNo,
        invcNo: refundInvoiceNo,
        orgInvcNo: saleInvoice.kra_curRcptNo || saleInvoice.invcNo,
        custTin: order.customer_tin || 'A123456789Z',
        custNm: order.customer_name || 'WALK IN CUSTOMER',
        salesTyCd: 'N',
        rcptTyCd: 'R',
        pmtTyCd,
        salesSttsCd: '02',
        cfmDt,
        salesDt: salesDt,
        totItemCnt,
        taxblAmtB,
        taxRtB: 16,
        taxAmtB,
        totTaxblAmt: taxblAmtB,
        totTaxAmt: taxAmtB,
        prchrAcptcYn: 'N',
        totAmt,
        kra_status: 'success',
        kra_response: kraData,
        original_receipt_no: saleInvoice.kra_curRcptNo || saleInvoice.invcNo,
        items: order.items
      })

    if (insertError) {
      console.error('Error storing refund invoice:', insertError)
    }

    return NextResponse.json({ 
      success: true, 
      kraData, 
      refundInvoiceNo,
      message: 'Refund processed successfully'
    })

  } catch (e: any) {
    console.error('Refund error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 