'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

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
      <p className="text-sm text-gray-600">
        If that username exists, a reset link has been emailed. Check your inbox — the link expires in 1 hour.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md transition-colors"
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
        <p className="text-sm text-gray-600">Your new password (shown once — write it down):</p>
        <p className="text-lg font-mono bg-gray-100 rounded-md px-3 py-2 text-center">{newPassword}</p>
        <a href="/login" className="block text-center text-sm text-blue-600 hover:underline">
          Go to sign in
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Click below to generate a new password. It will be shown once — you won&apos;t need to type
        anything.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold mb-1">Reset password</h1>
        <Suspense fallback={null}>
          <ResetBody />
        </Suspense>
      </div>
    </div>
  )
}
