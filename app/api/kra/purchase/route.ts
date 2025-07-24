import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { kraTransactionService } from '@/lib/kra-transaction-service'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

// Generate unique orgInvcNo starting from 1
async function getNextOrgInvcNo() {
  const { data, error } = await supabase
    .from('kra_transactions')
    .select('kra_invoice_no')
    .not('kra_invoice_no', 'is', null)
    .order('kra_invoice_no', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastInvcNo = data[0].kra_invoice_no
    if (lastInvcNo) {
      next = lastInvcNo + 1
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
  let transactionId: string | undefined
  
  try {
    const body = await req.json()
    const { 
      items, 
      supplier, 
      invoiceNumber, 
      vatAmount,
      purchaseDate,
      supplierOrderId // Optional: for linking to supplier order
    } = body

    if (!items || !items.length || !supplier || !invoiceNumber) {
      return NextResponse.json({ 
        error: 'Missing required fields: items, supplier, or invoiceNumber' 
      }, { status: 400 })
    }

    // Generate unique orgInvcNo for this transaction
    const orgInvcNo = await getNextOrgInvcNo()
    
    // Use the exact invoice number from the bulk update component
    const invcNo = parseInt(invoiceNumber) || orgInvcNo
    
    console.log('KRA Purchase Invoice Numbers:', {
      inputInvoiceNumber: invoiceNumber,
      parsedInvcNo: invcNo,
      generatedOrgInvcNo: orgInvcNo,
      supplierInvoiceNumber: invoiceNumber
    })

    const now = new Date()
    const purchaseDt = purchaseDate || now.toISOString().slice(0, 10).replace(/-/g, '')
    const cfmDt = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '')

    // Calculate totals
    const totItemCnt = items.length
    const totTaxblAmt = items.reduce((sum: number, item: any) => {
      const qty = item.newQuantity || item.quantity || 0
      const prc = item.newCost || item.cost_per_unit || 0
      return sum + (qty * prc)
    }, 0)
    
    const totTaxAmt = vatAmount ? parseFloat(vatAmount) : 0
    const totAmt = totTaxblAmt + totTaxAmt

    // Build item list for KRA
    const itemList = items.map((item: any, index: number) => {
      const qty = item.newQuantity || item.quantity || 0
      const prc = item.newCost || item.cost_per_unit || 0
      const splyAmt = qty * prc
      const taxAmt = totTaxAmt > 0 ? (splyAmt / totTaxblAmt) * totTaxAmt : 0
      
      return {
        itemSeq: index + 1,
        itemCd: item.itemCd || item.ingredient?.itemCd || 'UNKNOWN',
        itemClsCd: item.itemClsCd || item.ingredient?.itemClsCd || generateItemClsCd(item.category || item.ingredient?.category),
        itemNm: item.name || item.ingredient?.name,
        bcd: undefined,
        spplrItemClsCd: undefined,
        spplrItemCd: undefined,
        spplrItemNm: undefined,
        pkgUnitCd: 'NT',
        pkg: 0,
        qtyUnitCd: mapToKRAUnit(item.unit || item.ingredient?.unit),
        qty,
        prc,
        splyAmt,
        dcRt: 0,
        dcAmt: 0,
        taxblAmt: splyAmt,
        taxTyCd: 'B',
        taxAmt,
        totAmt: splyAmt,
        itemExprDt: undefined
      }
    })

    // Build KRA purchase transaction payload
    const purchasePayload = {
      tin: TIN,
      bhfId: BHF_ID,
      invcNo, // Use the exact invoice number from bulk update
      orgInvcNo, // Unique incrementing number for each transaction
      spplrTin: supplier.tax_id || undefined,
      spplrBhfId: undefined,
      spplrNm: supplier.name,
      spplrInvcNo: invoiceNumber, // Supplier's invoice number
      regTyCd: 'M', // Manual
      pchsTyCd: 'N', // Normal purchase
      rcptTyCd: 'P', // Purchase receipt
      pmtTyCd: '01', // Cash
      pchsSttsCd: '02', // Confirmed
      cfmDt,
      pchsDt: purchaseDt,
      wrhsDt: '',
      cnclReqDt: undefined,
      cnclDt: undefined,
      rfdDt: undefined,
      totItemCnt,
      taxblAmtA: 0,
      taxblAmtB: totTaxblAmt,
      taxblAmtC: 0,
      taxblAmtD: 0,
      taxblAmtE: 0,
      taxRtA: 0,
      taxRtB: 16, // Default VAT rate
      taxRtC: 0,
      taxRtD: 0,
      taxRtE: 0,
      taxAmtA: 0,
      taxAmtB: totTaxAmt,
      taxAmtC: 0,
      taxAmtD: 0,
      taxAmtE: 0,
      totTaxblAmt,
      totTaxAmt,
      totAmt,
      remark: undefined,
      regrNm: 'Restaurant POS',
      regrId: 'Restaurant POS',
      modrNm: 'Restaurant POS',
      modrId: 'Restaurant POS',
      itemList
    }

    console.log('KRA Purchase Payload:', JSON.stringify(purchasePayload, null, 2))
    console.log('Key fields for debugging:', {
      invcNo: purchasePayload.invcNo,
      orgInvcNo: purchasePayload.orgInvcNo,
      spplrInvcNo: purchasePayload.spplrInvcNo,
      supplierName: purchasePayload.spplrNm,
      totalAmount: purchasePayload.totAmt,
      itemCount: purchasePayload.totItemCnt
    })

    // Create transaction record before API call
    const transactionResult = await kraTransactionService.create({
      transaction_type: 'purchase',
      kra_invoice_no: orgInvcNo, // Store the unique orgInvcNo
      supplier_id: supplier.id,
      supplier_order_id: supplierOrderId,
      items_data: items,
      total_amount: totAmt,
      vat_amount: totTaxAmt,
      status: 'pending'
    })

    if (transactionResult.error) {
      console.error('Failed to create transaction record:', transactionResult.error)
    } else {
      transactionId = transactionResult.data?.id
    }

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertTrnsPurchase', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        tin: TIN, 
        bhfId: BHF_ID, 
        cmcKey: CMC_KEY 
      },
      body: JSON.stringify(purchasePayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Purchase Response:', kraData)

    // Update transaction record with result
    if (transactionId) {
      if (kraData.resultCd !== '000') {
        await kraTransactionService.updateError(
          transactionId,
          kraData.resultMsg || 'KRA purchase failed',
          kraData
        )
      } else {
        await kraTransactionService.updateStatus(
          transactionId,
          'success',
          kraData.resultCd,
          kraData.resultMsg,
          kraData
        )
      }
    }

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA purchase failed', 
        kraData,
        invcNo,
        orgInvcNo 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData, 
      invcNo,
      orgInvcNo,
      transactionId 
    })
  } catch (error: any) {
    console.error('KRA Purchase Error:', error)
    
    // Update transaction record with error if we have an ID
    if (transactionId) {
      await kraTransactionService.updateError(
        transactionId,
        error.message || 'Internal error',
        { stack: error.stack }
      )
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 