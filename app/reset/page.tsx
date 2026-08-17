'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send } from 'lucide-react'

function RequestForm() {
  const [username, setUsername] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/comms/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    setSent(true) // always shown, regardless of whether the username existed
  }

  if (sent) {
    return (
      <p className="text-sm text-slate-600">
        If that username exists, a reset link has been emailed. Check your inbox — the link expires in 1 hour.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-800 mb-1.5" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
          required
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="w-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
      >
        Send reset link
      </button>
    </form>
  )
}

function ConfirmForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/comms/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'That link is invalid or expired.')
        return
      }
      setNewPassword(data.newPassword)
    } finally {
      setLoading(false)
    }
  }

  if (newPassword) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Your new password (shown once — write it down):</p>
        <p className="text-lg font-mono bg-navy-50 rounded-lg px-3 py-2 text-center text-navy-900">{newPassword}</p>
        <a href="/login" className="block text-center text-sm text-navy-600 hover:text-gold-600 transition-colors">
          Go to sign in
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Click below to generate a new password. It will be shown once — you won&apos;t need to type
        anything.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
      >
        {loading ? 'Generating...' : 'Generate new password'}
      </button>
    </div>
  )
}

function ResetBody() {
  const params = useSearchParams()
  const token = params.get('token')
  return token ? <ConfirmForm token={token} /> : <RequestForm />
}

export default function ResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy-950 bg-[radial-gradient(circle_at_top,_theme(colors.navy.800)_0%,_theme(colors.navy.950)_55%)]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-navy-950 mb-3">
            <Send size={20} strokeWidth={2.25} />
          </span>
          <h1 className="text-lg font-semibold text-white">Comms Desk</h1>
        </div>
        <div className="bg-white rounded-xl shadow-2xl border border-navy-800/50 p-8">
          <h2 className="text-base font-semibold text-navy-900 mb-4">Reset password</h2>
          <Suspense fallback={null}>
            <ResetBody />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
