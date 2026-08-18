'use client'

import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'

const URL_RE = /https?:\/\/\S+/i

interface LinkPreview {
  title: string | null
  description: string | null
  image: string | null
  domain: string
}

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 text-[11px] text-slate-400 font-medium">facebook.com</span>
      </div>
      <div className="bg-slate-100 p-4">{children}</div>
    </div>
  )
}

function useLinkPreview(url: string | null): LinkPreview | null {
  const [preview, setPreview] = useState<LinkPreview | null>(null)

  useEffect(() => {
    if (!url) {
      setPreview(null)
      return
    }
    let cancelled = false
    const debounce = setTimeout(() => {
      fetch(`/api/comms/link-preview?url=${encodeURIComponent(url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setPreview(data)
        })
        .catch(() => {
          if (!cancelled) setPreview(null)
        })
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(debounce)
    }
  }, [url])

  return preview
}

function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  if (!preview.image && !preview.title) return null
  return (
    <div className="border-t border-slate-200">
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.image} alt="" className="w-full max-h-64 object-cover" />
      )}
      <div className="px-3 py-2 bg-slate-50">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{preview.domain}</p>
        {preview.title && <p className="text-sm font-semibold text-navy-900 line-clamp-2">{preview.title}</p>}
        {preview.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </div>
  )
}

export default function FacebookPostPreview({
  body,
  imageUrl,
}: {
  body: string
  imageUrl?: string | null
}) {
  const linkUrl = body.match(URL_RE)?.[0] ?? null
  const linkPreview = useLinkPreview(imageUrl ? null : linkUrl)

  return (
    <div>
      <p className="text-sm font-medium mb-2 text-slate-500">Preview</p>
      <BrowserChrome>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center">
              <Send size={14} className="text-navy-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Faith Makes Sense</p>
              <p className="text-xs text-slate-400">Just now</p>
            </div>
          </div>
          <p className="px-3 pb-3 text-sm whitespace-pre-wrap text-navy-800">
            {body || 'Your post text will appear here.'}
          </p>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full max-h-80 object-cover" />
          )}
          {!imageUrl && linkPreview && <LinkPreviewCard preview={linkPreview} />}
        </div>
      </BrowserChrome>
    </div>
  )
}
