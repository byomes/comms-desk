import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import NavBar from '../components/NavBar'
import CalendarView from './CalendarView'

export default async function CalendarPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="app-shell min-h-screen">
      <NavBar displayName={session.displayName} role={session.role} />
      <main className="max-w-5xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <CalendarView role={session.role} />
      </main>
    </div>
  )
}
