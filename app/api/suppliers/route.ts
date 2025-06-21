import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/database'

export async function GET() {
  try {
    const result = await databaseService.suppliers.getAll()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: result.data || [],
      success: true
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const result = await databaseService.suppliers.create({
      name: body.name,
      contact_person: body.contact_person || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      postal_code: body.postal_code || null,
      tax_id: body.tax_id || null,
      payment_terms: body.payment_terms || null,
      credit_limit: body.credit_limit || null,
      current_balance: body.current_balance || 0,
      status: body.status || 'active'
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: result.data,
      success: true
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
} 