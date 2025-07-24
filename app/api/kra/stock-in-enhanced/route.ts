import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { kraTransactionService } from '@/lib/kra-transaction-service'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

// Generate unique SAR number for stock movement
async function generateUniqueSarNo(): Promise<number> {
  const { data, error } = await supabase
    .from('kra_transactions')
    .select('kra_sar_no')
    .not('kra_sar_no', 'is', null)
    .order('kra_sar_no', { ascending: false })
    .limit(1)
  
  let next = 1
  if (data && data.length > 0) {
    const lastSarNo = data[0].kra_sar_no
    if (lastSarNo) {
      next = lastSarNo + 1
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
      sarTyCd = '02', // Default to purchase (02)
      receiptCode,
      vatAmount,
      stockDate,
      supplierOrderId // Optional: for linking to supplier order
    } = body

    if (!items || !items.length) {
      return NextResponse.json({ 
        error: 'Missing required fields: items' 
      }, { status: 400 })
    }

    const now = new Date()
    const ocrnDt = stockDate || now.toISOString().slice(0, 10).replace(/-/g, '')
    const sarNo = await generateUniqueSarNo() // Use async function to get unique SAR number
    const orgSarNo = sarNo

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
      const totItemAmt = splyAmt + taxAmt
      
      return {
        itemSeq: index + 1,
        itemCd: item.itemCd || item.ingredient?.itemCd || 'UNKNOWN',
        itemClsCd: item.itemClsCd || item.ingredient?.itemClsCd || generateItemClsCd(item.category || item.ingredient?.category),
        itemNm: item.name || item.ingredient?.name,
        pkgUnitCd: 'NT',
        pkg: 1,
        qtyUnitCd: mapToKRAUnit(item.unit || item.ingredient?.unit),
        qty,
        prc,
        splyAmt,
        totDcAmt: 0,
        taxblAmt: splyAmt,
        taxTyCd: 'B',
        taxAmt,
        totAmt: totItemAmt,
      }
    })

    // Safe name for KRA fields (max 20 chars)
    const safeName = receiptCode ? 
      (receiptCode.length > 20 ? receiptCode.slice(0, 20) : receiptCode) : 
      'Restaurant POS'

    // Build KRA stock movement payload
    const stockPayload = {
      tin: TIN,
      bhfId: BHF_ID,
      sarNo,
      orgSarNo,
      regTyCd: 'M', // Manual
      sarTyCd, // 02 for purchase, 01 for sales, etc.
      ocrnDt,
      totItemCnt,
      totTaxblAmt,
      totTaxAmt,
      totAmt,
      regrId: safeName,
      regrNm: safeName,
      modrId: safeName,
      modrNm: safeName,
      itemList,
    }

    console.log('KRA Stock-In Payload:', JSON.stringify(stockPayload, null, 2))

    // Create transaction record before API call
    const transactionResult = await kraTransactionService.create({
      transaction_type: 'stock_in',
      kra_sar_no: sarNo,
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
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertStockIO', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        tin: TIN, 
        bhfId: BHF_ID, 
        cmcKey: CMC_KEY 
      },
      body: JSON.stringify(stockPayload),
    })
    
    const kraData = await kraRes.json()
    console.log('KRA Stock-In Response:', kraData)

    // Update transaction record with result
    if (transactionId) {
      if (kraData.resultCd !== '000') {
        await kraTransactionService.updateError(
          transactionId,
          kraData.resultMsg || 'KRA stock-in failed',
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
        error: kraData.resultMsg || 'KRA stock-in failed', 
        kraData,
        sarNo 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData, 
      sarNo,
      transactionId 
    })
  } catch (error: any) {
    console.error('KRA Stock-In Error:', error)
    
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