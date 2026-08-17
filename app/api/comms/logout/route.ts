import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/comms-auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  })
  return res
}
