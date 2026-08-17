import { NextRequest, NextResponse } from 'next/server'
import mjml2html from 'mjml'
import { commsApi, type BatchSendItem } from '@/lib/comms-api'
import { getSession } from '@/lib/session'
import { blocksToMjml, type Block } from '@/lib/mjml-blocks'

// blocksToMjml's 'text' block doesn't escape its content (the block editor
// only ever feeds it plain-textarea input, so that's never mattered before).
// Claude.ai-authored batch copy is far more likely to contain a bare "&" or
// "<" than anything typed by hand, so escape it here before wrapping —
// contained to this route, not a change to the shared block renderer.
function escapeForMjml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { items } = await request.json()
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items (array) required' }, { status: 400 })
  }

  const prepared: BatchSendItem[] = await Promise.all(
    items.map(async (item: BatchSendItem) => {
      if (item.platform !== 'brevo') return item
      const block: Block = { id: crypto.randomUUID(), type: 'text', content: escapeForMjml(item.body_text) }
      const { html } = await mjml2html(blocksToMjml([block]), { validationLevel: 'soft' })
      return { ...item, body_text: html }
    }),
  )

  const { ok, data, status } = await commsApi.batchCreateSends(session.userId, prepared)
  if (!ok || !data) return NextResponse.json({ error: 'upstream error' }, { status: status || 502 })
  return NextResponse.json(data)
}
