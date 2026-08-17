import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const fields = await request.json()
  const { ok, data, status } = await commsApi.editSend(Number(params.id), session.userId, fields)
  if (!ok) return NextResponse.json({ error: 'edit failed' }, { status: status || 502 })
  return NextResponse.json(data)
}
