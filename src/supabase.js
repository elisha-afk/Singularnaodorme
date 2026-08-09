const SUPABASE_URL = 'https://xcpfjuvvgzyrnqmhzibu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGZqdXZ2Z3p5cm5xbWh6aWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODk1NTksImV4cCI6MjEwMTg2NTU1OX0.xwFl23__rHZtacBYOyDuZ8p1igemIHILu68oRJtVgBs'

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.')
  return data
}

export function submitReport(report) {
  return request('submit-relato', { method: 'POST', body: JSON.stringify(report) })
}

export function findReport(code) {
  return request(`get-relato?code=${encodeURIComponent(code)}`, { method: 'GET' })
}