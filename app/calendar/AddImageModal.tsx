'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import type { CommsSend } from '@/lib/comms-api'

export default function AddImageModal({
  send,
  onCancel,
  onSaved,
}: {
  send: CommsSend
  onCancel: () => void
  onSaved: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
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
      setError('Upload failed — try again.')
      setImagePath(null)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!imagePath) {
      setError('Add an image first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/comms/sends/${send.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_path: imagePath, needs_image: false }),
      })
      if (!res.ok) throw new Error()
      toast.success('Image attached.')
      onSaved()
    } catch {
      setError('Save failed — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-navy-900">Add a photo</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <p className="text-sm text-slate-500 line-clamp-3">{send.body_text}</p>

          <div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg cursor-pointer transition-colors">
              <ImagePlus size={15} />
              {imagePreview ? 'Change image' : 'Choose image'}
              <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            {uploading && <p className="text-xs text-slate-400 mt-1.5">Uploading...</p>}
          </div>

          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="w-full max-h-64 object-cover rounded-lg border border-slate-200" />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="text-sm font-medium border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !imagePath}
            className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
