import { NextRequest, NextResponse } from 'next/server'
import { getKRAHeaders } from '@/lib/kra-utils'

interface StockInItem {
  itemSeq: number
  itemCd: string
  itemClsCd: string
  itemNm: string
  bcd: string | null
  pkgUnitCd: string
  pkg: number
  qtyUnitCd: string
  qty: number
  itemExprDt: string | null
  prc: number
  splyAmt: number
  totDcAmt: number
  taxblAmt: number
  taxTyCd: string
  taxAmt: number
  totAmt: number
}

interface StockInPayload {
  sarNo: number
  orgSarNo: number
  regTyCd: string
  custTin: string | null
  custNm: string | null
  custBhfId: string | null
  sarTyCd: string
  ocrnDt: string
  totItemCnt: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  remark: string | null
  regrId: string
  regrNm: string
  modrNm: string
  modrId: string
  itemList: StockInItem[]
}

// Calculate tax amount based on tax type
function calculateTaxAmount(amount: number, taxType: string): number {
  switch (taxType) {
    case 'A': return 0 // Exempt
    case 'B': return amount * 0.16 // 16% VAT
    case 'C': return 0 // Zero-rated
    case 'D': return 0 // Non-VAT
    case 'E': return amount * 0.08 // 8% Reduced rate
    default: return amount * 0.16 // Default to 16%
  }
}

