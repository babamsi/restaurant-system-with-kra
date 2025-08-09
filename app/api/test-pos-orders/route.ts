import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Get test POS orders from database
    const { data: orders, error } = await supabase
      .from('test_pos_invoices')
      .select('*')
    //   .not('is_refund', 'eq', true) // Exclude refund records
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching test POS orders:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch orders' 
      }, { status: 500 })
    }

    console.log('orders', orders)   

    // Transform orders to match the frontend interface
    const transformedOrders = orders?.map(order => ({
      id: order.trdInvcNo.toString(),
      items: order.items || [],
      subtotal: order.totTaxblAmt || 0,
      tax: order.totTaxAmt || 0,
      total: order.totAmt || 0,
      paymentMethod: order.pmtTyCd || 'cash',
      customer: order.custTin ? {
        id: order.custTin,
        name: order.custNm || 'Walk-in Customer',
        kra_pin: order.custTin,
        phone: null,
        email: null
      } : null,
      discountAmount: order.totDcAmt || 0,
      discountType: order.totDcRt > 0 ? 'percentage' : 'fixed',
      status: order.kra_status === 'success' ? 'completed' : 
              order.kra_status === 'refunded' ? 'refunded' : 'pending',
      createdAt: order.created_at,
      stockOutProcessed: order.stock_out_processed || false,
      stockOutResults: order.stock_out_results,
      stockOutTimestamp: order.stock_out_timestamp,
      refundTrdInvcNo: order.refund_trdInvcNo,
      refundInvcNo: order.refund_invcNo,
      refundTimestamp: order.refund_timestamp
    })) || []

    return NextResponse.json({ 
      success: true, 
      orders: transformedOrders 
    })

  } catch (error: any) {
    console.error('Error in test POS orders API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error' 
    }, { status: 500 })
  }
} 