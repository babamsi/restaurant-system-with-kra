import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { sales_invoice_id } = await req.json();
    if (!sales_invoice_id) {
      return NextResponse.json({ error: 'Missing sales_invoice_id' }, { status: 400 });
    }
    // 1. Fetch the failed sales invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('id', sales_invoice_id)
      .single();
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Failed to fetch sales invoice' }, { status: 404 });
    }
    // 2. Fetch the order and its items
    const { data: order, error: orderError } = await supabase
      .from('table_orders')
      .select('*, items:table_order_items(*)')
      .eq('id', invoice.order_id)
      .single();
    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to fetch order for this invoice' }, { status: 404 });
    }
    // 3. Prepare items for KRA
    let items = (order.items || []).map((item: any) => ({
      id: item.menu_item_id, // use the real UUID for recipe lookup
      name: item.menu_item_name,
      price: item.unit_price, // tax-inclusive
      qty: item.quantity,
      // itemCd and itemClsCd will be filled below
    }));
    // 4. Ensure all items have itemCd and itemClsCd
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemCd || !items[i].itemClsCd) {
        console.log('Fetching recipe for item:', items[i].id)
        const { data: recipe, error: recipeError } = await supabase
          .from('recipes')
          .select('itemCd, itemClsCd')
          .eq('id', items[i].id)
          .single();
        console.log('Recipe fetch result:', recipe, 'Error:', recipeError)
        if (recipe) {
          items[i].itemCd = recipe.itemCd;
          items[i].itemClsCd = recipe.itemClsCd;
        } else {
          console.warn('No recipe found for item id:', items[i].id)
        }
      }
    }
    if (items.some((i: any) => !i.itemCd)) {
      await supabase.from('sales_invoices').update({ kra_status: 'error', kra_error: 'One or more items missing KRA itemCd' }).eq('id', sales_invoice_id);
      return NextResponse.json({ error: 'One or more items are not KRA registered. Retry blocked.' }, { status: 400 });
    }
    // 5. Prepare payment and customer info
    const payment = { method: invoice.payment_method || 'cash' };
    const customer = { tin: '', name: order.customer_name || 'Walk-in Customer' };
    // 6. Call /api/kra/save-sale
    const kraRes = await fetch(`${req.nextUrl.origin}/api/kra/save-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        payment,
        customer,
        saleId: order.id,
        orgInvcNo: invoice.trdInvcNo || 0,
      }),
    });
    const kraData = await kraRes.json();
    if (!kraData.success) {
      await supabase.from('sales_invoices').update({ kra_status: 'error', kra_error: kraData.error || kraData.kraData?.resultMsg || 'KRA push failed', updated_at: new Date().toISOString() }).eq('id', sales_invoice_id);
      return NextResponse.json({ error: kraData.error || kraData.kraData?.resultMsg || 'KRA push failed' }, { status: 400 });
    }
    // 7. Update invoice as successful
    const { curRcptNo, totRcptNo, intrlData, rcptSign, sdcDateTime } = kraData.kraData.data
    await supabase.from('sales_invoices').update({ kra_status: 'ok', kra_error: null, kra_rcptSign: rcptSign, kra_sdcDateTime: sdcDateTime, kra_intrlData:intrlData, kra_curRcptNo: curRcptNo, kra_totRcptNo: totRcptNo, updated_at: new Date().toISOString() }).eq('id', sales_invoice_id);
    return NextResponse.json({ success: true, kraData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
} 