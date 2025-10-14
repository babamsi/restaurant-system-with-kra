import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getKRAHeaders } from '@/lib/kra-utils'

// Parse itemCd to derive KRA unit codes (kept consistent with save-sale route)
function parseItemCd(itemCd: string): { pkgUnitCd: string; qtyUnitCd: string } {
  let pkgUnitCd = 'NT'
  let qtyUnitCd = 'U'
  if (itemCd && itemCd.length >= 8) {
    try {
      if (itemCd.startsWith('KE2NT')) {
        const KRA_UNIT_CODES = [
          '4B','AV','BA','BE','BG','BL','BLL','BX','CA','CEL','CMT','CR','DR','DZ',
          'GLL','GRM','GRO','KG','KTM','KWT','L','LBR','LK','LTR','M','M2','M3',
          'MGM','MTR','MWT','NO','NX','PA','PG','PR','RL','RO','SET','ST','TNE','TU','U','YRD'
        ]
        let extractedUnitCode = ''
        const twoCharCode = itemCd.substring(5, 7)
        if (KRA_UNIT_CODES.includes(twoCharCode)) {
          extractedUnitCode = twoCharCode
        } else {
          const oneCharCode = itemCd.substring(5, 6)
          if (KRA_UNIT_CODES.includes(oneCharCode)) {
            extractedUnitCode = oneCharCode
          }
        }
        if (extractedUnitCode) qtyUnitCd = extractedUnitCode
        pkgUnitCd = 'NT'
      }
    } catch {}
  }
  return { pkgUnitCd, qtyUnitCd }
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

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate())
  )
}

