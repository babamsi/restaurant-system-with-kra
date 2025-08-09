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

// Generate unique invoice number for retry
async function getNextRetryInvoiceNo() {
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('trdInvcNo')
    .not('trdInvcNo', 'is', null)
    .order('trdInvcNo', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastInvoice = data[0].trdInvcNo
    if (lastInvoice) {
      next = parseInt(lastInvoice, 10) + 1
    }
  }
  return next
}

// Map unit to KRA unit code
function mapToKRAUnit(unit: string): string {
  const KRA_UNIT_MAP: Record<string, string> = {
    'bag': 'BG', 'box': 'BOX', 'can': 'CA', 'dozen': 'DZ', 'gram': 'GRM', 'g': 'GRM', 
    'kg': 'KG', 'kilogram': 'KG', 'kilo gramme': 'KG', 'litre': 'L', 'liter': 'L', 'l': 'L', 
    'milligram': 'MGM', 'mg': 'MGM', 'packet': 'PA', 'set': 'SET', 'piece': 'U', 
    'pieces': 'U', 'item': 'U', 'number': 'U', 'pcs': 'U', 'u': 'U',
  }
  
  if (!unit) return 'U'
  const normalized = unit.trim().toLowerCase()
  return KRA_UNIT_MAP[normalized] || 'U'
}

// Generate item classification code based on category
function generateItemClsCd(category: string): string {
  const CATEGORY_MAP: Record<string, string> = {
    'meats': '73131600',
    'drinks': '50200000', 
    'vegetables': '50400000',
    'package': '24120000',
    'dairy': '50130000',
    'grains': '50130000', // Same as dairy as per your mapping
    'oil': '50150000',
    'fruits': '50300000',
    'canned': '50460000',
    'nuts': '50100000'
  }
  
  const normalizedCategory = category.toLowerCase().trim()
  return CATEGORY_MAP[normalizedCategory] || '5059690800' // Default for unknown categories
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

    const { orderId, retryInvoiceNo } = await req.json()

    if (!orderId || !retryInvoiceNo) {
      return NextResponse.json({ error: 'Order ID and retry invoice number are required' }, { status: 400 })
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

    // Format dates
    const now = new Date()
    const cfmDt = formatDateTime(now)
    const salesDt = formatDateTime(now)

    // Calculate totals
    const totItemCnt = order.items?.length || 0
    const taxblAmtB = order.subtotal || 0
    const taxAmtB = order.tax_amount || 0
    const totAmt = order.total_amount || 0

    // Create item list
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
      prc: item.unit_price,
      splyAmt: item.total_price,
      totDcAmt: 0,
      taxblAmt: item.total_price,
      taxTyCd: 'B',
      taxAmt: Math.round(item.total_price * 0.16),
      totAmt: item.total_price
    }))

    // Determine payment type
    let pmtTyCd = '01' // Default to cash
    if (order.payment_method) {
      switch (order.payment_method) {
        case 'cash':
          pmtTyCd = '01'
          break
        case 'card':
          pmtTyCd = '05'
          break
        case 'mobile':
          pmtTyCd = '06'
          break
        default:
          pmtTyCd = '01'
      }
    }

    const payload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      cmcKey: headers.cmcKey,
      trdInvcNo: orderId,
      invcNo: retryInvoiceNo,
      orgInvcNo: retryInvoiceNo,
      custTin: order.customer_tin || 'A123456789Z',
      custNm: order.customer_name || 'WALK IN CUSTOMER',
      salesTyCd: 'N',
      rcptTyCd: 'S',
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
      modrId: 'Retry Sale',
      regrNm: 'Retry Sale',
      regrId: 'Retry Sale',
      taxblAmtD: 0,
      taxRtA: 0,
      taxAmtC: 0,
      taxAmtD: 0,
      taxAmtA: 0,
      taxblAmtE: 0,
      taxblAmtC: 0,
      modrNm: 'Retry Sale',
      taxAmtE: 0,
      taxRtC: 0,
      taxRtD: 0,
    }

    console.log("Retry Sale Payload:", payload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
    })

    const kraData = await kraRes.json()
    console.log("Retry Sale KRA Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA retry sale failed', 
        kraData, 
        retryInvoiceNo 
      }, { status: 400 })
    }

    // Update the order with KRA response
    const { error: updateError } = await supabase
      .from('table_orders')
      .update({
        kra_status: 'success',
        kra_response: kraData,
        kra_curRcptNo: kraData.data?.curRcptNo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order with KRA response:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      retryInvoiceNo,
      message: 'Retry sale processed successfully'
    })

  } catch (e: any) {
    console.error('Retry sale error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 