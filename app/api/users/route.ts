import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getKRAHeaders } from '@/lib/kra-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function GET() {
  const { data } = await supabase.from('users').select('id, name, role, active, kra_status, kra_submission_date');
  return NextResponse.json({ users: data || [] });
}

export async function POST(req: NextRequest) {
  // Bootstrap: allow creating the first user when none exist
  const { count, error: countError } = await supabase.from('users').select('id', { count: 'exact', head: true });
  const isBootstrap = !countError && (count === 0 || count === null);

  let user: any = null;
  const token = req.cookies.get('session')?.value;
  if (!isBootstrap) {
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (typeof user !== 'object' || !user || !('role' in user)) {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 401 });
    }
    if (!(user.role === 'owner' || user.role === 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  const { name, role, passcode, sendToKRA, branchUserData } = await req.json();
  
  // Handle branch user creation for KRA
  if (!isBootstrap && sendToKRA && branchUserData) {
    try {
      // Get dynamic KRA headers
      const { success: headersSuccess, headers, error: headersError } = await getKRAHeaders()
      
      if (!headersSuccess || !headers) {
        return NextResponse.json({ 
          error: headersError || 'Failed to get KRA credentials. Please initialize your device first.' 
        }, { status: 400 })
      }

      // Validate required fields for KRA
      if (!branchUserData.userId || !branchUserData.userNm || !branchUserData.pwd) {
        return NextResponse.json({ 
          error: 'userId, userNm, and pwd are required fields for KRA branch user' 
        }, { status: 400 })
      }

      // Prepare KRA payload with dynamic headers and default values
      const kraPayload = {
        userId: branchUserData.userId,
        userNm: branchUserData.userNm,
        pwd: branchUserData.pwd,
        adrs: branchUserData.adrs || null,
        cntc: branchUserData.cntc || null,
        authCd: branchUserData.authCd || null,
        remark: branchUserData.remark || null,
        useYn: branchUserData.useYn || 'Y',
        regrNm: branchUserData.regrNm || 'Admin',
        regrId: branchUserData.regrId || 'Admin',
        modrNm: branchUserData.modrNm || 'Admin',
        modrId: branchUserData.modrId || 'Admin'
      }

      console.log("KRA Branch User Payload:", JSON.stringify(kraPayload, null, 2))

      // Call KRA API with dynamic headers
      const kraRes = await fetch('https://etims-api-sbx.kra.go.ke/etims-api/saveBhfUser', {
        method: 'POST',
        headers: headers as unknown as Record<string, string>,
        body: JSON.stringify(kraPayload),
      })
      
      const kraData = await kraRes.json()
      console.log("KRA Branch User Response:", kraData)

      if (kraData.resultCd !== '000') {
        return NextResponse.json({ 
          error: kraData.resultMsg || 'KRA branch user save failed', 
          kraData 
        }, { status: 400 })
      }

      // Update user's KRA status in database using the original user ID
      if (branchUserData.originalUserId) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            kra_status: 'ok', 
            kra_submission_date: new Date().toISOString() 
          })
          .eq('id', branchUserData.originalUserId) // Use the original full UUID

        if (updateError) {
          console.error('Error updating user KRA status:', updateError)
          // Don't fail the request, just log the error
        }
      }

      return NextResponse.json({ 
        success: true, 
        kraData,
        message: 'Branch user account saved to KRA successfully'
      })

    } catch (error: any) {
      console.error('KRA Branch User Error:', error)
      return NextResponse.json({ 
        error: error.message || 'Internal error' 
      }, { status: 500 })
    }
  }
  
  // Handle regular user creation
  if (!name || !role || !passcode) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const passcode_hash = await bcrypt.hash(passcode, 10);
  const { data, error } = await supabase.from('users').insert([{ name, role, passcode_hash, active: true }]).select('id, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
} 