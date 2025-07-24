import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"

interface KRAReceiptData {
  curRcptNo: string
  totRcptNo: string
  intrlData: string
  rcptSign: string
  sdcDateTime: string
  invcNo: number
  trdInvcNo: string
}

interface ReceiptItem {
  name: string
  unit_price: number
  quantity: number
  total: number
  tax_rate: number
  tax_amount: number
  tax_type: 'A-EX' | 'B' | 'C' | 'D' | 'E' // A-EX=Exempt, B=16% VAT, C=0%, D=Non-VAT, E=8%
}

interface ReceiptRequest {
  kraData: KRAReceiptData
  items: ReceiptItem[]
  customer: {
    name: string
    pin?: string
  }
  payment_method: string
  total_amount: number
  tax_amount: number
  net_amount: number
  order_id: string
  discount_amount?: number
  discount_percentage?: number
  discount_narration?: string
}

// Business configuration
const BUSINESS_CONFIG = {
  name: "Restaurant POS",
  address: "Nairobi, Kenya",
  pin: TIN,
  commercialMessage: "Welcome to our restaurant",
  thankYouMessage: "THANK YOU\nWE LOOK FORWARD TO SERVE YOU AGAIN"
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function formatDateTime(dateTimeString: string): { date: string; time: string } {
  try {
    // Handle KRA sdcDateTime format: "YYYYMMDDHHMMSS" (e.g., "20250724113711")
    if (dateTimeString && dateTimeString.length === 14 && /^\d{14}$/.test(dateTimeString)) {
      const year = dateTimeString.substring(0, 4)
      const month = dateTimeString.substring(4, 6)
      const day = dateTimeString.substring(6, 8)
      const hour = dateTimeString.substring(8, 10)
      const minute = dateTimeString.substring(10, 12)
      const second = dateTimeString.substring(12, 14)
      
      const dateStr = `${day}/${month}/${year}`
      const timeStr = `${hour}:${minute}:${second}`
      
      return { date: dateStr, time: timeStr }
    }
    
    // Fallback to standard date parsing for other formats
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return { date: dateStr, time: timeStr }
  } catch (error) {
    console.warn('Error parsing date time:', dateTimeString, error)
    // Return current date/time as fallback
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-GB', { hour12: false })
    }
  }
}

// Calculate tax breakdown
function calculateTaxBreakdown(items: ReceiptItem[]) {
  const breakdown = {
    exempt: { amount: 0, tax: 0 },
    vat16: { amount: 0, tax: 0 },
    zeroRated: { amount: 0, tax: 0 },
    nonVatable: { amount: 0, tax: 0 },
    vat8: { amount: 0, tax: 0 }
  }

  items.forEach(item => {
    switch (item.tax_type) {
      case 'A-EX':
        breakdown.exempt.amount += item.total
        breakdown.exempt.tax += 0
        break
      case 'B':
        breakdown.vat16.amount += item.total
        breakdown.vat16.tax += item.tax_amount
        break
      case 'C':
        breakdown.zeroRated.amount += item.total
        breakdown.zeroRated.tax += 0
        break
      case 'D':
        breakdown.nonVatable.amount += item.total
        breakdown.nonVatable.tax += 0
        break
      case 'E':
        breakdown.vat8.amount += item.total
        breakdown.vat8.tax += item.tax_amount
        break
    }
  })

  return breakdown
}

