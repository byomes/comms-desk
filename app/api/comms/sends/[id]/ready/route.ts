import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { sendNow } = await request.json()
  const { ok, data, status } = await commsApi.markReady(Number(params.id), session.userId, !!sendNow)
  if (!ok) return NextResponse.json({ error: 'failed' }, { status: status || 502 })
  return NextResponse.json(data)
}
