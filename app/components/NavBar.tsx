'use client'

import { useRouter } from 'next/navigation'

export default function NavBar({
  displayName,
  role,
}: {
  displayName: string
  role: 'volunteer' | 'admin'
}) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/comms/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/calendar" className="font-semibold text-sm">Comms Desk</a>
          <a href="/calendar" className="text-sm text-gray-600 hover:text-gray-900">Calendar</a>
          <a href="/compose/facebook" className="text-sm text-gray-600 hover:text-gray-900">New Facebook post</a>
          <a href="/compose/email" className="text-sm text-gray-600 hover:text-gray-900">New email</a>
          {role === 'admin' && (
            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Bill&apos;s view</a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{displayName}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
