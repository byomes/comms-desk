'use client'

import { X } from 'lucide-react'
import type { CommsSend } from '@/lib/comms-api'

export default function EmailPreviewModal({
  send,
  onClose,
}: {
  send: CommsSend
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-navy-900 truncate">
              {send.subject || 'Email preview'}
            </h2>
            <p className="text-xs text-slate-400">How this will look in an inbox</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-navy-700 hover:bg-slate-100 transition-colors shrink-0 ml-3"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
            <iframe
              srcDoc={send.body_text}
              title="Email preview"
              className="w-full h-[65vh] bg-white"
              sandbox=""
            />
          </div>
        </div>

        <div className="flex justify-end px-4 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="text-sm font-medium border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
