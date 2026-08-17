'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  LayoutTemplate, Type, Image as ImageIcon, MousePointerClick, Minus, Quote as QuoteIcon,
  ImagePlus, ChevronUp, ChevronDown, X, Zap, Users,
} from 'lucide-react'
import { type Block, blocksToMjml, newBlock } from '@/lib/mjml-blocks'
import type { BrevoContact, BrevoList } from '@/lib/comms-api'
import ContactPickerModal from './ContactPickerModal'

function todayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nextHourLocalTime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toTimeString().slice(0, 5)
}

const BLOCK_META: Record<Block['type'], { label: string; icon: typeof Type }> = {
  hero: { label: 'Hero', icon: LayoutTemplate },
  text: { label: 'Text', icon: Type },
  image: { label: 'Image', icon: ImageIcon },
  button: { label: 'Button', icon: MousePointerClick },
  divider: { label: 'Divider', icon: Minus },
  quote: { label: 'Quote', icon: QuoteIcon },
}

type StaticSegment = 'donor' | 'arc'

const STATIC_SEGMENT_LABEL: Record<StaticSegment, string> = {
  donor: 'Donors',
  arc: 'ARC readers',
}

// "Send to" select values are either a static segment ('donor'/'arc') or a
// live Brevo list, encoded as `list:<id>` since <select> options are strings.
function listOptionValue(listId: number): string {
  return `list:${listId}`
}

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 text-[11px] text-slate-400 font-medium">Inbox preview</span>
      </div>
      {children}
    </div>
  )
}

