import { NextRequest, NextResponse } from 'next/server'
import { commsApi } from '@/lib/comms-api'

export async function POST(request: NextRequest) {
  const { token } = await request.json()
  const { ok, data } = await commsApi.resetConfirm(token)
  if (!ok || !data) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
  }
  return NextResponse.json({ newPassword: data.newPassword })
}
