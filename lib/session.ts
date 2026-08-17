import { cookies } from 'next/headers'
import { getCommsSession, type CommsSession } from './comms-auth'

export async function getSession(): Promise<CommsSession | null> {
  const cookieStore = cookies()
  const value = cookieStore.get('comms_session')?.value
  return getCommsSession(value)
}
