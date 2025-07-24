import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

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
    const body = await req.json()
    const { sales_invoice_id } = body

    if (!sales_invoice_id) {
      return NextResponse.json({ 
        error: 'Missing required field: sales_invoice_id' 
      }, { status: 400 })
    }

    // Fetch the failed sale record
    const { data: failedSale, error: fetchError } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('id', sales_invoice_id)
      .single()

    if (fetchError || !failedSale) {
      return NextResponse.json({ 
        error: 'Failed sale record not found' 
      }, { status: 404 })
    }

    // Fetch the order and items
    const { data: order, error: orderError } = await supabase
      .from('table_orders')
      .select('*, items:table_order_items(*)')
      .eq('id', failedSale.order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ 
        error: 'Order not found' 
      }, { status: 404 })
    }

    // Check if the error was due to duplicate invoice number
    const isDuplicateInvoiceError = failedSale.kra_error?.toLowerCase().includes('invoice number already exists') ||
                                   failedSale.kra_error?.toLowerCase().includes('duplicate invoice') ||
                                   failedSale.kra_error?.toLowerCase().includes('invoice already exists')

    // Generate new invoice number if needed
    let newInvoiceNo = failedSale.trdInvcNo
    if (isDuplicateInvoiceError) {
      newInvoiceNo = await getNextRetryInvoiceNo()
      console.log(`Duplicate invoice error detected. Using new invoice number: ${newInvoiceNo}`)
    }

    // Prepare items for KRA
    const items = order.items.map((item: any) => ({
      id: item.menu_item_id,
      name: item.menu_item_name,
      price: item.unit_price,
      qty: item.quantity,
      itemCd: item.itemCd || 'UNKNOWN',
      itemClsCd: item.itemClsCd || generateItemClsCd(item.category || 'general'),
      unit: item.unit || 'piece'
    }))

    // Calculate totals
    const TAX_RATE = 0.16
    const TAX_FACTOR = TAX_RATE / (1 + TAX_RATE)
    
    const calculatedItems = items.map((item: any) => {
      const total = item.price * item.qty
      const taxAmount = total * TAX_FACTOR
      const netAmount = total - taxAmount
      return { ...item, total, taxAmount, netAmount }
    })

    const orderTotal = calculatedItems.reduce((sum: number, item: any) => sum + item.total, 0)
    const orderTax = calculatedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0)
    const orderNet = calculatedItems.reduce((sum: number, item: any) => sum + item.netAmount, 0)

    // Prepare payment and customer info
    const payment = { method: failedSale.payment_method }
    const customer = { tin: '', name: order.customer_name || 'Walk-in Customer' }

    // Call KRA save-sale API with new invoice number
    const kraRes = await fetch(`${req.nextUrl.origin}/api/kra/save-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: calculatedItems,
        payment,
        customer,
        saleId: order.id,
        retryInvoiceNo: newInvoiceNo // Pass the new invoice number
      }),
    })

    const kraData = await kraRes.json()

    if (!kraData.success) {
      // Update the failed sale record with new error
      await supabase
        .from('sales_invoices')
        .update({
          kra_error: kraData.error || kraData.kraData?.resultMsg || 'KRA retry failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sales_invoice_id)

      return NextResponse.json({ 
        error: kraData.error || 'KRA retry failed', 
        kraData 
      }, { status: 400 })
    }

    // KRA retry successful - update the sale record
    const { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime } = kraData.kraData.data
    
    await supabase
      .from('sales_invoices')
      .update({
        trdInvcNo: kraData.invcNo,
        kra_curRcptNo: curRcptNo,
        kra_totRcptNo: totRcptNo,
        kra_intrlData: intrlData,
        kra_rcptSign: rcptSign,
        kra_sdcDateTime: sdcDateTime,
        kra_status: 'ok',
        kra_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sales_invoice_id)

    // Prepare receipt data for client-side PDF generation
    const receiptItems = order.items.map((item: any) => {
      // Determine tax type based on item category
      let taxType: 'A-EX' | 'B' | 'C' | 'D' | 'E' = 'B' // Default to 16% VAT
      
      if (item.category?.toLowerCase().includes('exempt') || item.category?.toLowerCase().includes('basic')) {
        taxType = 'A-EX' // Exempt
      } else if (item.category?.toLowerCase().includes('zero') || item.category?.toLowerCase().includes('export')) {
        taxType = 'C' // Zero rated
      } else if (item.category?.toLowerCase().includes('non-vat') || item.category?.toLowerCase().includes('service')) {
        taxType = 'D' // Non-VAT
      } else if (item.category?.toLowerCase().includes('8%')) {
        taxType = 'E' // 8% VAT
      }
      
      const itemTotal = item.unit_price * item.quantity
      const taxAmount = taxType === 'B' ? itemTotal * 0.16 : 
                       taxType === 'E' ? itemTotal * 0.08 : 0
      
      return {
        name: item.menu_item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total: itemTotal,
        tax_rate: taxType === 'B' ? 16 : taxType === 'E' ? 8 : 0,
        tax_amount: taxAmount,
        tax_type: taxType
      }
    })

    const receiptData = {
      kraData: {
        curRcptNo,
        totRcptNo,
        intrlData,
        rcptSign,
        sdcDateTime,
        invcNo: kraData.invcNo,
        trdInvcNo: order.id
      },
      items: receiptItems,
      customer: {
        name: order.customer_name || 'Walk-in Customer',
        pin: order.customer_pin
      },
      payment_method: failedSale.payment_method,
      total_amount: orderTotal,
      tax_amount: orderTax,
      net_amount: orderNet,
      order_id: order.id,
      discount_amount: 0,
      discount_percentage: 0,
      discount_narration: ''
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      invcNo: kraData.invcNo,
      message: 'Sale successfully retried and pushed to KRA',
      receiptData: receiptData // Return receipt data for client-side PDF generation
    })

  } catch (error: any) {
    console.error('KRA Retry Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 