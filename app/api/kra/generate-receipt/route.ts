import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('table_orders')
      .select(`
        *,
        items:table_order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate HTML receipt
    const receiptHtml = generateReceiptHTML(order)

    // For now, return the HTML. In production, you'd use a PDF library like puppeteer
    return NextResponse.json({ 
      success: true, 
      html: receiptHtml,
      message: 'Receipt generated successfully'
    })

  } catch (error: any) {
    console.error('Receipt Generation Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
}

function generateReceiptHTML(order: any): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString()
  const timeStr = now.toLocaleTimeString()
  
  const subtotal = order.items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0
  const taxAmount = Math.round((subtotal * 16) / 100)
  const total = subtotal

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>KRA Receipt - ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .receipt { max-width: 300px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        .kra-info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h2>KRA RECEIPT</h2>
          <p>Receipt No: ${order.kra_invoice_no || order.id}</p>
          <p>Date: ${dateStr} ${timeStr}</p>
        </div>
        
        <div class="kra-info">
          <p><strong>KRA TIN:</strong> [Your TIN]</p>
          <p><strong>Business Name:</strong> [Your Business Name]</p>
        </div>
        
        <div>
          <p><strong>Customer:</strong> ${order.customer_name || 'Walk-in Customer'}</p>
          <p><strong>Table:</strong> ${order.table_number || 'Takeaway'}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>Items:</h3>
          ${order.items?.map((item: any) => `
            <div class="item">
              <span>${item.menu_item_name} x${item.quantity}</span>
              <span>Ksh ${item.total_price?.toFixed(2) || '0.00'}</span>
            </div>
          `).join('') || ''}
        </div>
        
        <div class="total">
          <div class="item">
            <span>Subtotal:</span>
            <span>Ksh ${subtotal.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>VAT (16%):</span>
            <span>Ksh ${taxAmount.toFixed(2)}</span>
          </div>
          <div class="item" style="font-weight: bold; font-size: 18px;">
            <span>Total:</span>
            <span>Ksh ${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a KRA compliant receipt</p>
        </div>
      </div>
    </body>
    </html>
  `
}