// Get next invoice number by incrementing the latest numeric trdInvcNo
async function getNextRefundInvoiceNo(): Promise<number> {
  // Fetch latest invoice with numeric trdInvcNo
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('trdInvcNo')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return 1

  // Find the first numeric trdInvcNo in recent rows
  const numeric = (data || [])
    .map((row: any) => row?.trdInvcNo)
    .filter((v: any) => typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v)))
  if (numeric.length === 0) return 1

  const latest = numeric[0]
  const latestNum = typeof latest === 'number' ? latest : parseInt(latest, 10)
  return latestNum + 1
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

    

    const { orderId, refundItems } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the original order details with items for building refund itemList
    const { data: order, error: orderError } = await supabase
      .from('table_orders')
      .select('*, items:table_order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get the ORIGINAL sale invoice (first one created for this order) - not the most recent
    // This ensures we always reference the original sale's KRA receipt, not a previous refund's receipt
    const { data: saleInvoices, error: saleError } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }) // Get the FIRST (oldest) record
      .limit(1)
      .maybeSingle()

    if (saleError || !saleInvoices) {
      return NextResponse.json({ error: 'Original sale invoice not found' }, { status: 404 })
    }

    // Always use the ORIGINAL sale's KRA receipt number for all refunds of this order
    const originalKraReceiptNo = Number((saleInvoices as any).kra_curRcptNo || (saleInvoices as any).orgInvcNo)
    console.log(`Refund for Order ${orderId} - Using ORIGINAL KRA Receipt: ${originalKraReceiptNo} (from first sale invoice)`)

    // Get next refund invoice number (numeric and continuous)
    const refundInvoiceNo = await getNextRefundInvoiceNo()
    const refundTrdInvcNo = refundInvoiceNo

    // Format dates
    const now = new Date()
    const cfmDt = formatDateTime(now)
    const salesDt = formatDate(now)

    // Payment type code mapping
    const paymentTypeMap: Record<string, string> = {
      cash: '01',
      card: '05',
      mobile: '06',
    }
    const pmtTyCd = paymentTypeMap[(saleInvoices as any)?.payment_method || order.payment_method] || '01'

    // Build selected items from order (full or partial), then enrich with recipe KRA codes
    const orderItems: any[] = (order as any)?.items || []
    let selected: Array<{ orderItem: any; qty: number }> = []
    if (Array.isArray(refundItems) && refundItems.length > 0) {
      const desiredByName = new Map<string, number>()
      refundItems.forEach((ri: any) => {
        const name = String(ri.menu_item_name || '').trim()
        const q = Number(ri.quantity) || 0
        if (!name || q <= 0) return
        desiredByName.set(name, (desiredByName.get(name) || 0) + q)
      })
      orderItems.forEach((it: any) => {
        const name = String(it.menu_item_name || it.name || '').trim()
        const desired = desiredByName.get(name) || 0
        if (desired <= 0) return
        const useQty = Math.min(Number(it.quantity) || 0, desired)
        if (useQty > 0) {
          selected.push({ orderItem: it, qty: useQty })
          desiredByName.set(name, desired - useQty)
        }
      })
      selected = selected.filter(s => s.qty > 0)
      if (selected.length === 0) {
        return NextResponse.json({ error: 'No valid items found to refund' }, { status: 400 })
      }
    } else {
      selected = orderItems.map(it => ({ orderItem: it, qty: Number(it.quantity) || 0 })).filter(s => s.qty > 0)
    }

    // Fetch recipes to get KRA codes
    const recipeIds = Array.from(new Set(selected.map(s => s.orderItem.menu_item_id).filter(Boolean)))
    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes')
      .select('id, name, itemCd, itemClsCd, taxTyCd')
      .in('id', recipeIds)

    if (recipesError) {
      return NextResponse.json({ error: 'Failed to load recipe KRA codes' }, { status: 500 })
    }
    const recipeById = new Map<string, any>((recipesData || []).map(r => [r.id, r]))

    // Build itemList strictly using recipe-provided KRA fields
    const itemList = selected.map((sel, index) => {
      const it = sel.orderItem
      const recipe = recipeById.get(it.menu_item_id)
      if (!recipe || !recipe.itemCd || !recipe.itemClsCd) {
        throw new Error(`Missing KRA codes for item: ${it.menu_item_name || recipe?.name || it.menu_item_id}`)
      }
      const qty = Number(sel.qty) || 0
      const prc = Number(it.unit_price) || 0
        const splyAmt = prc * qty
      const itemCd = recipe.itemCd
      const { pkgUnitCd, qtyUnitCd } = parseItemCd(itemCd)
      const taxTyCd = recipe.taxTyCd || 'B'
        let taxAmt = 0
        switch (taxTyCd) {
          case 'B': taxAmt = splyAmt * 0.16; break
          case 'E': taxAmt = splyAmt * 0.08; break
          default: taxAmt = 0
        }
        return {
          itemSeq: index + 1,
        itemCd: itemCd,
        itemClsCd: recipe.itemClsCd,
        itemNm: it.menu_item_name || recipe.name,
          bcd: null,
        pkgUnitCd,
          dcAmt: 0,
          dcRt: 0,
        pkg: 1,
        qtyUnitCd: qtyUnitCd || 'U',
          qty,
          itemExprDt: null,
          prc: -prc,
          splyAmt: -splyAmt,
          totDcAmt: 0,
          taxblAmt: -splyAmt,
          taxTyCd,
          taxAmt: -Number(taxAmt.toFixed(2)),
          totAmt: -splyAmt
        }
      })

    // Dynamic tax breakdown across A-E (negative totals for refund)
    const totItemCnt = itemList.length
    let taxblAmtA = 0, taxblAmtB = 0, taxblAmtC = 0, taxblAmtD = 0, taxblAmtE = 0
    let taxAmtA = 0, taxAmtB = 0, taxAmtC = 0, taxAmtD = 0, taxAmtE = 0
    let totAmt = 0
    itemList.forEach((it) => {
      totAmt += it.totAmt
      switch (it.taxTyCd) {
        case 'A':
          taxblAmtA += it.taxblAmt
          taxAmtA += 0
          break
        case 'B':
          taxblAmtB += it.taxblAmt
          taxAmtB += it.taxAmt
          break
        case 'C':
          taxblAmtC += it.taxblAmt
          taxAmtC += 0
          break
        case 'D':
          taxblAmtD += it.taxblAmt
          taxAmtD += 0
          break
        case 'E':
          taxblAmtE += it.taxblAmt
          taxAmtE += it.taxAmt
          break
        default:
          taxblAmtB += it.taxblAmt
          taxAmtB += it.taxAmt
      }
    })
    const totTaxblAmt = taxblAmtA + taxblAmtB + taxblAmtC + taxblAmtD + taxblAmtE
    const totTaxAmt = taxAmtA + taxAmtB + taxAmtC + taxAmtD + taxAmtE

    const payload = {
      tin: headers.tin,
      bhfId: headers.bhfId,
      cmcKey: headers.cmcKey,
      trdInvcNo: refundTrdInvcNo,
      invcNo: refundInvoiceNo,
      orgInvcNo: originalKraReceiptNo, // Always reference the original sale's KRA receipt
      custTin: order.customer_tin,
      custNm: order.customer_name,
      salesTyCd: 'N',
      rcptTyCd: 'R', // Refund/Credit Note after Sale
      pmtTyCd,
      salesSttsCd: '02',
      cfmDt,
      salesDt,
      totItemCnt,
      taxblAmtB,
      taxRtA: 0,
      taxRtB: 16,
      taxRtC: 0,
      taxRtD: 0,
      taxRtE: 8,
      taxAmtB,
      taxAmtC,
      taxAmtD,
      taxAmtA,
      taxAmtE,
      totTaxblAmt: totTaxblAmt,
      totTaxAmt: totTaxAmt,
      prchrAcptcYn: 'N',
      totAmt,
      receipt: {
        custTin: order.customer_tin || 'A123456789Z',
        rcptPbctDt: cfmDt,
        prchrAcptcYn: 'N',
      },
      itemList,
      // Additional KRA fields
      taxblAmtA,
      modrId: 'Refund',
      regrNm: 'Refund',
      regrId: 'Refund',
      taxblAmtD,
      taxblAmtE,
      taxblAmtC,
      modrNm: 'Refund',
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

      // Track refunded items and update order status accordingly
      let newStatus = 'refunded' // Default to full refund
      
      if (Array.isArray(refundItems) && refundItems.length > 0) {
        // Partial refund - determine status based on refunded items vs total items
        const { data: orderItems } = await supabase
          .from('table_order_items')
          .select('id, quantity')
          .eq('order_id', orderId)

        if (orderItems && orderItems.length > 0) {
          // Calculate total quantities
          const totalOrderQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
          const refundedQuantity = refundItems.reduce((sum, item) => sum + item.quantity, 0)
          
          // If refunded quantity equals total order quantity, it's a full refund
          // Otherwise, it's a partial refund
          newStatus = refundedQuantity >= totalOrderQuantity ? 'refunded' : 'partially_refunded'
          
          console.log(`Refund Status Logic - Total Order Qty: ${totalOrderQuantity}, Refunded Qty: ${refundedQuantity}, Status: ${newStatus}`)
        }
      }

      // Update the original order status
      const { error: updateOrderError } = await supabase
        .from('table_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
    }

    // Store refund invoice
    const { error: insertError } = await supabase
      .from('sales_invoices')
      .insert({
        trdInvcNo: refundTrdInvcNo,
        orgInvcNo: originalKraReceiptNo, // Always reference the original sale's KRA receipt
        order_id: orderId,
        payment_method: order.payment_method,
        total_items: itemList.length,
        gross_amount: totAmt,
        net_amount: totAmt - totTaxAmt,
        tax_amount: totTaxAmt,
        kra_curRcptNo: kraData.data?.curRcptNo,
        kra_totRcptNo: kraData.data?.totRcptNo,
        kra_intrlData: kraData.data?.intrlData,
        kra_rcptSign: kraData.data?.rcptSign,
        kra_sdcDateTime: kraData.data?.sdcDateTime,
        kra_status: "Refund successful",
        kra_response: kraData,
        kra_error: null,
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