// Determine sarTyCd based on stock movement type
function determineSarTyCd(stockChange: number, context: string = 'manual'): string {
  if (stockChange > 0) {
    // Stock is being added (incoming)
    switch (context) {
      case 'purchase': return '02' // Incoming purchase
      case 'import': return '01' // Incoming import
      case 'return': return '03' // Incoming return
      case 'processing': return '05' // Incoming processing
      case 'adjustment': return '06' // Incoming adjustment
      default: return '04' // Incoming stock (default for manual additions)
    }
  } else {
    // Stock is being reduced (outgoing)
    switch (context) {
      case 'sale': return '11' // Outgoing sale
      case 'return': return '12' // Outgoing return
      case 'processing': return '14' // Outgoing processing
      case 'discarding': return '15' // Outgoing discarding
      case 'adjustment': return '16' // Outgoing adjustment
      default: return '13' // Outgoing stock movement (default for manual reductions)
    }
  }
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

    const body = await req.json()
    const { stockInData, items, sarTyCd, receiptCode, vatAmount, stockDate, supplierOrderId, sarNo, itemList, stockChange, context } = body

    // Handle different payload formats
    let finalPayload: any

    if (stockInData) {
      // Complete payload format wrapped in stockInData (from some components)
      if (!stockInData.itemList || stockInData.itemList.length === 0) {
        return NextResponse.json({ error: 'Item list is required' }, { status: 400 })
      }

      // Ensure ocrnDt is 8 characters (YYYYMMDD format)
      if (stockInData.ocrnDt && stockInData.ocrnDt.length !== 8) {
        const today = new Date()
        stockInData.ocrnDt = today.getFullYear().toString() + 
                             String(today.getMonth() + 1).padStart(2, '0') + 
                             String(today.getDate()).padStart(2, '0')
      }

      // Recalculate totals to ensure accuracy
      let totTaxblAmt = 0
      let totTaxAmt = 0
      let totAmt = 0

      // Process each item and recalculate amounts
      stockInData.itemList.forEach((item: StockInItem) => {
        const supplyAmount = item.prc * item.qty
        const taxAmount = calculateTaxAmount(supplyAmount, item.taxTyCd)
        
        // Update item amounts
        item.splyAmt = supplyAmount
        item.taxblAmt = supplyAmount
        item.taxAmt = taxAmount
        item.totAmt = supplyAmount

        // Add to totals
        totTaxblAmt += supplyAmount
        totTaxAmt += taxAmount
        totAmt += supplyAmount
      })

      // Update payload with recalculated totals and dynamic headers
      finalPayload = {
        tin: headers.tin,
        bhfId: headers.bhfId,
        custBhfId: headers.bhfId,
        ...stockInData,
        totTaxblAmt,
        totTaxAmt,
        totAmt
      }
    } else if (sarNo && itemList) {
      // Complete payload format sent directly (from edit-test-item-dialog)
      if (!itemList || itemList.length === 0) {
        return NextResponse.json({ error: 'Item list is required' }, { status: 400 })
      }

      // Ensure ocrnDt is 8 characters (YYYYMMDD format)
      if (body.ocrnDt && body.ocrnDt.length !== 8) {
        const today = new Date()
        body.ocrnDt = today.getFullYear().toString() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0')
      }

      // Determine correct sarTyCd based on stock change
      const dynamicSarTyCd = determineSarTyCd(stockChange || 0, context || 'manual')

      // Recalculate totals to ensure accuracy
      let totTaxblAmt = 0
      let totTaxAmt = 0
      let totAmt = 0

      // Process each item and recalculate amounts
      itemList.forEach((item: StockInItem) => {
        const supplyAmount = item.prc * item.qty
        const taxAmount = calculateTaxAmount(supplyAmount, item.taxTyCd)
        
        // Update item amounts
        item.splyAmt = supplyAmount
        item.taxblAmt = supplyAmount
        item.taxAmt = taxAmount
        item.totAmt = supplyAmount

        // Add to totals
        totTaxblAmt += supplyAmount
        totTaxAmt += taxAmount
        totAmt += supplyAmount
      })

      // Update payload with recalculated totals, dynamic headers, and correct sarTyCd
      finalPayload = {
        tin: headers.tin,
        bhfId: headers.bhfId,
        custBhfId: headers.bhfId,
        ...body,
        sarTyCd: dynamicSarTyCd, // Use dynamic sarTyCd
        totTaxblAmt,
        totTaxAmt,
        totAmt
      }
    } else if (items) {
      // Simple payload format (from inventory sync/bulk update)
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'Items are required' }, { status: 400 })
      }

      // Generate SAR number
      const sarNo = Math.floor(Math.random() * 900000) + 100000
      
      // Format date
      const today = new Date()
      const ocrnDt = today.getFullYear().toString() + 
                     String(today.getMonth() + 1).padStart(2, '0') + 
                     String(today.getDate()).padStart(2, '0')

      // Determine correct sarTyCd based on context
      const dynamicSarTyCd = determineSarTyCd(0, sarTyCd === '02' ? 'purchase' : 'manual')

    // Calculate totals
      let totTaxblAmt = 0
      let totTaxAmt = 0
      let totAmt = 0

      // Process items
      const itemList = items.map((item: any, index: number) => {
        const supplyAmount = item.cost_per_unit * item.quantity
        const taxAmount = calculateTaxAmount(supplyAmount, item.tax_ty_cd || 'B')
        
        totTaxblAmt += supplyAmount
        totTaxAmt += taxAmount
        totAmt += supplyAmount
      
      return {
        itemSeq: index + 1,
          itemCd: item.item_cd || `ITEM${item.id}`,
          itemClsCd: item.item_cls_cd || '73131600',
          itemNm: item.name,
          bcd: null,
        pkgUnitCd: 'NT',
        pkg: 1,
          qtyUnitCd: item.unit || 'U',
          qty: item.quantity,
          itemExprDt: null,
          prc: item.cost_per_unit,
          splyAmt: supplyAmount,
        totDcAmt: 0,
          taxblAmt: supplyAmount,
          taxTyCd: item.tax_ty_cd || 'B',
          taxAmt: taxAmount,
          totAmt: supplyAmount
        }
      })

      finalPayload = {
        tin: headers.tin,
        bhfId: headers.bhfId,
      sarNo,
        orgSarNo: sarNo,
      regTyCd: 'M', // Manual
        custTin: null,
        custNm: null,
        custBhfId: headers.bhfId,
        sarTyCd: sarTyCd, // Use dynamic sarTyCd
      ocrnDt,
        totItemCnt: items.length,
      totTaxblAmt,
      totTaxAmt,
      totAmt,
      remark: `Stock-in for ${items.length} items`,
      regrId: 'Inventory Manager',
      regrNm: 'Inventory Manager',
      modrNm: 'Inventory Manager',
      modrId: 'Inventory Manager',
      itemList
      }
    } else {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
    }

    console.log("KRA Stock-in Enhanced Payload:", JSON.stringify(finalPayload, null, 2))

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/insertStockIO', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(finalPayload),
    })
    
    const kraData = await kraRes.json()
    console.log("KRA Stock-in Enhanced Response:", kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        error: kraData.resultMsg || 'KRA stock-in failed', 
        kraData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      kraData, 
      message: 'Stock-in sent to KRA successfully'
    })

  } catch (error: any) {
    console.error('KRA Stock-in Enhanced Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 