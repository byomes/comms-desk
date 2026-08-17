import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import NavBar from '../../components/NavBar'
import BatchImport from './BatchImport'

export default async function BatchImportPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="app-shell min-h-screen">
      <NavBar displayName={session.displayName} role={session.role} />
      <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <BatchImport />
      </main>
    </div>
  )
}
