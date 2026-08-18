import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Matches localhost/loopback and RFC1918 / link-local IP literals so the
// composer's link-preview fetch can't be used to probe internal network or
// cloud-metadata addresses (e.g. 169.254.169.254) from the server.
const BLOCKED_HOST_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|\[?::1\]?)$/i

const MAX_BYTES = 300_000

function metaContent(html: string, prop: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1]
  }
  return null
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const target = request.nextUrl.searchParams.get('url')
  if (!target) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || BLOCKED_HOST_RE.test(parsed.hostname)) {
    return NextResponse.json({ error: 'url not allowed' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CommsDeskLinkPreview/1.0)' },
    })
    if (!res.ok || !res.body) return NextResponse.json({ error: 'fetch failed' }, { status: 502 })

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let html = ''
    let bytes = 0
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break
    }
    reader.cancel().catch(() => {})

    const title = metaContent(html, 'og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null
    const description = metaContent(html, 'og:description') || metaContent(html, 'description')
    let image = metaContent(html, 'og:image')
    if (image) {
      try {
        image = new URL(image, parsed).toString()
      } catch {
        image = null
      }
    }

    return NextResponse.json({
      title: title?.trim() || null,
      description: description?.trim() || null,
      image,
      domain: parsed.hostname.replace(/^www\./, ''),
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
