'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { CommsSend } from '@/lib/comms-api'
import FacebookPostPreview from '../components/FacebookPostPreview'

const EDITABLE_SEGMENTS = ['general', 'donor', 'arc'] as const

export default function EditPostModal({
  send,
  onCancel,
  onSaved,
}: {
  send: CommsSend
  onCancel: () => void
  onSaved: () => void
}) {
  const isEmail = send.platform === 'brevo'
  const canEditSegment = isEmail && (send.recipient_mode ?? 'segment') === 'segment'

  const [subject, setSubject] = useState(send.subject ?? '')
  const [bodyText, setBodyText] = useState(send.body_text)
  const [segment, setSegment] = useState(send.segment)
  const [sendDate, setSendDate] = useState(send.send_date)
  const [sendTime, setSendTime] = useState(send.send_time ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!bodyText.trim()) {
      setError('Post text can’t be empty.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const fields: Partial<CommsSend> = {
        body_text: bodyText,
        send_date: sendDate,
        send_time: sendTime || null,
      }
      if (isEmail) fields.subject = subject
      if (canEditSegment) fields.segment = segment

      const res = await fetch(`/api/comms/sends/${send.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error()
      toast.success('Post updated.')
      onSaved()
    } catch {
      setError('Save failed — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-xl ${isEmail ? 'max-w-lg' : 'max-w-3xl'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-navy-900">Edit {isEmail ? 'email' : 'post'}</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`px-4 py-4 max-h-[70vh] overflow-y-auto ${isEmail ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
        <div className="space-y-4">
          {isEmail && (
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">
              {isEmail ? 'Body' : 'Post text'}
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={isEmail ? 10 : 6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
            />
            {isEmail && (
              <p className="text-xs text-slate-400 mt-1">
                Raw HTML sent to Brevo — edit carefully.
              </p>
            )}
          </div>

          {canEditSegment && (
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Send to</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as CommsSend['segment'])}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
              >
                {EDITABLE_SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

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
        </div>

        {!isEmail && <FacebookPostPreview body={bodyText} imageUrl={send.image_url} />}
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
            disabled={saving}
            className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
