import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { makeCommsCookieValue, SESSION_COOKIE, MAX_AGE } from '@/lib/comms-auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  const { ok, data } = await commsApi.login(username, password)

  if (!ok || !data) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const cookieValue = await makeCommsCookieValue({
    userId: data.userId,
    username: data.username,
    displayName: data.displayName,
    role: data.role,
  })

  const res = NextResponse.json({ ok: true, role: data.role })
  res.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
    // Explicit Domain so the session survives wcky's /comms edge rewrite —
    // the browser's URL bar stays williamckyomes.com even though this app
    // is served from comms-desk.vercel.app underneath.
    domain: process.env.COOKIE_DOMAIN || undefined,
  })
  return res
}
