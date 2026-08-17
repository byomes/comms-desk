import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import NavBar from '../../components/NavBar'
import FacebookComposer from './FacebookComposer'

export default async function FacebookComposePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div>
      <NavBar displayName={session.displayName} role={session.role} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <FacebookComposer />
      </main>
    </div>
  )
}