function ImageUploadField({
  label,
  url,
  onChange,
}: {
  label: string
  url: string
  onChange: (rawUrl: string) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      const contentBase64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setPreview(URL.createObjectURL(file))

      const res = await fetch('/api/comms/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentBase64, kind: 'email' }),
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onChange(data.rawUrl)
    } catch {
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors">
        <ImagePlus size={13} />
        Upload
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {uploading && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
      {(preview || url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview ?? url} alt="" className="mt-2 max-h-24 rounded-lg border border-slate-200" />
      )}
    </div>
  )
}

function BlockEditor({
  block,
  onChange,
}: {
  block: Block
  onChange: (block: Block) => void
}) {
  const inputClass = "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-2">
          <input
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Heading"
            className={inputClass}
          />
          <input
            value={block.subheading}
            onChange={(e) => onChange({ ...block, subheading: e.target.value })}
            placeholder="Subheading (optional)"
            className={inputClass}
          />
          <ImageUploadField
            label="Image (optional)"
            url={block.imageUrl}
            onChange={(rawUrl) => onChange({ ...block, imageUrl: rawUrl })}
          />
        </div>
      )
    case 'text':
      return (
        <textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          rows={4}
          placeholder="Write your message here..."
          className={inputClass}
        />
      )
    case 'image':
      return (
        <div className="space-y-2">
          <ImageUploadField
            label="Image"
            url={block.url}
            onChange={(rawUrl) => onChange({ ...block, url: rawUrl })}
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt text"
            className={inputClass}
          />
        </div>
      )
    case 'button':
      return (
        <div className="space-y-2">
          <input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Button label"
            className={inputClass}
          />
          <input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      )
    case 'divider':
      return <p className="text-xs text-slate-400">A horizontal rule — nothing to edit.</p>
    case 'quote':
      return (
        <div className="space-y-2">
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={3}
            placeholder="Quote text"
            className={inputClass}
          />
          <input
            value={block.attribution}
            onChange={(e) => onChange({ ...block, attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className={inputClass}
          />
        </div>
      )
  }
}

export default function EmailComposer() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [sendTo, setSendTo] = useState<string>('donor')
  const [brevoLists, setBrevoLists] = useState<BrevoList[] | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customContacts, setCustomContacts] = useState<BrevoContact[]>([])
  const [sendDate, setSendDate] = useState(todayLocalDate())
  const [sendTime, setSendTime] = useState(nextHourLocalTime())
  const [blocks, setBlocks] = useState<Block[]>([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/comms/brevo/lists')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BrevoList[]) => setBrevoLists(data))
      .catch(() => setBrevoLists([]))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (blocks.length === 0) {
        setPreviewHtml('')
        return
      }
      try {
        const res = await fetch('/api/mjml/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mjml: blocksToMjml(blocks) }),
        })
        if (res.ok) {
          const data = await res.json()
          setPreviewHtml(data.html || '')
        }
      } catch {
        // preview is best-effort — leave the last good render in place
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [blocks])

  function addBlock(type: Block['type']) {
    setBlocks((prev) => [...prev, newBlock(type)])
  }

  function updateBlock(id: string, next: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)))
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function renderFinalHtml(): Promise<string> {
    const res = await fetch('/api/mjml/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mjml: blocksToMjml(blocks) }),
    })
    if (!res.ok) throw new Error('Render failed')
    const data = await res.json()
    return data.html as string
  }

  async function save(mode: 'draft' | 'ready' | 'now') {
    if (!subject.trim()) {
      setError('Give it a subject line first.')
      return
    }
    if (blocks.length === 0) {
      setError('Add at least one block first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const html = await renderFinalHtml()

      const audience =
        customContacts.length > 0
          ? { recipient_mode: 'custom_emails' as const, recipient_detail: { emails: customContacts } }
          : sendTo.startsWith('list:')
          ? {
              recipient_mode: 'brevo_list' as const,
              recipient_detail: {
                list_id: Number(sendTo.slice(5)),
                list_name: brevoLists?.find((l) => listOptionValue(l.id) === sendTo)?.name ?? '',
              },
            }
          : { segment: sendTo }

      const createRes = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_date: sendDate,
          send_time: sendTime,
          platform: 'brevo',
          ...audience,
          subject,
          body_text: html,
        }),
      })
      if (!createRes.ok) throw new Error('Save failed')
      const { id } = await createRes.json()

      if (mode !== 'draft') {
        const readyRes = await fetch(`/api/comms/sends/${id}/ready`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sendNow: mode === 'now' }),
        })
        if (!readyRes.ok) throw new Error('Could not mark ready')
      }

      toast.success(
        mode === 'now' ? 'Sending — 12 minutes to undo on the calendar.'
        : mode === 'ready' ? 'Email marked ready.'
        : 'Draft saved.'
      )
      router.push('/calendar')
    } catch {
      setError('Something went wrong — the draft may have saved. Check the calendar.')
    } finally {
      setSaving(false)
    }
  }

  const isToday = sendDate <= todayLocalDate()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-5">
        <h1 className="text-lg font-semibold text-navy-900">New email</h1>

        <div>
          <label className="block text-sm font-medium text-navy-800 mb-1.5">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
            placeholder="Subject line"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Send to</label>
            {customContacts.length > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 text-navy-900 px-3 py-2">
                  <Users size={14} /> {customContacts.length} people selected
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-medium text-navy-700 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setCustomContacts([])}
                  className="text-xs font-medium text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
                >
                  {(Object.keys(STATIC_SEGMENT_LABEL) as StaticSegment[]).map((s) => (
                    <option key={s} value={s}>{STATIC_SEGMENT_LABEL[s]}</option>
                  ))}
                  {brevoLists === null ? (
                    <option disabled>Loading lists...</option>
                  ) : (
                    brevoLists.map((l) => (
                      <option key={l.id} value={listOptionValue(l.id)}>
                        {l.name} ({l.count})
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-medium text-navy-700 hover:underline whitespace-nowrap"
                >
                  or choose specific people
                </button>
              </div>
            )}
          </div>
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

        <div>
          <label className="block text-sm font-medium text-navy-800 mb-2">Content</label>
          <div className="space-y-3">
            {blocks.map((block, i) => {
              const { label, icon: Icon } = BLOCK_META[block.type]
              return (
                <div key={block.id} className="rounded-xl border border-slate-200 bg-white shadow-card p-3.5 animate-slide-up">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Icon size={13} strokeWidth={2.25} />
                      {label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveBlock(block.id, -1)}
                        disabled={i === 0}
                        className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        aria-label="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveBlock(block.id, 1)}
                        disabled={i === blocks.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        aria-label="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Remove block"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <BlockEditor block={block} onChange={(next) => updateBlock(block.id, next)} />
                </div>
              )
            })}
            {blocks.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-300 rounded-xl">
                No content yet — add a block below.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(Object.keys(BLOCK_META) as Block['type'][]).map((type) => {
            const { label, icon: Icon } = BLOCK_META[type]
            return (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Icon size={13} /> {label}
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="text-sm font-medium border border-slate-300 hover:bg-slate-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
          >
            Save as draft
          </button>
          <button
            onClick={() => save('ready')}
            disabled={saving}
            className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Mark ready
          </button>
          {isToday && (
            <button
              onClick={() => save('now')}
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
          {previewHtml ? (
            <iframe srcDoc={previewHtml} title="Email preview" className="w-full h-[600px] bg-white" />
          ) : (
            <p className="text-sm text-slate-400 p-10 text-center bg-white">Add a block to see a preview.</p>
          )}
        </BrowserChrome>
      </div>

      {pickerOpen && (
        <ContactPickerModal
          initialSelected={customContacts}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(selected) => {
            setCustomContacts(selected)
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
