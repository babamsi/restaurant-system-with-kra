import { NextRequest, NextResponse } from 'next/server'
import { kraPurchaseSubmissionsService } from '@/lib/kra-purchase-submissions-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invcNo, tin } = body

    if (!invcNo || !tin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice number and TIN are required' 
      }, { status: 400 })
    }

    const result = await kraPurchaseSubmissionsService.isSubmissionSuccessful(invcNo, tin)

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to check submission status' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      isSubmitted: result.isSuccessful 
    })

  } catch (error: any) {
    console.error('Check Submission Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal error while checking submission status' 
    }, { status: 500 })
  }
} 