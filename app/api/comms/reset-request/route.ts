import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'

export async function POST(request: NextRequest) {
  const { username } = await request.json()
  await commsApi.resetRequest(username)
  // Always the same response — no enumeration of valid usernames.
  return NextResponse.json({ ok: true })
}
