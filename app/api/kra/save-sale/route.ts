import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

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

// Function to parse itemCd and extract unit codes
function parseItemCd(itemCd: string): { pkgUnitCd: string; qtyUnitCd: string } {
  // Default values if parsing fails
  let pkgUnitCd = 'NT'  // Always "NT" as specified
  let qtyUnitCd = 'U'   // Default to "U" if parsing fails
  
  if (itemCd && itemCd.length >= 8) {
    try {
      // KRA format: KE2NT${unitCode}${7 digits}
      // Example: KE2NTKG0000001 -> pkgUnitCd: 'NT', qtyUnitCd: 'KG'
      // Example: KE2NTU0000003 -> pkgUnitCd: 'NT', qtyUnitCd: 'U'
      
      if (itemCd.startsWith('KE2NT')) {
        // List of valid KRA unit codes to determine extraction length
        const KRA_UNIT_CODES = [
          '4B', 'AV', 'BA', 'BE', 'BG', 'BL', 'BLL', 'BX', 'CA', 'CEL', 'CMT', 'CR', 'DR', 'DZ',
          'GLL', 'GRM', 'GRO', 'KG', 'KTM', 'KWT', 'L', 'LBR', 'LK', 'LTR', 'M', 'M2', 'M3',
          'MGM', 'MTR', 'MWT', 'NO', 'NX', 'PA', 'PG', 'PR', 'RL', 'RO', 'SET', 'ST', 'TNE', 'TU', 'U', 'YRD'
        ]
        
        // Try to extract unit code by checking different lengths
        let extractedUnitCode = ''
        
        // First try 2 characters (for codes like KG, BG, etc.)
        const twoCharCode = itemCd.substring(5, 7)
        if (KRA_UNIT_CODES.includes(twoCharCode)) {
          extractedUnitCode = twoCharCode
        } else {
          // Try 1 character (for codes like U, L, etc.)
          const oneCharCode = itemCd.substring(5, 6)
          if (KRA_UNIT_CODES.includes(oneCharCode)) {
            extractedUnitCode = oneCharCode
          }
        }
        
        if (extractedUnitCode) {
          qtyUnitCd = extractedUnitCode
        }
        
        pkgUnitCd = 'NT'  // Always "NT" as specified
      }
      
      console.log(`Parsed itemCd: ${itemCd} -> pkgUnitCd: ${pkgUnitCd}, qtyUnitCd: ${qtyUnitCd}`)
    } catch (error) {
      console.warn(`Failed to parse itemCd: ${itemCd}, using defaults`, error)
    }
  }
  
  return { pkgUnitCd, qtyUnitCd }
}

async function getNextInvoiceNo() {
  // You should store and increment this in your DB for true uniqueness
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('trdInvcNo')
    .order('trdInvcNo', { ascending: false })
    .limit(1)
  let next = 1
  if (data && data.length > 0) {
    next = (data[0].trdInvcNo || 0) + 1
  }
  // Optionally, insert the new invoice number here for atomicity
  return next
}

