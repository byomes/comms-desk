'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CommsSend } from '@/lib/comms-api'
import { monthMatrix, toDateKey } from './dateGrid'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthGrid({
  month,
  onMonthChange,
  grouped,
  selectedDate,
  onSelectDate,
}: {
  month: Date
  onMonthChange: (d: Date) => void
  grouped: Record<string, CommsSend[]>
  selectedDate: string | null
  onSelectDate: (d: string) => void
}) {
  const days = monthMatrix(month.getFullYear(), month.getMonth())
  const todayKey = toDateKey(new Date())
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-navy-900">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const today = new Date()
              onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))
              onSelectDate(toDateKey(today))
            }}
            className="text-xs font-medium text-slate-500 hover:text-navy-900 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            aria-label="Previous month"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="p-1.5 rounded-md text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next month"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="p-1.5 rounded-md text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = toDateKey(d)
          const inMonth = d.getMonth() === month.getMonth()
          const items = grouped[key] || []
          const isToday = key === todayKey
          const isSelected = key === selectedDate

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={`min-h-[56px] sm:min-h-[92px] p-1 sm:p-1.5 flex flex-col gap-1 text-left border-b border-slate-100 transition-colors ${
                (i + 1) % 7 !== 0 ? 'border-r' : ''
              } ${inMonth ? 'bg-white' : 'bg-slate-50/60'} ${
                isSelected ? 'ring-2 ring-inset ring-gold-400' : 'hover:bg-slate-50'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-navy-900 text-white' : inMonth ? 'text-navy-900' : 'text-slate-300'
                }`}
              >
                {d.getDate()}
              </span>

              {/* Mobile: compact dots, full text is cramped below ~sm */}
              {items.length > 0 && (
                <div className="flex sm:hidden flex-wrap items-center gap-0.5 px-0.5">
                  {items.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className={`h-1.5 w-1.5 rounded-full ${s.platform === 'facebook' ? 'bg-navy-600' : 'bg-gold-500'}`}
                    />
                  ))}
                  {items.length > 4 && (
                    <span className="text-[9px] leading-none text-slate-400">+{items.length - 4}</span>
                  )}
                </div>
              )}

              {/* sm+: truncated text chips */}
              <div className="hidden sm:flex sm:flex-col sm:gap-0.5">
                {items.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={`truncate text-[10.5px] leading-4 px-1 rounded ${
                      s.platform === 'facebook' ? 'bg-navy-50 text-navy-700' : 'bg-gold-300/30 text-gold-700'
                    }`}
                  >
                    {s.subject || s.body_text.split('\n')[0].slice(0, 40)}
                  </span>
                ))}
                {items.length > 3 && (
                  <span className="text-[10.5px] text-slate-400 px-1">+{items.length - 3} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
