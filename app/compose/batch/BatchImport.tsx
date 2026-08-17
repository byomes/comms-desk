'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, Check, Mail, Camera, Sparkles } from 'lucide-react'
import FacebookGlyph from '../../components/icons/FacebookGlyph'
import type { BatchSendItem } from '@/lib/comms-api'

const INSTRUCTIONS = `Draft a series of Faith Makes Sense Facebook posts and/or emails as a JSON array, one object per post, in this exact shape:

[
  {
    "platform": "facebook" | "brevo",
    "segment": "public" | "general" | "donor" | "arc",
    "send_date": "YYYY-MM-DD",
    "subject": "only for platform: brevo",
    "body_text": "the post or email copy, plain text",
    "image_intent": "none" | "ai_quote" | "needs_manual",
    "quote_text": "only if image_intent is ai_quote — the exact pull-quote to render",
    "quote_attribution": "optional, defaults to Dr. Bill Yomes"
  }
]

Rules:
- "image_intent" only applies to platform: "facebook" — leave it "none" (or omit it) for brevo items.
- Use "ai_quote" when the post IS a pull-quote graphic — a short, punchy line worth rendering as its own branded quote card. Put that exact line in "quote_text".
- Use "needs_manual" when the post needs a real photo (an event, a person, a place) that can't be generated — Kaci will attach one before it goes out.
- Use "none" for a plain text post with no image.

Return ONLY the JSON array, no other text.`

const SEGMENT_LABEL: Record<string, string> = {
  public: 'Public',
  general: 'General list',
  donor: 'Donors',
  arc: 'ARC readers',
}

function IntentChip({ intent }: { intent?: string }) {
  if (intent === 'needs_manual') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <Camera size={11} strokeWidth={2.25} /> Needs photo
      </span>
    )
  }
  if (intent === 'ai_quote') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-700 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full">
        <Sparkles size={11} strokeWidth={2.25} /> AI quote card
      </span>
    )
  }
  return null
}

export default function BatchImport() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState<BatchSendItem[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)

  const needsPhotoCount = useMemo(
    () => items?.filter((i) => i.image_intent === 'needs_manual').length ?? 0,
    [items],
  )

  async function copyInstructions() {
    await navigator.clipboard.writeText(INSTRUCTIONS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function parse() {
    setParseError('')
    setItems(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setParseError("That doesn't look like valid JSON — check for a trailing comma or missing bracket.")
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setParseError('Expected a non-empty JSON array of post objects.')
      return
    }
    for (let i = 0; i < parsed.length; i++) {
      const it = parsed[i] as Partial<BatchSendItem>
      if (!it.platform || !it.segment || !it.send_date || !it.body_text) {
        setParseError(`Item ${i + 1} is missing a required field (platform, segment, send_date, or body_text).`)
        return
      }
    }
    setItems(parsed as BatchSendItem[])
  }

  async function importAll() {
    if (!items) return
    setImporting(true)
    try {
      const res = await fetch('/api/comms/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error()
      const { results } = await res.json()
      const okCount = results.filter((r: { ok: boolean }) => r.ok).length
      const failCount = results.length - okCount
      const needPhoto = items.filter((i, idx) => i.image_intent === 'needs_manual' && results[idx]?.ok).length

      if (failCount > 0) {
        toast.error(`${okCount} imported, ${failCount} failed — check the copy for those items.`)
      } else {
        toast.success(`${okCount} imported${needPhoto ? `, ${needPhoto} need photos` : ''}.`)
      }
      router.push('/calendar')
    } catch {
      toast.error('Import failed. Nothing was saved — try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-navy-900">Batch import from Claude.ai</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy-800">1. Copy these instructions into Claude.ai</p>
          <button
            onClick={copyInstructions}
            className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy instructions'}
          </button>
        </div>
        <pre className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
          {INSTRUCTIONS}
        </pre>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 space-y-3">
        <p className="text-sm font-medium text-navy-800">2. Paste Claude.ai&apos;s JSON output</p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder='[{"platform": "facebook", "segment": "public", ...}]'
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
        />
        {parseError && <p className="text-sm text-red-600">{parseError}</p>}
        <button
          onClick={parse}
          disabled={!raw.trim()}
          className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Parse
        </button>
      </div>

      {items && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 space-y-3">
          <p className="text-sm font-medium text-navy-800">
            3. Review {items.length} {items.length === 1 ? 'post' : 'posts'}
            {needsPhotoCount > 0 && (
              <span className="text-amber-600 font-normal"> — {needsPhotoCount} will need a photo added after import</span>
            )}
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item, i) => {
              const Icon = item.platform === 'facebook' ? FacebookGlyph : Mail
              return (
                <div key={i} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Icon size={13} strokeWidth={2} />
                      {item.platform === 'facebook' ? 'Facebook' : 'Email'} · {SEGMENT_LABEL[item.segment] || item.segment}
                    </span>
                    <span className="text-xs text-slate-400">{item.send_date}</span>
                    <IntentChip intent={item.image_intent} />
                  </div>
                  <p className="text-sm text-navy-900 truncate">
                    {item.subject || item.body_text.split('\n')[0].slice(0, 90)}
                  </p>
                </div>
              )
            })}
          </div>
          <button
            onClick={importAll}
            disabled={importing}
            className="text-sm font-medium bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-navy-950 px-4 py-2 rounded-lg transition-colors"
          >
            {importing ? 'Importing...' : `Import all ${items.length}`}
          </button>
        </div>
      )}
    </div>
  )
}
