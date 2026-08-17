import { NextRequest, NextResponse } from 'next/server'
import mjml2html from 'mjml'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { mjml } = await request.json()
  if (typeof mjml !== 'string') {
    return NextResponse.json({ error: 'mjml (string) required' }, { status: 400 })
  }

  const result = mjml2html(mjml, { validationLevel: 'soft' })
  return NextResponse.json({
    html: result.html,
    errors: result.errors.map((e) => e.formattedMessage),
  })
}
