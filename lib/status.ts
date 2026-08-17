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
  drafted: 'bg-gray-100 text-gray-700',
  ready: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-400 line-through',
}

export const PLATFORM_CLASS: Record<CommsSend['platform'], string> = {
  facebook: 'border-l-4 border-l-indigo-500',
  brevo: 'border-l-4 border-l-pink-500',
}
