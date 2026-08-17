'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CommsSend } from '@/lib/comms-api'
import { stageOf, minutesUntil, STAGE_LABEL, STAGE_CLASS, PLATFORM_CLASS } from '@/lib/status'

export default function CalendarView({ role }: { role: 'volunteer' | 'admin' }) {
  const [sends, setSends] = useState<CommsSend[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<number | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/comms/sends')
    if (res.ok) setSends(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // keep hold countdowns fresh
    return () => clearInterval(interval)
  }, [load])

  async function markReady(id: number, sendNow: boolean) {
    setActioning(id)
    try {
      await fetch(`/api/comms/sends/${id}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNow }),
      })
      await load()
    } finally {
      setActioning(null)
    }
  }

  async function cancel(id: number) {
    setActioning(id)
    try {
      await fetch(`/api/comms/sends/${id}/cancel`, { method: 'POST' })
      await load()
    } finally {
      setActioning(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  const grouped = sends
    .filter((s) => stageOf(s) !== 'skipped')
    .sort((a, b) => a.send_date.localeCompare(b.send_date))
    .reduce<Record<string, CommsSend[]>>((acc, s) => {
      (acc[s.send_date] ||= []).push(s)
      return acc
    }, {})

  const dates = Object.keys(grouped)

  if (dates.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nothing scheduled yet. Start a{' '}
        <a href="/compose/facebook" className="text-blue-600 hover:underline">Facebook post</a> or{' '}
        <a href="/compose/email" className="text-blue-600 hover:underline">email</a>.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </h2>
          <div className="space-y-2">
            {grouped[date].map((send) => {
              const stage = stageOf(send)
              const label = send.subject || send.body_text.split('\n')[0].slice(0, 80)
              return (
                <div
                  key={send.id}
                  className={`bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between ${PLATFORM_CLASS[send.platform]}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wide text-gray-400">
                        {send.platform === 'facebook' ? 'Facebook' : 'Email'} · {send.segment}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_CLASS[stage]}`}>
                        {stage === 'ready' && send.holdReleasesAt
                          ? `Sending in ~${minutesUntil(send.holdReleasesAt)}m`
                          : STAGE_LABEL[stage]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 truncate">{label}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {stage === 'drafted' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => markReady(send.id, false)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md"
                      >
                        Mark ready
                      </button>
                    )}
                    {stage === 'drafted' && send.send_date <= new Date().toISOString().slice(0, 10) && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => markReady(send.id, true)}
                        className="text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md"
                      >
                        Send now
                      </button>
                    )}
                    {stage === 'ready' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => cancel(send.id)}
                        className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5"
                      >
                        Undo
                      </button>
                    )}
                    {stage === 'scheduled' && role === 'admin' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => cancel(send.id)}
                        className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5"
                      >
                        Pull
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
