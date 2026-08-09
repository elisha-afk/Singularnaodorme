import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xcpfjuvvgzyrnqmhzibu.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9wjOZ3LxD2Mb11TjyCp2FA_gGPVgMlS'

export const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export async function adminRequest(functionName, path = '', options = {}) {
  const { data: { session } } = await authClient.auth.getSession()
  if (!session) throw new Error('Sua sessão expirou. Entre novamente.')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.')
  return data
}

export const adminApi = {
  me: () => adminRequest('admin-api', '?action=me'),
  staff: () => adminRequest('admin-api', '?action=staff'),
  dashboard: () => adminRequest('admin-api', '?action=dashboard'),
  reports: (params) => adminRequest('admin-api', `?action=reports&${new URLSearchParams(params)}`),
  report: (id) => adminRequest('admin-api', `?action=report&id=${encodeURIComponent(id)}`),
  updateReport: (changes) => adminRequest('admin-api', '?action=report', { method: 'PATCH', body: JSON.stringify(changes) }),
  completePasswordChange: () => adminRequest('admin-api', '?action=password-changed', { method: 'PATCH', body: '{}' }),
  addNote: (note) => adminRequest('admin-api', '?action=note', { method: 'POST', body: JSON.stringify(note) }),
  users: () => adminRequest('admin-users'),
  createUser: (user) => adminRequest('admin-users', '', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (user) => adminRequest('admin-users', '', { method: 'PATCH', body: JSON.stringify(user) }),
  respond: (response) => adminRequest('respond-relato', '', { method: 'POST', body: JSON.stringify(response) }),
}