'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { BrevoContact } from '@/lib/comms-api'

export default function ContactPickerModal({
  initialSelected,
  onCancel,
  onConfirm,
}: {
  initialSelected: BrevoContact[]
  onCancel: () => void
  onConfirm: (selected: BrevoContact[]) => void
}) {
  const [contacts, setContacts] = useState<BrevoContact[] | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<string, BrevoContact>>(
    () => new Map(initialSelected.map((c) => [c.email, c]))
  )

  useEffect(() => {
    let cancelled = false
    fetch('/api/comms/brevo/contacts')
      .then((res) => {
        if (!res.ok) throw new Error('failed')
        return res.json()
      })
      .then((data: BrevoContact[]) => {
        if (!cancelled) setContacts(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!contacts) return []
    const q = query.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) => c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    )
  }, [contacts, query])

  function toggle(contact: BrevoContact) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(contact.email)) next.delete(contact.email)
      else next.set(contact.email, contact)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-navy-900">Choose specific people</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-slate-200">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name or email"
              className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {error ? (
            <p className="text-sm text-slate-400 text-center py-10">
              Couldn&apos;t load contacts from Brevo. Try again in a moment.
            </p>
          ) : !contacts ? (
            <p className="text-sm text-slate-400 text-center py-10">Loading contacts...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No contacts match.</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((c) => (
                <li key={c.email}>
                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(c.email)}
                      onChange={() => toggle(c)}
                      className="rounded border-slate-300 text-navy-900 focus:ring-gold-400"
                    />
                    <span className="text-sm text-navy-800">
                      {c.name ? `${c.name} ` : ''}
                      <span className="text-slate-400">{c.email}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="text-sm font-medium border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(Array.from(selected.values()))}
              disabled={selected.size === 0}
              className="text-sm font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Use selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
