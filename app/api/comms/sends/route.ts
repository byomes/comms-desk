import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ok, data } = await commsApi.listSends(session.userId)
  if (!ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ok, data, status } = await commsApi.createSend(session.userId, body)
  if (!ok) return NextResponse.json({ error: 'create failed' }, { status: status || 502 })
  return NextResponse.json(data)
}
