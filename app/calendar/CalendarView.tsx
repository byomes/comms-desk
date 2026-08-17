'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CalendarX, ThumbsUp, Mail, Clock, X } from 'lucide-react'
import type { CommsSend } from '@/lib/comms-api'
import { stageOf, minutesUntil, STAGE_LABEL, STAGE_CLASS, PLATFORM_CLASS, PLATFORM_LABEL } from '@/lib/status'

const PLATFORM_ICON = { facebook: ThumbsUp, brevo: Mail } as const

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200 ml-1" />
      </div>
      <div className="h-3.5 w-3/4 rounded bg-slate-200" />
    </div>
  )
}

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
      const res = await fetch(`/api/comms/sends/${id}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNow }),
      })
      if (res.ok) {
        toast.success(sendNow ? 'Sending — you have 12 minutes to undo.' : 'Marked ready.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
      await load()
    } finally {
      setActioning(null)
    }
  }

  async function cancel(id: number) {
    setActioning(id)
    try {
      const res = await fetch(`/api/comms/sends/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        toast.success('Canceled.')
      } else {
        toast.error('Could not cancel. Please try again.')
      }
      await load()
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200 animate-pulse mb-4" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

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
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 mb-4">
          <CalendarX size={26} className="text-navy-500" strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-semibold text-navy-900 mb-1.5">Nothing scheduled yet</h2>
        <p className="text-sm text-slate-500 max-w-xs mb-6">
          Start a Facebook post or an email and it&apos;ll show up here once it&apos;s scheduled.
        </p>
        <div className="flex gap-2">
          <a
            href="/compose/facebook"
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ThumbsUp size={15} /> Facebook post
          </a>
          <a
            href="/compose/email"
            className="inline-flex items-center gap-1.5 text-sm font-medium border border-slate-300 hover:bg-slate-50 text-navy-900 px-4 py-2 rounded-lg transition-colors"
          >
            <Mail size={15} /> Email
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </h2>
          <div className="space-y-2.5">
            {grouped[date].map((send) => {
              const stage = stageOf(send)
              const label = send.subject || send.body_text.split('\n')[0].slice(0, 80)
              const Icon = PLATFORM_ICON[send.platform]
              const isReady = stage === 'ready'
              return (
                <div
                  key={send.id}
                  className={`bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover transition-shadow p-4 flex items-start justify-between animate-fade-in ${PLATFORM_CLASS[send.platform]} ${
                    isReady ? 'ring-1 ring-gold-400/60' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Icon size={13} strokeWidth={2} />
                        {PLATFORM_LABEL[send.platform]} · {send.segment}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${STAGE_CLASS[stage]}`}>
                        {stage === 'ready' && send.holdReleasesAt ? (
                          <>
                            <Clock size={11} strokeWidth={2.25} />
                            {minutesUntil(send.holdReleasesAt)}m
                          </>
                        ) : (
                          STAGE_LABEL[stage]
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-navy-900 truncate">{label}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {stage === 'drafted' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => markReady(send.id, false)}
                        className="text-xs font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark ready
                      </button>
                    )}
                    {stage === 'drafted' && send.send_date <= new Date().toISOString().slice(0, 10) && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => markReady(send.id, true)}
                        className="text-xs font-medium bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-navy-950 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Send now
                      </button>
                    )}
                    {stage === 'ready' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => cancel(send.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X size={13} /> Undo
                      </button>
                    )}
                    {stage === 'scheduled' && role === 'admin' && (
                      <button
                        disabled={actioning === send.id}
                        onClick={() => cancel(send.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X size={13} /> Pull
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
