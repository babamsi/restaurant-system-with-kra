import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Customer {
  id: string
  name: string
  kra_pin: string
  phone: string | null
  email: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching all customers from database')

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,kra_pin.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Add pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to fetch customers from database' 
      }, { status: 500 })
    }

    console.log(`Successfully fetched ${customers?.length || 0} customers`)

    return NextResponse.json({ 
      success: true, 
      message: 'Customers fetched successfully',
      customers: customers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('Customers API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error while fetching customers' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, kra_pin, phone, email } = body

    // Validate required fields
    if (!name || !kra_pin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and KRA PIN are required' 
      }, { status: 400 })
    }

    console.log('Creating new customer:', { name, kra_pin })

    // Check if customer with same KRA PIN already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('id, name, kra_pin')
      .eq('kra_pin', kra_pin)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing customer:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing customer' 
      }, { status: 500 })
    }

    if (existingCustomer) {
      return NextResponse.json({ 
        success: false, 
        error: `Customer with KRA PIN ${kra_pin} already exists` 
      }, { status: 409 })
    }

    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        name: name.trim(),
        kra_pin: kra_pin.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null
      }])
      .select()
      .single()

    if (createError) {
      console.error('Error creating customer:', createError)
      return NextResponse.json({ 
        success: false, 
        error: createError.message || 'Failed to create customer' 
      }, { status: 500 })
    }

    console.log('Customer created successfully:', newCustomer.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Customer created successfully',
      customer: newCustomer
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create Customer API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error while creating customer' 
    }, { status: 500 })
  }
} 