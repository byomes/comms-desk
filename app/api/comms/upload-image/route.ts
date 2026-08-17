import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { filename, contentBase64, kind } = await request.json()
  const { ok, data, status } = await commsApi.uploadImage(filename, contentBase64, kind)
  if (!ok) return NextResponse.json({ error: 'upload failed' }, { status: status || 502 })
  return NextResponse.json(data)
}
