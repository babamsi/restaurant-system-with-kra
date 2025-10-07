import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Insert a marker row that clears active credentials by making latest device_init empty
    const { error } = await supabase
      .from('kra_registrations')
      .insert([{
        registration_type: 'device_init',
        tin: '',
        bhf_id: '',
        cmc_key: '',
        kra_status: 'failed',
        kra_response: { message: 'manual logout' }
      }])

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}