function generateReceiptText(data: ReceiptRequest): string {
  const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = data
  
  // Parse KRA date time
  const { date, time } = formatDateTime(kraData.sdcDateTime)
  
  // Calculate totals
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = discount_amount
  const subtotal = totalBeforeDiscount - totalDiscount
  
  // Calculate tax breakdown
  const taxBreakdown = calculateTaxBreakdown(items)
  
  // Format items for receipt
  const itemsText = items.map(item => {
    const unitPrice = formatCurrency(item.unit_price)
    const quantity = item.quantity
    const total = formatCurrency(item.total)
    const taxType = item.tax_type
    
    return `${item.name}\n${unitPrice}x ${quantity} ${total}${taxType}`
  }).join('\n')
  
  // Format tax breakdown table
  const taxTable = `Rate Taxable Amount VAT
EX ${formatCurrency(taxBreakdown.exempt.amount)} ${formatCurrency(taxBreakdown.exempt.tax)}
16% ${formatCurrency(taxBreakdown.vat16.amount)} ${formatCurrency(taxBreakdown.vat16.tax)}
0% ${formatCurrency(taxBreakdown.zeroRated.amount)} ${formatCurrency(taxBreakdown.zeroRated.tax)}
Non-VAT ${formatCurrency(taxBreakdown.nonVatable.amount)} ${formatCurrency(taxBreakdown.nonVatable.tax)}
8% ${formatCurrency(taxBreakdown.vat8.amount)} ${formatCurrency(taxBreakdown.vat8.tax)}`
  
  // Generate receipt text
  const receiptText = `
${BUSINESS_CONFIG.name}
${BUSINESS_CONFIG.address}
PIN: ${BUSINESS_CONFIG.pin}
TAX INVOICE
--------------------------------------------------
${BUSINESS_CONFIG.commercialMessage}
${customer.pin ? `Buyer PIN: ${customer.pin}` : ''}
--------------------------------------------------
${itemsText}
${discount_narration ? `\nDiscount narration and value: ${discount_percentage}% (${formatCurrency(totalDiscount)})` : ''}
-----------------------------------------------------
TOTAL BEFORE DISCOUNT ${formatCurrency(totalBeforeDiscount)}
${totalDiscount > 0 ? `TOTAL DISCOUNT AWARDED (${formatCurrency(totalDiscount)})` : ''}
SUB TOTAL ${formatCurrency(subtotal)}
VAT ${formatCurrency(tax_amount)}
TOTAL ${formatCurrency(total_amount)}
--------------------------------------------------
${payment_method.toUpperCase()} ${formatCurrency(total_amount)}
ITEMS NUMBER ${items.length}
------------------------------------------------
${taxTable}
------------------------------------------------
SCU INFORMATION
Date: ${date} Time: ${time}
SCU ID: ${kraData.curRcptNo}
CU INVOICE NO.: ${kraData.curRcptNo}/${kraData.invcNo}
Internal Data:
${kraData.intrlData}
Receipt Signature:
${kraData.rcptSign}
----------------------------------------------
TIS INFORMATION
RECEIPT NUMBER: ${kraData.totRcptNo}
DATE: ${date} TIME: ${time}
--------------------------------------------
${BUSINESS_CONFIG.thankYouMessage}
`.trim()

  return receiptText
}

export async function POST(req: NextRequest) {
  try {
    const body: ReceiptRequest = await req.json()
    const { kraData, items, customer, payment_method, total_amount, tax_amount, net_amount, order_id, discount_amount = 0, discount_percentage = 0, discount_narration = '' } = body

    if (!kraData || !items || !customer) {
      return NextResponse.json({ 
        error: 'Missing required fields: kraData, items, or customer' 
      }, { status: 400 })
    }

    // Generate receipt text
    const receiptText = generateReceiptText(body)

    // Create receipt record in database
    const receiptData = {
      order_id,
      kra_receipt_no: kraData.curRcptNo,
      kra_total_receipt_no: kraData.totRcptNo,
      kra_internal_data: kraData.intrlData,
      kra_receipt_signature: kraData.rcptSign,
      kra_sdc_date_time: kraData.sdcDateTime,
      kra_invoice_no: kraData.invcNo,
      receipt_text: receiptText,
      total_amount,
      tax_amount,
      net_amount,
      payment_method,
      customer_name: customer.name,
      customer_pin: customer.pin || null,
      discount_amount,
      discount_percentage,
      discount_narration,
      items_data: items // Store items data for reference
    }

    // Save to database
    const { data: savedReceipt, error: dbError } = await supabase
      .from('kra_receipts')
      .insert(receiptData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error saving receipt:', dbError)
      return NextResponse.json({ 
        error: 'Failed to save receipt to database' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      receipt: {
        id: savedReceipt.id,
        text: receiptText,
        kraData: kraData,
        order_id,
        created_at: savedReceipt.created_at,
        items: items,
        taxBreakdown: calculateTaxBreakdown(items)
      }
    })

  } catch (error: any) {
    console.error('KRA Receipt Generation Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 