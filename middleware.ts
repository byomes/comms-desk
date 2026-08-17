import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/reset']

function getSecret(): string {
  return process.env.COMMS_SESSION_SECRET ?? 'dev-secret-change-me-in-production'
}

async function verifyHmac(token: string): Promise<{ role: string } | null> {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null

  const b64 = token.slice(0, lastDot)
  const hexSig = token.slice(lastDot + 1)

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b64))
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (hexSig.length !== expectedHex.length) return null
    let diff = 0
    for (let i = 0; i < hexSig.length; i++) {
      diff |= hexSig.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    }
    if (diff !== 0) return null

    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('comms_session')
  const session = cookie?.value ? await verifyHmac(cookie.value) : null

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/calendar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
