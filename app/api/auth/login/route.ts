import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function POST(req: NextRequest) {
  const { user_id, passcode } = await req.json();
  if (!user_id || !passcode) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .eq('active', true)
    .single();
  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const valid = await bcrypt.compare(passcode, user.passcode_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }
  // Create JWT
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  return res;
} 