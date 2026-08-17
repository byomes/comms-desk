'use client'

import { Mail, Clock, X, Camera } from 'lucide-react'
import FacebookGlyph from '../components/icons/FacebookGlyph'
import type { CommsSend } from '@/lib/comms-api'
import { stageOf, minutesUntil, STAGE_LABEL, STAGE_CLASS, PLATFORM_CLASS, PLATFORM_LABEL } from '@/lib/status'

const PLATFORM_ICON = { facebook: FacebookGlyph, brevo: Mail } as const

export default function SendCard({
  send,
  role,
  actioning,
  onMarkReady,
  onCancel,
  onAddImage,
}: {
  send: CommsSend
  role: 'volunteer' | 'admin'
  actioning: number | null
  onMarkReady: (id: number, sendNow: boolean) => void
  onCancel: (id: number) => void
  onAddImage?: (send: CommsSend) => void
}) {
  const stage = stageOf(send)
  const label = send.subject || send.body_text.split('\n')[0].slice(0, 80)
  const Icon = PLATFORM_ICON[send.platform]
  const isReady = stage === 'ready'

  return (
    <div
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
          {!!send.needs_image && (
            <button
              onClick={() => onAddImage?.(send)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-2 py-0.5 rounded-full transition-colors"
            >
              <Camera size={11} strokeWidth={2.25} /> Needs photo
            </button>
          )}
        </div>
        <p className="text-sm text-navy-900 truncate">{label}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {stage === 'drafted' && (
          <button
            disabled={actioning === send.id}
            onClick={() => onMarkReady(send.id, false)}
            className="text-xs font-medium bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark ready
          </button>
        )}
        {stage === 'drafted' && send.send_date <= new Date().toISOString().slice(0, 10) && (
          <button
            disabled={actioning === send.id}
            onClick={() => onMarkReady(send.id, true)}
            className="text-xs font-medium bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-navy-950 px-3 py-1.5 rounded-lg transition-colors"
          >
            Send now
          </button>
        )}
        {stage === 'ready' && (
          <button
            disabled={actioning === send.id}
            onClick={() => onCancel(send.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={13} /> Undo
          </button>
        )}
        {stage === 'scheduled' && role === 'admin' && (
          <button
            disabled={actioning === send.id}
            onClick={() => onCancel(send.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={13} /> Pull
          </button>
        )}
      </div>
    </div>
  )
}
