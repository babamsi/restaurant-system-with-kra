import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TIN = "P052380018M"
const BHF_ID = "01"
const CMC_KEY = "34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3"

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
    const body = await req.json()
    // Expect: { items, payment, customer, saleId, orgInvcNo }
    const {
      items, // [{id, name, price, qty, itemCd, itemClsCd, ...}]
      payment, // { method: 'cash'|'mpesa'|'card'|'split', ... }
      customer, // { tin, name }
      saleId, // internal transaction id
      orgInvcNo = 0,
    } = body

    if (!items || !items.length || !payment || !saleId) {
      return NextResponse.json({ error: 'Missing required sale data' }, { status: 400 })
    }

    // Invoice number
    let invcNo: number;
    if (orgInvcNo && orgInvcNo > 0) {
      invcNo = await getNextInvoiceNoForRetry(orgInvcNo);
    } else {
      invcNo = await getNextInvoiceNo();
    }
    const now = new Date()
    const cfmDt = formatDateTime(now)
    const salesDt = formatDate(now)

    // Payment type code mapping
    const paymentTypeMap: Record<string, string> = {
      cash: '01',
      card: '02',
      mpesa: '05',
      split: '99', // custom code for split, adjust as needed
    }
    const pmtTyCd = paymentTypeMap[payment.method] || '01'

    // Customer info
    const custTin = customer?.tin || TIN
    const custNm = customer?.name || 'Walk-in Customer'

    // Calculate totals (all prices are tax-inclusive)
    let totItemCnt = items.length
    let taxblAmtB = 0, taxAmtB = 0, totAmt = 0
    const itemList = items.map((item: any, idx: number) => {
      const prc = item.price // tax-inclusive unit price
      const qty = item.qty
      // Reverse-calculate tax and supply amount
      const splyAmt = Math.round((prc * qty) / 1.16)
      const taxblAmt = splyAmt
      const taxAmt = Math.round((prc * qty) - splyAmt)
      const totItemAmt = prc * qty
      taxblAmtB += taxblAmt
      taxAmtB += taxAmt
      totAmt += totItemAmt
      return {
        itemSeq: idx + 1,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.name,
        pkgUnitCd: 'NT',
        pkg: 1,
        qtyUnitCd: 'U',
        qty,
        prc,
        splyAmt,
        taxTyCd: 'B',
        taxblAmt,
        taxAmt,
        dcAmt:0,
        dcRt:0,
        totAmt: totItemAmt,
      }
    })
    // Compose recipe names for modrID, modrNm, regrNm
    const recipeNames = items.map((item: any) => item.name).join(', ');
    const recipeNamesShort = recipeNames.slice(0, 20);

    const payload = {
      tin: TIN,
      bhfId: BHF_ID,
      cmcKey: CMC_KEY,
      trdInvcNo: saleId,
      invcNo,
      orgInvcNo,
      // custTin,
      // custNm,
      salesTyCd: 'N',
      rcptTyCd: 'S',
      pmtTyCd,
      salesSttsCd: '02',
      cfmDt,
      salesDt,
      totItemCnt,
      taxblAmtB,
      taxRtB: 18,
      taxAmtB,
      totTaxblAmt: taxblAmtB,
      totTaxAmt: taxAmtB,
      prchrAcptcYn: 'N',
      totAmt,
      receipt: {
        custTin,
        rcptPbctDt: cfmDt,
        prchrAcptcYn: 'N',
      },
      itemList,
      // Additional KRA fields as requested
      taxblAmtA: 0,
      taxRtE: 16,
      modrId: recipeNamesShort,
      regrNm: recipeNames,
      regrId: recipeNamesShort,
      taxblAmtD: 0,
      taxRtA: 0,
      taxAmtC: 0,
      taxAmtD: 0,
      taxAmtA: 0,
      taxblAmtE:0,
      taxblAmtC:0,
      modrNm: recipeNames,
      taxAmtE: 0,
      taxRtC: 0,
      taxRtD: 0,
    }


    console.log("Payload:", payload)

    // Call KRA API
    const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveTrnsSalesOsdc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', tin: TIN, bhfId: BHF_ID, cmcKey: CMC_KEY },
      body: JSON.stringify(payload),
    })
    const kraData = await kraRes.json()
    console.log("receipt KRA: ", kraData)
    if (kraData.resultCd !== '000') {
      // Log error for manual intervention
      return NextResponse.json({ error: kraData.resultMsg || 'KRA sale failed', kraData, invcNo }, { status: 400 })
    }

    // Optionally, store the invoice number and KRA receipt info in your DB here

    return NextResponse.json({ success: true, kraData, invcNo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
} 