async function getNextInvoiceNoForRetry(orgInvcNo: number) {
  // For retry, increment from the original invoice's trdInvcNo
  return orgInvcNo;
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

    const { orderData } = await req.json()
    const { items, totalAmount, discount } = orderData

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const saleId = await getNextInvoiceNo()
    const invcNo = saleId
    const cfmDt = formatDateTime(new Date())
    const salesDt = formatDate(new Date())
    const totItemCnt = items.length



    // Calculate totals
    // let taxblAmtB = 0
    // let taxAmtB = 0
    // let totalOrderValue = 0


    // Normalize numeric inputs and compute base sums for discount proration
    const discountAmount: number = typeof discount === 'object' && discount !== null
      ? Number(discount.amount || 0)
      : Number(discount || 0)

    // Compute original (pre-discount) line totals and base sum
    const originalLineTotals: number[] = (items as any[]).map((item: any) => {
      const qty = Number(item.quantity || 0)
      const unitPrice = Number(item.unit_price || 0)
      // Prefer explicit total_price if provided, else derive
      const lineTotal = item.total_price != null ? Number(item.total_price) : unitPrice * qty
      return isFinite(lineTotal) ? lineTotal : 0
    })
    const baseSum = originalLineTotals.reduce((s, v) => s + v, 0)

    const normalizedTotalAmount = Number(totalAmount != null ? totalAmount : baseSum)

    const calculateTaxByType = (items: any[]) => {
      // console.log("from calculate Tax types: ", items)
      let taxblAmtA = 0, taxblAmtB = 0, taxblAmtC = 0, taxblAmtD = 0, taxblAmtE = 0
      let taxAmtA = 0, taxAmtB = 0, taxAmtC = 0, taxAmtD = 0, taxAmtE = 0

      items.forEach((item, idx) => {
        const taxType = item.taxTyCd || 'B'
        const originalAmount = originalLineTotals[idx] || 0
        // Prorate discount across items using baseSum (pre-discount total)
        const itemDiscountAmount = baseSum > 0 ? (originalAmount / baseSum) * discountAmount : 0
        const discountedAmount = Math.max(0, originalAmount - itemDiscountAmount)
        // console.log("Discounted amount: ", discountedAmount)
        
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

      // console.log("at the down of calculate: ", {
      //   taxblAmtA, taxblAmtB, taxblAmtC, taxblAmtD, taxblAmtE,
      //   taxAmtA, taxAmtB, taxAmtC, taxAmtD, taxAmtE
      // })

      return {
        taxblAmtA, taxblAmtB, taxblAmtC, taxblAmtD, taxblAmtE,
        taxAmtA, taxAmtB, taxAmtC, taxAmtD, taxAmtE
      }
    }

    const taxBreakdown = calculateTaxByType(items)

    // Calculate total taxable amount and total tax
    const totalTaxblAmt = taxBreakdown.taxblAmtA + taxBreakdown.taxblAmtB + taxBreakdown.taxblAmtC + taxBreakdown.taxblAmtD + taxBreakdown.taxblAmtE
    const totalTaxAmt = taxBreakdown.taxAmtA + taxBreakdown.taxAmtB + taxBreakdown.taxAmtC + taxBreakdown.taxAmtD + taxBreakdown.taxAmtE




    // const itemList = items.map((item: any, index: number) => {
    //   const { pkgUnitCd, qtyUnitCd } = parseItemCd(item.itemCd)
      
    //   // Calculate tax for this item (16% for tax type B)
    //   const itemTaxAmount = item.taxTyCd === 'B' ? Math.round(item.total_price * 0.16) : 0
    //   const itemTaxableAmount = item.total_price - itemTaxAmount

    //   taxblAmtB += itemTaxableAmount
    //   taxAmtB += itemTaxAmount
    //   totalOrderValue += item.total_price

    //   return {
    //     itemSeq: index + 1,
    //     itemCd: item.itemCd,
    //     itemClsCd: item.itemClsCd,
    //     itemNm: item.name,
    //     bcd: null,
    //     pkgUnitCd,
    //     pkg: 1,
    //     qtyUnitCd,
    //     qty: item.quantity,
    //     itemExprDt: null,
    //     prc: item.unit_price,
    //     splyAmt: item.total_price,
    //     dcAmt: 0,
    //     dcRt: 0,
    //     taxblAmt: itemTaxableAmount,
    //     taxTyCd: item.taxTyCd,
    //     taxAmt: itemTaxAmount,
    //     totAmt: item.total_price
    //   }
    // })

    // Overall total should be sum of discounted line totals
    const totAmt = ((): number => {
      if (!items || items.length === 0) return 0
      let sum = 0
      items.forEach((item: any, idx: number) => {
        const originalAmount = originalLineTotals[idx] || 0
        const itemDiscountAmount = baseSum > 0 ? (originalAmount / baseSum) * discountAmount : 0
        const discountedAmount = Math.max(0, originalAmount - itemDiscountAmount)
        sum += discountedAmount
      })
      return Number(sum.toFixed(2))
    })()

    // Get customer info from the first item or use defaults
    const firstItem = items[0]
    const custTin = firstItem?.customer_tin || null
    const custNm = firstItem?.customer_name || null

    // Determine payment type
    let pmtTyCd = '01' // Default to cash
    if (firstItem?.payment_method) {
      switch (firstItem.payment_method) {
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

    // Get recipe names for modrId and regrId
    const recipeNames = items.map((item: any) => item.name).join(', ')
    const recipeNamesShort = items.map((item: any) => item.name.substring(0, 10)).join(',')

    // Store order in database
    // const { data: storedOrderData, error: orderError } = await supabase
    //   .from('sales_invoices')
    //   .insert({
    //     trdInvcNo: saleId,
    //     invcNo,
    //     orgInvcNo: invcNo || 0,
    //     custTin,
    //     custNm,
    //     salesTyCd: 'N',
    //     rcptTyCd: 'S',
    //     pmtTyCd,
    //     salesSttsCd: '02',
    //     cfmDt,
    //     salesDt,
    //     totItemCnt,
    //     taxblAmtB,
    //     taxRtB: 16,
    //     taxAmtB,
    //     totTaxblAmt: taxblAmtB,
    //     totTaxAmt: taxAmtB,
    //     prchrAcptcYn: 'N',
    //     totAmt,
    //     totDcAmt: discount?.amount || 0,
    //     totDcRt: discount?.amount && totalOrderValue > 0 ? Math.round((discount.amount / totalOrderValue) * 100) : 0,
    //     kra_status: 'pending',
    //     kra_response: null,
    //     items: items.map((item: any) => ({
    //       name: item.name,
    //       quantity: item.quantity,
    //       unitPrice: item.unit_price,
    //       totalPrice: item.total_price,
    //       discountAmount: item.dcAmt,
    //       discountRate: item.dcRt,
    //       finalTotal: item.totAmt
    //     }))
    //   })
    //   .select()
    //   .single()

    // if (orderError) {
    //   console.error('Error storing order:', orderError)
    //   return NextResponse.json({ error: 'Failed to store order' }, { status: 500 })
    // }

    const payload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      cmcKey: headers.cmcKey,
      trdInvcNo: saleId,
      invcNo,
      orgInvcNo: invcNo || 0,
      custTin,
      custNm,
      salesTyCd: 'N', 
      rcptTyCd: 'S', // Standard Receipt
      pmtTyCd,
      salesSttsCd: '02', // Approved
      cfmDt,
      salesDt,
      totItemCnt,
      taxblAmtB: taxBreakdown.taxblAmtB,
      taxRtA: 0, // Exempt rate
      taxRtB: 16, // Standard VAT rate
      taxRtC: 0, // Zero-rated rate
      taxRtD: 0, // Non-VAT rate
      taxRtE: 8, // Reduced rate
      taxAmtB: Number(taxBreakdown.taxAmtB.toFixed(2)),
      taxAmtC: Number(taxBreakdown.taxAmtC.toFixed(2)),
      taxAmtD: Number(taxBreakdown.taxAmtD.toFixed(2)),
      taxAmtA: Number(taxBreakdown.taxAmtA.toFixed(2)),
      taxAmtE: Number(taxBreakdown.taxAmtE.toFixed(2)),
      totTaxblAmt:  Number(totalTaxblAmt.toFixed(2)),
      totTaxAmt: Number(totalTaxAmt.toFixed(2)),
      prchrAcptcYn: 'N',
      totAmt,
      receipt: {
        custTin,
        rcptPbctDt: cfmDt,
        prchrAcptcYn: 'N',
      },
      // Additional KRA fields as requested
      taxblAmtA: taxBreakdown.taxblAmtA,
      modrId: "11999",
      regrNm: recipeNames,
      regrId: "99911",
      taxblAmtD: taxBreakdown.taxblAmtD,
      taxblAmtE:taxBreakdown.taxblAmtE,
      taxblAmtC:taxBreakdown.taxblAmtC,
      modrNm: recipeNames,
      itemList: items.map((item: any, index: number) => {
        const { pkgUnitCd, qtyUnitCd } = parseItemCd(item.itemCd)
        const qty = Number(item.quantity || 0)
        const unitPrice = Number(item.unit_price || 0)
        const lineTotal = item.total_price != null ? Number(item.total_price) : unitPrice * qty
        const originalAmount = isFinite(lineTotal) ? lineTotal : 0
        const taxType = item.taxTyCd || 'B'

        // Calculate discount for this item (proportional to pre-discount amount)
        const itemDiscountAmount = baseSum > 0 ? (originalAmount / baseSum) * discountAmount : 0
        const discountedAmount = Math.max(0, originalAmount - itemDiscountAmount)

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
          itemCd: item.itemCd,
          itemClsCd: item.itemClsCd,
          itemNm: item.name,
          bcd: null,
          pkgUnitCd: pkgUnitCd, // Standard packaging unit
          pkg: 1,
          qtyUnitCd: qtyUnitCd || 'U',
          qty: qty,
          prc: unitPrice,
          splyAmt: Number(discountedAmount.toFixed(2)), // Discounted supply amount
          dcRt: originalAmount > 0 ? Number(((itemDiscountAmount / originalAmount) * 100).toFixed(2)) : 0, // Discount rate (number)
          dcAmt: Number(itemDiscountAmount.toFixed(2)), // Discount amount for this item - fixed to 2 decimals
          isrccCd: null,
          isrccNm: null,
          isrcRt: null,
          isrcAmt: null,
          taxTyCd: taxType,
          taxblAmt: Number(discountedAmount.toFixed(2)), // Taxable amount after discount
          taxAmt: Number(taxAmount.toFixed(2)), // Tax amount on discounted amount - fixed to 2 decimals
          totAmt: Number(discountedAmount.toFixed(2)) // Total amount after discount
        }
      })
    }

    console.log("Payload:", payload)

    // Call KRA API with dynamic headers
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: headers as unknown as Record<string, string>,
      body: JSON.stringify(payload),
    })
    
    const kraData = await kraRes.json()
    // console.log("receipt KRA: ", kraData)
    if (kraData.resultCd !== '000') {
      // Log error for manual intervention
      return NextResponse.json({ error: kraData.resultMsg || 'KRA sale failed', kraData, invcNo, saleId }, { status: 400 })
    }

    // Update the order with KRA response
    // const { error: updateError } = await supabase
    //   .from('sales_invoices')
    //   .update({
    //     kra_status: 'success',
    //     kra_response: kraData,
    //     kra_curRcptNo: kraData.data?.curRcptNo || null
    //   })
    //   .eq('trdInvcNo', saleId)

    // if (updateError) {
    //   console.error('Error updating order with KRA response:', updateError)
    // }

    return NextResponse.json({ success: true, kraData, invcNo, saleId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 