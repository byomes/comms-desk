'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImagePlus, Send, Zap, Sparkles, Camera } from 'lucide-react'

type ImageMode = 'upload' | 'ai_quote' | 'needs_manual'

function todayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nextHourLocalTime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toTimeString().slice(0, 5)
}

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 text-[11px] text-slate-400 font-medium">facebook.com</span>
      </div>
      <div className="bg-slate-100 p-4">{children}</div>
    </div>
  )
}

export default function FacebookComposer() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [sendDate, setSendDate] = useState(todayLocalDate())
  const [sendTime, setSendTime] = useState(nextHourLocalTime())
  const [imageMode, setImageMode] = useState<ImageMode>('upload')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [quoteText, setQuoteText] = useState('')
  const [quoteAttribution, setQuoteAttribution] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const reader = new FileReader()
      const contentBase64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setImagePreview(URL.createObjectURL(file))

      const res = await fetch('/api/comms/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentBase64, kind: 'facebook' }),
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setImagePath(data.imagePath)
    } catch {
      setError('Image upload failed — you can still save the post without it.')
      setImagePath(null)
    } finally {
      setUploading(false)
    }
  }

  function buildPayload() {
    const base = { send_date: sendDate, send_time: sendTime, platform: 'facebook', segment: 'public', body_text: body }
    if (imageMode === 'ai_quote') {
      return { ...base, image_intent: 'ai_quote' as const, quote_text: quoteText, quote_attribution: quoteAttribution || undefined }
    }
    if (imageMode === 'needs_manual') {
      return { ...base, image_intent: 'needs_manual' as const }
    }
    return { ...base, image_path: imagePath }
  }

  function validate(): boolean {
    if (!body.trim()) {
      setError('Write something first.')
      return false
    }
    if (imageMode === 'ai_quote' && !quoteText.trim()) {
      setError('Add the quote text for the quote card.')
      return false
    }
    return true
  }

  async function save(sendNow: boolean) {
    if (!validate()) return
    setSaving(true)
    setError('')
    try {
      const createRes = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      if (!createRes.ok) throw new Error('Save failed')
      const { id } = await createRes.json()

      const readyRes = await fetch(`/api/comms/sends/${id}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNow }),
      })
      if (!readyRes.ok) throw new Error('Could not mark ready')

      toast.success(sendNow ? 'Sending — 12 minutes to undo on the calendar.' : 'Post marked ready.')
      router.push('/calendar')
    } catch {
      setError('Something went wrong — the draft may have saved. Check the calendar.')
    } finally {
      setSaving(false)
    }
  }

  async function saveDraft() {
    if (!validate()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) throw new Error()
      toast.success('Draft saved.')
      router.push('/calendar')
    } catch {
      setError('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const isToday = sendDate <= todayLocalDate()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-5">
        <h1 className="text-lg font-semibold text-navy-900">New Facebook post</h1>

        <div>
          <label className="block text-sm font-medium text-navy-800 mb-1.5">Post text</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-800 mb-1.5">Image</label>
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-3">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                imageMode === 'upload' ? 'bg-navy-900 text-white' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <ImagePlus size={13} strokeWidth={2.25} /> Upload photo
            </button>
            <button
              type="button"
              onClick={() => setImageMode('ai_quote')}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                imageMode === 'ai_quote' ? 'bg-navy-900 text-white' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Sparkles size={13} strokeWidth={2.25} /> AI quote card
            </button>
            <button
              type="button"
              onClick={() => setImageMode('needs_manual')}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                imageMode === 'needs_manual' ? 'bg-navy-900 text-white' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Camera size={13} strokeWidth={2.25} /> Needs photo later
            </button>
          </div>

          {imageMode === 'upload' && (
            <>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <ImagePlus size={15} />
                {imagePreview ? 'Change image' : 'Add image'}
                <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {uploading && <p className="text-xs text-slate-400 mt-1.5">Uploading...</p>}
            </>
          )}

          {imageMode === 'ai_quote' && (
            <div className="space-y-2">
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={3}
                placeholder="The exact line to render on the quote card"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
              />
              <input
                value={quoteAttribution}
                onChange={(e) => setQuoteAttribution(e.target.value)}
                placeholder="Attribution (defaults to Dr. Bill Yomes)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
              />
              <p className="text-xs text-slate-400">The branded quote card is generated when you save.</p>
            </div>
          )}

          {imageMode === 'needs_manual' && (
            <p className="text-xs text-slate-400">
              This post will show a &quot;Needs photo&quot; badge on the calendar until someone attaches an image.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Send date</label>
            <input
              type="date"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Send time</label>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="text-sm font-medium border border-slate-300 hover:bg-slate-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
          >
            Save as draft
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Mark ready
          </button>
          {isToday && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-navy-950 px-4 py-2 rounded-lg transition-colors"
            >
              <Zap size={14} /> Send now
            </button>
          )}
        </div>
        {isToday && (
          <p className="text-xs text-slate-400">
            &quot;Send now&quot; gives you a 12-minute window to undo before it actually goes out.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium mb-2 text-slate-500">Preview</p>
        <BrowserChrome>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center">
                <Send size={14} className="text-navy-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Faith Makes Sense</p>
                <p className="text-xs text-slate-400">Just now</p>
              </div>
            </div>
            <p className="px-3 pb-3 text-sm whitespace-pre-wrap text-navy-800">{body || 'Your post text will appear here.'}</p>
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="w-full max-h-80 object-cover" />
            )}
          </div>
        </BrowserChrome>
      </div>
    </div>
  )
}
