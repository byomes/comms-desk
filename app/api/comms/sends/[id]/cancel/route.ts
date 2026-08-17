import { NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ok, data, status } = await commsApi.cancelSend(Number(params.id), session.userId)
  if (!ok) return NextResponse.json({ error: 'failed' }, { status: status || 502 })
  return NextResponse.json(data)
}
