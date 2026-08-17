'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/comms/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Login failed')
        return
      }
      router.push('/calendar')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-sm text-slate-500 mb-6">Sign in to schedule posts and emails.</p>

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
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <a href="/reset" className="block text-center text-sm text-navy-600 hover:text-gold-600 mt-5 transition-colors">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  )
}
