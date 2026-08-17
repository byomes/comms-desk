import { NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ok, data, status } = await commsApi.getBrevoLists(session.userId)
  if (!ok) return NextResponse.json({ error: 'upstream error' }, { status: status || 502 })
  return NextResponse.json(data)
}
