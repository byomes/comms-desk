import type { CommsSend } from './comms-api'

export type Stage = 'drafted' | 'ready' | 'scheduled' | 'sent' | 'skipped'

export function stageOf(send: CommsSend): Stage {
  if (send.status === 'sent') return 'sent'
  if (send.status === 'skipped') return 'skipped'
  if (send.holdReleasesAt) return 'ready' // Path B: active undo window
  if (send.status === 'approved') return 'scheduled' // Path A: already approved, sweep will pick it up
  return 'drafted'
}

export function minutesUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000))
}

export const STAGE_LABEL: Record<Stage, string> = {
  drafted: 'Drafted',
  ready: 'Ready',
  scheduled: 'Scheduled',
  sent: 'Sent',
  skipped: 'Canceled',
}

export const STAGE_CLASS: Record<Stage, string> = {
  drafted: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  ready: 'bg-gold-300/40 text-gold-700 ring-1 ring-inset ring-gold-400/50',
  scheduled: 'bg-navy-100 text-navy-700 ring-1 ring-inset ring-navy-200',
  sent: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  skipped: 'bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200 line-through',
}

export const PLATFORM_CLASS: Record<CommsSend['platform'], string> = {
  facebook: 'border-l-4 border-l-navy-600',
  brevo: 'border-l-4 border-l-gold-500',
}

export const PLATFORM_LABEL: Record<CommsSend['platform'], string> = {
  facebook: 'Facebook',
  brevo: 'Email',
}
