import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  
  // Type guard for JwtPayload
  if (typeof user !== 'object' || !user || !('role' in user)) {
    return NextResponse.json({ error: 'Invalid session payload' }, { status: 401 });
  }
  
  if (!(user.role === 'owner' || user.role === 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, active, passcode_hash, kra_status, kra_submission_date')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  let requester;
  try {
    requester = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  // Type guard for JwtPayload
  if (typeof requester !== 'object' || !requester || !('role' in requester)) {
    return NextResponse.json({ error: 'Invalid session payload' }, { status: 401 });
  }
  // Only owner can edit owner
  const { data: user } = await supabase.from('users').select('role').eq('id', id).single();
  if (user?.role === 'owner' && requester.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can edit owner' }, { status: 403 });
  }
  const { name, role, passcode, active } = await req.json();
  const update: any = {};
  if (name) update.name = name;
  if (role) update.role = role;
  if (typeof active === 'boolean') update.active = active;
  if (passcode) update.passcode_hash = await bcrypt.hash(passcode, 10);
  const { data: updated, error } = await supabase.from('users').update(update).eq('id', id).select('id, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  let requester;
  try {
    requester = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  // Type guard for JwtPayload
  if (typeof requester !== 'object' || !requester || !('role' in requester)) {
    return NextResponse.json({ error: 'Invalid session payload' }, { status: 401 });
  }
  // Only owner can delete owner
  const { data: user } = await supabase.from('users').select('role').eq('id', id).single();
  if (user?.role === 'owner' && requester.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can delete owner' }, { status: 403 });
  }
  // Soft delete: set active = false
  const { data: updated, error } = await supabase.from('users').update({ active: false }).eq('id', id).select('id, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: updated });
} 