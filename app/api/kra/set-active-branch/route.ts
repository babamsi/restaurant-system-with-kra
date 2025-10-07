import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { tin, bhfId, cmcKey } = await req.json()
    if (!tin || !bhfId) {
      return NextResponse.json({ error: 'tin and bhfId are required' }, { status: 400 })
    }

    let resolvedCmcKey = cmcKey
    if (!resolvedCmcKey) {
      const { data: latest, error: latestError } = await supabase
        .from('kra_registrations')
        .select('cmc_key')
        .eq('registration_type', 'device_init')
        .eq('kra_status', 'success')
        .not('cmc_key', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (latestError) {
        return NextResponse.json({ error: 'No existing CMC Key found. Please provide cmcKey.' }, { status: 400 })
      }
      resolvedCmcKey = latest?.cmc_key
    }

    if (!resolvedCmcKey) {
      return NextResponse.json({ error: 'cmcKey is required' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('kra_registrations')
      .insert([{
        registration_type: 'device_init',
        tin,
        bhf_id: bhfId,
        cmc_key: resolvedCmcKey,
        kra_status: 'success'
      }])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}



