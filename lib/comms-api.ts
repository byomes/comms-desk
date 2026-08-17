// Server-side-only client for the Watson API blueprint (jobs/comms/api.py),
// reached over Tailscale. Same pattern as wcky's writing-room-api.ts.

const WATSON_BASE = process.env.WATSON_API_URL
const WATSON_KEY = process.env.WATSON_API_KEY

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Watson-Key': WATSON_KEY ?? '',
  }
}

async function watsonGet<T>(path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(`${WATSON_BASE}${path}`, { headers: headers(), cache: 'no-store' })
    const data = res.ok ? ((await res.json()) as T) : null
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  }
}

async function watsonPost<T>(path: string, body: object): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(`${WATSON_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = res.ok ? ((await res.json()) as T) : ((await res.json().catch(() => null)) as T | null)
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  }
}

async function watsonPut<T>(path: string, body: object): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(`${WATSON_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = res.ok ? ((await res.json()) as T) : null
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  }
}

export interface CommsSend {
  id: number
  campaign_id: string
  send_date: string
  send_time: string | null
  platform: 'facebook' | 'brevo'
  segment: 'public' | 'general' | 'donor' | 'arc'
  subject: string | null
  body_text: string
  image_path: string | null
  status: 'scheduled' | 'previewed' | 'approved' | 'edited' | 'sent' | 'skipped'
  source: string
  author_user_id: number
  sent_at: string | null
  recipient_mode?: 'segment' | 'brevo_list' | 'custom_emails' | null
  recipient_detail?: string | null
  holdReleasesAt?: string
  holdId?: number
}

export interface BrevoList {
  id: number
  name: string
  count: number
}

export interface BrevoContact {
  email: string
  name: string
}

export interface LoginResult {
  userId: number
  username: string
  displayName: string
  role: 'volunteer' | 'admin'
}

export const commsApi = {
  login: (username: string, password: string) =>
    watsonPost<LoginResult>('/api/comms/login', { username, password }),

  resetRequest: (username: string) => watsonPost<{ sent: boolean }>('/api/comms/reset-request', { username }),

  resetConfirm: (token: string) => watsonPost<{ newPassword: string }>('/api/comms/reset-confirm', { token }),

  listSends: (asUserId: number) => watsonGet<CommsSend[]>(`/api/comms/sends?as_user_id=${asUserId}`),

  createSend: (
    asUserId: number,
    body: Partial<CommsSend> & { send_date: string; platform: string; body_text: string } & (
      | { recipient_mode?: 'segment'; segment: string }
      | { recipient_mode: 'brevo_list' | 'custom_emails'; recipient_detail: object }
    ),
  ) => watsonPost<{ id: number }>('/api/comms/sends', { as_user_id: asUserId, ...body }),

  getBrevoLists: (asUserId: number) => watsonGet<BrevoList[]>(`/api/comms/brevo/lists?as_user_id=${asUserId}`),

  getBrevoContacts: (asUserId: number) => watsonGet<BrevoContact[]>(`/api/comms/brevo/contacts?as_user_id=${asUserId}`),

  editSend: (id: number, asUserId: number, fields: Partial<CommsSend>) =>
    watsonPut<{ ok: boolean }>(`/api/comms/sends/${id}`, { as_user_id: asUserId, ...fields }),

  markReady: (id: number, asUserId: number, sendNow: boolean) =>
    watsonPost<{ status: string; holdId?: number; holdReleasesAt?: string }>(
      `/api/comms/sends/${id}/ready`,
      { as_user_id: asUserId, send_now: sendNow },
    ),

  cancelSend: (id: number, asUserId: number) =>
    watsonPost<{ status: string }>(`/api/comms/sends/${id}/cancel`, { as_user_id: asUserId }),

  sentLog: (asUserId: number) => watsonGet<CommsSend[]>(`/api/comms/sent-log?as_user_id=${asUserId}`),

  uploadImage: (filename: string, contentBase64: string, kind: 'facebook' | 'email') =>
    watsonPost<{ imagePath: string; rawUrl: string }>('/api/comms/upload-image', {
      filename,
      content_base64: contentBase64,
      kind,
    }),
}
