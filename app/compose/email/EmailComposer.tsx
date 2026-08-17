'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Block, blocksToMjml, newBlock } from '@/lib/mjml-blocks'
import type { CommsSend } from '@/lib/comms-api'

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10)
}

const BLOCK_LABEL: Record<Block['type'], string> = {
  hero: 'Hero',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  quote: 'Quote',
}

type Segment = Extract<CommsSend['segment'], 'general' | 'donor' | 'arc'>

const SEGMENT_LABEL: Record<Segment, string> = {
  general: 'General list',
  donor: 'Donors',
  arc: 'ARC readers',
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
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type="file" accept="image/*" onChange={handleFile} className="text-xs" />
      {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
      {(preview || url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview ?? url} alt="" className="mt-2 max-h-24 rounded border border-gray-200" />
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
  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-2">
          <input
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Heading"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            value={block.subheading}
            onChange={(e) => onChange({ ...block, subheading: e.target.value })}
            placeholder="Subheading (optional)"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      )
    case 'divider':
      return <p className="text-xs text-gray-400">A horizontal rule — nothing to edit.</p>
    case 'quote':
      return (
        <div className="space-y-2">
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={3}
            placeholder="Quote text"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            value={block.attribution}
            onChange={(e) => onChange({ ...block, attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      )
  }
}

export default function EmailComposer() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [segment, setSegment] = useState<Segment>('general')
  const [sendDate, setSendDate] = useState(todayLocalDate())
  const [blocks, setBlocks] = useState<Block[]>([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      const createRes = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_date: sendDate,
          platform: 'brevo',
          segment,
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
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">New email</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Subject line"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Send to</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {(Object.keys(SEGMENT_LABEL) as Segment[]).map((s) => (
                <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Send date</label>
            <input
              type="date"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <div key={block.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {BLOCK_LABEL[block.type]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={i === 0}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={i === blocks.length - 1}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="text-xs text-gray-400 hover:text-red-600 px-1"
                      aria-label="Remove block"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <BlockEditor block={block} onChange={(next) => updateBlock(block.id, next)} />
              </div>
            ))}
            {blocks.length === 0 && (
              <p className="text-sm text-gray-400">No content yet — add a block below.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(Object.keys(BLOCK_LABEL) as Block['type'][]).map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md"
            >
              + {BLOCK_LABEL[type]}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-md"
          >
            Save as draft
          </button>
          <button
            onClick={() => save('ready')}
            disabled={saving}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Mark ready
          </button>
          {isToday && (
            <button
              onClick={() => save('now')}
              disabled={saving}
              className="text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
            >
              Send now
            </button>
          )}
        </div>
        {isToday && (
          <p className="text-xs text-gray-400">
            &quot;Send now&quot; gives you a 12-minute window to undo before it actually goes out.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium mb-2 text-gray-500">Preview</p>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {previewHtml ? (
            <iframe srcDoc={previewHtml} title="Email preview" className="w-full h-[600px]" />
          ) : (
            <p className="text-sm text-gray-400 p-6">Add a block to see a preview.</p>
          )}
        </div>
      </div>
    </div>
  )
}
