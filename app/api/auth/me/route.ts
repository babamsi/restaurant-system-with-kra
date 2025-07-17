import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
} 