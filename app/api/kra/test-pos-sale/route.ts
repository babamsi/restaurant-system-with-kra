import { NextRequest, NextResponse } from 'next/server'
import { kraTestItemsService } from '@/lib/kra-test-items-service'
import { getKRAHeaders } from '@/lib/kra-utils'
import { supabase } from '@/lib/supabase'
import { generateAndDownloadReceipt, type ReceiptRequest } from '@/lib/receipt-utils'

interface CartItem {
  item: {
    id: string
    name: string
    cost_per_unit: number
    unit: string
    item_cd?: string
    item_cls_cd?: string
    tax_ty_cd?: string
  }
  quantity: number
  price: number
}

interface Customer {
  id: string
  name: string
  kra_pin: string
  phone: string | null
  email: string | null
}

interface TestPOSOrder {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  customer?: Customer | null
  discountAmount: number
  discountType?: string
}

// Helper functions for date formatting
function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate())
  )
}

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

// Get next invoice number for test POS
async function getNextTestInvoiceNo() {
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

    const body = await req.json()
    const { order } = body

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order data is required' 
      }, { status: 400 })
    }

    const testOrder: TestPOSOrder = order

    console.log('Processing KRA Test POS sale:', {
      items: testOrder.items.length,
      total: testOrder.total,
      paymentMethod: testOrder.paymentMethod,
      customer: testOrder.customer?.name || 'No customer',
      discountAmount: testOrder.discountAmount
    })

    // Get serial invoice number
    const saleId = await getNextTestInvoiceNo()
    console.log('Sale ID:', saleId)
    const invcNo = saleId
    const orgInvcNo = 0 // For new sales, orgInvcNo is 0
    const cfmDt = formatDateTime(new Date())
    const salesDt = formatDate(new Date())

    // Map payment method to KRA payment type
    const mapPaymentMethodToKRA = (method: string): string => {
      switch (method) {
        case 'cash': return '01' // Cash
        case 'card': return '05' // Credit/Debit Card
        case 'mobile': return '06' // Mobile Money
        default: return '01' // Default to cash
      }
    }

    // Calculate tax amounts by type
    const calculateTaxByType = (items: CartItem[]) => {
      let taxblAmtA = 0, taxblAmtB = 0, taxblAmtC = 0, taxblAmtD = 0, taxblAmtE = 0
      let taxAmtA = 0, taxAmtB = 0, taxAmtC = 0, taxAmtD = 0, taxAmtE = 0

      items.forEach(item => {
        const originalAmount = item.price * item.quantity
        const taxType = item.item.tax_ty_cd || 'B'
        
        // Calculate discount for this item (proportional to item amount)
        const totalOrderAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        const itemDiscountAmount = totalOrderAmount > 0 ? (originalAmount / totalOrderAmount) * testOrder.discountAmount : 0
        const discountedAmount = originalAmount - itemDiscountAmount
        
        switch (taxType) {
          case 'A': // Exempt
            taxblAmtA += discountedAmount
            taxAmtA += 0 // Exempt from VAT
            break
          case 'B': // Standard VAT (16%)
            taxblAmtB += discountedAmount
            taxAmtB += discountedAmount * 0.16 // 16% VAT on discounted amount
            break
          case 'C': // Zero-rated
            taxblAmtC += discountedAmount
            taxAmtC += 0 // Zero-rated for VAT
            break
          case 'D': // Non-VAT
            taxblAmtD += discountedAmount
            taxAmtD += 0 // Not subject to VAT
            break
          case 'E': // Reduced rate (8%)
            taxblAmtE += discountedAmount
            taxAmtE += discountedAmount * 0.08 // 8% VAT on discounted amount
            break
          default: // Default to standard VAT
            taxblAmtB += discountedAmount
            taxAmtB += discountedAmount * 0.16
        }
      })

      return {
        taxblAmtA, taxblAmtB, taxblAmtC, taxblAmtD, taxblAmtE,
        taxAmtA, taxAmtB, taxAmtC, taxAmtD, taxAmtE
      }
    }

    const taxBreakdown = calculateTaxByType(testOrder.items)

    // Calculate total taxable amount and total tax
    const totalTaxblAmt = taxBreakdown.taxblAmtA + taxBreakdown.taxblAmtB + taxBreakdown.taxblAmtC + taxBreakdown.taxblAmtD + taxBreakdown.taxblAmtE
    const totalTaxAmt = taxBreakdown.taxAmtA + taxBreakdown.taxAmtB + taxBreakdown.taxAmtC + taxBreakdown.taxAmtD + taxBreakdown.taxAmtE

    // Prepare KRA sale payload
    const kraPayload = {
      invcNo: invcNo,
      orgInvcNo: orgInvcNo,
      custTin: testOrder.customer?.kra_pin || null, // Use customer KRA PIN or null
      custNm: testOrder.customer?.name || "Walk-in Customer",
      salesTyCd: "N",
      rcptTyCd: 'S', // Standard receipt
      pmtTyCd: mapPaymentMethodToKRA(testOrder.paymentMethod),
      salesSttsCd: "02", // Approved
      cfmDt: cfmDt,
      salesDt: salesDt,
      stockRlsDt: cfmDt,
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      totItemCnt: testOrder.items.length,
      taxblAmtA: taxBreakdown.taxblAmtA,
      taxblAmtB: taxBreakdown.taxblAmtB,
      taxblAmtC: taxBreakdown.taxblAmtC,
      taxblAmtD: taxBreakdown.taxblAmtD,
      taxblAmtE: taxBreakdown.taxblAmtE,
      taxRtA: 0, // Exempt rate
      taxRtB: 16, // Standard VAT rate
      taxRtC: 0, // Zero-rated rate
      taxRtD: 0, // Non-VAT rate
      taxRtE: 8, // Reduced rate
      taxAmtA: Number(taxBreakdown.taxAmtA.toFixed(2)),
      taxAmtB: Number(taxBreakdown.taxAmtB.toFixed(2)),
      taxAmtC: Number(taxBreakdown.taxAmtC.toFixed(2)),
      taxAmtD: Number(taxBreakdown.taxAmtD.toFixed(2)),
      taxAmtE: Number(taxBreakdown.taxAmtE.toFixed(2)),
      totTaxblAmt: Number(totalTaxblAmt.toFixed(2)),
      totTaxAmt: Number(totalTaxAmt.toFixed(2)),
      totAmt: Number(testOrder.total.toFixed(2)),
      prchrAcptcYn: "N",
      remark: null,
      regrId: "11999",
      regrNm: "TestVSCU",
      modrId: "45678",
      modrNm: "TestVSCU",
      receipt: {
        custTin: testOrder.customer?.kra_pin || null,
        custMblNo: testOrder.customer?.phone || null,
        rptNo: 1,
        rcptPbctDt: cfmDt,
        trdeNm: "",
        adrs: "",
        topMsg: "KRA Test POS",
        btmMsg: "www.maamul.com",
        prchrAcptcYn: "N"
      },
      itemList: testOrder.items.map((item, index) => {
        const originalAmount = item.price * item.quantity
        const taxType = item.item.tax_ty_cd || 'B'
        
        // Calculate discount for this item (proportional to item amount)
        const totalOrderAmount = testOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        const itemDiscountAmount = totalOrderAmount > 0 ? (originalAmount / totalOrderAmount) * testOrder.discountAmount : 0
        const discountedAmount = originalAmount - itemDiscountAmount
        
        let taxAmount = 0
        
        // Calculate tax based on tax type on discounted amount
        switch (taxType) {
          case 'A': // Exempt
            taxAmount = 0
            break
          case 'B': // Standard VAT (16%)
            taxAmount = discountedAmount * 0.16
            break
          case 'C': // Zero-rated
            taxAmount = 0
            break
          case 'D': // Non-VAT
            taxAmount = 0
            break
          case 'E': // Reduced rate (8%)
            taxAmount = discountedAmount * 0.08
            break
          default: // Default to standard VAT
            taxAmount = discountedAmount * 0.16
        }

        return {
          itemSeq: index + 1,
          itemCd: item.item.item_cd || `TEST${item.item.id}`,
          itemClsCd: item.item.item_cls_cd || 'TEST',
          itemNm: item.item.name,
          bcd: null,
          pkgUnitCd: 'NT', // Standard packaging unit
          pkg: 1,
          qtyUnitCd: item.item.unit || 'U',
          qty: item.quantity,
          prc: item.price,
          splyAmt: discountedAmount, // Use discounted amount
          dcRt: testOrder.discountAmount > 0 ? Number((itemDiscountAmount / originalAmount) * 100).toFixed(2) : 0, // Discount rate
          dcAmt: Number(itemDiscountAmount.toFixed(2)), // Discount amount for this item - fixed to 2 decimals
          isrccCd: null,
          isrccNm: null,
          isrcRt: null,
          isrcAmt: null,
          taxTyCd: taxType,
          taxblAmt: discountedAmount, // Taxable amount after discount
          taxAmt: Number(taxAmount.toFixed(2)), // Tax amount on discounted amount - fixed to 2 decimals
          totAmt: discountedAmount // Total amount after discount
        }
      })
    }

    console.log('KRA Test POS Sale Payload:', JSON.stringify(kraPayload, null, 2))

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(kraPayload),
    })
    console.log('headers', headers)
    const kraData = await kraRes.json()
    console.log('KRA Test POS Sale Response:', kraData)

    if (kraData.resultCd !== '000') {
      return NextResponse.json({ 
        success: false, 
        error: kraData.resultMsg || 'KRA test POS sale failed',
        kraResponse: kraData
      }, { status: 400 })
    }

    // Store order in database
    const { data: storedOrderData, error: orderError } = await supabase
      .from('test_pos_invoices')
      .insert({
        trdInvcNo: saleId,
        invcNo: invcNo,
        orgInvcNo: orgInvcNo,
        custTin: testOrder.customer?.kra_pin || null,
        custNm: testOrder.customer?.name || "Walk-in Customer",
        salesTyCd: 'N',
        rcptTyCd: 'S',
        pmtTyCd: mapPaymentMethodToKRA(testOrder.paymentMethod),
        salesSttsCd: '02',
        cfmDt: cfmDt,
        salesDt: salesDt,
        totItemCnt: testOrder.items.length,
        // taxblAmtA: taxBreakdown.taxblAmtA,
        // taxblAmtB: taxBreakdown.taxblAmtB,
        // taxblAmtC: taxBreakdown.taxblAmtC,
        // taxblAmtD: taxBreakdown.taxblAmtD,
        // taxblAmtE: taxBreakdown.taxblAmtE,
        // taxRtA: 0,
        // taxRtB: 16,
        // taxRtC: 0,
        // taxRtD: 0,
        // taxRtE: 8,
        // taxAmtA: taxBreakdown.taxAmtA,
        // taxAmtB: taxBreakdown.taxAmtB,
        // taxAmtC: taxBreakdown.taxAmtC,
        // taxAmtD: taxBreakdown.taxAmtD,
        // taxAmtE: taxBreakdown.taxAmtE,
        // totTaxblAmt: totalTaxblAmt,
        // totTaxAmt: totalTaxAmt,
        prchrAcptcYn: 'N',
        totAmt: testOrder.total,
        totDcAmt: testOrder.discountAmount || 0,
        totDcRt: testOrder.discountAmount && testOrder.subtotal > 0 ? Math.round((testOrder.discountAmount / testOrder.subtotal) * 100) : 0,
        kra_status: 'pending',
        kra_response: null,
        items: testOrder.items.map((item: any, index: number) => {
          const originalAmount = item.price * item.quantity
          const totalOrderAmount = testOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
          const itemDiscountAmount = totalOrderAmount > 0 ? (originalAmount / totalOrderAmount) * testOrder.discountAmount : 0
          const discountedAmount = originalAmount - itemDiscountAmount
          const taxType = item.item.tax_ty_cd || 'B'
          
          // Calculate tax on discounted amount
          let taxAmount = 0
          switch (taxType) {
            case 'A': taxAmount = 0; break
            case 'B': taxAmount = discountedAmount * 0.16; break
            case 'C': taxAmount = 0; break
            case 'D': taxAmount = 0; break
            case 'E': taxAmount = discountedAmount * 0.08; break
            default: taxAmount = discountedAmount * 0.16; break
          }
          
          return {
            name: item.item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            originalPrice: originalAmount,
            totalPrice: discountedAmount,
            discountAmount: itemDiscountAmount,
            discountRate: testOrder.discountAmount > 0 ? (itemDiscountAmount / originalAmount) * 100 : 0,
            taxType: taxType,
            taxAmount: taxAmount,
            finalTotal: discountedAmount
          }
        })
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error storing test POS order:', orderError)
      return NextResponse.json({ error: 'Failed to store test POS order' }, { status: 500 })
    }

    // Update the order with KRA response
    const { error: updateError } = await supabase
      .from('test_pos_invoices')
      .update({
        kra_status: 'success',
        kra_response: kraData,
        kra_curRcptNo: kraData.data?.curRcptNo || null,
        kra_intrlData: kraData.data?.intrlData || null,
        kra_rcptSign: kraData.data?.rcptSign || null,
        kra_sdcDateTime: kraData.data?.sdcDateTime || null
      })
      .eq('trdInvcNo', saleId)

    if (updateError) {
      console.error('Error updating test POS order with KRA response:', updateError)
    }

    // Stock-out functionality - Update KRA stock levels after successful sale
    try {
      console.log('Processing stock-out for sold items...')
      
      // Prepare stock-out payload for all items at once
      const stockOutItems = testOrder.items.map((item, index) => {
        const originalAmount = item.price * item.quantity
        const taxType = item.item.tax_ty_cd || 'B'
        let taxAmount = 0
        
        // Calculate tax based on tax type
        switch (taxType) {
          case 'A': taxAmount = 0; break // Exempt
          case 'B': taxAmount = originalAmount * 0.16; break // 16% VAT
          case 'C': taxAmount = 0; break // Zero-rated
          case 'D': taxAmount = 0; break // Non-VAT
          case 'E': taxAmount = originalAmount * 0.08; break // 8% Reduced rate
          default: taxAmount = originalAmount * 0.16; break // Default to 16%
        }

        // Calculate discount for this item (proportional to item amount)
        const totalOrderAmount = testOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        const itemDiscountAmount = totalOrderAmount > 0 ? (originalAmount / totalOrderAmount) * testOrder.discountAmount : 0

        return {
          itemSeq: index + 1,
          itemCd: item.item.item_cd || `TEST${item.item.id}`,
          itemClsCd: item.item.item_cls_cd || 'TEST',
          itemNm: item.item.name,
          bcd: null,
          pkgUnitCd: 'NT',
          pkg: 1,
          qtyUnitCd: item.item.unit || 'U',
          qty: item.quantity,
          itemExprDt: null,
          prc: item.price,
          splyAmt: originalAmount,
          totDcAmt: itemDiscountAmount,
          taxblAmt: originalAmount,
          taxTyCd: taxType,
          taxAmt: taxAmount,
          totAmt: originalAmount
        }
      })

      // Calculate total amounts for the entire stock-out payload
      const totalStockOutAmount = testOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalStockOutTax = testOrder.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        const taxType = item.item.tax_ty_cd || 'B'
        let taxAmount = 0
        switch (taxType) {
          case 'A': taxAmount = 0; break
          case 'B': taxAmount = itemTotal * 0.16; break
          case 'C': taxAmount = 0; break
          case 'D': taxAmount = 0; break
          case 'E': taxAmount = itemTotal * 0.08; break
          default: taxAmount = itemTotal * 0.16; break
        }
        return sum + taxAmount
      }, 0)

      // Prepare stock-out payload with all items
      const stockOutPayload = {
        sarNo: saleId, // Use the same invoice number
        orgSarNo: 0,
        regTyCd: 'M',
        custTin: null,
        custNm: null,
        custBhfId: "00",
        sarTyCd: '11', // Outgoing sale
        ocrnDt: salesDt, // Same as sales date
        totItemCnt: testOrder.items.length, // Total number of items
        totTaxblAmt: totalStockOutAmount,
        totTaxAmt: totalStockOutTax,
        totAmt: totalStockOutAmount,
        remark: `Stock-out from sale ${saleId}`,
        regrId: "11999",
        regrNm: "TestVSCU",
        modrId: "45678",
        modrNm: "TestVSCU",
        itemList: stockOutItems // All items in single payload
      }

      // Call stock-in-enhanced API for stock-out with all items
      const stockOutResponse = await fetch(`${req.nextUrl.origin}/api/kra/stock-in-enhanced`, {
        method: 'POST',
        headers: headers as unknown as Record<string, string>,
        body: JSON.stringify(stockOutPayload),
      })

      const stockOutData = await stockOutResponse.json()
      console.log('Stock-out response:', stockOutData)

      // Store stock-out results in database
      await supabase
        .from('test_pos_invoices')
        .update({
          stock_out_results: stockOutData,
          // stock_out_processed: true,
          // stock_out_timestamp: new Date().toISOString()
        })
        .eq('trdInvcNo', saleId)

    } catch (stockOutError) {
      console.error('Error processing stock-out:', stockOutError)
      // Don't fail the entire transaction if stock-out fails
      // Just log the error and continue
    }

    // Prepare receipt data for client-side PDF generation
    const receiptItems = testOrder.items.map((item) => {
      const itemTotal = item.price * item.quantity
      const taxType = item.item.tax_ty_cd || 'B'
      let taxAmount = 0
      let taxRate = 0
      
      // Calculate tax based on tax type on discounted amount
      switch (taxType) {
        case 'A': // Exempt
          taxAmount = 0
          taxRate = 0
          break
        case 'B': // Standard VAT (16%)
          taxAmount = itemTotal * 0.16
          taxRate = 16
          break
        case 'C': // Zero-rated
          taxAmount = 0
          taxRate = 0
          break
        case 'D': // Non-VAT
          taxAmount = 0
          taxRate = 0
          break
        case 'E': // Reduced rate (8%)
          taxAmount = itemTotal * 0.08
          taxRate = 8
          break
        default: // Default to standard VAT
          taxAmount = itemTotal * 0.16
          taxRate = 16
      }
      
      return {
        name: item.item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: itemTotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        tax_type: taxType as "B" | "C" | "D" | "E" | "A-EX"
      }
    })

    const receiptData = {
      kraData: {
        curRcptNo: kraData.data?.curRcptNo || '',
        totRcptNo: kraData.data?.totRcptNo || '',
        intrlData: kraData.data?.intrlData || '',
        rcptSign: kraData.data?.rcptSign || '',
        sdcDateTime: cfmDt,
        invcNo: invcNo,
        trdInvcNo: saleId.toString()
      },
      items: receiptItems,
      customer: {
        name: testOrder.customer?.name || 'Walk-in Customer',
        pin: testOrder.customer?.kra_pin
      },
      payment_method: testOrder.paymentMethod,
      total_amount: testOrder.total,
      tax_amount: testOrder.tax,
      net_amount: testOrder.subtotal,
      order_id: saleId.toString(),
      discount_amount: testOrder.discountAmount || 0,
      discount_percentage: testOrder.discountType === 'percentage' ? testOrder.discountAmount : 0,
      discount_narration: testOrder.discountAmount > 0 ? `${testOrder.discountType === 'percentage' ? testOrder.discountAmount : 'Fixed'} discount` : undefined
    }

    return NextResponse.json({ 
      success: true, 
      kraData,
      invoiceNumber: invcNo,
      receiptData, // Send receipt data to client for PDF generation
      message: 'KRA Test POS sale processed successfully'
    })

  } catch (error: any) {
    console.error('KRA Test POS Sale Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error during test POS sale' 
    }, { status: 500 })
  }
} 