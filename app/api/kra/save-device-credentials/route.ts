import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { tin, bhfId, cmcKey } = await req.json()
    if (!tin || !bhfId || !cmcKey) {
      return NextResponse.json({ error: 'tin, bhfId and cmcKey are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kra_registrations')
      .insert([{
        registration_type: 'device_init',
        tin,
        bhf_id: bhfId,
        cmc_key: cmcKey,
        kra_status: 'success'
      }])
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


