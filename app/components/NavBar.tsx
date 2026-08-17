'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Mail, LogOut, Menu, X, Send } from 'lucide-react'
import FacebookGlyph from './icons/FacebookGlyph'

const NAV_ITEMS = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/compose/facebook', label: 'New Facebook post', icon: FacebookGlyph },
  { href: '/compose/email', label: 'New email', icon: Mail },
]

function Wordmark() {
  return (
    <Link href="/calendar" className="flex items-center gap-2.5 px-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-navy-950">
        <Send size={16} strokeWidth={2.25} />
      </span>
      <span className="font-semibold text-[15px] text-white tracking-tight">Comms Desk</span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-navy-800 text-white'
                : 'text-slate-300 hover:bg-navy-800/60 hover:text-white'
            }`}
          >
            <span className={`relative flex h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-gold-400' : 'bg-transparent'}`} />
            <Icon size={17} strokeWidth={2} className={active ? 'text-gold-400' : 'text-slate-400 group-hover:text-slate-200'} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function NavBar({
  displayName,
  role,
}: {
  displayName: string
  role: 'volunteer' | 'admin'
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/comms/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-navy-900 shadow-sidebar">
        <div className="h-16 flex items-center px-4 border-b border-navy-800/70">
          <Wordmark />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="px-3 py-4 border-t border-navy-800/70">
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-navy-900 shadow-sidebar">
        <Wordmark />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 text-slate-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-navy-950/60 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-navy-900 flex flex-col animate-slide-up shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800/70">
              <Wordmark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="px-3 py-4 border-t border-navy-800/70">
              <div className="flex items-center justify-between px-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 capitalize">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  <LogOut size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
