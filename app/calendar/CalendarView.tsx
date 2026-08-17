'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { CalendarX, Mail, LayoutGrid, List } from 'lucide-react'
import FacebookGlyph from '../components/icons/FacebookGlyph'
import type { CommsSend } from '@/lib/comms-api'
import { stageOf } from '@/lib/status'
import MonthGrid from './MonthGrid'
import SendCard from './SendCard'
import { toDateKey } from './dateGrid'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date()))

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

  const grouped = useMemo(
    () =>
      sends
        .filter((s) => stageOf(s) !== 'skipped')
        .sort((a, b) => a.send_date.localeCompare(b.send_date))
        .reduce<Record<string, CommsSend[]>>((acc, s) => {
          (acc[s.send_date] ||= []).push(s)
          return acc
        }, {}),
    [sends]
  )

  const dates = Object.keys(grouped)

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

  if (dates.length === 0 && viewMode === 'list') {
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
            <FacebookGlyph size={15} /> Facebook post
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

  const ToggleButton = ({ mode, icon: Icon, label }: { mode: 'grid' | 'list'; icon: typeof LayoutGrid; label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        viewMode === mode ? 'bg-navy-900 text-white' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={13} strokeWidth={2.25} /> {label}
    </button>
  )

  if (viewMode === 'list') {
    return (
      <div className="space-y-8">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <ToggleButton mode="grid" icon={LayoutGrid} label="Grid" />
            <ToggleButton mode="list" icon={List} label="List" />
          </div>
        </div>
        {dates.map((date) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-slate-500 mb-3">
              {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </h2>
            <div className="space-y-2.5">
              {grouped[date].map((send) => (
                <SendCard key={send.id} send={send} role={role} actioning={actioning} onMarkReady={markReady} onCancel={cancel} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const selectedItems = grouped[selectedDate] || []
  const selectedLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <ToggleButton mode="grid" icon={LayoutGrid} label="Grid" />
          <ToggleButton mode="list" icon={List} label="List" />
        </div>
      </div>

      <MonthGrid
        month={month}
        onMonthChange={setMonth}
        grouped={grouped}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="flex gap-2">
        <a
          href="/compose/facebook"
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FacebookGlyph size={15} /> New Facebook post
        </a>
        <a
          href="/compose/email"
          className="inline-flex items-center gap-1.5 text-sm font-medium border border-slate-300 hover:bg-slate-50 text-navy-900 px-4 py-2 rounded-lg transition-colors"
        >
          <Mail size={15} /> New email
        </a>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-3">{selectedLabel}</h2>
        {selectedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-6 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">Nothing scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedItems.map((send) => (
              <SendCard key={send.id} send={send} role={role} actioning={actioning} onMarkReady={markReady} onCancel={cancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
