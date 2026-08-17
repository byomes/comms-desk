'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function FacebookComposer() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [sendDate, setSendDate] = useState(todayLocalDate())
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
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

  async function save(sendNow: boolean) {
    if (!body.trim()) {
      setError('Write something first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const createRes = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_date: sendDate,
          platform: 'facebook',
          segment: 'public',
          body_text: body,
          image_path: imagePath,
        }),
      })
      if (!createRes.ok) throw new Error('Save failed')
      const { id } = await createRes.json()

      const readyRes = await fetch(`/api/comms/sends/${id}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNow }),
      })
      if (!readyRes.ok) throw new Error('Could not mark ready')

      router.push('/calendar')
    } catch {
      setError('Something went wrong — the draft may have saved. Check the calendar.')
    } finally {
      setSaving(false)
    }
  }

  async function saveDraft() {
    if (!body.trim()) {
      setError('Write something first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/comms/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_date: sendDate, platform: 'facebook', segment: 'public',
          body_text: body, image_path: imagePath,
        }),
      })
      if (!res.ok) throw new Error()
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
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">New Facebook post</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Post text</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image (optional)</label>
          <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="text-sm" />
          {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-md"
          >
            Save as draft
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Mark ready
          </button>
          {isToday && (
            <button
              onClick={() => save(true)}
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
          <div className="p-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div>
              <p className="text-sm font-semibold">Writing Room</p>
              <p className="text-xs text-gray-400">Just now</p>
            </div>
          </div>
          <p className="px-3 pb-3 text-sm whitespace-pre-wrap">{body || 'Your post text will appear here.'}</p>
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="w-full max-h-80 object-cover" />
          )}
        </div>
      </div>
    </div>
  )
}
