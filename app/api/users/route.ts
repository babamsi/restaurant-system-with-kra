import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function GET() {
  const { data } = await supabase.from('users').select('id, name, role, active');
  return NextResponse.json({ users: data || [] });
}

export async function POST(req: NextRequest) {
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
  const { name, role, passcode } = await req.json();
  if (!name || !role || !passcode) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const passcode_hash = await bcrypt.hash(passcode, 10);
  const { data, error } = await supabase.from('users').insert([{ name, role, passcode_hash }]).select('id, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
} 